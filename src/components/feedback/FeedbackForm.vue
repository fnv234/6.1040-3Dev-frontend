<template>
  <div class="feedback-form-wrapper">
    <form @submit.prevent="handleSubmit" class="feedback-form">
      <div v-for="(question, index) in questions" :key="index" class="question-block">
        <div class="question-header">
          <span class="question-number">{{ index + 1 }}</span>
          <div class="question-content">
            <h3 class="question-prompt">{{ question.prompt }}</h3>
            <span v-if="question.targetRoles && question.targetRoles.length > 0" class="role-indicator">
              ({{ question.targetRoles.join(', ') }} only)
            </span>
          </div>
          <span v-if="question.required" class="required-badge">*</span>
        </div>

        <!-- Free Response -->
        <div v-if="question.type === 'Free'" class="answer-section">
          <textarea
            v-model="formState[`question-${index}`]"
            :placeholder="question.placeholder || 'Type your answer here...'"
            rows="4"
            class="textarea-input"
            :required="question.required"
          ></textarea>
        </div>

        <!-- Scale (1-5) -->
        <div v-else-if="question.type === 'Scale'" class="answer-section scale-section">
          <div class="scale-container">
            <div class="scale-options">
              <label v-for="n in (question.max || 5)" :key="n" class="scale-option">
                <input
                  type="radio"
                  :name="`question-${index}`"
                  :value="n.toString()"
                  v-model="formState[`question-${index}`]"
                  :required="question.required"
                  class="scale-radio"
                />
                <span class="scale-label">{{ n }}</span>
              </label>
            </div>
            <div class="scale-text-labels">
              <span class="scale-text-label">{{ question.minLabel || 'Strongly Disagree' }}</span>
              <span class="scale-text-label">{{ question.maxLabel || 'Strongly Agree' }}</span>
            </div>
          </div>
        </div>

        <!-- Multiple Choice -->
        <div v-else-if="question.type === 'Multiple Choice'" class="answer-section">
          <select
            v-model="formState[`question-${index}`]"
            :required="question.required"
            class="form-select"
          >
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
      </div>

      <div v-if="showSubmitButton" class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn-cancel">
          Cancel
        </button>
        <button type="submit" :disabled="isSubmitting" class="btn-submit">
          <span v-if="isSubmitting">Submitting...</span>
          <span v-else>Submit Feedback</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

const props = defineProps({
  questions: {
    type: Array as () => Array<{
      type: 'Multiple Choice' | 'Free' | 'Scale';
      prompt: string;
      required?: boolean;
      options?: string[];
      min?: number;
      max?: number;
      step?: number;
      placeholder?: string;
      targetRoles?: string[];
      minLabel?: string;
      maxLabel?: string;
    }>,
    required: true
  },
  showSubmitButton: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['submit', 'cancel']);

const formState = reactive<Record<string, any>>({});
const isSubmitting = ref(false);

// Initialize form state with default values
props.questions.forEach((question, index) => {
  if (question.type === 'Scale') {
    formState[`question-${index}`] = question.min || 1;
  } else if (question.type === 'Multiple Choice') {
    formState[`question-${index}`] = '';
  } else {
    formState[`question-${index}`] = '';
  }
});

async function handleSubmit() {
  try {
    isSubmitting.value = true;
    
    // Format the responses
    const responses = props.questions.map((question, index) => ({
      questionId: index,
      questionText: question.prompt,
      response: formState[`question-${index}`],
      type: question.type
    }));
    
    // Emit the form data
    emit('submit', responses);
  } catch (error) {
    console.error('Error submitting form:', error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.feedback-form-wrapper {
  background: rgba(3, 33, 140, 0.66);
  border-radius: 12px;
  padding: 2.5rem;
}

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
  transition: border-color 0.3s ease;
}

.question-block:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.question-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.question-content {
  flex: 1;
}

.question-prompt {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--title-primary);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.role-indicator {
  color: var(--primary);
  font-size: 0.875rem;
  font-style: italic;
  margin-left: 0.5rem;
}

.question-number {
  background: var(--primary);
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

.required-badge {
  color: #ef4444;
  margin-left: 0.25rem;
}

.answer-section {
  margin-top: 1rem;
}

/* Free Response */
.textarea-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
  resize: vertical;
  min-height: 100px;
}

.textarea-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.textarea-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

/* Scale */
.scale-section {
  text-align: center;
}

.scale-container {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 0.5rem;
}

.scale-options {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.scale-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  gap: 0.5rem;
}

.scale-radio {
  width: 20px;
  height: 20px;
  accent-color: var(--primary);
}

.scale-label {
  color: var(--title-primary);
  font-weight: 500;
}

.scale-text-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.scale-text-label {
  text-align: center;
}

/* Multiple Choice */
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
}

.form-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.form-select option {
  background: #1f2937;
  color: white;
}

.form-select:invalid {
  color: rgba(255, 255, 255, 0.6);
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

.btn-cancel,
.btn-submit {
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.btn-cancel {
  padding: 0.75rem 2rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: none;
  box-shadow: none;
}

.btn-submit {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  box-shadow: 0 4px 12px rgba(66, 122, 161, 0.3);
  min-width: 200px;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(66, 122, 161, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>