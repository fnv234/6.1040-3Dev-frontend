<template>
  <div class="access-code-form-page">
    <div class="access-code-form-overlay">
      <div class="access-code-form-card card">
        <div v-if="loading" class="loading-state">
          <h2>Loading form...</h2>
          <p class="text-secondary">Please wait while we load your feedback form.</p>
        </div>

        <div v-else-if="error" class="error-state">
          <h2>Error</h2>
          <p class="text-secondary">{{ error }}</p>
          <div class="form-actions">
            <GradientButton @click="goBack">
              Back to Login
            </GradientButton>
          </div>
        </div>

        <div v-else-if="submitted" class="success-state">
          <h2>Thank you!</h2>
          <p class="text-secondary">Your feedback has been submitted successfully.</p>
          <div class="form-actions">
            <GradientButton @click="goBack">
              Back to Login
            </GradientButton>
          </div>
        </div>

        <div v-else class="form-content">
          <div class="form-header">
            <h1>{{ formData?.name || 'Feedback Form' }}</h1>
            <p class="text-secondary">
              Hello {{ memberInfo?.memberEmail }}, please complete this feedback form.
            </p>
            <div class="member-info">
              <span class="member-role" v-if="memberInfo?.memberRole">
                Role: {{ memberInfo.memberRole }}
              </span>
            </div>
          </div>

          <form @submit.prevent="submitForm" class="feedback-form" v-if="!props.previewMode">
            <div v-for="(question, index) in questions" :key="index" class="question-block">
              <label class="question-label">
                {{ index + 1 }}. {{ question.prompt }}
                <span class="required-indicator">*</span>
                <span v-if="question.targetRoles && question.targetRoles.length > 0" class="role-indicator">
                  ({{ question.targetRoles.join(', ') }} only)
                </span>
              </label>

              <!-- Multiple Choice -->
              <div v-if="question.type === 'Multiple Choice'" class="question-input">
                <select 
                  v-model="responses[index]" 
                  :required="true"
                  class="form-select"
                >
                  <option value="">Select an option</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              <!-- Scale -->
              <div v-else-if="question.type === 'Scale'" class="question-input scale-input">
                <div class="scale-container">
                  <label v-for="n in 5" :key="n" class="scale-option">
                    <input 
                      type="radio" 
                      :name="`question-${index}`"
                      :value="n.toString()" 
                      v-model="responses[index]"
                      :required="true"
                    />
                    <span class="scale-label">{{ n }}</span>
                  </label>
                </div>
                <div class="scale-labels">
                  <span>Strongly Disagree</span>
                  <span>Strongly Agree</span>
                </div>
              </div>

              <!-- Free Text -->
              <div v-else class="question-input">
                <textarea 
                  v-model="responses[index]" 
                  :placeholder="'Enter your response...'"
                  :required="true"
                  class="form-textarea"
                  rows="4"
                ></textarea>
              </div>

              <div v-if="validationErrors[index]" class="validation-error">
                {{ validationErrors[index] }}
              </div>
            </div>

            <div class="form-actions">
              <GradientButton 
                type="submit" 
                :disabled="submitting"
                class="submit-button"
              >
                {{ submitting ? 'Submitting...' : 'Submit Feedback' }}
              </GradientButton>
              <button type="button" @click="goBack" class="secondary-button">
                Cancel
              </button>
            </div>
          </form>
          
          <!-- Preview Mode Form -->
          <div v-else class="feedback-form">
            <div v-for="(question, index) in questions" :key="index" class="question-block">
              <label class="question-label">
                {{ index + 1 }}. {{ question.prompt }}
                <span class="required-indicator">*</span>
                <span v-if="question.targetRoles && question.targetRoles.length > 0" class="role-indicator">
                  ({{ question.targetRoles.join(', ') }} only)
                </span>
              </label>

              <!-- Multiple Choice -->
              <div v-if="question.type === 'Multiple Choice'" class="question-input">
                <select class="form-select">
                  <option value="">Select an option</option>
                  <option
                    v-for="(option, optIdx) in question.options"
                    :key="optIdx"
                    :value="option"
                  >
                    {{ option }}
                  </option>
                </select>
              </div>

              <!-- Scale -->
              <div v-else-if="question.type === 'Scale'" class="question-input scale-input">
                <div class="scale-container">
                  <label v-for="n in (question.max || 5)" :key="n" class="scale-option">
                    <input 
                      type="radio" 
                      :name="`preview-question-${index}`"
                      :value="n.toString()"
                    />
                    <span class="scale-label">{{ n }}</span>
                  </label>
                </div>
                <div class="scale-labels">
                  <span>{{ question.minLabel || 'Strongly Disagree' }}</span>
                  <span>{{ question.maxLabel || 'Strongly Agree' }}</span>
                </div>
              </div>

              <!-- Free Text -->
              <div v-else class="question-input">
                <textarea 
                  :placeholder="question.placeholder || 'Enter your response...'"
                  class="form-textarea"
                  rows="4"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import GradientButton from '@/components/ui/GradientButton.vue';
