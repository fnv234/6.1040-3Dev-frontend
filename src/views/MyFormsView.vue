<template>
  <div class="container">
    <div class="page-header">
      <h1>My Forms</h1>
      <router-link to="/forms/new" class="btn btn-primary">+ Create Form</router-link>
    </div>

    <div v-if="forms.length === 0" class="empty-state card">
      <h3>No forms yet</h3>
      <p class="text-secondary">Create your first feedback form to get started</p>
      <router-link to="/forms/new" class="btn btn-primary">Create Form</router-link>
    </div>

    <div v-else class="forms-list">
      <div v-for="form in sortedForms" :key="form._id" class="form-card card">
        <div class="form-header">
          <div class="form-info">
            <h3>{{ form.name || 'Untitled Form' }}</h3>
            <p class="text-secondary">{{ form.questions.length }} question(s) • {{ form.teamId ? 'Team assigned' : 'No team assigned' }}</p>
          </div>
          <div class="form-status">
            <span v-if="form.status === 'Sent'" class="badge badge-sent">Sent</span>
            <span v-else class="badge badge-draft">Draft</span>
          </div>
        </div>

        <div class="form-details">
          <div class="detail-item">
            <span class="detail-label">Questions:</span>
            <span class="detail-value">{{ form.questions.length }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Created:</span>
            <span class="detail-value">{{ formatDate(form.createdDate) }}</span>
          </div>
          <div v-if="form.status === 'Sent'" class="detail-item">
            <span class="detail-label">Status:</span>
            <span class="detail-value">{{ form.status }}</span>
          </div>
        </div>

        <div class="form-actions">
          <button @click="viewForm(form)" class="btn btn-secondary btn-sm">View</button>
          <button v-if="form.status === 'Created'" @click="sendForm(form._id!)" class="btn btn-primary btn-sm">Send</button>
          <button @click="deleteForm(form._id!)" class="btn btn-secondary btn-sm">Delete</button>
        </div>
      </div>
    </div>

    <!-- View Form Modal -->
    <div v-if="viewingForm" class="modal-overlay" @click.self="closeModal">
      <div class="modal card">
        <div class="modal-header">
          <h2>{{ viewingForm.name || 'Untitled Form' }}</h2>
          <button @click="closeModal" class="btn-icon" title="Close">×</button>
        </div>
        
        <p class="text-secondary modal-description">{{ viewingForm.questions.length }} question(s) for team feedback</p>
        
        <div class="modal-details">
          <div class="detail-item">
            <span class="detail-label">Status:</span>
            <span v-if="viewingForm.status === 'Sent'" class="badge badge-sent">Sent</span>
            <span v-else class="badge badge-draft">Draft</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Created:</span>
            <span class="detail-value">{{ formatDate(viewingForm.createdDate) }}</span>
          </div>
          <div v-if="viewingForm.completedDate" class="detail-item">
            <span class="detail-label">Completed:</span>
            <span class="detail-value">{{ formatDate(viewingForm.completedDate) }}</span>
          </div>
        </div>

        <div class="questions-section">
          <h3>Questions ({{ viewingForm.questions.length }})</h3>
          <div class="questions-list">
            <div v-for="(question, idx) in viewingForm.questions" :key="idx" class="question-item">
              <p class="question-text">
                <strong>{{ idx + 1 }}. {{ question.prompt }}</strong>
              </p>
              <p class="question-type text-secondary">
                <small>Type: {{ question.type }}</small>
              </p>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeModal" class="btn btn-secondary">Close</button>
          <button v-if="viewingForm.status === 'Created'" @click="sendFormFromModal" class="btn btn-primary">Send Form</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FeedbackFormDraft } from '@/types';
import { useFormsStore } from '@/store/forms';

const formsStore = useFormsStore();

const { forms } = formsStore;
const viewingForm = ref<FeedbackFormDraft | null>(null);

const sortedForms = computed(() => {
  return [...forms.value].sort((a, b) => {
    return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
  });
});

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const viewForm = (form: FeedbackFormDraft) => {
  viewingForm.value = form;
};

const closeModal = () => {
  viewingForm.value = null;
};

const deleteForm = (formId: string) => {
  if (confirm('Are you sure you want to delete this form?')) {
    formsStore.deleteForm(formId);
  }
};

const sendForm = (formId: string) => {
  if (confirm('Are you sure you want to send this form to the team?')) {
    formsStore.sendForm(formId);
    alert('Form sent successfully!');
  }
};

const sendFormFromModal = () => {
  if (viewingForm.value && viewingForm.value._id) {
    sendForm(viewingForm.value._id);
    closeModal();
  }
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

.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
}

.empty-state .btn {
  margin-top: 1rem;
}

.forms-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-card {
  padding: 1.5rem;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.form-info h3 {
  margin-bottom: 0.25rem;
  color: var(--text);
}

.form-status {
  flex-shrink: 0;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-sent {
  background: var(--success);
  color: white;
}

.badge-draft {
  background: var(--warning);
  color: white;
}

.form-details {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.detail-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.detail-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.detail-value {
  font-size: 0.875rem;
  color: var(--text);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-sm {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal {
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.modal-header h2 {
  margin: 0;
  color: var(--title-primary);
}

.modal-description {
  margin-bottom: 1.5rem;
}

.modal-details {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 6px;
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

.questions-section {
  margin-bottom: 1.5rem;
}

.questions-section h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--title-primary);
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-item {
  padding: 1rem;
  background: white;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.question-text {
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.required-badge {
  color: var(--error);
  font-weight: bold;
}

.question-type {
  margin-bottom: 0.5rem;
}

.question-options {
  list-style: disc;
  margin-left: 1.5rem;
  margin-top: 0.5rem;
}

.question-options li {
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding: 0.125rem 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}
</style>
