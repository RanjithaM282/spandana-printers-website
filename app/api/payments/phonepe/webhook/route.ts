import { NextRequest, NextResponse } from 'next/server';
import { updateOrder, getOrders } from '@/lib/database';
import { verifyPhonePeWebhook } from '@/lib/paymentVerification';

// PhonePe configuration
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';

// Handle PhonePe webhook callback
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const decodedBody = Buffer.from(body, 'base64').toString('utf8');
    const paymentData = JSON.parse(decodedBody);
    
    console.log('=== PhonePe Webhook Received ===');
    console.log('Payment Data:', paymentData);
    
    // Verify webhook signature
    if (!PHONEPE_SALT_KEY || !PHONEPE_SALT_INDEX) {
      console.error('PhonePe credentials not configured');
      return NextResponse.json(
        { success: false, error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    const xVerify = paymentData.checksum;
    const isValid = verifyPhonePeWebhook(decodedBody, xVerify, PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX);
    
    if (!isValid) {
      console.error('Invalid PhonePe webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }
    
    console.log('PhonePe webhook signature verified successfully');
    
    // Update order status based on payment
    const orderId = paymentData.data.merchantTransactionId;
    const paymentStatus = paymentData.data.paymentState;
    const transactionId = paymentData.data.transactionId;
    
    console.log(`Processing webhook for order: ${orderId}, status: ${paymentStatus}`);
    
    // Get order details to check payment history
    const order = await getOrders();
    const currentOrder = order.find(o => o.id === orderId);
    
    if (!currentOrder) {
      console.error('Order not found:', orderId);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    if (paymentStatus === 'COMPLETED') {
      // Update payment history
      const updatedPaymentHistory = currentOrder.paymentHistory?.map(record => {
        if (record.status === 'pending') {
          return {
            ...record,
            status: 'completed' as const,
            transactionId
          };
        }
        return record;
      }) || [];
      
      // Check if this was an advance payment
      const totalPaid = updatedPaymentHistory
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + r.amount, 0);
      
      const remainingAmount = currentOrder.total - totalPaid;
      
      await updateOrder(orderId, {
        status: remainingAmount <= 0 ? 'processing' : 'pending',
        paymentStatus: remainingAmount <= 0 ? 'paid' : 'partially_paid',
        transactionId,
        paymentDate: new Date().toISOString(),
        advancePaid: totalPaid,
        remainingAmount,
        paymentHistory: updatedPaymentHistory
      });
      
      console.log(`Payment successful for order: ${orderId}. Total paid: ${totalPaid}, Remaining: ${remainingAmount}`);
    } else {
      // Update payment history to failed
      const updatedPaymentHistory = currentOrder.paymentHistory?.map(record => {
        if (record.status === 'pending') {
          return {
            ...record,
            status: 'failed' as const,
            transactionId
          };
        }
        return record;
      }) || [];
      
      await updateOrder(orderId, {
        paymentHistory: updatedPaymentHistory
      });
      
      console.log(`Payment failed for order: ${orderId}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PhonePe webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
