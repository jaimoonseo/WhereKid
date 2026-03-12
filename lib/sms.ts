/**
 * SMS sending utilities for WhereKid
 *
 * Note: This implementation uses a mock SMS service for demonstration.
 * In production, integrate with a Korean SMS provider like:
 * - Naver Cloud Platform SENS (Simple & Easy Notification Service)
 * - Aligo SMS
 * - NHN Toast SMS
 *
 * For real implementation, install the appropriate SDK and add API credentials to .env
 */

export interface SMSMessage {
  to: string; // Phone number (e.g., "010-1234-5678")
  message: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS message
 *
 * @param to - Recipient phone number
 * @param message - Message content
 * @returns Promise<SMSResult>
 */
export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  // Validate phone number format (Korean mobile)
  const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
  if (!phoneRegex.test(to.replace(/-/g, ''))) {
    return {
      success: false,
      error: '유효하지 않은 전화번호 형식입니다.',
    };
  }

  try {
    // TODO: Replace with actual SMS API integration
    // Example for SENS:
    // const response = await fetch('https://sens.apigw.ntruss.com/sms/v2/services/{serviceId}/messages', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'x-ncp-apigw-timestamp': timestamp,
    //     'x-ncp-iam-access-key': accessKey,
    //     'x-ncp-apigw-signature-v2': signature,
    //   },
    //   body: JSON.stringify({
    //     type: 'SMS',
    //     from: process.env.SMS_SENDER_PHONE,
    //     content: message,
    //     messages: [{ to }],
    //   }),
    // });

    // Mock implementation for development
    console.log('📱 SMS 전송 시뮬레이션:');
    console.log(`수신: ${to}`);
    console.log(`내용: ${message}`);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // For development, always succeed
    // In production, parse actual API response
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  } catch (error) {
    console.error('SMS 전송 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * Send SMS to multiple recipients
 *
 * @param recipients - Array of phone numbers
 * @param message - Message content
 * @returns Promise<SMSResult[]>
 */
export async function sendBulkSMS(
  recipients: string[],
  message: string
): Promise<SMSResult[]> {
  const results = await Promise.all(
    recipients.map((to) => sendSMS(to, message))
  );
  return results;
}

/**
 * Format schedule message for SMS
 */
export function formatScheduleMessage(
  academy: string,
  startTime: string,
  endTime: string,
  isActive: boolean
): string {
  if (isActive) {
    return `[WhereKid] 우리 아이가 지금 ${academy}(${startTime}-${endTime})에 있어요 📚`;
  }
  return `[WhereKid] ${academy} 스케줄: ${startTime}-${endTime} 📚`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
  return phoneRegex.test(phone.replace(/-/g, ''));
}

/**
 * Format phone number with hyphens
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}
