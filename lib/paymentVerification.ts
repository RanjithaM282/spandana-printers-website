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
