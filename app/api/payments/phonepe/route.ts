import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateOrder, getOrders, savePaymentRecord, getPaymentHistory } from '@/lib/database';
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
    
    // Check if PhonePe credentials are configured
    if (!PHONEPE_MERCHANT_ID || !PHONEPE_SALT_KEY) {
      console.error('PhonePe credentials not configured');
      return NextResponse.json(
        { success: false, error: 'Payment gateway not configured. Please add PHONEPE_MERCHANT_ID and PHONEPE_SALT_KEY to environment variables.' },
        { status: 500 }
      );
    }
    
    // Amount is already in paise from frontend
    const amountInPaise = paymentData.amount;
    console.log('Amount in paise:', amountInPaise);
    
    // Prepare PhonePe API payload
    const merchantTransactionId = paymentData.orderId;
    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId,
      amount: amountInPaise,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/return?orderId=${merchantTransactionId}`,
      redirectMode: 'REDIRECT',
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/phonepe/webhook`,
      paymentInstrument: {
        type: 'PAY_PAGE'
      },
      mobileNumber: paymentData.customerPhone,
      deviceContext: {
        deviceOS: 'WEB'
      }
    };
    
    const payloadString = JSON.stringify(payload);
    const checksum = generatePhonePeChecksum(payloadString, PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX);
    
    console.log('PhonePe API payload prepared');
    console.log('Merchant Transaction ID:', merchantTransactionId);
    
    // Make API call to PhonePe
    const phonePeResponse = await fetch(`${PHONEPE_BASE_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID
      },
      body: JSON.stringify({
        request: payloadString
      })
    });
    
    const responseText = await phonePeResponse.text();
    console.log('PhonePe API response status:', phonePeResponse.status);
    console.log('PhonePe API response:', responseText);
    
    if (!phonePeResponse.ok) {
      console.error('PhonePe API error:', responseText);
      return NextResponse.json(
        { success: false, error: `PhonePe API error: ${phonePeResponse.status}` },
        { status: phonePeResponse.status }
      );
    }
    
    const phonePeData = JSON.parse(responseText);
    
    if (phonePeData.success && phonePeData.data?.instrumentResponse?.redirectInfo?.url) {
      return NextResponse.json({
        success: true,
        data: {
          merchantId: PHONEPE_MERCHANT_ID,
          merchantTransactionId,
          redirectUrl: phonePeData.data.instrumentResponse.redirectInfo.url,
          transactionId: phonePeData.data.transactionId
        },
        message: 'Payment initiated successfully'
      });
    } else {
      console.error('PhonePe payment initiation failed:', phonePeData);
      return NextResponse.json(
        { success: false, error: phonePeData.message || 'Payment initiation failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in PhonePe payment:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

