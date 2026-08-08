import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Order validation schemas
export const orderSchema = z.object({
  id: z.string().optional(),
  serviceSlug: z.string().min(1, 'Service slug is required'),
  serviceTitle: z.string().min(1, 'Service title is required'),
  size: z.string().min(1, 'Size is required'),
  gsm: z.string().min(1, 'GSM is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  addOns: z.array(z.string()).default([]),
  notes: z.string().optional(),
  total: z.number().min(0, 'Total must be positive'),
  customerEmail: z.string().email('Invalid email address'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  orderDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  status: z.enum(['pending', 'processing', 'ready', 'delivered']).optional(),
  pickupScheduled: z.string().optional(),
  paymentStatus: z.enum(['pending', 'partially_paid', 'paid', 'failed']).optional(),
  transactionId: z.string().optional(),
  paymentDate: z.string().optional(),
  advancePaid: z.number().min(0).optional(),
  remainingAmount: z.number().min(0).optional(),
  files: z.array(z.string()).default([]),
  deliveryOption: z.enum(['pickup', 'delivery']).optional(),
  deliveryAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().length(6),
    landmark: z.string().optional(),
  }).optional(),
});

// Chat validation schemas
export const chatMessageSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  message: z.string().min(1, 'Message is required'),
  sender: z.enum(['customer', 'admin']),
});

// Payment validation schemas
export const paymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  paymentType: z.enum(['advance', 'full', 'remaining']),
  transactionId: z.string().optional(),
  paymentMethod: z.string().optional(),
});
