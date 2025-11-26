// services/emailService.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  formLink: string;
}

export const sendEmail = async (emailData: EmailData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/email/send`, {
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
      throw new Error(errorData.error || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};