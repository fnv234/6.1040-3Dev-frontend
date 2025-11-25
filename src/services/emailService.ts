import { http, feedbackForm } from '@/api/client';

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

/**
 * Generate a unique form link for an employee to fill out feedback
 */
function generateFormLink(formId: string, employeeId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/feedback/${formId}?reviewer=${employeeId}`;
}

/**
 * Send an email via a backend email service
 * NOTE: This assumes you have a backend endpoint that can send emails
 * You'll need to implement this endpoint on your backend
 */
async function sendEmailViaBackend(emailData: {
  to: string;
  subject: string;
  body: string;
  formLink: string;
}): Promise<boolean> {
  try {
   const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${import.meta.env.VITE_SENDGRID_API_KEY}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       personalizations: [{
         to: [{ email: emailData.to }],
         subject: emailData.subject
       }],
       from: { 
         email: import.meta.env.VITE_SENDER_EMAIL || 'noreply@yourcompany.com',
         name: 'Your Company Feedback System'
       },
       content: [{
         type: 'text/html',
         value: `
           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
             <h2 style="color: #427AA1;">${emailData.subject}</h2>
             <p>${emailData.body}</p>
             <p>
               <a href="${emailData.formLink}" 
                  style="background: #427AA1; color: white; padding: 12px 24px; 
                         text-decoration: none; border-radius: 6px; display: inline-block;">
                 Complete Feedback Form
               </a>
             </p>
             <p style="color: #666; font-size: 12px;">
               This is an automated message. Please do not reply to this email.
             </p>
           </div>
         `
       }]
     })
   });
   return response.ok;
} catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export const emailService = {
  /**
   * Send feedback form emails to team members
   */
  async sendFeedbackForm(emailData: EmailData): Promise<SendEmailResponse> {
    try {
      let emailsSent = 0;
      const failedEmails: string[] = [];

      // Get employee emails
      const employeeEmails = await this.getEmployeeEmails(emailData.to);

      // Create a feedback form for each team member to review each other team member
      for (const reviewerEmail of emailData.to) {
        const reviewerId = reviewerEmail; // Using email as ID for now, adjust if you have a different ID system
        if (!employeeEmails[reviewerId]) {
          console.warn(`No email found for reviewer ${reviewerId}`);
          failedEmails.push(reviewerId);
          continue;
        }

        for (const targetId of emailData.to) {
          // Skip self-reviews
          if (reviewerId === targetId) continue;

          try {
            // Get the original form to copy questions
            const originalFormResponse = await feedbackForm.getFeedbackForm({ id: emailData.formId });
            const originalForm = originalFormResponse.data.feedbackForm;

            // Create a new feedback form instance for this reviewer-target pair
            const createResponse = await feedbackForm.createFeedbackForm({
              reviewer: reviewerId,
              target: targetId,
              questions: originalForm.questions
            });

            const newFormId = createResponse.data.feedbackForm;

            // Send the form (marks it as "Sent")
            await feedbackForm.sendFeedbackForm({
              feedbackForm: newFormId
            });

            // Generate the form link
            const formLink = this.generateFormLink(emailData.formId, reviewerId);

            // Get target employee info for email context
            // const targetEmail = employeeEmails[targetId];
            // const targetName = targetEmail ? targetEmail.split('@')[0] : targetId;

            // Send the actual email
            const emailSent = await sendEmailViaBackend({
              to: reviewerEmail,
              subject: `Feedback Request: ${emailData.formName} - Review for ${employeeEmails[targetId] || targetId}`,
              body: `
                <p>Hello ${employeeEmails[reviewerId] || reviewerId},</p>
                <p>You have been requested to provide feedback for ${employeeEmails[targetId] || targetId} as part of the ${emailData.formName} process.</p>
                <p>This feedback will help them grow and improve. Your honest and constructive feedback is valuable.</p>
                <p>Please click the link below to complete the feedback form:</p>
              `,
              formLink
            });

            if (emailSent) {
              emailsSent++;
            } else {
              failedEmails.push(reviewerEmail);
            }
          } catch (error) {
            console.error(`Failed to create form for reviewer ${reviewerId} -> target ${targetId}:`, error);
            if (!failedEmails.includes(reviewerEmail)) {
              failedEmails.push(reviewerEmail);
            }
          }
        }
      }

      return {
        success: emailsSent > 0,
        emailsSent,
        failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
        message: `Successfully sent ${emailsSent} feedback form emails to team members`
      };
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
    return generateFormLink(formId, employeeId);
  }
};