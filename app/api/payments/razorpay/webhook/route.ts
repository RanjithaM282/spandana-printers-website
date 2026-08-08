import { NextRequest, NextResponse } from 'next/server';
import { updateOrder, getOrders } from '@/lib/database';
import { verifyRazorpayWebhook } from '@/lib/paymentVerification';

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Razorpay webhook secret not configured');
      return NextResponse.json(
        { success: false, error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing Razorpay signature');
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyRazorpayWebhook(body, signature, webhookSecret);
    
    if (!isValid) {
      console.error('Invalid Razorpay webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const webhookData = JSON.parse(body);
    const event = webhookData.event;
    const payload = webhookData.payload;

    console.log('Razorpay webhook received:', event);

    // Handle payment.captured event
    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      const orderId = payment.notes?.orderId || payment.receipt;
      const amount = payment.amount / 100; // Convert from paise to rupees
      const transactionId = payment.id;

      if (!orderId) {
        console.error('Order ID not found in webhook payload');
        return NextResponse.json(
          { success: false, error: 'Order ID not found' },
          { status: 400 }
        );
      }

      // Get order details
      const orders = await getOrders();
      const currentOrder = orders.find(o => o.id === orderId);

      if (!currentOrder) {
        console.error('Order not found:', orderId);
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      // Update order with payment details
      const updatedPaymentHistory = currentOrder.paymentHistory?.map(record => {
        if (record.status === 'pending') {
          return {
            ...record,
            status: 'completed' as const,
            transactionId,
          };
        }
        return record;
      }) || [];

      // Calculate total paid
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
        paymentHistory: updatedPaymentHistory,
      });

      console.log(`Payment successful for order: ${orderId}. Amount: ₹${amount}`);
    }

    // Handle payment.failed event
    if (event === 'payment.failed') {
      const payment = payload.payment.entity;
      const orderId = payment.notes?.orderId || payment.receipt;
      const transactionId = payment.id;

      if (orderId) {
        const orders = await getOrders();
        const currentOrder = orders.find(o => o.id === orderId);

        if (currentOrder) {
          const updatedPaymentHistory = currentOrder.paymentHistory?.map(record => {
            if (record.status === 'pending') {
              return {
                ...record,
                status: 'failed' as const,
                transactionId,
              };
            }
            return record;
          }) || [];

          await updateOrder(orderId, {
            paymentHistory: updatedPaymentHistory,
          });
        }
      }

      console.log(`Payment failed for order: ${orderId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
