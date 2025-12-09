<template>
  <div class="container">
    <div class="page-header">
      <h1>Create Feedback Form</h1>
      <div class="header-actions">
        <GradientButton @click="saveFormDraft" :disabled="!canSave" variant="variant">
          Save
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

            <div class="form-group">
              <div class="role-targeting-section">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    :checked="question.targetRoles !== undefined"
                    @change="toggleRoleTargeting(question, $event)"
                    :disabled="!form.teamId || availableRoles.length === 0"
                  />
                  Target specific roles only
                </label>
                <small class="text-secondary">
                  <span v-if="!form.teamId">Select a team first to enable role targeting</span>
                  <span v-else-if="availableRoles.length === 0">Selected team has no role information available</span>
                  <span v-else>Check this to show this question only to team members with specific roles</span>
                </small>
              </div>
              
              <div v-if="question.targetRoles !== undefined" class="targeted-roles">
                <label class="label">Select Target Roles</label>
                <div class="roles-selection-section">
                  <div v-if="availableRoles.length === 0" class="no-roles-available">
                    <p class="text-secondary">
                      No roles available. Please select a team with members that have roles assigned, or ensure the selected team has members with roles.
                    </p>
                  </div>
                  <div v-else class="roles-checkbox-list">
                    <div v-for="role in availableRoles" :key="role" class="role-checkbox-item">
                      <label class="role-checkbox-label">
                        <input
                          type="checkbox"
                          :checked="isRoleSelected(question, role)"
                          @change="toggleRoleSelection(question, role, $event)"
                        />
                        <span class="role-name">{{ role }}</span>
                      </label>
                    </div>
                  </div>
                  <div v-if="question.targetRoles && question.targetRoles.length > 0" class="selected-roles-summary">
                    <small class="text-secondary">
                      Selected: {{ question.targetRoles.join(', ') }}
                    </small>
                  </div>
                </div>
              </div>
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
              <p v-if="q.targetRoles && q.targetRoles.length > 0" class="role-target-info">
                <small><strong>Target Roles:</strong> 
                  <span class="role-badges">
                    <span v-for="role in q.targetRoles" :key="role" class="role-badge">{{ role }}</span>
                  </span>
                </small>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { FormTemplate, FeedbackQuestion } from '@/types';
import { useFormsStore } from '@/store/forms';
import { useTeamsStore } from '@/store/teams';
import GradientButton from '@/components/ui/GradientButton.vue';

const router = useRouter();
const formsStore = useFormsStore();
const { teams: availableTeams } = useTeamsStore();

interface QuestionWithOptions extends FeedbackQuestion {
  options?: string[];
  optionsDisplay?: string; // For UI display of comma-separated options
  targetRoles?: string[]; // Override to ensure it's optional and can be undefined
}

const form = reactive({
  name: '',
  teamId: '',
  questions: [] as QuestionWithOptions[]
});

const canSave = computed(() => {
  return form.name && form.questions.length > 0;
});

// const canSend = computed(() => {
//   return form.name && form.teamId && form.questions.length > 0;
// });

// Get available roles from the selected team
const availableRoles = computed(() => {
  if (!form.teamId) return [];
  
  const selectedTeam = availableTeams.value.find(team => team._id === form.teamId);
  if (!selectedTeam || !selectedTeam.membersWithRoles) return [];
  
  // Extract unique roles from team members
  const roles = selectedTeam.membersWithRoles.map(member => member.role);
  return [...new Set(roles)].filter(role => role.trim() !== '');
});

