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
              <span v-else>📊 {{ currentFormReport ? 'Regenerate' : 'Generate' }} Synthesis Report</span>
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

        <!-- Generated Report Display - NEW FORMATTED VERSION -->
        <div v-if="currentFormReport" class="synthesized-report-section">
          <div class="report-header">
            <div class="report-title-section">
              <h3>📄 Synthesized Report</h3>
              <span class="report-badge">AI-Generated Analysis</span>
            </div>
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
            <!-- Report Meta Information -->
            <div class="report-meta-card">
              <div class="meta-item">
                <span class="meta-icon">📅</span>
                <div class="meta-content">
                  <span class="meta-label">Generated</span>
                  <span class="meta-value">{{ formatDate(currentFormReport.createdAt) }}</span>
                </div>
              </div>
              <div class="meta-item">
                <span class="meta-icon">📋</span>
                <div class="meta-content">
                  <span class="meta-label">Form</span>
                  <span class="meta-value">{{ selectedForm?.name }}</span>
                </div>
              </div>
              <div class="meta-item">
                <span class="meta-icon">👥</span>
                <div class="meta-content">
                  <span class="meta-label">Responses</span>
                  <span class="meta-value">{{ currentFormReport.metrics?.totalResponses || responses.length }}</span>
                </div>
              </div>
            </div>

            <!-- Key Themes Section -->
            <div v-if="currentFormReport.keyThemes && currentFormReport.keyThemes.length > 0" class="report-card themes-card">
              <div class="card-header">
                <h4>🎯 Key Themes Identified</h4>
                <p class="card-subtitle">The most prominent themes emerging from team feedback</p>
              </div>
              <div class="themes-grid">
                <div v-for="(theme, index) in currentFormReport.keyThemes" :key="theme" class="theme-item">
                  <div class="theme-number">{{ index + 1 }}</div>
                  <div class="theme-text">{{ theme }}</div>
                </div>
              </div>
            </div>

            <!-- Analysis Summary Section -->
            <div class="report-card summary-card">
              <div class="card-header">
                <h4>📊 Analysis & Insights</h4>
                <p class="card-subtitle">Synthesized findings from {{ currentFormReport.metrics?.totalResponses || responses.length }} team responses</p>
              </div>
              <div class="summary-text-container">
                <MarkdownRenderer 
                  v-if="currentFormReport.textSummary" 
                  :content="currentFormReport.textSummary" 
                />
                <div v-else class="no-summary">
                  <p>No summary available</p>
                </div>
              </div>
            </div>

            <!-- Key Quotes Section -->
            <div v-if="currentFormReport.keyQuotes && currentFormReport.keyQuotes.length > 0" class="report-card quotes-card">
              <div class="card-header">
                <h4>💬 Notable Feedback Excerpts</h4>
                <p class="card-subtitle">Representative quotes from team members</p>
              </div>
              <div class="quotes-container">
                <div v-for="(quote, index) in currentFormReport.keyQuotes" :key="index" class="quote-item">
                  <div class="quote-icon">"</div>
                  <div class="quote-content">
                    <div class="quote-text">
                      <MarkdownRenderer :content="quote" />
                    </div>
                    <span class="quote-attribution">— Team Member</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Metrics Section -->
            <div v-if="currentFormReport.metrics" class="report-card metrics-card">
              <div class="card-header">
                <h4>📈 Response Metrics</h4>
                <p class="card-subtitle">Statistical overview of feedback data</p>
              </div>
              <div class="metrics-grid">
                <div class="metric-box">
                  <div class="metric-icon">👥</div>
                  <div class="metric-data">
                    <span class="metric-value">{{ currentFormReport.metrics.totalResponses }}</span>
                    <span class="metric-label">Total Responses</span>
                  </div>
                </div>
                <div class="metric-box">
                  <div class="metric-icon">🎯</div>
                  <div class="metric-data">
                    <span class="metric-value">{{ currentFormReport.metrics.uniqueRespondents }}</span>
                    <span class="metric-label">Unique Respondents</span>
                  </div>
                </div>
                <div class="metric-box">
                  <div class="metric-icon">❓</div>
                  <div class="metric-data">
                    <span class="metric-value">{{ currentFormReport.metrics.questionsAnswered }}</span>
                    <span class="metric-label">Questions Covered</span>
                  </div>
                </div>
                <div v-if="currentFormReport.metrics.averageResponseLength" class="metric-box">
                  <div class="metric-icon">📝</div>
                  <div class="metric-data">
                    <span class="metric-value">{{ Math.round(currentFormReport.metrics.averageResponseLength) }}</span>
                    <span class="metric-label">Avg Response Length (Chars)</span>
                  </div>
                </div>
              </div>

              <!-- Role Distribution -->
              <div v-if="currentFormReport.metrics.roleDistribution" class="role-distribution-section">
                <h5>👔 Participation by Role</h5>
                <div class="role-items">
                  <div v-for="(count, role) in currentFormReport.metrics.roleDistribution" :key="role" class="role-item">
                    <div class="role-info">
                      <span class="role-name">{{ role }}</span>
                      <span class="role-count">{{ count }} response{{ count !== 1 ? 's' : '' }}</span>
                    </div>
                    <div class="role-bar">
                      <div class="role-bar-fill" :style="{ width: (count / currentFormReport.metrics.totalResponses * 100) + '%' }"></div>
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
                  <p>Response: {{ responseText }}</p>
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
import MarkdownRenderer from '@/components/ui/MarkdownRenderer.vue';
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
const reportMinimized = ref(false);
const sendingReport = ref(false);

