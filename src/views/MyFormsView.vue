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

    <!-- Tabs -->
    <div class="tabs-container">
      <div class="tabs">
        <button 
          @click="activeTab = 'drafts'" 
          :class="['tab', { active: activeTab === 'drafts' }]"
        >
          <span class="tab-icon">📝</span>
          My Drafts
          <span class="tab-count">{{ draftForms.length }}</span>
        </button>
        <button 
          @click="activeTab = 'sent'" 
          :class="['tab', { active: activeTab === 'sent' }]"
        >
          <span class="tab-icon">📤</span>
          Sent Forms
          <span class="tab-count">{{ sentForms.length }}</span>
        </button>
      </div>
    </div>

    <!-- My Drafts Tab -->
    <div v-if="activeTab === 'drafts'">
      <div v-if="draftForms.length === 0" class="empty-state card">
        <div class="empty-icon">📝</div>
        <h3>No drafts yet</h3>
        <p class="text-secondary">Create your first feedback form to get started</p>
        <router-link to="/forms/new">
          <GradientButton>Create Form</GradientButton>
        </router-link>
      </div>

      <div v-else class="forms-grid">
        <div v-for="form in draftForms" :key="form._id" class="form-card card">
          <div class="form-card-header">
            <div class="form-icon">📝</div>
            <div class="form-status-badge">
              <span class="badge badge-draft">Draft</span>
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

          <!-- Team Members Section -->
          <div v-if="form.teamId && getTeamMembers(form.teamId).length > 0" class="team-members-section">
            <h4 class="members-title">Team Members</h4>
            <div class="members-list">
              <div v-for="member in getTeamMembers(form.teamId)" :key="member.memberId" class="member-item">
                <div class="member-info">
                  <span class="member-name">{{ member.memberId }}</span>
                  <span class="member-role">{{ member.role }}</span>
                  <span class="member-email">{{ member.email }}</span>
                </div>
                <button 
                  @click="sendEmailToMember(form, member)" 
                  class="btn-email"
                  :disabled="sending"
                  :title="`Send access code to ${member.email}`"
                >
                  <span class="btn-icon">�</span>
                  <span class="access-code" v-if="getStoredAccessCode(form._id!, member.memberId)">
                    {{ getStoredAccessCode(form._id!, member.memberId) }}
                  </span>
                  <span v-else>Email</span>
                </button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button @click="previewFormTemplate(form)" class="btn-action btn-view">
              <span class="btn-icon">👁️</span>
              View
            </button>
            <button @click="deleteForm(form._id!)" class="btn-action btn-delete">
              <span class="btn-icon">🗑️</span>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sent Forms Tab -->
    <div v-if="activeTab === 'sent'">
      <div v-if="sentForms.length === 0" class="empty-state card">
        <div class="empty-icon">📤</div>
        <h3>No sent forms</h3>
        <p class="text-secondary">Send your draft forms to see them here</p>
        <router-link v-if="draftForms.length > 0" to="/forms/new">
          <GradientButton>Create Form</GradientButton>
        </router-link>
      </div>

      <div v-else class="forms-grid">
        <div v-for="form in sentForms" :key="form._id" class="form-card card">
          <div class="form-card-header">
            <div class="form-icon">📤</div>
            <div class="form-status-badge">
              <span v-if="form.status === 'Completed'" class="badge badge-completed">✓ Completed</span>
              <span v-else class="badge badge-sent">✓ Sent</span>
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

          <!-- Team Members Section for Sent Forms -->
          <div v-if="form.teamId && getTeamMembers(form.teamId).length > 0" class="team-members-section">
            <h4 class="members-title">Team Members</h4>
            <div class="members-list">
              <div v-for="member in getTeamMembers(form.teamId)" :key="member.memberId" class="member-item">
                <div class="member-info">
                  <span class="member-name">{{ member.memberId }}</span>
                  <span class="member-role">{{ member.role }}</span>
                  <span class="member-email">{{ member.email }}</span>
                </div>
                <button 
                  @click="sendEmailToMember(form, member)" 
                  class="btn-email"
                  :disabled="sending"
                  :title="`Send access code to ${member.email}`"
                >
                  <span class="btn-icon">📧</span>
                  <span class="access-code" v-if="getStoredAccessCode(form._id!, member.memberId)">
                    {{ getStoredAccessCode(form._id!, member.memberId) }}
                  </span>
                  <span v-else>Email</span>
                </button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button @click="previewFormTemplate(form)" class="btn-action btn-view">
              <span class="btn-icon">👁️</span>
              View
            </button>
            <button @click="deleteForm(form._id!)" class="btn-action btn-delete">
              <span class="btn-icon">🗑️</span>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <transition name="modal">
      <div v-if="previewingForm" class="modal-overlay" @click.self="closePreview">
        <div class="modal modal-preview">
          <div class="modal-header">
            <div>
              <h2>{{ previewingForm.name || 'Untitled Form' }}</h2>
            </div>
            <button @click="closePreview" class="btn-close" title="Close">
              <span>✕</span>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="preview-badge">
              <span class="badge-icon">👁️</span>
              <span>Preview Mode - This is how your form will appear to reviewers</span>
            </div>
            
            <FeedbackForm 
              :questions="previewingForm.questions"
              :show-submit-button="false"
            />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import FeedbackForm from '@/components/feedback/FeedbackForm.vue';
