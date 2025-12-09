<template>
  <div class="responses-view">
    <div class="responses-header">
      <h1>Form Responses</h1>
      <p class="text-secondary">
        View and analyze feedback responses that have been submitted.
      </p>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Loading responses...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <GradientButton @click="loadResponses">
        Try Again
      </GradientButton>
    </div>

    <div v-else class="responses-content">
      <!-- Form Selection -->
      <div class="form-selector">
        <label for="form-select">Select Form:</label>
        <select 
          id="form-select" 
          v-model="selectedFormId" 
          @change="onFormChange"
          class="form-select"
        >
          <option value="">Choose a form...</option>
          <option 
            v-for="form in formsWithResponses" 
            :key="form._id" 
            :value="form._id"
          >
            {{ form.name }}
          </option>
        </select>
      </div>
      
      <div v-if="formsWithResponses.length === 0 && !loading" class="no-forms-with-responses">
        <h3>No responses yet</h3>
        <p class="text-secondary">No forms have received responses yet. Once team members submit feedback, those forms will appear here.</p>
        <GradientButton @click="goToForms" style="margin-top: 1rem;">
          View My Forms
        </GradientButton>
      </div>

      <!-- Responses Display -->
      <div v-if="selectedFormId && responses.length > 0" class="responses-section">
        <div class="responses-summary">
          <div class="summary-header">
            <h2>{{ selectedForm?.name }} - Responses</h2>
            <GradientButton 
              @click="generateReport" 
              :disabled="generatingReport || responses.length < 3"
              class="btn-generate-report"
            >
              <span v-if="generatingReport">Generating Report...</span>
              <span v-else>📊 {{ synthesizedReport ? 'Regenerate' : 'Generate' }} Synthesis Report</span>
            </GradientButton>
          </div>
          <div class="summary-stats">
            <div class="stat">
              <span class="stat-value">{{ responses.length }}</span>
              <span class="stat-label">Total Responses</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ uniqueRoles.length }}</span>
              <span class="stat-label">Different Roles</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ completionRate }}%</span>
              <span class="stat-label">Completion Rate</span>
            </div>
          </div>
          <p v-if="responses.length < 3" class="warning-text">
            ⚠️ At least 3 responses required to generate a synthesis report
          </p>
        </div>

        <!-- Generated Report Display -->
        <div v-if="synthesizedReport" class="synthesized-report-section">
          <div class="report-header">
            <h3>📄 Synthesized Report</h3>
            <div class="report-actions">
              <button @click="sendReportEmail" class="btn-send-report" :disabled="sendingReport">
                <span class="btn-icon">📧</span>
                {{ sendingReport ? 'Sending...' : 'Send Report' }}
              </button>
              <button @click="toggleReportMinimize" class="btn-minimize-report">
                {{ reportMinimized ? '▼ Expand' : '▲ Minimize' }}
              </button>
            </div>
          </div>
          
          <div v-show="!reportMinimized" class="report-content">
            <div class="report-meta">
              <span class="report-date">📅 Generated: {{ formatDate(synthesizedReport.createdAt) }}</span>
              <span class="report-form-name">📋 {{ selectedForm?.name }}</span>
            </div>

            <div v-if="synthesizedReport.keyThemes && synthesizedReport.keyThemes.length > 0" class="report-themes">
              <h4>🎯 Key Themes Identified</h4>
              <p class="section-description">The most prominent themes emerging from team feedback:</p>
              <div class="themes-list">
                <span v-for="(theme, index) in synthesizedReport.keyThemes" :key="theme" class="theme-tag">
                  <span class="theme-number">{{ index + 1 }}</span>
                  {{ theme }}
                </span>
              </div>
            </div>

            <div class="report-summary">
              <h4>📊 Analysis & Insights</h4>
              <p class="section-description">Synthesized findings from {{ synthesizedReport.metrics?.totalResponses || responses.length }} team responses:</p>
              <div class="summary-text">
                {{ synthesizedReport.textSummary }}
              </div>
            </div>

            <div v-if="synthesizedReport.keyQuotes && synthesizedReport.keyQuotes.length > 0" class="report-quotes">
              <h4>💬 Notable Feedback Excerpts</h4>
              <p class="section-description">Representative quotes from team members:</p>
              <ul class="quotes-list">
                <li v-for="(quote, index) in synthesizedReport.keyQuotes" :key="index" class="quote-item">
                  <span class="quote-number">{{ index + 1 }}</span>
                  <span class="quote-text">"{{ quote }}"</span>
                </li>
              </ul>
            </div>

            <div v-if="synthesizedReport.metrics" class="report-metrics">
              <h4>📈 Response Metrics</h4>
              <div class="metrics-grid">
                <div class="metric-item">
                  <div class="metric-icon">👥</div>
                  <div class="metric-content">
                    <span class="metric-value">{{ synthesizedReport.metrics.totalResponses }}</span>
                    <span class="metric-label">Total Responses</span>
                  </div>
                </div>
                <div class="metric-item">
                  <div class="metric-icon">🎯</div>
                  <div class="metric-content">
                    <span class="metric-value">{{ synthesizedReport.metrics.uniqueRespondents }}</span>
                    <span class="metric-label">Unique Respondents</span>
                  </div>
                </div>
                <div class="metric-item">
                  <div class="metric-icon">❓</div>
                  <div class="metric-content">
                    <span class="metric-value">{{ synthesizedReport.metrics.questionsAnswered }}</span>
                    <span class="metric-label">Questions Covered</span>
                  </div>
                </div>
                <div v-if="synthesizedReport.metrics.averageResponseLength" class="metric-item">
                  <div class="metric-icon">📝</div>
                  <div class="metric-content">
                    <span class="metric-value">{{ Math.round(synthesizedReport.metrics.averageResponseLength) }}</span>
                    <span class="metric-label">Avg Response Length (chars)</span>
                  </div>
                </div>
              </div>
              <div v-if="synthesizedReport.metrics.roleDistribution" class="role-distribution">
                <h5>👔 Participation by Role</h5>
                <div class="role-dist-grid">
                  <div v-for="(count, role) in synthesizedReport.metrics.roleDistribution" :key="role" class="role-dist-item">
                    <span class="role-name">{{ role }}</span>
                    <div class="role-count-bar">
                      <div class="role-count-fill" :style="{ width: (count / synthesizedReport.metrics.totalResponses * 100) + '%' }"></div>
                      <span class="role-count">{{ count }} response{{ count !== 1 ? 's' : '' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="filter-controls">
          <div class="filter-group">
            <label for="role-filter">Filter by Role:</label>
            <select id="role-filter" v-model="roleFilter" class="form-select">
              <option value="">All Roles</option>
              <option 
                v-for="role in uniqueRoles" 
                :key="role" 
                :value="role"
              >
                {{ role }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="date-filter">Sort by:</label>
            <select id="date-filter" v-model="sortBy" class="form-select">
              <option value="date">Submission Date</option>
              <option value="role">Role</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>

        <!-- Responses List -->
        <div class="responses-list">
          <div 
            v-for="response in filteredResponses" 
            :key="response._id" 
            class="response-card"
          >
            <div class="response-header">
              <div class="response-meta">
                <span class="response-email">{{ response.memberEmail }}</span>
                <span v-if="response.memberRole" class="response-role">
                  {{ response.memberRole }}
                </span>
                <span class="response-date">
                  {{ formatDate(response.submittedDate) }}
                </span>
              </div>
            </div>

            <div class="response-content">
              <div 
                v-for="(responseText, questionIndex) in response.responses" 
                :key="questionIndex" 
                class="question-response"
              >
                <div class="question-prompt">
                  <strong>Q{{ parseInt(String(questionIndex)) + 1 }}:</strong> 
                  {{ getQuestionPrompt(questionIndex) }}
                </div>
                <div class="response-text">
                <p>Response:  {{ responseText }} </p>
                 
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="selectedFormId && responses.length === 0" class="empty-state">
        <h3>No responses yet</h3>
        <p class="text-secondary">
          No one has submitted this form yet. Send out the access codes to your team members.
        </p>
        <GradientButton @click="goToForms">
          Back to My Forms
        </GradientButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import GradientButton from '@/components/ui/GradientButton.vue';
import { useFormsStore } from '@/store/forms';
import { useTeamsStore } from '@/store/teams';
import { useToast } from '@/composables/useToast';
import { createReportEmailBody, createMailtoLink } from '@/utils/accessCode';

const router = useRouter();
const formsStore = useFormsStore();
const teamsStore = useTeamsStore();
const { showToast } = useToast();

const loading = ref(true);
const error = ref('');
const selectedFormId = ref('');
const responses = ref<any[]>([]);
const roleFilter = ref('');
const sortBy = ref('date');
const formQuestions = ref<any[]>([]);
const formsResponseCounts = ref<Record<string, number>>({});
const generatingReport = ref(false);
const synthesizedReport = ref<any | null>(null);
const reportMinimized = ref(false);
const sendingReport = ref(false);

// Get forms from store
const forms = computed(() => formsStore.forms.value);
const selectedForm = computed(() => 
  forms.value.find(f => f._id === selectedFormId.value)
);

// Get team info for completion rate calculation
const selectedTeam = computed(() => {
  if (!selectedForm.value?.teamId) return null;
  return teamsStore.teams.value.find(t => t._id === selectedForm.value?.teamId);
});

// Filter forms that have responses
const formsWithResponses = computed(() => {
  return forms.value.filter(form => {
    const responseCount = formsResponseCounts.value[form._id || ''] || 0;
    return responseCount > 0;
  });
});

const uniqueRoles = computed(() => {
  const roles = responses.value
    .map(r => r.memberRole)
    .filter(role => role && role.trim() !== '');
  return [...new Set(roles)];
});

const completionRate = computed(() => {
  if (!selectedForm.value) return 0;
  
  // Get the actual number of team members
  const teamMemberCount = selectedTeam.value?.members?.length || 0;
  
  if (teamMemberCount === 0) return 0;
  
  // Calculate completion rate based on actual team size
  return Math.min(100, Math.round((responses.value.length / teamMemberCount) * 100));
});

const filteredResponses = computed(() => {
  let filtered = responses.value;

  if (roleFilter.value) {
    filtered = filtered.filter(r => r.memberRole === roleFilter.value);
  }

  // Sort responses
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'date':
        return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
      case 'role':
        return (a.memberRole || '').localeCompare(b.memberRole || '');
      case 'email':
        return a.memberEmail.localeCompare(b.memberEmail);
      default:
        return 0;
    }
  });

  return filtered;
});