import { useFormsStore } from '@/store/forms';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const route = useRoute();
const formsStore = useFormsStore();
const { showToast } = useToast();

const accessCode = ref('');
const loading = ref(true);
const error = ref('');
const props = defineProps({
  previewMode: {
    type: Boolean,
    default: false
  },
  previewData: {
    type: Object,
    default: null
  }
});
const submitting = ref(false);
const submitted = ref(false);

const formData = ref<any>(null);
const memberInfo = ref<any>(null);
const questions = ref<any[]>([]);
const responses = reactive<Record<number, string>>({});
const validationErrors = reactive<Record<number, string>>({});

onMounted(async () => {
  if (props.previewMode && props.previewData) {
    // Use preview data instead of loading from API
    loading.value = false;
    formData.value = props.previewData;
    questions.value = props.previewData.questions || [];
    
    // Initialize responses
    for (let i = 0; i < questions.value.length; i++) {
      responses[i] = '';
    }
  } else {
    // Get the access code from route params
    accessCode.value = route.params.code as string;
    
    // If no access code is provided, redirect to login
    if (!accessCode.value) {
      router.push('/login');
      return;
    }

    await loadForm();
  }
});

const loadForm = async () => {
  try {
    loading.value = true;
    error.value = '';

    // Get form and access code info
    const { accessCodeInfo, form } = await formsStore.getFormByAccessCode(accessCode.value);
    
    formData.value = form;
    memberInfo.value = accessCodeInfo;

    // Get questions filtered by role
    const filteredQuestions = await formsStore.getQuestionsForRole(
      form, 
      accessCodeInfo.memberRole || null
    );
    
    questions.value = filteredQuestions;
    
    // Initialize responses
    for (let i = 0; i < questions.value.length; i++) {
      responses[i] = '';
    }

  } catch (err: any) {
    error.value = err.message || 'Failed to load form';
  } finally {
    loading.value = false;
  }
};

const validateForm = () => {
  let isValid = true;
  
  // Clear previous validation errors
  Object.keys(validationErrors).forEach(key => {
    delete validationErrors[parseInt(key)];
  });

  // Validate each question
  questions.value.forEach((_, index) => {
    const response = responses[index];
    
    if (!response || response.trim() === '') {
      validationErrors[index] = 'This question is required';
      isValid = false;
    }
  });

  return isValid;
};

const submitForm = async () => {
  if (!validateForm()) {
    showToast('Please answer all required questions', 'error');
    return;
  }

  try {
    submitting.value = true;
    
    console.log('Submitting form with access code:', accessCode.value);
    console.log('Responses:', responses);
    
    const responseId = await formsStore.submitFormResponse(accessCode.value, responses);
    
    console.log('Form submitted successfully, response ID:', responseId);
    
    submitted.value = true;
    showToast('Feedback submitted successfully!', 'success');
    
  } catch (err: any) {
    console.error('Form submission error:', err);
    error.value = err.message || 'Failed to submit form';
    showToast(error.value, 'error');
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
  router.push('/login');
};
</script>

<style scoped>
.access-code-form-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

.access-code-form-overlay {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.access-code-form-card {
  width: 100%;
  max-width: 800px;
  background: #4398ffff;
  border-radius: 12px;
  padding: 2.5rem;
  opacity: 0;
  animation: formFadeIn 0.9s ease-out forwards;
}

@keyframes formFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading, Error, Success States */
.loading-state, .error-state, .success-state {
  text-align: center;
}

.loading-state h2, .error-state h2, .success-state h2 {
  color: var(--title-primary);
  margin-bottom: 1rem;
}

/* Form Content */
.form-content {
  text-align: left;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.form-header h1 {
  color: var(--title-primary);
  margin-bottom: 0.5rem;
}

.member-info {
  margin-top: 1rem;
}

.member-role {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.875rem;
  color: var(--primary);
}

/* Form Questions */
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.question-block {
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.question-label {
  display: block;
  color: var(--title-primary);
  font-weight: 500;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.required-indicator {
  color: #ef4444;
  margin-left: 0.25rem;
}

.role-indicator {
  color: var(--primary);
  font-size: 0.875rem;
  font-style: italic;
  margin-left: 0.5rem;
}

/* Form Inputs */
.question-input {
  width: 100%;
}

.form-select, .form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
}

.form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.form-select option {
  background: #1f2937;
  color: white;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

/* Scale Input */
.scale-input {
  text-align: center;
}

.scale-container {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 0.5rem;
}

.scale-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  gap: 0.5rem;
}

.scale-option input[type="radio"] {
  width: 20px;
  height: 20px;
  accent-color: var(--primary);
}

.scale-label {
  color: var(--title-primary);
  font-weight: 500;
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

/* Validation */
.validation-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.submit-button {
  min-width: 200px;
}

.secondary-button {
  padding: 0.75rem 2rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .access-code-form-overlay {
    padding: 1rem;
  }
  
  .access-code-form-card {
    padding: 1.5rem;
  }
  
  .scale-container {
    gap: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .submit-button {
    min-width: auto;
    width: 100%;
  }
}
</style>