// Store reports per form ID
const formReports = ref<Record<string, any>>({});

// Get forms from store
const forms = computed(() => formsStore.forms.value);
const selectedForm = computed(() => 
  forms.value.find(f => f._id === selectedFormId.value)
);

// Get the report for the CURRENT form only
const currentFormReport = computed(() => {
  if (!selectedFormId.value) return null;
  return formReports.value[selectedFormId.value] || null;
});

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
  
  const teamMemberCount = selectedTeam.value?.members?.length || 0;
  
  if (teamMemberCount === 0) return 0;
  
  return Math.min(100, Math.round((responses.value.length / teamMemberCount) * 100));
});

const filteredResponses = computed(() => {
  let filtered = responses.value;

  if (roleFilter.value) {
    filtered = filtered.filter(r => r.memberRole === roleFilter.value);
  }

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

    await loadFormResponseCounts();

    console.log('Available forms:', forms.value);
    console.log('Response counts:', formsResponseCounts.value);
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
    
    const formResponses = await formsStore.getFormResponses(selectedFormId.value);
    responses.value = formResponses;

    const form = selectedForm.value;
    if (form) {
      formQuestions.value = form.questions || [];
    }

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

  // Check if we already have the report cached for this form
  if (formReports.value[selectedFormId.value]) {
    console.log('Using cached report for form:', selectedFormId.value);
    return;
  }

  try {
    const { currentAdminId } = useFormsStore();
    if (!currentAdminId.value) return;

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
        // Store the report specifically for this form ID
        formReports.value[selectedFormId.value] = data.report;
        reportMinimized.value = true;
        console.log('Loaded existing report for form:', selectedFormId.value);
      }
    }
  } catch (error) {
    console.log('No existing report found for form:', selectedFormId.value);
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

    const { currentAdminId } = useFormsStore();
    if (!currentAdminId.value) {
      throw new Error('No current admin');
    }

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

    const responseData = await response.json();
    const { report } = responseData;
    
    if (!report) {
      throw new Error('No report data received from backend');
    }
    
    // Store the report for THIS specific form
    formReports.value[selectedFormId.value] = report;
    reportMinimized.value = false;
    
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
  if (!currentFormReport.value || !selectedForm.value) {
    showToast('No report available to send', 'error');
    return;
  }

  try {
    sendingReport.value = true;

    const team = selectedTeam.value;
    if (!team || !team.membersWithRoles || team.membersWithRoles.length === 0) {
      showToast('No team members found to send report to', 'error');
      return;
    }

    const teamEmails = team.membersWithRoles
      .map(member => member.email)
      .filter(email => email && email.trim() !== '');

    if (teamEmails.length === 0) {
      showToast('No valid email addresses found for team members', 'error');
      return;
    }

    const emailSubject = `Feedback Report: ${selectedForm.value.name || 'Team Feedback'}`;
    const emailBody = createReportEmailBody(
      selectedForm.value.name || 'Team Feedback',
      team.name || 'Your Team',
      currentFormReport.value
    );

    const mailtoLink = createMailtoLink(emailSubject, teamEmails, emailBody, true);
    window.open(mailtoLink, '_blank');

    showToast(`Email opened for ${teamEmails.length} team members. Please send from your email client.`, 'success');

  } catch (error: any) {
    console.error('Error preparing report email:', error);
    showToast(error.message || 'Failed to prepare email. Please try again.', 'error');
  } finally {
    sendingReport.value = false;
  }
};

