import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

interface PaymentRequest {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Razorpay Payment Initiation Started ===');
    
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
    
    // Validate amount
    console.log('Amount validation:', {
      received: paymentData.amount,
      type: typeof paymentData.amount,
      isNumber: typeof paymentData.amount === 'number',
      isPositive: paymentData.amount > 0,
      inRupees: paymentData.amount / 100,
      isInteger: Number.isInteger(paymentData.amount)
    });
    
    if (paymentData.amount <= 0) {
      console.error('Invalid amount:', paymentData.amount);
      return NextResponse.json(
        { success: false, error: 'Invalid payment amount' },
        { status: 400 }
      );
    }
    
    // Razorpay requires amount to be integer (in paise)
    if (!Number.isInteger(paymentData.amount)) {
      console.error('Amount must be integer (paise):', paymentData.amount);
      return NextResponse.json(
        { success: false, error: 'Amount must be in whole paise (no decimals)' },
        { status: 400 }
      );
    }
    
    // Log environment variables (without exposing sensitive data)
    console.log('Environment check:', {
      HAS_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      HAS_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      KEY_ID_LENGTH: process.env.RAZORPAY_KEY_ID?.length,
      KEY_SECRET_LENGTH: process.env.RAZORPAY_KEY_SECRET?.length,
      NODE_ENV: process.env.NODE_ENV,
      ENV_LOADED: process.env.RAZORPAY_KEY_ID !== undefined
    });
    
    // Check if environment variables are properly loaded
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set in environment variables');
      return NextResponse.json(
        { success: false, error: 'Payment gateway configuration error' },
        { status: 500 }
      );
    }
    
    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    
    // Create Razorpay order
    const options = {
      amount: paymentData.amount, // amount in paise
      currency: 'INR',
      receipt: paymentData.orderId,
      notes: {
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName,
        customerPhone: paymentData.customerPhone,
      },
    };
    
    console.log('Creating Razorpay order with options:', { ...options, key_secret: '[HIDDEN]' });
    
    let order;
    try {
      order = await razorpay.orders.create(options);
      console.log('Razorpay order created successfully:', order);
    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', {
        error: razorpayError,
        message: razorpayError instanceof Error ? razorpayError.message : 'Unknown error',
        stack: razorpayError instanceof Error ? razorpayError.stack : undefined,
        options: { ...options, key_secret: '[HIDDEN]' }
      });
      
      // Check for common Razorpay errors
      if (razorpayError instanceof Error) {
        if (razorpayError.message.includes('key_id') || razorpayError.message.includes('key_secret')) {
          return NextResponse.json(
            { success: false, error: 'Invalid Razorpay credentials. Please check your API keys.' },
            { status: 500 }
          );
        }
        if (razorpayError.message.includes('amount')) {
          return NextResponse.json(
            { success: false, error: 'Invalid amount format. Amount should be in paise.' },
            { status: 400 }
          );
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: razorpayError instanceof Error ? razorpayError.message : 'Failed to create Razorpay order' 
        },
        { status: 500 }
      );
    }
    
    // Return order details to frontend
    return NextResponse.json({
      success: true,
      data: {
        key_id: process.env.RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: 'Spandana Printers',
        description: `Payment for order ${paymentData.orderId}`,
        prefill: {
          email: paymentData.customerEmail,
          name: paymentData.customerName,
          contact: paymentData.customerPhone,
        },
        theme: {
          color: '#3399cc',
        },
      },
    });
  } catch (error) {
    console.error('Error in Razorpay payment:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment processing failed' 
      },
      { status: 500 }
    );
  }
}
