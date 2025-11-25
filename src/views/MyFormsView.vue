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
      <div class="modal card" :class="{ 'wider': showFeedbackForm }">
        <div class="modal-header">
          <h2>{{ viewingForm.name || 'Untitled Form' }}</h2>
          <button @click="closeModal" class="btn-icon" title="Close">×</button>
        </div>
        
        <!-- Form Details View -->
        <div v-if="!showFeedbackForm">
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
            <button v-else @click="showFeedbackForm = true" class="btn btn-primary">Fill Out Form</button>
          </div>
        </div>

        <!-- Feedback Form View -->
        <div v-else class="feedback-form-container">
          <FeedbackForm 
            :questions="viewingForm.questions"
            @submit="handleFeedbackSubmit"
            @cancel="showFeedbackForm = false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import FeedbackForm from '@/components/feedback/FeedbackForm.vue';
import { useFormsStore } from '@/store/forms';
import { emailService } from '@/services/emailService';
import { orgGraph } from '@/api/client';

const formsStore = useFormsStore();

const { forms } = formsStore;
const viewingForm = ref<any | null>(null);
const showFeedbackForm = ref(false);

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
    // Here you would typically submit the feedback to your backend
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
  try {
    const form = forms.value.find(f => f._id === formId);
    if (!form) {
      alert('Form not found');
      return;
    }

    // Get team members if teamId exists
    let employeeEmails: string[] = [];
    if (form.teamId) {
      try {
        // Since the API doesn't return team members, we'll need to handle this differently
        // For now, let's get all employees and you can filter by team later
        const employeesResponse = await orgGraph.getAllEmployees();
        const allEmployeeIds = employeesResponse.data.employees;
        
        // TODO: Filter employees by team when backend supports it
        // For now, we'll get emails for all employees (you may want to limit this)
        const emailMap = await emailService.getEmployeeEmails(allEmployeeIds.slice(0, 10)); // Limit to first 10 for testing
        employeeEmails = Object.values(emailMap);
        
        if (employeeEmails.length === 0) {
          alert('No employee emails found. Please ensure employees have email addresses.');
          return;
        }
      } catch (error) {
        console.error('Error fetching employee emails:', error);
        alert('Failed to fetch employee emails. Please try again.');
        return;
      }
    } else {
      alert('No team assigned to this form. Please assign a team first.');
      return;
    }

    if (employeeEmails.length === 0) {
      alert('No team members found with valid emails.');
      return;
    }

    // Send emails
    const emailData = {
      to: employeeEmails,
      subject: `Feedback Request: ${form.name}`,
      formId: form._id!,
      formName: form.name,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };

    const result = await emailService.sendFeedbackForm(emailData);
    
    if (result.success) {
      alert(`Successfully sent ${result.emailsSent} email(s) to team members.`);
      
      // Update form status to 'Sent' using the store's sendForm method
      formsStore.sendForm(formId);
    } else {
      alert(`Failed to send some emails. Sent: ${result.emailsSent}, Failed: ${result.failedEmails?.length || 0}`);
    }
  } catch (error: any) {
    console.error('Error sending form:', error);
    alert(error.message || 'Failed to send form. Please try again.');
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

.wider {
  max-width: 800px;
  width: 90%;
}

.feedback-form-container {
  padding: 1rem;
  max-height: 70vh;
  overflow-y: auto;
}
</style>