onMounted(async () => {
  await loadForms();
});

const loadForms = async () => {
  try {
    loading.value = true;
    error.value = '';

    // Forms are loaded reactively by the store; nothing else to do here for now.
    // Load response counts for all forms to determine which have responses
    await loadFormResponseCounts();

    console.log('Available forms:', forms.value);
    console.log('Response counts:', formsResponseCounts.value);
    // Auto-selection is now handled by the watcher above

  } catch (err: any) {
    error.value = err.message || 'Failed to load forms';
  } finally {
    loading.value = false;
  }
};

const loadFormResponseCounts = async () => {
  const responseCounts: Record<string, number> = {};
  
  for (const form of forms.value) {
    if (form._id) {
      try {
        const formResponses = await formsStore.getFormResponses(form._id);
        responseCounts[form._id] = formResponses.length;
      } catch (error) {
        // If we can't load responses for a form, assume it has 0 responses
        responseCounts[form._id] = 0;
      }
    }
  }
  
  formsResponseCounts.value = responseCounts;
};

const loadResponses = async () => {
  if (!selectedFormId.value) return;

  try {
    loading.value = true;
    error.value = '';
    
    // Load responses for the selected form
    const formResponses = await formsStore.getFormResponses(selectedFormId.value);
    responses.value = formResponses;

    // Load form questions to display prompts
    const form = selectedForm.value;
    if (form) {
      formQuestions.value = form.questions || [];
    }

    // Load existing report if available
    await loadExistingReport();

  } catch (err: any) {
    error.value = err.message || 'Failed to load responses';
    showToast(error.value, 'error');
  } finally {
    loading.value = false;
  }
};

