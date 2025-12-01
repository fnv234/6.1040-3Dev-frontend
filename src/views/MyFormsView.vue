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
          <button @click="previewForm(form._id!)" class="btn-action btn-view">
            <span class="btn-icon">👁️</span>
            Preview
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import GradientButton from '@/components/ui/GradientButton.vue';
import { useFormsStore } from '@/store/forms';
import { useTeamsStore } from '@/store/teams';
import { sendEmail } from '@/services/emailService';

const router = useRouter();
const formsStore = useFormsStore();
const teamsStore = useTeamsStore();

const { forms } = formsStore;
const { teams } = teamsStore;

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

const previewForm = (formId: string) => {
  router.push({
    path: `/form/${formId}`,
    query: { preview: 'true' }
  });
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

.btn-preview {
  border-color: #FFA726;
  color: #FB8C00;
}

.btn-preview:hover {
  background: linear-gradient(135deg, #FFA726, #FB8C00);
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
</style>