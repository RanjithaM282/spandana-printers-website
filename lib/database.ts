import connectToMySQL, { initMySQLTables } from './mysql';
import mysql from 'mysql2/promise';
import { Resend } from 'resend';

// TypeScript types
export interface Order {
  id: string;
  serviceSlug: string;
  serviceTitle: string;
  size: string;
  gsm: string;
  quantity: number;
  addOns: string[];
  notes: string;
  total: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  orderDate: string;
  deliveryDate?: string;
  status: 'pending' | 'processing' | 'ready' | 'delivered';
  pickupScheduled?: string;
  paymentStatus?: 'pending' | 'partially_paid' | 'paid' | 'failed';
  transactionId?: string;
  paymentDate?: string;
  advancePaid?: number;
  remainingAmount?: number;
  paymentHistory?: PaymentRecord[];
  files?: string[];
  deliveryOption?: 'pickup' | 'delivery';
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  otp?: string;
  otpExpiry?: string;
  otpVerified?: boolean;
}

export interface PaymentRecord {
  id?: number;
  orderId: string;
  amount: number;
  paymentType: 'advance' | 'full' | 'remaining';
  transactionId?: string;
  paymentDate: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'customer';
  createdAt: string;
}

export interface Service {
  slug: string;
  title: string;
  description: string;
  basePrice: number;
  sizes: string[];
  gsmOptions: number[];
  category: string;
  image?: string;
}

// Initialize databases
let databasesInitialized = false;