const loadExistingReport = async () => {
  if (!selectedFormId.value) return;

  try {
    // Get current admin ID from forms store
    const { currentAdminId } = useFormsStore();
    if (!currentAdminId.value) return;

    // Check if there's an existing report for this form
    const response = await fetch(`${import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_BASE_URL}/ReportSynthesis/getReportByFormTemplate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formTemplate: selectedFormId.value,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.report) {
        synthesizedReport.value = data.report;
        // Start minimized if there's already a report
        reportMinimized.value = true;
        console.log('Loaded existing report:', data.report);
      }
    }
  } catch (error) {
    console.log('No existing report found or error loading:', error);
    // Don't show error toast for this - it's normal if no report exists
  }
};

const getQuestionPrompt = (questionIndex: string | number): string => {
  const index = typeof questionIndex === 'string' ? parseInt(questionIndex) : questionIndex;
  return formQuestions.value[index]?.prompt || `Question ${index + 1}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const goToForms = () => {
  router.push('/my-forms');
};

const generateReport = async () => {
  if (!selectedFormId.value || responses.value.length < 3) {
    showToast('At least 3 responses required to generate a report', 'error');
    return;
  }

  try {
    generatingReport.value = true;
    error.value = '';

    // Get current admin ID from forms store
    const { currentAdminId } = useFormsStore();
    if (!currentAdminId.value) {
      throw new Error('No current admin');
    }

    // Call the sync-based API that handles everything
    const response = await fetch(`${import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_BASE_URL}/ReportSynthesis/generateFormTemplateReport`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formTemplateId: selectedFormId.value,
        createdBy: currentAdminId.value,
        anonymityFlag: true,
        kThreshold: 3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate report');
    }

    // The sync returns the completed report via the respond action
    const responseData = await response.json();
    console.log('Full backend response:', responseData); // Debug log
    const { report } = responseData;
    console.log('Generated report:', report); // Debug log
    if (!report) {
      throw new Error('No report data received from backend');
    }
    synthesizedReport.value = report;
    // Reset minimized state when regenerating so the report stays visible
    reportMinimized.value = false;
    console.log('Report set in ref:', synthesizedReport.value); // Debug log
    showToast('Synthesis report generated successfully!', 'success');

  } catch (err: any) {
    console.error('Error generating report:', err);
    error.value = err.message || 'Failed to generate report';
    showToast(error.value, 'error');
  } finally {
    generatingReport.value = false;
  }
};

const toggleReportMinimize = () => {
  reportMinimized.value = !reportMinimized.value;
};

const sendReportEmail = async () => {
  if (!synthesizedReport.value || !selectedForm.value) {
    showToast('No report available to send', 'error');
    return;
  }

  try {
    sendingReport.value = true;

    // Get team members
    const team = selectedTeam.value;
    if (!team || !team.membersWithRoles || team.membersWithRoles.length === 0) {
      showToast('No team members found to send report to', 'error');
      return;
    }

    // Extract team member emails
    const teamEmails = team.membersWithRoles
      .map(member => member.email)
      .filter(email => email && email.trim() !== '');

    if (teamEmails.length === 0) {
      showToast('No valid email addresses found for team members', 'error');
      return;
    }

    // Create email subject
    const emailSubject = `Feedback Report: ${selectedForm.value.name || 'Team Feedback'}`;

    // Create email body
    const emailBody = createReportEmailBody(
      selectedForm.value.name || 'Team Feedback',
      team.name || 'Your Team',
      synthesizedReport.value
    );

    // Create mailto link
    const mailtoLink = createMailtoLink(emailSubject, teamEmails, emailBody, true);

    // Open email client
    window.open(mailtoLink, '_blank');

    showToast(`Email opened for ${teamEmails.length} team members. Please send from your email client.`, 'success');

  } catch (error: any) {
    console.error('Error preparing report email:', error);
    showToast(error.message || 'Failed to prepare email. Please try again.', 'error');
  } finally {
    sendingReport.value = false;
  }
};

// Watch for forms to be loaded, then auto-select first form with responses
watch(() => formsStore.loaded.value, (isLoaded) => {
  if (isLoaded && forms.value.length > 0) {
    console.log('Forms are loaded, checking for responses');
    // Load response counts if not already loaded
    if (Object.keys(formsResponseCounts.value).length === 0) {
      loadFormResponseCounts();
    } else {
      checkAndSelectFormWithResponses();
    }
  }
});

// Watch for response counts to be calculated
watch(formsResponseCounts, (counts) => {
  if (Object.keys(counts).length > 0 && forms.value.length > 0) {
    console.log('Response counts calculated, checking for forms with responses');
    checkAndSelectFormWithResponses();
  }
}, { deep: true });

const checkAndSelectFormWithResponses = () => {
  const formWithResponses = forms.value.find(form => 
    form._id && formsResponseCounts.value[form._id] > 0
  );
  
  if (formWithResponses && formWithResponses._id) {
    console.log('Auto-selecting form with responses:', formWithResponses._id);
    selectedFormId.value = formWithResponses._id;
  } else {
    console.log('No forms with responses found');
  }
};

// Watch for changes to selectedFormId to automatically load responses
watch(selectedFormId, async (newFormId) => {
  if (newFormId) {
    await loadResponses();
  } else {
    // Clear data when no form is selected
    responses.value = [];
    formQuestions.value = [];
    synthesizedReport.value = null;
    reportMinimized.value = false;
  }
});

// Watch for changes to synthesizedReport to debug disappearing issue
watch(synthesizedReport, (newValue, oldValue) => {
  console.log('synthesizedReport changed:', { 
    newValue: !!newValue, 
    oldValue: !!oldValue,
    newValueData: newValue,
    reportMinimized: reportMinimized.value 
  });
}, { deep: true });

const onFormChange = async () => {
  if (!selectedFormId.value) {
    responses.value = [];
    formQuestions.value = [];
    synthesizedReport.value = null;
    reportMinimized.value = false;
    return;
  }

  await loadResponses();
  // Try to load existing report for this form
  await loadExistingReport();
  // Reset minimized state when loading a new form
  reportMinimized.value = false;
};
</script>

<style scoped>
.responses-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.responses-header {
  margin-bottom: 2rem;
  text-align: center;
}

.responses-header h1 {
  font-family: 'Cal Sans', sans-serif;
  color: var(--title-primary);
  margin-bottom: 0.5rem;
}

/* States */
.loading-state, .error-state {
  text-align: center;
  padding: 3rem;
}

.error-message {
  color: #ef4444;
  margin-bottom: 1rem;
}

/* Form Selector */
.form-selector {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.91);
  border-radius: 8px;
}

.form-selector label {
  display: block;
  margin-bottom: 0.5rem;
  color:  var(--primary);
  font-weight: 500;
}

.form-select {
  width: 100%;
  max-width: 400px;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.77);
  color: var(--primary);
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-select:focus {
  outline: none;
  border-color:  rgba(0, 0, 0, 1);
  box-shadow: 0 0 0 2px rgba(126, 162, 170, 0.2);
}

.form-select option {
  background: #1f2937;
  color: black;
}

.no-forms-with-responses {
  padding: 3rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 2rem;
}

.no-forms-with-responses h3 {
  font-family: 'Cal Sans', sans-serif;
  color: var(--title-primary);
  margin-bottom: 1rem;
}

/* Summary */
.responses-summary {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.responses-summary h2 {
  font-family: 'Cal Sans', sans-serif;
  color: var(--title-primary);
  margin-bottom: 1rem;
}

.btn-generate-report {
  white-space: nowrap;
}

.warning-text {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(255, 193, 7, 0.1);
  border-left: 3px solid #ffc107;
  border-radius: 4px;
  color: #ffc107;
  font-size: 0.875rem;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.91);
  border-radius: 6px;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Filters */
.filter-controls {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.filter-group label {
  color: var(--title-primary);
  font-weight: 500;
}

/* Responses List */
.responses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.response-card {
  background: rgba(198, 253, 190, 0.76);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
}

.response-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.response-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.response-email {
  font-weight: 500;
  color: var(--title-primary);
}

.response-role {
  background: var(--primary);
  color: black;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.875rem;
}

.response-date {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.response-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: black;
}

.question-response {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 6px;
}

.question-prompt {
  color: var(--title-primary);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.response-text {
  color: black;
  line-height: 1.5;
  padding: 0.5rem 0;
}

/* Synthesized Report Section */
.synthesized-report-section {
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(126, 162, 170, 0.1), rgba(66, 122, 161, 0.1));
  border: 2px solid var(--primary);
  border-radius: 12px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.report-header h3 {
  font-family: 'Cal Sans', sans-serif;
  color: var(--title-primary);
  margin: 0;
  font-size: 1.5rem;
}

.report-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-send-report {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #A0CA92, #8ABD7C);
  border: 1px solid rgba(160, 202, 146, 0.5);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-send-report:hover:not(:disabled) {
  background: linear-gradient(135deg, #8ABD7C, #7BA86E);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-send-report:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-minimize-report {
  padding: 0.5rem 1rem;
  background: rgba(108, 222, 247, 0.1);
  border: 1px solid rgba(108, 222, 247, 0.3);
  border-radius: 6px;
  color: var(--primary);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-minimize-report:hover {
  background: rgba(108, 222, 247, 0.2);
  border-color: var(--primary);
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.report-meta {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
}

.report-date, .report-form-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.report-themes {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 4px solid var(--primary);
}

.report-themes h4 {
  color: var(--title-primary);
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  font-style: italic;
}

.themes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.theme-tag {
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.theme-number {
  background: rgba(255, 255, 255, 0.2);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.report-summary {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 4px solid #10b981;
}

.report-summary h4 {
  color: var(--title-primary);
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-text {
  color: var(--text);
  line-height: 1.8;
  white-space: pre-wrap;
  font-size: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

.report-quotes {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.report-quotes h4 {
  color: var(--title-primary);
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quotes-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quote-item {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.08);
  border-left: 3px solid #f59e0b;
  border-radius: 6px;
  color: var(--text);
  font-style: italic;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  transition: all 0.3s ease;
}

.quote-item:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateX(4px);
}

.quote-number {
  background: #f59e0b;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  flex-shrink: 0;
  font-style: normal;
}

.quote-text {
  flex: 1;
  line-height: 1.6;
}

.report-metrics {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 4px solid #8b5cf6;
}

.report-metrics h4 {
  color: var(--title-primary);
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.metric-item:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.metric-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-label {
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.metric-value {
  color: var(--primary);
  font-weight: 700;
  font-size: 1.75rem;
  line-height: 1;
}

.role-distribution {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.role-distribution h5 {
  color: var(--title-primary);
  margin: 0 0 1rem 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.role-dist-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.role-dist-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.role-name {
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 600;
}

.role-count-bar {
  position: relative;
  height: 32px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
}

.role-count-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  transition: width 0.5s ease;
  opacity: 0.3;
}

.role-count {
  position: relative;
  z-index: 1;
  color: var(--text);
  font-weight: 600;
  font-size: 0.875rem;
}

/* Empty States */
.empty-state, .no-selection-state, .no-forms-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-state h3, .no-selection-state h3, .no-forms-state h3 {
  color: var(--title-primary);
  margin-bottom: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .responses-view {
    padding: 1rem;
  }
  
  .form-select {
    max-width: none;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .filter-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .response-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .response-card {
    padding: 1rem;
  }
}
</style>