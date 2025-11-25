<template>
  <div class="container">
    <div class="page-header">
      <h1>Create Feedback Form</h1>
      <div class="header-actions">
        <GradientButton @click="saveFormDraft" :disabled="!canSave" variant="variant">
          Save
        </GradientButton>
        <GradientButton @click="saveAndSendForm" :disabled="!canSend">
          Save &amp; Send Form
        </GradientButton>
      </div>
    </div>

    <div class="form-builder">
      <div class="builder-section card">
        <div class="section-header">
          <h2>Form Details</h2>
        </div>
        <div class="form-group">
          <label class="label" for="formName">Form Name</label>
          <input
            id="formName"
            v-model="form.name"
            type="text"
            class="input"
            placeholder="e.g., Q3 2025 Peer Feedback"
            required
          />
        </div>
        <div class="form-group">
          <label class="label" for="teamSelect">Select Team</label>
          <select id="teamSelect" v-model="form.teamId" class="input" required>
            <option value="">-- Select a team --</option>
            <option v-for="team in availableTeams" :key="team._id" :value="team._id">
              {{ team.name }}
            </option>
          </select>
          <small class="text-secondary">
            Forms will be sent to all team members for peer feedback
          </small>
        </div>
      </div>

      <div class="builder-section card">
        <div class="section-header">
          <h2>Questions</h2>
          <GradientButton @click="addQuestion" variant="variant">+ Add Question</GradientButton>
        </div>

        <div v-if="form.questions.length === 0" class="empty-questions">
          <p class="text-secondary">No questions yet. Add your first question above.</p>
        </div>

        <div v-else class="questions-list">
          <div v-for="(question, idx) in form.questions" :key="idx" class="question-card">
            <div class="question-header">
              <span class="question-number">Q{{ idx + 1 }}</span>
              <button @click="removeQuestion(idx)" class="btn-icon" title="Remove question">×</button>
            </div>

            <div class="form-group">
              <label class="label">Question Prompt</label>
              <input
                v-model="question.prompt"
                type="text"
                class="input"
                placeholder="e.g., How effective is this person at communication?"
                required
              />
            </div>

            <div class="form-group">
              <label class="label">Question Type</label>
              <select v-model="question.type" class="input">
                <option value="Free">Free Response</option>
                <option value="Scale">Scale (1-5)</option>
                <option value="Multiple Choice">Multiple Choice</option>
              </select>
            </div>

            <div v-if="question.type === 'Multiple Choice'" class="form-group">
              <label class="label">Options (comma-separated)</label>
              <input
                v-model="question.optionsDisplay"
                type="text"
                class="input"
                placeholder="Excellent, Good, Fair, Poor"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="builder-section card preview-section">
        <div class="section-header">
          <h2>Preview</h2>
        </div>
        <div class="form-preview">
          <h3>{{ form.name || 'Untitled Form' }}</h3>
          <p class="text-secondary">{{ form.questions.length }} question(s)</p>
          <div class="preview-questions">
            <div v-for="(q, idx) in form.questions" :key="idx" class="preview-question">
              <p><strong>{{ idx + 1 }}. {{ q.prompt || 'No prompt yet' }}</strong></p>
              <p class="text-secondary"><small>Type: {{ q.type }}</small></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import type { FeedbackFormDraft, FeedbackQuestion } from '@/types';
import { useFormsStore } from '@/store/forms';
import { useTeamsStore } from '@/store/teams';
import GradientButton from '@/components/ui/GradientButton.vue';

const router = useRouter();
const formsStore = useFormsStore();
const { teams: availableTeams } = useTeamsStore();

interface QuestionWithOptions extends FeedbackQuestion {
  options?: string[];
  optionsDisplay?: string; // For UI display of comma-separated options
}

const form = reactive({
  name: '',
  teamId: '',
  questions: [] as QuestionWithOptions[]
});

const canSave = computed(() => {
  return form.name && form.questions.length > 0;
});

const canSend = computed(() => {
  return form.name && form.teamId && form.questions.length > 0;
});

const addQuestion = () => {
  const newQuestion: QuestionWithOptions = {
    prompt: '',
    type: 'Free',
    options: []
  };
  form.questions.push(newQuestion);
};

const removeQuestion = (index: number) => {
  form.questions.splice(index, 1);
};

const saveFormDraft = () => {
  if (!canSave.value) return;

  // Remove empty options for non-Multiple Choice questions
  const processedQuestions: FeedbackQuestion[] = form.questions.map(q => {
    const question: FeedbackQuestion = {
      prompt: q.prompt,
      type: q.type
    };
    
    // Add options for Multiple Choice questions
    if (q.type === 'Multiple Choice' && q.optionsDisplay) {
      (question as any).options = q.optionsDisplay.split(',').map((opt: string) => opt.trim());
    }
    
    return question;
  });

  // Get current HR admin ID
  const creatorId = localStorage.getItem('hrAdminId') || 'unknown';

  const feedbackFormDraft: FeedbackFormDraft = {
    name: form.name,
    creator: creatorId,
    teamId: form.teamId,
    status: 'Created',
    createdDate: new Date().toISOString(),
    questions: processedQuestions
  };

  formsStore.saveForm(feedbackFormDraft);
  alert('Form saved successfully!');
  router.push('/forms');
};

const saveAndSendForm = async () => {
  if (!canSend.value) return;

  // Remove empty options for non-Multiple Choice questions
  const processedQuestions: FeedbackQuestion[] = form.questions.map(q => {
    const question: FeedbackQuestion = {
      prompt: q.prompt,
      type: q.type
    };
    
    // Add options for Multiple Choice questions
    if (q.type === 'Multiple Choice' && q.optionsDisplay) {
      (question as any).options = q.optionsDisplay.split(',').map((opt: string) => opt.trim());
    }
    
    return question;
  });

  // Get current HR admin ID
  const creatorId = localStorage.getItem('hrAdminId') || 'unknown';

  const feedbackFormDraft: FeedbackFormDraft = {
    name: form.name,
    creator: creatorId,
    teamId: form.teamId,
    status: 'Sent',
    createdDate: new Date().toISOString(),
    questions: processedQuestions
  };

  // Save form and mark as sent
  formsStore.saveForm(feedbackFormDraft);
  
  // In production: 
  // 1. Create individual FeedbackForm documents for each reviewer-target pair in the team
  // 2. Send emails to reviewers with form links
  
  console.log('Saving and sending form:', feedbackFormDraft);
  
  const teamName = availableTeams.value.find(t => t._id === form.teamId)?.name;
  alert(`Form created and sent to ${teamName}!`);
  
  router.push('/dashboard');
};
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.page-header h1 {
  color: var(--title-primary);
  text-shadow: 1px 1px var(--primary);
}

.form-builder {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.builder-section {
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  color: var(--title-primary);
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

.empty-questions {
  text-align: center;
  padding: 2rem;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-card {
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-number {
  font-weight: 600;
  color: var(--primary);
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: var(--border);
  color: var(--error);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.preview-section {
  background: var(--bg);
}

.form-preview {
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.form-preview h3 {
  margin-bottom: 0.5rem;
}

.preview-questions {
  margin-top: 1.5rem;
}

.preview-question {
  padding: 1rem 0;
  border-top: 1px solid var(--border);
}

.preview-question:first-child {
  border-top: none;
  padding-top: 0;
}
</style>
