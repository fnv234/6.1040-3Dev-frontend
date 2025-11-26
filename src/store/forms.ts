import { ref, computed, watch } from 'vue';
import type { FeedbackFormDraft } from '@/types';
import { useAuthStore } from './auth';
import { formTemplate as formTemplateAPI } from '@/api/client';

const forms = ref<FeedbackFormDraft[]>([]);
const loading = ref(false);
const loaded = ref(false);

export const useFormsStore = () => {
  const auth = useAuthStore();
  const currentAdminId = computed(() => auth.currentAdmin.value?._id);

  // Load forms from backend when admin changes
  watch(currentAdminId, async (newAdminId) => {
    if (newAdminId) {
      await loadFormsFromBackend();
    } else {
      forms.value = [];
      loaded.value = false;
    }
  }, { immediate: true });

  const loadFormsFromLocalStorage = () => {
    if (!storageKey.value) {
      forms.value = [];
      loaded.value = true;
      return;
    }

    const raw = localStorage.getItem(storageKey.value);
    try {
      forms.value = raw ? (JSON.parse(raw) as FeedbackFormDraft[]) : [];
      loaded.value = true;
    } catch {
      forms.value = [];
      loaded.value = true;
    }
  };

  const loadFormsFromBackend = async () => {
    if (!currentAdminId.value || loading.value) return;

    loading.value = true;
    try {
      const response = await formTemplateAPI.getTemplatesByCreator({
        creator: currentAdminId.value,
      });

      forms.value = response.data.templates.map((tpl: any) => ({
        _id: tpl._id,
        name: tpl.name || 'Untitled Form',
        creator: tpl.creator,
        teamId: tpl.teamId,
        status: tpl.status,
        createdDate: tpl.createdDate,
        questions: tpl.questions,
      }));

      loaded.value = true;
      if (storageKey.value) {
        localStorage.setItem(storageKey.value, JSON.stringify(forms.value));
      }
    } catch (error) {
      console.error('Error loading form templates from backend:', error);
      loadFormsFromLocalStorage();
    } finally {
      loading.value = false;
    }
  };

  watch(currentAdminId, () => {
    if (currentAdminId.value) {
      loadFormsFromBackend();
    } else {
      forms.value = [];
      loaded.value = false;
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

  const saveForm = async (form: FeedbackFormDraft) => {
    if (!currentAdminId.value) {
      throw new Error('Cannot save form: no current admin');
    }

    try {
      const response = await formTemplateAPI.createTemplate({
        name: form.name,
        creator: currentAdminId.value,
        teamId: form.teamId,
        questions: form.questions,
      });

      form._id = response.data.template;

      const existingIndex = forms.value.findIndex((f) => f._id === form._id);
      if (existingIndex >= 0) {
        forms.value[existingIndex] = form;
      } else {
        forms.value.push(form);
      }
    } catch (error) {
      console.error('Error saving form template to backend:', error);

      if (!form._id) {
        form._id = `temp_${Date.now()}`;
      }
      const existingIndex = forms.value.findIndex((f) => f._id === form._id);
      if (existingIndex >= 0) {
        forms.value[existingIndex] = form;
      } else {
        forms.value.push(form);
      }

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
      const existingIndex = forms.value.findIndex((f) => f._id === form._id);
      if (existingIndex >= 0) {
        forms.value[existingIndex] = form;
      }
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