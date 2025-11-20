<template>
  <div class="container">
    <div class="page-header">
      <h1>Create Feedback Form</h1>
      <button @click="saveAndSendForm" class="btn btn-primary" :disabled="!canSend">
        Save & Send Form
      </button>
    </div>

    <div class="form-builder">
      <div class="builder-section card">
        <div class="section-header">
          <h2>Form Details</h2>
        </div>
        <div class="form-group">
          <label class="label" for="formTitle">Form Title</label>
          <input
            id="formTitle"
            v-model="form.title"
            type="text"
            class="input"
            placeholder="e.g., Q4 Team Feedback"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="label" for="formDescription">Description</label>
          <textarea
            id="formDescription"
            v-model="form.description"
            class="input textarea"
            rows="3"
            placeholder="Provide context for this feedback form..."
          ></textarea>
        </div>

        <div class="form-group">
          <label class="label" for="teamSelect">Select Team</label>
          <select id="teamSelect" v-model="form.teamId" class="input" required>
            <option value="">-- Select a team --</option>
            <option v-for="team in availableTeams" :key="team.id" :value="team.id">
              {{ team.name }} ({{ team.memberEmails.length }} members)
            </option>
          </select>
          <small class="text-secondary">
            <router-link to="/teams">Manage teams</router-link>
          </small>
        </div>
      </div>

      <div class="builder-section card">
        <div class="section-header">
          <h2>Questions</h2>
          <button @click="addQuestion" class="btn btn-secondary">+ Add Question</button>
        </div>

        <div v-if="form.questions.length === 0" class="empty-questions">
          <p class="text-secondary">No questions yet. Add your first question above.</p>
        </div>

        <div v-else class="questions-list">
          <div v-for="(question, idx) in form.questions" :key="question.id" class="question-card">
            <div class="question-header">
              <span class="question-number">Q{{ idx + 1 }}</span>
              <button @click="removeQuestion(idx)" class="btn-icon" title="Remove question">×</button>
            </div>

            <div class="form-group">
              <label class="label">Question Text</label>
              <input
                v-model="question.text"
                type="text"
                class="input"
                placeholder="Enter your question..."
                required
              />
            </div>

            <div class="form-group">
              <label class="label">Question Type</label>
              <select v-model="question.type" class="input">
                <option value="text">Text Response</option>
                <option value="rating">Rating (1-5)</option>
                <option value="multipleChoice">Multiple Choice</option>
              </select>
            </div>

            <div v-if="question.type === 'multipleChoice'" class="form-group">
              <label class="label">Options (one per line)</label>
              <textarea
                v-model="question.optionsText"
                class="input textarea"
                rows="4"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="question.required" type="checkbox" />
                Required question
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="builder-section card preview-section">
        <div class="section-header">
          <h2>Preview</h2>
        </div>
        <div class="form-preview">
          <h3>{{ form.title || 'Untitled Form' }}</h3>
          <p class="text-secondary">{{ form.description || 'No description' }}</p>
          <div class="preview-questions">
            <div v-for="(q, idx) in form.questions" :key="q.id" class="preview-question">
              <p><strong>{{ idx + 1 }}. {{ q.text }}</strong> {{ q.required ? '*' : '' }}</p>
              <p class="text-secondary"><small>Type: {{ q.type }}</small></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import type { FeedbackForm, FeedbackQuestion, Team } from '@/types';

const router = useRouter();

// Mock teams data (in production, fetch from backend)
const availableTeams = ref<Team[]>([
  {
    id: 'team1',
    name: 'Engineering Team',
    memberEmails: ['eng1@company.com', 'eng2@company.com'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'team2',
    name: 'Product Team',
    memberEmails: ['pm1@company.com', 'pm2@company.com'],
    createdAt: new Date().toISOString()
  }
]);

interface QuestionWithText extends FeedbackQuestion {
  optionsText?: string;
}

const form = reactive({
  title: '',
  description: '',
  teamId: '',
  questions: [] as QuestionWithText[]
});

const canSend = computed(() => {
  return form.title && form.teamId && form.questions.length > 0;
});

const addQuestion = () => {
  const newQuestion: QuestionWithText = {
    id: `q_${Date.now()}`,
    text: '',
    type: 'text',
    required: true,
    optionsText: ''
  };
  form.questions.push(newQuestion);
};

const removeQuestion = (index: number) => {
  form.questions.splice(index, 1);
};

const saveAndSendForm = async () => {
  if (!canSend.value) return;

  // Convert optionsText to options array for multipleChoice questions
  const processedQuestions: FeedbackQuestion[] = form.questions.map(q => {
    const question: FeedbackQuestion = {
      id: q.id,
      text: q.text,
      type: q.type,
      required: q.required
    };
    
    if (q.type === 'multipleChoice' && q.optionsText) {
      question.options = q.optionsText
        .split('\n')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);
    }
    
    return question;
  });

  const feedbackForm: Partial<FeedbackForm> = {
    id: `form_${Date.now()}`,
    title: form.title,
    description: form.description,
    teamId: form.teamId,
    questions: processedQuestions,
    createdBy: localStorage.getItem('hrAdminId') || 'unknown',
    createdAt: new Date().toISOString(),
    sentAt: new Date().toISOString()
  };

  // In production: 
  // 1. Save form to backend
  // 2. Trigger email sending to team members
  // 3. Show success message
  
  console.log('Saving and sending form:', feedbackForm);
  
  alert(`Form "${form.title}" created and sent to ${availableTeams.value.find(t => t.id === form.teamId)?.name}!`);
  
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
