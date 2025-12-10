/**
 * Utility functions for generating and managing access codes
 */

/**
 * Generate a unique access code
 */
export function generateAccessCode(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomPart}`.toUpperCase();
}

/**
 * Generate unique access codes for team members
 */
export function generateTeamAccessCodes(teamMembers: Array<{memberId: string, email: string, role?: string}>): Array<{memberId: string, email: string, role?: string, accessCode: string}> {
  return teamMembers.map(member => ({
    ...member,
    accessCode: generateAccessCode()
  }));
}

/**
 * Create email body with access code
 */
export function createAccessCodeEmailBody(
  formName: string,
  teamName: string,
  accessCode: string,
  recipientName?: string
): string {
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';
  
  return `${greeting}

You've been invited to provide feedback for "${formName}" as a member of the "${teamName}" team.

Your unique access code is: ${accessCode}

To complete the feedback form:
1. Go to the login page: https://threedev-360-feedback.onrender.com/login
2. Click "Have an access code?"
3. Enter your access code: ${accessCode}
4. Complete the feedback form

This access code is unique to you and should not be shared with others. Please complete the form at your earliest convenience.

Thank you for your participation!

Best regards,
${teamName} HR Team`;
}

/**
 * Create mailto link with recipients and body
 */
export function createMailtoLink(
  subject: string,
  emails: string[],
  body: string,
  useBcc = false
): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedEmails = encodeURIComponent(emails.join(','));
  const encodedBody = encodeURIComponent(body);
  
  const emailField = useBcc ? 'bcc' : 'to';
  
  return `mailto:?subject=${encodedSubject}&${emailField}=${encodedEmails}&body=${encodedBody}`;
}

/**
 * Clean date patterns from text content
 */
function cleanDatePatterns(content: string): string {
  if (!content) return content;
  
  return content
    .replace(/October 26, 2023/gi, '')
    .replace(/Date:\s*October 26, 2023/gi, '')
    .replace('Date:', '')
    .replace(/Generated on:\s*October 26, 2023/gi, '')
    .replace(/As of October 26, 2023/gi, '')
    .replace(/On October 26, 2023/gi, '')
    .replace(/^(?:Generated on|Date:|As of|On) [A-Za-z]+ \d{1,2}, \d{4}(?: at \d{1,2}:\d{2}(?: [AP]M)?)?[\n\r]+/i, '')
    .replace(/^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2}(?::\d{2})?)?[\n\r]+/, '')
    .trim();
}

/**
 * Create email body with synthesized report
 */
export function createReportEmailBody(
  formName: string,
  teamName: string,
  report: any,
  recipientName?: string
): string {
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';
  
  // Format themes
  const themesText = report.keyThemes && report.keyThemes.length > 0
    ? `\n\nKey Themes:\n${report.keyThemes.map((theme: string, i: number) => `${i + 1}. ${theme}`).join('\n')}`
    : '';
  
  // Format metrics
  let metricsText = '';
  if (report.metrics) {
    metricsText = `\n\nMetrics:\n- Total Responses: ${report.metrics.totalResponses}\n- Unique Respondents: ${report.metrics.uniqueRespondents}`;
    if (report.metrics.roleDistribution) {
      metricsText += '\n- Response Distribution by Role:';
      for (const [role, count] of Object.entries(report.metrics.roleDistribution)) {
        metricsText += `\n  • ${role}: ${count}`;
      }
    }
  }
  
  // Format key quotes
  const quotesText = report.keyQuotes && report.keyQuotes.length > 0
    ? `\n\nKey Quotes:\n${report.keyQuotes.map((quote: string, i: number) => `${i + 1}. "${cleanDatePatterns(quote)}"`).join('\n')}`
    : '';
  
  // Clean the summary text to remove date patterns
  const cleanSummary = cleanDatePatterns(report.textSummary || '');
  
  return `${greeting}

Please find below the synthesized feedback report for "${formName}" from the "${teamName}" team.

${themesText}

SUMMARY:
${cleanSummary}
${metricsText}
${quotesText}

This report synthesizes anonymous feedback from team members to provide insights and actionable recommendations.

Best regards,
${teamName} HR Team`;
}
