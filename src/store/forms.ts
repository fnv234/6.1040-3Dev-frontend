import { ref } from 'vue';
import type { FeedbackFormDraft } from '@/types';

const STORAGE_KEY = 'hr_feedback_forms';

// Load forms from localStorage
const loadForms = (): FeedbackFormDraft[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Save forms to localStorage
const saveForms = (forms: FeedbackFormDraft[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
};

const forms = ref<FeedbackFormDraft[]>(loadForms());

export const useFormsStore = () => {
  const saveForm = (form: FeedbackFormDraft) => {
    // Generate a temporary ID if not present (will be replaced by backend)
    if (!form._id) {
      form._id = `temp_${Date.now()}`;
    }
    
    const existingIndex = forms.value.findIndex(f => f._id === form._id);
    
    if (existingIndex >= 0) {
      // Update existing form
      forms.value[existingIndex] = form;
    } else {
      // Add new form
      forms.value.push(form);
    }
    
    saveForms(forms.value);
  };

  const deleteForm = (formId: string) => {
    forms.value = forms.value.filter(f => f._id !== formId);
    saveForms(forms.value);
  };

  const getFormById = (formId: string): FeedbackFormDraft | undefined => {
    return forms.value.find(f => f._id === formId);
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
    sendForm
  };
};
