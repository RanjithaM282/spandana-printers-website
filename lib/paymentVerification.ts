import crypto from 'crypto';

// PhonePe webhook verification
export function verifyPhonePeWebhook(
  payload: string,
  xVerify: string,
  saltKey: string,
  saltIndex: string
): boolean {
  try {
    const finalString = `${payload}/pg/v1/status/${saltKey}`;
    const hash = crypto.createHash('sha256').update(finalString).digest('hex');
    const computedXVerify = `${hash}###${saltIndex}`;
    
    return computedXVerify === xVerify;
  } catch (error) {
    console.error('PhonePe webhook verification error:', error);
    return false;
  }
}

// Razorpay webhook signature verification
export function verifyRazorpayWebhook(
  payload: string,
  webhookSignature: string,
  webhookSecret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(webhookSignature)
    );
  } catch (error) {
    console.error('Razorpay webhook verification error:', error);
    return false;
  }
}

// Generate PhonePe checksum for payment initiation
export function generatePhonePeChecksum(
  payload: string,
  saltKey: string,
  saltIndex: string
): string {
  const finalString = `${payload}/pg/v1/pay${saltKey}`;
  const hash = crypto.createHash('sha256').update(finalString).digest('hex');
  return `${hash}###${saltIndex}`;
}
