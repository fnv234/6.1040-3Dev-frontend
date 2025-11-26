import { ref, computed, watch } from 'vue';
import type { FeedbackFormDraft } from '@/types';
import { useAuthStore } from './auth';
import { feedbackForm as feedbackFormAPI } from '@/api/client';

const forms = ref<FeedbackFormDraft[]>([]);
const loading = ref(false);
const loaded = ref(false);

export const useFormsStore = () => {
  const auth = useAuthStore();
  const currentAdminId = computed(() => auth.currentAdmin.value?._id);

  const loadFormsFromBackend = async () => {
    if (!currentAdminId.value || loading.value) return;
    
    loading.value = true;
    try {
      const response = await feedbackFormAPI.getFeedbackFormsByCreator({
        creator: currentAdminId.value
      });
      
      // Transform backend response to match our FeedbackFormDraft type
      forms.value = response.data.feedbackForms.map((form: any) => ({
        _id: form._id,
        name: form.name || 'Untitled Form',
        creator: form.creator,
        teamId: form.teamId,
        status: form.status,
        createdDate: form.createdDate,
        completedDate: form.completedDate,
        questions: form.questions
      }));
      
      loaded.value = true;
    } catch (error) {
      console.error('Error loading forms from backend:', error);
      // Fallback to localStorage if backend fails
      loadFormsFromLocalStorage();
    } finally {
      loading.value = false;
    }
  };

  const loadFormsFromLocalStorage = () => {
    const storageKey = `hr_feedback_forms_${currentAdminId.value}`;
    const raw = localStorage.getItem(storageKey);
    try {
      forms.value = raw ? (JSON.parse(raw) as FeedbackFormDraft[]) : [];
      loaded.value = true;
    } catch {
      forms.value = [];
      loaded.value = true;
    }
  };

  // Load forms from backend when admin changes
  watch(currentAdminId, async (newAdminId) => {
    if (newAdminId) {
      await loadFormsFromBackend();
    } else {
      forms.value = [];
      loaded.value = false;
    }
  }, { immediate: true });

  const saveForm = async (form: FeedbackFormDraft) => {
    try {
      // Create form in backend
      const response = await feedbackFormAPI.createFeedbackForm({
        name: form.name,
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

  const sendForm = async (formId: string) => {
    const form = getFormById(formId);
    if (!form) {
      throw new Error('Form not found');
    }

    try {
      // Update form status in backend
      await feedbackFormAPI.sendFeedbackForm({ feedbackForm: formId });
      
      // Update local state
      form.status = 'Sent';
      saveForm(form);
    } catch (error) {
      console.error('Error sending form:', error);
      
      // Fallback to local update only
      form.status = 'Sent';
      const storageKey = `hr_feedback_forms_${currentAdminId.value}`;
      localStorage.setItem(storageKey, JSON.stringify(forms.value));
      
      throw error;
    }
  };

  return {
    forms,
    loading,
    loaded,
    saveForm,
    deleteForm,
    getFormById,
    sendForm,
    loadFormsFromBackend,
  };
};