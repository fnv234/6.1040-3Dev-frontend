<template>
  <div class="container">
    <div class="page-header">
      <div>
        <h1>My Forms</h1>
        <p class="page-subtitle">Manage and send feedback forms to your teams</p>
      </div>
      <router-link to="/forms/new">
        <GradientButton>+ Create Form</GradientButton>
      </router-link>
    </div>

    <div v-if="forms.length === 0" class="empty-state card">
      <div class="empty-icon">📋</div>
      <h3>No forms yet</h3>
      <p class="text-secondary">Create your first feedback form to get started</p>
      <router-link to="/forms/new">
        <GradientButton>Create Form</GradientButton>
      </router-link>
    </div>

    <div v-else class="forms-grid">
      <div v-for="form in sortedForms" :key="form._id" class="form-card card">
        <div class="form-card-header">
          <div class="form-icon">📄</div>
          <div class="form-status-badge">
            <span v-if="form.status === 'Sent'" class="badge badge-sent">✓ Sent</span>
            <span v-else-if="form.status === 'Completed'" class="badge badge-completed">✓ Completed</span>
            <span v-else class="badge badge-draft">Draft</span>
          </div>
        </div>
        
        <h3 class="form-title">{{ form.name || 'Untitled Form' }}</h3>
        
        <div class="form-meta">
          <div class="meta-item">
            <span class="meta-icon">❓</span>
            <span>{{ form.questions.length }} questions</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">📅</span>
            <span>{{ formatDate(form.createdDate) }}</span>
          </div>
          <div v-if="form.teamId" class="meta-item">
            <span class="meta-icon">👥</span>
            <span>{{ getTeamName(form.teamId) }}</span>
          </div>
        </div>

        <div class="form-actions">
          <button @click="viewForm(form)" class="btn-action btn-view">
            <span class="btn-icon">👁️</span>
            View
          </button>
          <button v-if="form.status === 'Created'" @click="sendForm(form._id!)" class="btn-action btn-send" :disabled="sending">
            <span class="btn-icon">📤</span>
            {{ sending ? 'Sending...' : 'Send' }}
          </button>
          <button @click="deleteForm(form._id!)" class="btn-action btn-delete">
            <span class="btn-icon">🗑️</span>
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- View/Fill Form Modal -->
    <transition name="modal">
      <div v-if="viewingForm" class="modal-overlay" @click.self="closeModal">
        <div class="modal" :class="{ 'modal-wide': showFeedbackForm }">
          <div class="modal-header">
            <div>
              <h2>{{ viewingForm.name || 'Untitled Form' }}</h2>
              <p class="modal-subtitle">{{ viewingForm.questions.length }} questions • {{ getTeamName(viewingForm.teamId) }}</p>
            </div>
            <button @click="closeModal" class="btn-close" title="Close">
              <span>✕</span>
            </button>
          </div>
          
          <!-- Form Preview -->
          <div v-if="!showFeedbackForm" class="modal-body">
            <div class="status-bar">
              <div class="status-item">
                <span class="status-label">Status:</span>
                <span v-if="viewingForm.status === 'Sent'" class="badge badge-sent">✓ Sent</span>
                <span v-else-if="viewingForm.status === 'Completed'" class="badge badge-completed">✓ Completed</span>
                <span v-else class="badge badge-draft">Draft</span>
              </div>
              <div class="status-item">
                <span class="status-label">Created:</span>
                <span>{{ formatDate(viewingForm.createdDate) }}</span>
              </div>
            </div>

            <div class="questions-preview">
              <h3 class="section-title">Questions Preview</h3>
              <div class="questions-list">
                <div v-for="(question, idx) in viewingForm.questions" :key="idx" class="question-preview-item">
                  <div class="question-preview-header">
                    <span class="question-number-badge">{{ idx + 1 }}</span>
                    <span class="question-text">{{ question.prompt }}</span>
                  </div>
                  <div class="question-preview-meta">
                    <span class="type-badge">{{ question.type }}</span>
                    <span v-if="question.options" class="options-preview">
                      {{ question.options.length }} options
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button @click="closeModal" class="btn-secondary">Close</button>
              <button v-if="viewingForm.status === 'Created'" @click="sendFormFromModal" class="btn-primary" :disabled="sending">
                {{ sending ? 'Sending...' : '📤 Send Form' }}
              </button>
              <button v-else @click="showFeedbackForm = true" class="btn-primary">
                📝 Fill Out Form
              </button>
            </div>
          </div>

          <!-- Feedback Form -->
          <div v-else class="modal-body">
            <FeedbackForm 
              :questions="viewingForm.questions"
              @submit="handleFeedbackSubmit"
              @cancel="showFeedbackForm = false"
            />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import FeedbackForm from '@/components/feedback/FeedbackForm.vue';
import GradientButton from '@/components/ui/GradientButton.vue';
import { useFormsStore } from '@/store/forms';
import { useTeamsStore } from '@/store/teams';
import { sendEmail } from '@/services/emailService';

const formsStore = useFormsStore();
const teamsStore = useTeamsStore();

const { forms } = formsStore;
const { teams } = teamsStore;

const viewingForm = ref<any | null>(null);
const showFeedbackForm = ref(false);
const sending = ref(false);

const sortedForms = computed(() => {
  return [...forms.value].sort((a, b) => {
    return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
  });
});

