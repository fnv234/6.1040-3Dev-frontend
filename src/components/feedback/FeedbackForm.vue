<template>
  <div class="feedback-form-wrapper">
    <form @submit.prevent="handleSubmit" class="feedback-form">
      <div v-for="(question, index) in questions" :key="index" class="question-block">
        <div class="question-header">
          <span class="question-number">{{ index + 1 }}</span>
          <h3 class="question-prompt">{{ question.prompt }}</h3>
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
            <div class="scale-labels">
              <span class="scale-label">{{ question.min || 1 }}</span>
              <span class="scale-label">{{ question.max || 5 }}</span>
            </div>
            <input
              type="range"
              v-model.number="formState[`question-${index}`]"
              :min="question.min || 1"
              :max="question.max || 5"
              :step="question.step || 1"
              class="scale-slider"
              :required="question.required"
            />
            <div class="scale-value">
              <span class="current-value">{{ formState[`question-${index}`] || question.min || 1 }}</span>
            </div>
          </div>
        </div>

        <!-- Multiple Choice -->
        <div v-else-if="question.type === 'Multiple Choice'" class="answer-section">
          <div class="options-grid">
            <label
              v-for="(option, optIdx) in question.options"
              :key="optIdx"
              class="option-card"
              :class="{ 'selected': formState[`question-${index}`] === option }"
            >
              <input
                type="radio"
                :name="`question-${index}`"
                :value="option"
                v-model="formState[`question-${index}`]"
                :required="question.required"
                class="option-radio"
              />
              <span class="option-text">{{ option }}</span>
              <span class="check-icon">✓</span>
            </label>
          </div>
        </div>
      </div>

      <div class="form-actions">
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
    }>,
    required: true
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
  background: var(--bg);
  border-radius: 12px;
  padding: 2rem;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.question-block {
  background: white;
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  transition: border-color 0.3s ease;
}

.question-block:hover {
  border-color: var(--primary);
}

.question-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
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

.question-prompt {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--title-primary);
  margin: 0;
  line-height: 1.5;
}

.required-badge {
  color: var(--error);
  font-size: 1.25rem;
  font-weight: 700;
}

.answer-section {
  margin-top: 1rem;
}

/* Free Response */
.textarea-input {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
  resize: vertical;
  min-height: 100px;
}

.textarea-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(126, 162, 170, 0.1);
}

/* Scale */
.scale-section {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.scale-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.scale-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #7EA2AA, #427AA1);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.scale-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.scale-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.scale-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.scale-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.scale-value {
  text-align: center;
}

.current-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Multiple Choice */
.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.option-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border: 2px solid var(--border);
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.option-card:hover {
  border-color: var(--primary);
  background: var(--bg-secondary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.option-card.selected {
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(126, 162, 170, 0.15), rgba(66, 122, 161, 0.15));
  box-shadow: 0 4px 12px rgba(66, 122, 161, 0.2);
}

.option-radio {
  appearance: none;
  width: 22px;
  height: 22px;
  border: 2px solid var(--border);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.option-card:hover .option-radio {
  border-color: var(--primary);
}

.option-card.selected .option-radio {
  border-color: var(--primary);
  background: var(--primary);
  box-shadow: 0 0 0 3px rgba(126, 162, 170, 0.3);
}

.option-text {
  flex: 1;
  font-weight: 500;
  color: var(--text);
}

.option-card.selected .option-text {
  color: var(--primary);
  font-weight: 600;
}

.check-icon {
  display: none;
  color: var(--primary);
  font-size: 1.5rem;
  font-weight: 700;
}

.option-card.selected .check-icon {
  display: block;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border);
  margin-top: 1rem;
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
  background: var(--bg-secondary);
  color: var(--text);
  border: 2px solid var(--border);
}

.btn-cancel:hover {
  background: var(--border);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-submit {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  box-shadow: 0 4px 12px rgba(66, 122, 161, 0.3);
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