async function initializeDatabases() {
  if (databasesInitialized) return;
  
  try {
    await connectToMySQL();
    await initMySQLTables();
    databasesInitialized = true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Order management functions (MySQL)
export async function getOrders(): Promise<Order[]> {
  await initializeDatabases();
  try {
    const mysql = await connectToMySQL();
    const [rows] = await mysql.execute(
      'SELECT * FROM orders ORDER BY order_date DESC'
    ) as any;
    
    if (!rows || rows.length === 0) {
      console.log('No orders found in database');
      return [];
    }
    
    const orders = await Promise.all(rows.map(async (row: any) => ({
      id: row.id,
      serviceSlug: row.service_slug,
      serviceTitle: row.service_title,
      size: row.size,
      gsm: row.gsm,
      quantity: row.quantity,
      addOns: row.addons ? JSON.parse(row.addons) : [],
      notes: row.notes,
      total: parseFloat(row.total),
      customerEmail: row.customer_email,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      orderDate: row.order_date,
      deliveryDate: row.delivery_date,
      status: row.status,
      pickupScheduled: row.pickup_scheduled,
      paymentStatus: row.payment_status,
      transactionId: row.transaction_id,
      paymentDate: row.payment_date,
      advancePaid: row.advance_paid ? parseFloat(row.advance_paid) : undefined,
      remainingAmount: row.remaining_amount ? parseFloat(row.remaining_amount) : undefined,
      files: row.files ? JSON.parse(row.files) : [],
      deliveryOption: row.delivery_option,
      deliveryAddress: row.delivery_address ? JSON.parse(row.delivery_address) : undefined,
      otp: row.otp,
      otpExpiry: row.otp_expiry,
      otpVerified: row.otp_verified,
      paymentHistory: await getPaymentHistory(row.id),
    })));

    console.log(`Loaded ${orders.length} orders from database`);
    return orders;
  } catch (error) {
    console.error('Error reading orders:', error);
    return [];
  }
}

export async function saveOrder(order: Order): Promise<Order> {
  await initializeDatabases();
  let connection;
  try {
    const mysql = await connectToMySQL();
    connection = await mysql.getConnection();
    
    // Start transaction
    await connection.beginTransaction();
    
    const orderId = order.id || `order-${Date.now()}`;
    
    await connection.execute(
      `INSERT INTO orders (
        id, service_slug, service_title, size, gsm, quantity, addons, notes, total,
        customer_email, customer_name, customer_phone, order_date, delivery_date,
        status, pickup_scheduled, payment_status, transaction_id, payment_date,
        advance_paid, remaining_amount, files, delivery_option, delivery_address,
        otp, otp_expiry, otp_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        order.serviceSlug,
        order.serviceTitle,
        order.size,
        order.gsm,
        order.quantity,
        JSON.stringify(order.addOns || []),
        order.notes || null,
        order.total,
        order.customerEmail,
        order.customerName,
        order.customerPhone,
        order.orderDate || new Date().toISOString(),
        order.deliveryDate || null,
        order.status || 'pending',
        order.pickupScheduled || null,
        order.paymentStatus || 'pending',
        order.transactionId || null,
        order.paymentDate || null,
        order.advancePaid || null,
        order.remainingAmount || null,
        JSON.stringify(order.files || []),
        order.deliveryOption || null,
        JSON.stringify(order.deliveryAddress || null),
        order.otp || null,
        order.otpExpiry || null,
        order.otpVerified || false,
      ]
    );
    
    // Save payment history if provided
    if (order.paymentHistory && order.paymentHistory.length > 0) {
      for (const payment of order.paymentHistory) {
        await connection.execute(
          `INSERT INTO payments (order_id, amount, payment_type, transaction_id, payment_date, status, payment_method)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            payment.amount,
            payment.paymentType,
            payment.transactionId || null,
            payment.paymentDate,
            payment.status,
            payment.paymentMethod || null,
          ]
        );
      }
    }
    
    // Commit transaction
    await connection.commit();
    
    return order;
  } catch (error) {
    console.error('Error saving order:', error);
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  await initializeDatabases();
  let connection;
  try {
    console.log('Attempting to update order with ID:', id);
    
    const mysql = await connectToMySQL();
    connection = await mysql.getConnection();
    
    // Start transaction
    await connection.beginTransaction();
    
    const setClause: string[] = [];
    const values: any[] = [];
    
    // Build dynamic SET clause
    if (updates.serviceSlug !== undefined) { setClause.push('service_slug = ?'); values.push(updates.serviceSlug); }
    if (updates.serviceTitle !== undefined) { setClause.push('service_title = ?'); values.push(updates.serviceTitle); }
    if (updates.size !== undefined) { setClause.push('size = ?'); values.push(updates.size); }
    if (updates.gsm !== undefined) { setClause.push('gsm = ?'); values.push(updates.gsm); }
    if (updates.quantity !== undefined) { setClause.push('quantity = ?'); values.push(updates.quantity); }
    if (updates.addOns !== undefined) { setClause.push('addons = ?'); values.push(JSON.stringify(updates.addOns)); }
    if (updates.notes !== undefined) { setClause.push('notes = ?'); values.push(updates.notes); }
    if (updates.total !== undefined) { setClause.push('total = ?'); values.push(updates.total); }
    if (updates.customerEmail !== undefined) { setClause.push('customer_email = ?'); values.push(updates.customerEmail); }
    if (updates.customerName !== undefined) { setClause.push('customer_name = ?'); values.push(updates.customerName); }
    if (updates.customerPhone !== undefined) { setClause.push('customer_phone = ?'); values.push(updates.customerPhone); }
    if (updates.orderDate !== undefined) { setClause.push('order_date = ?'); values.push(updates.orderDate); }
    if (updates.deliveryDate !== undefined) { setClause.push('delivery_date = ?'); values.push(updates.deliveryDate); }
    if (updates.status !== undefined) { setClause.push('status = ?'); values.push(updates.status); }
    if (updates.pickupScheduled !== undefined) { setClause.push('pickup_scheduled = ?'); values.push(updates.pickupScheduled); }
    if (updates.paymentStatus !== undefined) { setClause.push('payment_status = ?'); values.push(updates.paymentStatus); }
    if (updates.transactionId !== undefined) { setClause.push('transaction_id = ?'); values.push(updates.transactionId); }
    if (updates.paymentDate !== undefined) { setClause.push('payment_date = ?'); values.push(updates.paymentDate); }
    if (updates.advancePaid !== undefined) { setClause.push('advance_paid = ?'); values.push(updates.advancePaid); }
    if (updates.remainingAmount !== undefined) { setClause.push('remaining_amount = ?'); values.push(updates.remainingAmount); }
    if (updates.files !== undefined) { setClause.push('files = ?'); values.push(JSON.stringify(updates.files)); }
    if (updates.deliveryOption !== undefined) { setClause.push('delivery_option = ?'); values.push(updates.deliveryOption); }
    if (updates.deliveryAddress !== undefined) { setClause.push('delivery_address = ?'); values.push(JSON.stringify(updates.deliveryAddress)); }
    if (updates.otp !== undefined) { setClause.push('otp = ?'); values.push(updates.otp); }
    if (updates.otpExpiry !== undefined) { setClause.push('otp_expiry = ?'); values.push(updates.otpExpiry); }
    if (updates.otpVerified !== undefined) { setClause.push('otp_verified = ?'); values.push(updates.otpVerified); }
    
    values.push(id);
    
    await connection.execute(
      `UPDATE orders SET ${setClause.join(', ')} WHERE id = ?`,
      values
    );
    
    // Handle payment history updates if provided
    if (updates.paymentHistory) {
      // Delete existing payment records for this order
      await connection.execute('DELETE FROM payments WHERE order_id = ?', [id]);
      
      // Insert new payment records
      for (const payment of updates.paymentHistory) {
        await connection.execute(
          `INSERT INTO payments (order_id, amount, payment_type, transaction_id, payment_date, status, payment_method)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            payment.amount,
            payment.paymentType,
            payment.transactionId || null,
            payment.paymentDate,
            payment.status,
            payment.paymentMethod || null,
          ]
        );
      }
    }
    
    // Commit transaction
    await connection.commit();
    
    // Return updated order
    const [rows] = await connection.execute('SELECT * FROM orders WHERE id = ?', [id]) as any;
    if (!rows || rows.length === 0) {
      throw new Error(`Order not found with ID: ${id}`);
    }
    
    const row = rows[0];
    return {
      id: row.id,
      serviceSlug: row.service_slug,
      serviceTitle: row.service_title,
      size: row.size,
      gsm: row.gsm,
      quantity: row.quantity,
      addOns: row.addons ? JSON.parse(row.addons) : [],
      notes: row.notes,
      total: parseFloat(row.total),
      customerEmail: row.customer_email,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      orderDate: row.order_date,
      deliveryDate: row.delivery_date,
      status: row.status,
      pickupScheduled: row.pickup_scheduled,
      paymentStatus: row.payment_status,
      transactionId: row.transaction_id,
      paymentDate: row.payment_date,
      advancePaid: row.advance_paid ? parseFloat(row.advance_paid) : undefined,
      remainingAmount: row.remaining_amount ? parseFloat(row.remaining_amount) : undefined,
      files: row.files ? JSON.parse(row.files) : [],
      deliveryOption: row.delivery_option,
      deliveryAddress: row.delivery_address ? JSON.parse(row.delivery_address) : undefined,
      otp: row.otp,
      otpExpiry: row.otp_expiry,
      otpVerified: row.otp_verified,
      paymentHistory: await getPaymentHistory(row.id),
    };
  } catch (error) {
    console.error('Error updating order:', error);
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function deleteOrder(id: string): Promise<boolean> {
  await initializeDatabases();
  try {
    const mysql = await connectToMySQL();
    const [result] = await mysql.execute('DELETE FROM orders WHERE id = ?', [id]) as any;
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}

// User management functions (MySQL)
export async function getUsers(): Promise<User[]> {
  await initializeDatabases();
  try {
    const mysql = await connectToMySQL();
    const [rows] = await mysql.execute('SELECT * FROM users ORDER BY created_at DESC') as any;
    
    return rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      role: row.role,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
}

export async function saveUser(user: User): Promise<User> {
  await initializeDatabases();
  try {
    const mysql = await connectToMySQL();
    const userId = user.id || `user-${Date.now()}`;
    
    await mysql.execute(
      'INSERT INTO users (id, email, name, phone, role) VALUES (?, ?, ?, ?, ?)',
      [userId, user.email, user.name, user.phone, user.role || 'customer']
    );
    
    return user;
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  await initializeDatabases();
  try {
    const mysql = await connectToMySQL();
    const setClause: string[] = [];
    const values: any[] = [];
    
    if (updates.email !== undefined) { setClause.push('email = ?'); values.push(updates.email); }
    if (updates.name !== undefined) { setClause.push('name = ?'); values.push(updates.name); }
    if (updates.phone !== undefined) { setClause.push('phone = ?'); values.push(updates.phone); }
    if (updates.role !== undefined) { setClause.push('role = ?'); values.push(updates.role); }
    
    values.push(id);
    
    await mysql.execute(
      `UPDATE users SET ${setClause.join(', ')} WHERE id = ?`,
      values
    );
    
    const [rows] = await mysql.execute('SELECT * FROM users WHERE id = ?', [id]) as any;
    if (!rows || rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      role: row.role,
      createdAt: row.created_at,
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Payment management functions (MySQL)
export async function getPaymentHistory(orderId: string): Promise<PaymentRecord[]> {
  await initializeDatabases();
  try {
    const mysql = await connectToMySQL();
    const [rows] = await mysql.execute(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date DESC',
      [orderId]
    ) as any;
    
    return rows.map((row: any) => ({
      id: row.id,
      orderId: row.order_id,
      amount: parseFloat(row.amount),
      paymentType: row.payment_type,
      transactionId: row.transaction_id,
      paymentDate: row.payment_date,
      status: row.status,
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('Error reading payment history:', error);
    return [];
  }
}

export async function savePaymentRecord(payment: PaymentRecord): Promise<PaymentRecord> {
  await initializeDatabases();
  try {
    const mysql = await connectToMySQL();
    const [result] = await mysql.execute(
      `INSERT INTO payments (order_id, amount, payment_type, transaction_id, payment_date, status, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payment.orderId,
        payment.amount,
        payment.paymentType,
        payment.transactionId || null,
        payment.paymentDate,
        payment.status,
        payment.paymentMethod || null,
      ]
    ) as any;
    
    const insertId = result.insertId;
    const [rows] = await mysql.execute('SELECT * FROM payments WHERE id = ?', [insertId]) as any;
    
    return {
      id: rows[0].id,
      orderId: rows[0].order_id,
      amount: parseFloat(rows[0].amount),
      paymentType: rows[0].payment_type,
      transactionId: rows[0].transaction_id,
      paymentDate: rows[0].payment_date,
      status: rows[0].status,
      paymentMethod: rows[0].payment_method,
      createdAt: rows[0].created_at,
      updatedAt: rows[0].updated_at,
    };
  } catch (error) {
    console.error('Error saving payment record:', error);
    throw error;
  }
}

export async function updatePaymentRecord(id: number, updates: Partial<PaymentRecord>): Promise<PaymentRecord | null> {
  await initializeDatabases();
  try {
    const mysql = await connectToMySQL();
    const setClause: string[] = [];
    const values: any[] = [];
    
    if (updates.orderId !== undefined) { setClause.push('order_id = ?'); values.push(updates.orderId); }
    if (updates.amount !== undefined) { setClause.push('amount = ?'); values.push(updates.amount); }
    if (updates.paymentType !== undefined) { setClause.push('payment_type = ?'); values.push(updates.paymentType); }
    if (updates.transactionId !== undefined) { setClause.push('transaction_id = ?'); values.push(updates.transactionId); }
    if (updates.paymentDate !== undefined) { setClause.push('payment_date = ?'); values.push(updates.paymentDate); }
    if (updates.status !== undefined) { setClause.push('status = ?'); values.push(updates.status); }
    if (updates.paymentMethod !== undefined) { setClause.push('payment_method = ?'); values.push(updates.paymentMethod); }
    
    values.push(id);
    
    await mysql.execute(
      `UPDATE payments SET ${setClause.join(', ')} WHERE id = ?`,
      values
    );
    
    const [rows] = await mysql.execute('SELECT * FROM payments WHERE id = ?', [id]) as any;
    if (!rows || rows.length === 0) {
      return null;
    }
    
    return {
      id: rows[0].id,
      orderId: rows[0].order_id,
      amount: parseFloat(rows[0].amount),
      paymentType: rows[0].payment_type,
      transactionId: rows[0].transaction_id,
      paymentDate: rows[0].payment_date,
      status: rows[0].status,
      paymentMethod: rows[0].payment_method,
      createdAt: rows[0].created_at,
      updatedAt: rows[0].updated_at,
    };
  } catch (error) {
    console.error('Error updating payment record:', error);
    throw error;
  }
}

// Email service function for order confirmation
export async function sendOrderConfirmationEmail(order: Order) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.warn('⚠️ RESEND_API_KEY not configured, using demo mode');
      console.log('=== ORDER CONFIRMATION EMAIL (DEMO MODE) ===');
      console.log('To:', order.customerEmail);
      console.log('Subject:', `Order Confirmation - ${order.id}`);
      console.log('Order ID:', order.id);
      console.log('Service:', order.serviceTitle);
      console.log('Total:', order.total);
      console.log('Payment Status:', order.paymentStatus || 'pending');
      console.log('================================');
      return { success: true, message: 'Email logged (demo mode)' };
    }

    const resend = new Resend(resendApiKey);
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Order Confirmation</h2>
        <p>Dear ${order.customerName},</p>
        <p>Thank you for your order! Your order has been received and is being processed.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Order Details</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Service:</strong> ${order.serviceTitle}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p><strong>Total Amount:</strong> ₹${order.total}</p>
          <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">${order.status}</span></p>
          <p><strong>Payment Status:</strong> <span style="color: ${order.paymentStatus === 'paid' ? '#28a745' : '#ffc107'}; font-weight: bold;">${order.paymentStatus || 'pending'}</span></p>
        </div>
        
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #6c757d; margin-top: 0;">Track Your Order</h3>
          <p>You can track your order status using your Order ID: <strong>${order.id}</strong></p>
          <p>Visit our tracking page and enter your Order ID and email to get real-time updates.</p>
        </div>
        
        <p style="margin-top: 30px;">Best regards,<br>Spandana Printers Team</p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        <p style="font-size: 12px; color: #6c757d; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: order.customerEmail,
      subject: `Order Confirmation - ${order.id}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw error;
    }

    console.log('✅ Email sent successfully via Resend:', data);
    return { success: true, message: 'Email sent successfully', data };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
