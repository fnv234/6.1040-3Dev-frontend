// services/emailService.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  formLink?: string;
}

interface QueueEmailResponse {
  email: string;
}

interface SendEmailResponse {
  success: boolean;
}

interface EmailStatusResponse {
  emailData: {
    _id: string;
    to: string;
    subject: string;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: string;
    error?: string;
    // Other fields can be added as needed
  };
}

/**
 * Queue an email to be sent
 */
export const queueEmail = async (emailData: EmailData): Promise<QueueEmailResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/Email/queueEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication token if required
        // 'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to queue email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error queuing email:', error);
    throw error;
  }
};

/**
 * Send a queued email
 */
export const sendQueuedEmail = async (emailId: string): Promise<SendEmailResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/Email/sendEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ email: emailId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send queued email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending queued email:', error);
    throw error;
  }
};

/**
 * Get the status of a sent email
 */
export const getEmailStatus = async (emailId: string): Promise<EmailStatusResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/Email/getEmail/${emailId}`, {
      method: 'GET',
      headers: {
        // 'Authorization': `Bearer ${userToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get email status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting email status:', error);
    throw error;
  }
};

/**
 * Helper function to queue and send an email in one step
 */
export const sendEmail = async (emailData: EmailData) => {
  try {
    // First queue the email
    const queueResponse = await queueEmail(emailData);
    
    // Then send it
    const sendResponse = await sendQueuedEmail(queueResponse.email);
    
    // Get the final status
    const status = await getEmailStatus(queueResponse.email);
    
    return {
      success: sendResponse.success && status.emailData.status === 'sent',
      emailId: queueResponse.email,
      status: status.emailData.status,
      sentAt: status.emailData.sentAt
    };
  } catch (error) {
    console.error('Error in sendEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
};