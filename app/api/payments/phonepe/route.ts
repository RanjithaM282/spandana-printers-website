import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateOrder, getOrders, savePaymentRecord, getPaymentHistory } from '@/lib/database';
import Razorpay from 'razorpay';
import { verifyPhonePeWebhook, generatePhonePeChecksum } from '@/lib/paymentVerification';

// PhonePe configuration
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
const PHONEPE_ENV = process.env.NODE_ENV === 'production' ? 'PROD' : 'UAT';
const PHONEPE_BASE_URL = PHONEPE_ENV === 'PROD' 
  ? 'https://api.phonepe.com/apis/hermes' 
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

interface PaymentRequest {
  amount: number;
  orderId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== PhonePe Payment Initiation Started ===');
    
    const paymentData: PaymentRequest = await request.json();
    console.log('Received payment data:', paymentData);
    
    // Validate required fields
    if (!paymentData.orderId || !paymentData.amount || !paymentData.customerEmail) {
      console.error('Missing required fields:', paymentData);
      return NextResponse.json(
        { success: false, error: 'Missing required payment data' },
        { status: 400 }
      );
    }
    
    // Amount is already in paise from frontend
    const amountInPaise = paymentData.amount;
    console.log('Amount in paise:', amountInPaise);
    
    // For project demonstration, we'll use a mock payment flow
    // In production, this would integrate with real PhonePe API
    console.log('=== PROJECT DEMONSTRATION MODE ===');
    console.log('Using mock payment flow for demonstration purposes');
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create mock successful payment response
    const mockResponse = {
      success: true,
      code: 'PAYMENT_INITIATED',
      message: 'Payment initiated successfully',
      data: {
        merchantId: PHONEPE_MERCHANT_ID,
        merchantTransactionId: paymentData.orderId,
        transactionId: `TXN_${Date.now()}`,
        amount: amountInPaise,
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/return?orderId=${paymentData.orderId}&status=success`,
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      }
    };
    
    console.log('Mock payment response:', mockResponse);
    
    // Simulate callback after 3 seconds (for demo)
    setTimeout(async () => {
      try {
        console.log('=== SIMULATING PAYMENT CALLBACK ===');
        const { updateOrder, savePaymentRecord } = await import('@/lib/database');
        
        // Save payment record to MySQL
        await savePaymentRecord({
          orderId: paymentData.orderId,
          amount: paymentData.amount / 100, // Convert paise to rupees
          paymentType: 'full',
          transactionId: mockResponse.data.transactionId,
          paymentDate: new Date().toISOString(),
          status: 'completed',
          paymentMethod: 'PhonePe',
        });
        
        // Update order status to paid
        await updateOrder(paymentData.orderId, {
          paymentStatus: 'paid',
          status: 'processing',
          transactionId: mockResponse.data.transactionId,
          paymentDate: new Date().toISOString()
        });
        
        console.log(`Payment completed for order: ${paymentData.orderId}`);
      } catch (error) {
        console.error('Error in simulated callback:', error);
      }
    }, 3000);
    
    return NextResponse.json({
      success: true,
      data: mockResponse.data,
      message: 'Payment initiated successfully (Demo Mode)'
    });
  } catch (error) {
    console.error('Unexpected error in PhonePe payment:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

// Handle PhonePe callback
export async function PUT(request: NextRequest) {
  try {
    const body = await request.text();
    const decodedBody = Buffer.from(body, 'base64').toString('utf8');
    const paymentData = JSON.parse(decodedBody);
    
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
    
    // Update order status based on payment
    const orderId = paymentData.data.merchantTransactionId;
    const paymentStatus = paymentData.data.paymentState;
    const transactionId = paymentData.data.transactionId;
    
    // Get order details to check payment history
    const order = await getOrders();
    const currentOrder = order.find(o => o.id === orderId);
    
    if (paymentStatus === 'COMPLETED') {
      if (currentOrder) {
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
      }
      
      // Send confirmation email (implement email service)
      // await sendOrderConfirmationEmail(orderId);
    } else {
      // Update payment history to failed
      if (currentOrder) {
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
      }
      
      console.log(`Payment failed for order: ${orderId}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PhonePe callback error:', error);
    return NextResponse.json(
      { success: false, error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}