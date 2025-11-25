// src/services/emailService.ts
import { feedbackForm, orgGraph } from '@/api/client';
import type { Team } from '@/types';

export interface EmailData {
  to: string[];
  subject: string;
  formId: string;
  teamName?: string;
}

export interface SendEmailResponse {
  success: boolean;
  emailsSent: number;
  failedEmails?: string[];
  message?: string;
}

export const emailService = {
  /**
   * Send feedback form to team members
   */
  async sendFeedbackFormToTeam(
    formId: string,
    team: Team,
  ): Promise<SendEmailResponse> {
    try {
      let emailsSent = 0;
      const failedEmails: string[] = [];

      // Create a feedback form for each team member to review each other team member
      for (const reviewerId of team.members) {
        for (const targetId of team.members) {
          // Skip self-reviews
          if (reviewerId === targetId) continue;

          try {
            // Get the original form to copy questions
            const originalFormResponse = await feedbackForm.getFeedbackForm({ id: formId });
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

            emailsSent++;
          } catch (error) {
            console.error(`Failed to create form for reviewer ${reviewerId} -> target ${targetId}:`, error);
            failedEmails.push(reviewerId);
          }
        }
      }

      return {
        success: emailsSent > 0,
        emailsSent,
        failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
        message: `Successfully created ${emailsSent} feedback forms for team members`
      };
    } catch (error: any) {
      console.error('Error sending feedback forms:', error);
      throw new Error(error.response?.data?.message || 'Failed to send feedback forms');
    }
  },

  /**
   * Get employee emails by their IDs
   */
  async getEmployeeEmails(employeeIds: string[]): Promise<Record<string, string>> {
    try {
      const emailMap: Record<string, string> = {};
      
      // Fetch each employee's data to get their email
      for (const employeeId of employeeIds) {
        try {
          const response = await orgGraph.getEmployee({ employee: employeeId });
          if (response.data.employeeData?.email) {
            emailMap[employeeId] = response.data.employeeData.email;
          }
        } catch (error) {
          console.warn(`Could not fetch email for employee ${employeeId}`);
        }
      }

      return emailMap;
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
  }
};