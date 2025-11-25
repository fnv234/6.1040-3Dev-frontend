import { http } from '@/api/client';

export interface EmailData {
  to: string[];
  subject: string;
  formId: string;
  formName: string;
  teamName?: string;
  dueDate?: string;
}

export interface SendEmailResponse {
  success: boolean;
  emailsSent: number;
  failedEmails?: string[];
  message?: string;
}

export const emailService = {
  /**
   * Send feedback form emails to team members
   */
  async sendFeedbackForm(emailData: EmailData): Promise<SendEmailResponse> {
    try {
      const response = await http.post<SendEmailResponse>('/email/send-feedback-form', emailData);
      return response.data;
    } catch (error: any) {
      console.error('Error sending feedback form emails:', error);
      throw new Error(error.response?.data?.message || 'Failed to send emails');
    }
  },

  /**
   * Get employee emails by their IDs
   */
  async getEmployeeEmails(employeeIds: string[]): Promise<Record<string, string>> {
    try {
      const response = await http.post<Record<string, string>>('/org-graph/get-employee-emails', {
        employeeIds
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching employee emails:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch employee emails');
    }
  },

  /**
   * Generate a unique form link for an employee
   */
  generateFormLink(formId: string, employeeId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/feedback/${formId}?employee=${employeeId}`;
  },

  /**
   * Create email template for feedback form
   */
  createEmailTemplate(formName: string, formLink: string, teamName?: string, dueDate?: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; margin-bottom: 20px;">Feedback Request: ${formName}</h2>
        
        ${teamName ? `<p style="margin-bottom: 20px;">Team: ${teamName}</p>` : ''}
        
        <p style="margin-bottom: 20px;">
          You have been selected to provide feedback. Please click the link below to complete the feedback form.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${formLink}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Complete Feedback Form
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          If the button above doesn't work, you can copy and paste this link into your browser:<br>
          <a href="${formLink}" style="color: #007bff;">${formLink}</a>
        </p>
        
        ${dueDate ? `
          <p style="margin-top: 20px; color: #333;">
            <strong>Please complete this feedback by: ${new Date(dueDate).toLocaleDateString()}</strong>
          </p>
        ` : ''}
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;
  }
};
