import { ref, computed, watch } from 'vue';
import type { FeedbackFormDraft } from '@/types';
import { useAuthStore } from './auth';

const forms = ref<FeedbackFormDraft[]>([]);

export const useFormsStore = () => {
  const auth = useAuthStore();
  const currentAdminId = computed(() => auth.currentAdmin.value?._id);

  const storageKey = computed(() => {
    if (currentAdminId.value) {
      return `hr_feedback_forms_${currentAdminId.value}`;
    }
    return null;
  });

  function loadFormsForCurrentUser() {
    if (storageKey.value) {
      const raw = localStorage.getItem(storageKey.value);
      try {
        forms.value = raw ? (JSON.parse(raw) as FeedbackFormDraft[]) : [];
      } catch {
        forms.value = [];
      }
    } else {
      forms.value = [];
    }
  };

  const saveForm = async (form: FeedbackFormDraft) => {
    try {
      // Create form in backend
      const response = await feedbackFormAPI.createFeedbackForm({
        name: form.name,
        creatorId: form.creator,
        reviewer: 'temp-reviewer', // Will be replaced when forms are sent
        target: 'temp-target', // Will be replaced when forms are sent
        questions: form.questions
      });

      // Update local state with backend ID
      form._id = response.data.feedbackForm;
      
      const existingIndex = forms.value.findIndex((f) => f._id === form._id);
      if (existingIndex >= 0) {
        forms.value[existingIndex] = form;
      } else {
        forms.value.push(form);
      }

      // Also save to localStorage as cache
      const storageKey = `hr_feedback_forms_${currentAdminId.value}`;
      localStorage.setItem(storageKey, JSON.stringify(forms.value));
      
      return form._id;
    } catch (error) {
      console.error('Error saving form to backend:', error);
      
      // Fallback to localStorage only
      if (!form._id) {
        form._id = `temp_${Date.now()}`;
      }
      const existingIndex = forms.value.findIndex((f) => f._id === form._id);
      if (existingIndex >= 0) {
        forms.value[existingIndex] = form;
      } else {
        forms.value.push(form);
      }
      
      const storageKey = `hr_feedback_forms_${currentAdminId.value}`;
      localStorage.setItem(storageKey, JSON.stringify(forms.value));
      
      throw error;
    }
  };

  const deleteForm = async (formId: string) => {
    try {
      // Delete from backend (if endpoint exists)
      // Note: Your backend doesn't have a delete endpoint yet, so this will fail gracefully
      try {
        await feedbackFormAPI.deleteFeedbackForm({ formId });
      } catch (e) {
        console.warn('Backend delete not available:', e);
      }

      // Delete from local state
      forms.value = forms.value.filter((f) => f._id !== formId);
      
      // Update localStorage cache
      const storageKey = `hr_feedback_forms_${currentAdminId.value}`;
      localStorage.setItem(storageKey, JSON.stringify(forms.value));
    } catch (error) {
      console.error('Error deleting form:', error);
      throw error;
    }
  };

  const getFormById = (formId: string): FeedbackFormDraft | undefined => {
    return forms.value.find((f) => f._id === formId);
  };

  const sendForm = (formId: string) => {
    const form = getFormById(formId);
    if (form) {
      form.status = 'Sent';
      saveForm(form);
    }
  };

  return {
    forms,
    saveForm,
    deleteForm,
    getFormById,
    sendForm,
  };
};