// Watch for team changes and clean up invalid role selections
watch(() => form.teamId, (newTeamId, oldTeamId) => {
  if (newTeamId !== oldTeamId && form.questions.length > 0) {
    // Clear any role targeting that's no longer valid for the new team
    form.questions.forEach(question => {
      if (question.targetRoles && question.targetRoles.length > 0) {
        const validRoles = question.targetRoles.filter(role => 
          availableRoles.value.includes(role)
        );
        
        if (validRoles.length === 0) {
          delete question.targetRoles;
        } else if (validRoles.length !== question.targetRoles.length) {
          question.targetRoles = validRoles;
        }
      }
    });
  }
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

const toggleRoleTargeting = (question: QuestionWithOptions, event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.checked) {
    question.targetRoles = [];
  } else {
    delete question.targetRoles;
  }
};

const toggleRoleSelection = (question: QuestionWithOptions, role: string, event: Event) => {
  const target = event.target as HTMLInputElement;
  
  if (!question.targetRoles) {
    question.targetRoles = [];
  }
  
  if (target.checked) {
    if (!question.targetRoles.includes(role)) {
      question.targetRoles.push(role);
    }
  } else {
    const index = question.targetRoles.indexOf(role);
    if (index > -1) {
      question.targetRoles.splice(index, 1);
    }
  }
  
  // If no roles selected, remove the targetRoles property
  if (question.targetRoles.length === 0) {
    delete question.targetRoles;
  }
};

const isRoleSelected = (question: QuestionWithOptions, role: string): boolean => {
  return question.targetRoles ? question.targetRoles.includes(role) : false;
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
    
    // Add target roles if specified
    if (q.targetRoles && q.targetRoles.length > 0) {
      question.targetRoles = q.targetRoles.filter(role => role.trim() !== '');
    }
    
    return question;
  });

  // Get current HR admin ID
  const creatorId = localStorage.getItem('hrAdminId') || 'unknown';

  const formTemplate: FormTemplate = {
    name: form.name,
    creator: creatorId,
    teamId: form.teamId,
    status: 'Created',
    createdDate: new Date().toISOString(),
    questions: processedQuestions
  };

  formsStore.saveForm(formTemplate);
  alert('Form saved successfully!');
  router.push('/forms');
};

// const saveAndSendForm = async () => {
//   if (!canSend.value) return;

//   // Remove empty options for non-Multiple Choice questions
//   const processedQuestions: FeedbackQuestion[] = form.questions.map(q => {
//     const question: FeedbackQuestion = {
//       prompt: q.prompt,
//       type: q.type
//     };
    
//     // Add options for Multiple Choice questions
//     if (q.type === 'Multiple Choice' && q.optionsDisplay) {
//       (question as any).options = q.optionsDisplay.split(',').map((opt: string) => opt.trim());
//     }
    
//     // Add target roles if specified
//     if (q.targetRoles && q.targetRoles.length > 0) {
//       question.targetRoles = q.targetRoles.filter(role => role.trim() !== '');
//     }
    
//     return question;
//   });

//   // Get current HR admin ID
//   const creatorId = localStorage.getItem('hrAdminId') || 'unknown';

//   const formTemplate: FormTemplate = {
//     name: form.name,
//     creator: creatorId,
//     teamId: form.teamId,
//     status: 'Sent',
//     createdDate: new Date().toISOString(),
//     questions: processedQuestions
//   };

//   // Save form and mark as sent
//   formsStore.saveForm(formTemplate);
  
//   // In production: 
//   // 1. Generate access codes for team members
//   // 2. Send emails to team members with form links and access codes
  
//   console.log('Saving and sending form:', formTemplate);
  
//   const teamName = availableTeams.value.find(t => t._id === form.teamId)?.name;
//   alert(`Form created and sent to ${teamName}!`);
  
//   router.push('/dashboard');
// };
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
  font-family: 'Petit Formal Script', cursive;
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
  font-family: 'Petit Formal Script', cursive;
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
  background: rgba(190, 231, 254, 0.568);
  border: 1px solid var(--border);
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
  background: rgba(255, 255, 255, 0.878);
}

.form-preview {
  padding: 1rem;
  background: rgba(190, 231, 254, 0.568);
  border-radius: 6px;
  border: 1px solid var(--border);
}

.form-preview h3 {
  font-family: 'Petit Formal Script', cursive;
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

.role-targeting-section {
  padding: 1rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-bottom: 1rem;
}

.role-targeting-section:has(input:disabled) {
  opacity: 0.6;
}

.checkbox-label input:disabled {
  cursor: not-allowed;
}

.checkbox-label:has(input:disabled) {
  cursor: not-allowed;
  color: var(--text-secondary);
}

.targeted-roles {
  margin-top: 1rem;
}

.roles-selection-section {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1rem;
  background: white;
}

.no-roles-available {
  text-align: center;
  padding: 1rem;
  color: var(--text-secondary);
}

.roles-checkbox-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.role-checkbox-item {
  display: flex;
  align-items: center;
}

.role-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
  font-weight: normal;
  width: 100%;
}

.role-checkbox-label:hover {
  background: var(--bg);
}

.role-checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
  cursor: pointer;
}

.role-name {
  font-size: 0.875rem;
  color: var(--text-primary);
  flex: 1;
}

.selected-roles-summary {
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  margin-top: 0.75rem;
}

.role-target-info {
  margin-top: 0.5rem;
  color: var(--primary);
}

.role-badges {
  display: inline-flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  margin-left: 0.5rem;
}

.role-badge {
  display: inline-block;
  background: var(--primary);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