const getTeamName = (teamId?: string) => {
  if (!teamId) return 'No team';
  const team = teams.value.find(t => t._id === teamId);
  return team?.name || 'Unknown team';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const viewForm = (form: any) => {
  viewingForm.value = form;
  showFeedbackForm.value = false;
};

const closeModal = () => {
  viewingForm.value = null;
  showFeedbackForm.value = false;
};

const handleFeedbackSubmit = async (feedbackData: any) => {
  try {
    console.log('Feedback submitted:', feedbackData);
    alert('Feedback submitted successfully!');
    closeModal();
  } catch (error) {
    console.error('Error submitting feedback:', error);
    alert('Failed to submit feedback. Please try again.');
  }
};

const deleteForm = (formId: string) => {
  if (confirm('Are you sure you want to delete this form?')) {
    formsStore.deleteForm(formId);
  }
};

const sendForm = async (formId: string) => {
  const form = forms.value.find(f => f._id === formId);
  if (!form || !form.teamId) {
    alert('Cannot send form: No team assigned');
    return;
  }

  const team = teams.value.find(t => t._id === form.teamId);
  if (!team) {
    alert('Cannot send form: Team not found');
    return;
  }

  if (team.members.length < 2) {
    alert('Cannot send form: Team must have at least 2 members for peer feedback');
    return;
  }

  if (confirm(`Send this form to all ${team.members.length} members of ${team.name}?`)) {
    sending.value = true;
    try {
      // Send email to each team member individually
      const emailPromises = team.members.map(async (email: string) => {
        const formLink = `${window.location.origin}/form/${formId}`;
        const emailData = {
          to: email,
          subject: `New Feedback Form: ${form.name || 'Feedback Form'}`,
          body: `Hello,

You've been requested to provide feedback for "${form.name || 'a form'}" in team "${team.name}".

Please click the link below to access the feedback form:
${formLink}

Thank you!`,
          formLink: formLink
        };
        console.log('Sending email with data:', emailData);
        return sendEmail(emailData);
      });
      
      const results = await Promise.allSettled(emailPromises);
      const successfulEmails = results.filter(result => result.status === 'fulfilled' && result.value.success);
      const failedEmails = team.members.filter((_, index) => 
        results[index].status === 'rejected' || 
        (results[index] as any).value?.success === false
      );
      
      const emailResult = {
        success: successfulEmails.length > 0,
        emailsSent: successfulEmails.length,
        failedEmails: failedEmails
      };
      
      if (emailResult.success) {
        alert(`Successfully sent ${emailResult.emailsSent} feedback forms to team members!`);
        formsStore.sendForm(formId);
      } else {
        const failedMessage = emailResult.failedEmails?.length 
          ? ` Failed to send to ${emailResult.failedEmails.length} members.` 
          : '';
        alert(`Sent ${emailResult.emailsSent} forms successfully.${failedMessage}`);
      }
    } catch (error: any) {
      console.error('Error sending form:', error);
      alert(error.message || 'Failed to send form. Please try again.');
    } finally {
      sending.value = false;
    }
  }
};

const sendFormFromModal = async () => {
  if (viewingForm.value && viewingForm.value._id) {
    await sendForm(viewingForm.value._id);
    closeModal();
  }
};
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
}

.page-header h1 {
  color: var(--title-primary);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, rgba(126, 162, 170, 0.05), rgba(66, 122, 161, 0.05));
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
  color: var(--title-primary);
}

.empty-state .btn {
  margin-top: 1.5rem;
}

.forms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.form-card {
  padding: 1.5rem;
  transition: all 0.3s ease;
  border: 2px solid var(--border);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(126, 162, 170, 0.05));
}

.form-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: var(--primary);
}

.form-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.form-icon {
  font-size: 2rem;
}

.form-status-badge {
  flex-shrink: 0;
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

.form-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--title-primary);
  margin-bottom: 1rem;
  line-height: 1.4;
}

.form-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding: 0.75rem;
  background: rgba(126, 162, 170, 0.05);
  border-radius: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.meta-icon {
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-action {
  flex: 1;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  border: 2px solid var(--border);
  background: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-action:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-view {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-view:hover {
  background: var(--primary);
  color: white;
}

.btn-send {
  border-color: #A0CA92;
  color: #8ABD7C;
}

.btn-send:hover {
  background: linear-gradient(135deg, #A0CA92, #8ABD7C);
  color: white;
}

.btn-delete {
  border-color: var(--error);
  color: var(--error);
}

.btn-delete:hover {
  background: var(--error);
  color: white;
}

.btn-icon {
  font-size: 1rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-wide {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem;
  border-bottom: 2px solid var(--border);
  background: linear-gradient(135deg, rgba(126, 162, 170, 0.05), rgba(66, 122, 161, 0.05));
}

.modal-header h2 {
  margin: 0 0 0.25rem 0;
  color: var(--title-primary);
}

.modal-subtitle {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.btn-close {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-close:hover {
  background: var(--error);
  border-color: var(--error);
  color: white;
  transform: rotate(90deg);
}

.modal-body {
  padding: 2rem;
}

.status-bar {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-label {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--title-primary);
  margin-bottom: 1rem;
}

.questions-preview {
  margin-bottom: 1.5rem;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-preview-item {
  padding: 1rem;
  background: white;
  border: 2px solid var(--border);
  border-radius: 10px;
  transition: border-color 0.3s ease;
}

.question-preview-item:hover {
  border-color: var(--primary);
}

.question-preview-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.question-number-badge {
  background: var(--primary);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.question-text {
  flex: 1;
  font-weight: 600;
  line-height: 1.5;
}

.question-preview-meta {
  display: flex;
  gap: 0.75rem;
  padding-left: 2.5rem;
}

.type-badge {
  padding: 0.25rem 0.625rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.options-preview {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border);
}

.btn-secondary,
.btn-primary {
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text);
  border: 2px solid var(--border);
}

.btn-secondary:hover {
  background: var(--border);
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  box-shadow: 0 4px 12px rgba(66, 122, 161, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(66, 122, 161, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.9) translateY(20px);
}
</style>