watch(() => formsStore.loaded.value, (isLoaded) => {
  if (isLoaded && forms.value.length > 0) {
    console.log('Forms are loaded, checking for responses');
    if (Object.keys(formsResponseCounts.value).length === 0) {
      loadFormResponseCounts();
    } else {
      checkAndSelectFormWithResponses();
    }
  }
});

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

watch(selectedFormId, async (newFormId) => {
  if (newFormId) {
    await loadResponses();
  } else {
    responses.value = [];
    formQuestions.value = [];
    // Don't clear formReports - keep all cached reports
    reportMinimized.value = false;
  }
});

const onFormChange = async () => {
  if (!selectedFormId.value) {
    responses.value = [];
    formQuestions.value = [];
    reportMinimized.value = false;
    return;
  }

  await loadResponses();
  await loadExistingReport();
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
  color: var(--primary);
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
  border-color: rgba(0, 0, 0, 1);
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

/* NEW FORMATTED REPORT STYLES */
.synthesized-report-section {
  margin-bottom: 2rem;
  padding: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #427AA1 0%, #7EA2AA 100%);
  color: white;
}

.report-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.report-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.report-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 6px;
  color: #427AA1;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.btn-send-report:hover:not(:disabled) {
  background: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-send-report:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-minimize-report {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-minimize-report:hover {
  background: rgba(255, 255, 255, 0.25);
}

.report-content {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Report Cards */
.report-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
}

.card-header {
  margin-bottom: 1rem;
}

.card-header h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

.card-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

/* Meta Card */
.report-meta-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.meta-icon {
  font-size: 1.5rem;
}

.meta-content {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  font-size: 0.9375rem;
  color: #1e293b;
  font-weight: 600;
}

/* Themes Grid */
.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: white;
  border-radius: 8px;
  border: 2px solid #427AA1;
  transition: all 0.2s;
}

.theme-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 122, 161, 0.2);
}

.theme-number {
  background: linear-gradient(135deg, #427AA1, #7EA2AA);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.theme-text {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9375rem;
}

/* Summary Text */
.summary-text-container {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  line-height: 1.8;
}

.no-summary {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
  padding: 2rem;
}

/* Quotes */
.quotes-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quote-item {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
  transition: all 0.2s;
}

.quote-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateX(4px);
}

.quote-icon {
  font-size: 2.5rem;
  color: #f59e0b;
  line-height: 1;
  font-family: Georgia, serif;
  opacity: 0.5;
}

.quote-content {
  flex: 1;
}

.quote-text {
  margin: 0 0 0.5rem 0;
  color: #334155;
  font-size: 0.9375rem;
  line-height: 1.6;
  font-style: italic;
}

.quote-text :deep(p) {
  margin: 0;
  font-style: italic;
}

.quote-attribution {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 600;
  font-style: normal;
}

/* Metrics */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  transition: all 0.2s;
}

.metric-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.metric-icon {
  font-size: 2rem;
}

.metric-data {
  display: flex;
  flex-direction: column;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #427AA1;
  line-height: 1;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
  font-weight: 600;
}

/* Role Distribution */
.role-distribution-section {
  padding-top: 1.5rem;
  border-top: 2px solid #e2e8f0;
}

.role-distribution-section h5 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #1e293b;
  font-weight: 700;
}

.role-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.role-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.role-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.role-count {
  color: #64748b;
  font-size: 0.875rem;
}

.role-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.role-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #427AA1, #7EA2AA);
  border-radius: 4px;
  transition: width 0.5s ease;
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

/* Empty States */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-state h3 {
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

  .report-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .report-actions {
    width: 100%;
    flex-direction: column;
  }

  .btn-send-report,
  .btn-minimize-report {
    width: 100%;
    justify-content: center;
  }

  .themes-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .report-meta-card {
    grid-template-columns: 1fr;
  }
}
</style>