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
  }

  watch(currentAdminId, loadFormsForCurrentUser, { immediate: true });

  watch(
    forms,
    (newForms) => {
      if (storageKey.value) {
        localStorage.setItem(storageKey.value, JSON.stringify(newForms));
      }
    },
    { deep: true }
  );

  const saveForm = (form: FeedbackFormDraft) => {
    if (!form._id) {
      form._id = `temp_${Date.now()}`;
    }
    const existingIndex = forms.value.findIndex((f) => f._id === form._id);
    if (existingIndex >= 0) {
      forms.value[existingIndex] = form;
    } else {
      forms.value.push(form);
    }
  };

  const deleteForm = (formId: string) => {
    forms.value = forms.value.filter((f) => f._id !== formId);
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
