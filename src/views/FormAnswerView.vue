<template>
  <div class="form-answer-container">
    <div v-if="loading" class="loading-state card">
      <div class="loading-spinner"></div>
      <p>Loading form...</p>
    </div>

    <div v-else-if="error" class="error-state card">
      <div class="error-icon">⚠️</div>
      <h2>Error Loading Form</h2>
      <p class="error-message">{{ error }}</p>
      <router-link to="/forms">
        <button class="btn-primary">Back to My Forms</button>
      </router-link>
    </div>

    <div v-else-if="form" class="form-container">
      <div class="form-header card">
        <div class="header-content">
          <div v-if="isPreviewMode" class="preview-badge">
            <span>👁️ Preview Mode</span>
          </div>
          <h1>{{ form.name || 'Untitled Form' }}</h1>
          <p class="form-description">
            {{ form.questions.length }} question{{ form.questions.length !== 1 ? 's' : '' }}
          </p>
          <div v-if="!isPreviewMode" class="form-status">
            <span class="status-label">Status:</span>
            <span v-if="form.status === 'Sent'" class="badge badge-sent">Ready to Answer</span>
            <span v-else-if="form.status === 'Completed'" class="badge badge-completed">✓ Completed</span>
            <span v-else class="badge badge-draft">Draft</span>
          </div>
        </div>
        
        <button v-if="isPreviewMode" @click="goBack" class="btn-back">
          ← Back
        </button>
      </div>

      <div v-if="form.status === 'Completed' && !isPreviewMode" class="completed-message card">
        <div class="completed-icon">✓</div>
        <h2>Form Already Completed</h2>
        <p>This feedback form has already been submitted.</p>
        <button @click="viewResponses" class="btn-primary">View Responses</button>
      </div>

      <div v-else class="form-content card">
        <FeedbackForm 
          :questions="form.questions"
          :show-submit-button="!isPreviewMode && form.status === 'Sent'"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
        
        <div v-if="isPreviewMode" class="preview-footer">
          <button @click="goBack" class="btn-secondary">
            ← Back to My Forms
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FeedbackForm from '@/components/feedback/FeedbackForm.vue';
import { feedbackForm as feedbackFormAPI } from '@/api/client';
import { useToast } from '@/composables/useToast';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();

const form = ref<any | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const formId = computed(() => route.params.id as string);
const isPreviewMode = computed(() => route.query.preview === 'true');

onMounted(async () => {
  await fetchForm();
});

async function fetchForm() {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await feedbackFormAPI.getFeedbackForm({ id: formId.value });
    form.value = response.data.feedbackForm;
  } catch (err: any) {
    console.error('Error fetching form:', err);
    error.value = err.response?.data?.error || 'Failed to load form. Please try again.';
  } finally {
    loading.value = false;
  }
}

async function handleSubmit(responses: any[]) {
  if (isPreviewMode.value) {
    showToast('This is preview mode. Submissions are disabled.', 'info');
    return;
  }

  try {
    // Convert responses array to Record<number, string> format expected by backend
    const responseMap: Record<number, string> = {};
    responses.forEach((response: any) => {
      responseMap[response.questionId] = String(response.response);
    });

    await feedbackFormAPI.submitFeedbackForm({
      feedbackForm: formId.value,
      responses: responseMap
    });

    showToast('Feedback submitted successfully!', 'success');
    
    // Redirect to a success page or forms list
    setTimeout(() => {
      router.push('/forms');
    }, 1500);
  } catch (err: any) {
    console.error('Error submitting form:', err);
    showToast(err.response?.data?.error || 'Failed to submit feedback. Please try again.', 'error');
  }
}

function handleCancel() {
  if (isPreviewMode.value) {
    goBack();
  } else {
    if (confirm('Are you sure you want to cancel? Your progress will not be saved.')) {
      router.push('/forms');
    }
  }
}

function goBack() {
  router.push('/forms');
}

function viewResponses() {
  // TODO: Implement view responses functionality
  showToast('View responses functionality coming soon!', 'info');
}
</script>

<style scoped>
.form-answer-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 1rem;
  border: 4px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-state h2 {
  color: var(--error);
  margin-bottom: 1rem;
}

.error-message {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

/* Form Container */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  background: linear-gradient(135deg, rgba(126, 162, 170, 0.05), rgba(66, 122, 161, 0.05));
}

.header-content {
  flex: 1;
}

.preview-badge {
  display: inline-block;
  background: linear-gradient(135deg, #FFA726, #FB8C00);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-badge span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-header h1 {
  color: var(--title-primary);
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
}

.form-description {
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.form-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.status-label {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.badge {
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-sent {
  background: linear-gradient(135deg, #A0CA92, #8ABD7C);
  color: white;
}

.badge-completed {
  background: linear-gradient(135deg, #427AA1, #7EA2AA);
  color: white;
}

.badge-draft {
  background: linear-gradient(135deg, #998650, #67584a);
  color: white;
}

.btn-back {
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  border: 2px solid var(--border);
  background: white;
  color: var(--text);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-back:hover {
  background: var(--border);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Completed Message */
.completed-message {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, rgba(126, 162, 170, 0.05), rgba(66, 122, 161, 0.05));
}

.completed-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(66, 122, 161, 0.3);
}

.completed-message h2 {
  color: var(--title-primary);
  margin-bottom: 0.5rem;
}

.completed-message p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

/* Form Content */
.form-content {
  padding: 2rem;
}

.preview-footer {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid var(--border);
  display: flex;
  justify-content: center;
}

/* Buttons */
.btn-primary,
.btn-secondary {
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  box-shadow: 0 4px 12px rgba(66, 122, 161, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(66, 122, 161, 0.4);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text);
  border: 2px solid var(--border);
}

.btn-secondary:hover {
  background: var(--border);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