import GradientButton from '@/components/ui/GradientButton.vue';
import { useFormsStore } from '@/store/forms';
import { useTeamsStore } from '@/store/teams';
import { useAuthStore } from '@/store/auth';
import { sendEmail } from '@/services/emailService';
import { generateAccessCode, createAccessCodeEmailBody, createMailtoLink } from '@/utils/accessCode';
import type { FeedbackFormDraft, TeamMember } from '@/types';

const formsStore = useFormsStore();
const teamsStore = useTeamsStore();
const authStore = useAuthStore();

const { forms, getAccessCode, setAccessCode, loadAccessCodesFromStorage } = formsStore;
const { teams } = teamsStore;
const currentAdminId = computed(() => authStore.currentAdmin.value?._id);

// Load access codes on component mount
onMounted(() => {
  loadAccessCodesFromStorage();
});

const sending = ref(false);
const previewingForm = ref<FeedbackFormDraft | null>(null);
const activeTab = ref<'drafts' | 'sent'>('drafts');

const draftForms = computed(() => {
  return forms.value
    .filter(form => form.status === 'Created')
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
});

const sentForms = computed(() => {
  return forms.value
    .filter(form => form.status === 'Sent' || form.status === 'Completed')
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
});

const getTeamName = (teamId?: string) => {
  if (!teamId) return 'No team';
  const team = teams.value.find(t => t._id === teamId);
  return team?.name || 'Unknown team';
};

const getTeamMembers = (teamId?: string): TeamMember[] => {
  if (!teamId) return [];
  const team = teams.value.find(t => t._id === teamId);
  return team?.membersWithRoles || [];
};

const getStoredAccessCode = (formId: string, memberId: string): string | null => {
  return getAccessCode(formId, memberId);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const previewFormTemplate = (form: FeedbackFormDraft) => {
  previewingForm.value = form;
};

const closePreview = () => {
  previewingForm.value = null;
};

const deleteForm = (formId: string) => {
  if (confirm('Are you sure you want to delete this form?')) {
    formsStore.deleteForm(formId);
  }
};

const sendEmailToMember = async (form: FeedbackFormDraft, member: TeamMember) => {
  if (!form._id || !form.teamId) {
    alert('Cannot send email: Form ID or team not found');
    return;
  }

  const team = teams.value.find(t => t._id === form.teamId);
  if (!team) {
    alert('Cannot send email: Team not found');
    return;
  }

  sending.value = true;
  try {
    // Check if we already have an access code for this member
    let accessCode = getAccessCode(form._id, member.memberId);
    
    // If not, generate a new one and store it in backend
    if (!accessCode) {
      accessCode = generateAccessCode();
      setAccessCode(form._id, member.memberId, accessCode);
      
      // Store access code in backend
      try {
        await fetch(`http://localhost:8000/api/AccessCode/createAccessCode`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessCode,
            formId: form._id,
            teamId: form.teamId,
            memberId: member.memberId,
            memberEmail: member.email,
            memberRole: member.role,
            createdBy: currentAdminId.value,
          }),
        });
      } catch (backendError) {
        console.error('Failed to store access code in backend:', backendError);
        // Continue anyway with local storage
      }
    }

    // Create personalized email body
    const emailSubject = `Your Feedback Form Access Code: ${form.name || 'Feedback Form'}`;
    const emailBody = createAccessCodeEmailBody(
      form.name || 'Feedback Form',
      team.name,
      accessCode,
      member.memberId
    );

    // Create mailto link for this specific member
    const mailtoLink = createMailtoLink(emailSubject, [member.email], emailBody);
    
    // Open email client
    window.open(mailtoLink, '_blank');
    
    // Show success message with the access code
    alert(`Email opened for ${member.memberId} (${member.email})\n\nAccess Code: ${accessCode}\n\nPlease send the email from your email client.`);
    
  } catch (error: any) {
    console.error('Error preparing email for member:', error);
    alert(error.message || 'Failed to prepare email. Please try again.');
  } finally {
    sending.value = false;
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

/* Tabs */
.tabs-container {
  margin-bottom: 2rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  background: rgba(126, 162, 170, 0.05);
  padding: 0.375rem;
  border-radius: 12px;
}

.tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  background: transparent;
  border: 2px solid rgba(138, 155, 104, 0.5);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex: 1;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.5);
  color: var(--text);
}

.tab.active {
  background: white;
  color: var(--primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-icon {
  font-size: 1.125rem;
}

.tab-count {
  background: var(--primary);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 20px;
  text-align: center;
}

.tab:not(.active) .tab-count {
  background: var(--text-secondary);
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

.team-members-section {
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.members-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.member-name {
  font-weight: 600;
  color: var(--text);
  font-size: 0.875rem;
}

.member-role {
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--bg);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  width: fit-content;
}

.member-email {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-style: italic;
}

.btn-email {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, #A0CA92, #8ABD7C);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  flex-shrink: 0;
}

.btn-email:hover:not(:disabled) {
  background: linear-gradient(135deg, #8ABD7C, #7BA86E);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-email:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.access-code {
  font-family: 'Courier New', monospace;
  font-size: 0.6875rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
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
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem;
  border-bottom: 2px solid var(--border);
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
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

.preview-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(66, 122, 161, 0.1), rgba(126, 162, 170, 0.1));
  border-left: 4px solid var(--primary);
  border-radius: 8px;
  margin-bottom: 2rem;
  font-size: 0.9375rem;
  color: var(--text);
}

.badge-icon {
  font-size: 1.25rem;
}

.preview-actions {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid var(--border);
  display: flex;
  justify-content: center;
}

.btn-secondary {
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  background: var(--bg-secondary);
  color: var(--text);
  border: 2px solid var(--border);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--border);
  transform: translateY(-2px);
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