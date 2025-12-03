<template>
  <div class="responses-view">
    <div class="responses-header">
      <h1>Form Responses</h1>
      <p class="text-secondary">
        View and analyze feedback responses from your team members.
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
            v-for="form in forms" 
            :key="form._id" 
            :value="form._id"
          >
            {{ form.name }}
          </option>
        </select>
      </div>

      <!-- Responses Display -->
      <div v-if="selectedFormId && responses.length > 0" class="responses-section">
        <div class="responses-summary">
          <h2>{{ selectedForm?.name }} - Responses</h2>
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
                  {{ responseText }}
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

      <!-- No Form Selected -->
      <div v-else-if="forms.length > 0" class="no-selection-state">
        <h3>Select a form to view responses</h3>
        <p class="text-secondary">
          Choose one of your forms from the dropdown above to see the responses.
        </p>
      </div>

      <!-- No Forms -->
      <div v-else class="no-forms-state">
        <h3>No forms created yet</h3>
        <p class="text-secondary">
          You haven't created any forms yet. Create a form to start collecting feedback.
        </p>
        <GradientButton @click="goToForms">
          Create Your First Form
        </GradientButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import GradientButton from '@/components/ui/GradientButton.vue';
import { useFormsStore } from '@/store/forms';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const formsStore = useFormsStore();
const { showToast } = useToast();

const loading = ref(true);
const error = ref('');
const selectedFormId = ref('');
const responses = ref<any[]>([]);
const roleFilter = ref('');
const sortBy = ref('date');
const formQuestions = ref<any[]>([]);

// Get forms from store
const forms = computed(() => formsStore.forms.value);
const selectedForm = computed(() => 
  forms.value.find(f => f._id === selectedFormId.value)
);

const uniqueRoles = computed(() => {
  const roles = responses.value
    .map(r => r.memberRole)
    .filter(role => role && role.trim() !== '');
  return [...new Set(roles)];
});

const completionRate = computed(() => {
  if (!selectedForm.value) return 0;
  // This is a simplified calculation - in a real app you'd compare against expected responses
  return Math.min(100, Math.round((responses.value.length / 10) * 100));
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
    // This function mainly controls the loading state and error handling.

  } catch (err: any) {
    error.value = err.message || 'Failed to load forms';
  } finally {
    loading.value = false;
  }
};

const onFormChange = async () => {
  if (!selectedFormId.value) {
    responses.value = [];
    formQuestions.value = [];
    return;
  }

  await loadResponses();
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

  } catch (err: any) {
    error.value = err.message || 'Failed to load responses';
    showToast(error.value, 'error');
  } finally {
    loading.value = false;
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
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.form-selector label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--title-primary);
  font-weight: 500;
}

.form-select {
  width: 100%;
  max-width: 400px;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
}

.form-select option {
  background: #1f2937;
  color: white;
}

/* Summary */
.responses-summary {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.responses-summary h2 {
  color: var(--title-primary);
  margin-bottom: 1rem;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
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
  background: rgba(255, 255, 255, 0.05);
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
  color: white;
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
  color: white;
  line-height: 1.5;
  padding: 0.5rem 0;
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
