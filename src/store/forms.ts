import { ref, computed, watch } from 'vue';
import type { FormTemplate } from '@/types';
import { useAuthStore } from './auth';
import { formTemplate as formTemplateAPI } from '@/api/client';

const forms = ref<FormTemplate[]>([]);
const loading = ref(false);
const loaded = ref(false);

// Store access codes for each form and team member
const formAccessCodes = ref<Record<string, Record<string, string>>>({});

export const useFormsStore = () => {
  const auth = useAuthStore();
  const currentAdminId = computed(() => auth.currentAdmin.value?._id);

  const storageKey = computed(() => {
    if (currentAdminId.value) {
      return `hr_feedback_forms_${currentAdminId.value}`;
    }
    return null;
  });

  const loadFormsFromLocalStorage = () => {
    if (!storageKey.value) {
      forms.value = [];
      loaded.value = true;
      return;
    }

    const raw = localStorage.getItem(storageKey.value);
    try {
      forms.value = raw ? (JSON.parse(raw) as FormTemplate[]) : [];
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
  }, { immediate: true });

  watch(
    forms,
    (newForms) => {
      if (storageKey.value) {
        localStorage.setItem(storageKey.value, JSON.stringify(newForms));
      }
    },
    { deep: true },
  );

  const saveForm = async (form: FormTemplate) => {
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

  const deleteForm = (formId: string) => {
    forms.value = forms.value.filter((f) => f._id !== formId);
  };

  const getFormById = (formId: string): FormTemplate | undefined => {
    return forms.value.find((f) => f._id === formId);
  };

  const sendForm = (formId: string) => {
    const form = getFormById(formId);
    if (form) {
      form.status = 'Sent';
      const existingIndex = forms.value.findIndex((f) => f._id === form._id);
      if (existingIndex >= 0) {
        forms.value[existingIndex] = form;
      }
    }
  };

  // Access code management functions
  const getAccessCode = (formId: string, memberId: string): string | null => {
    return formAccessCodes.value[formId]?.[memberId] || null;
  };

  const setAccessCode = (formId: string, memberId: string, accessCode: string): void => {
    if (!formAccessCodes.value[formId]) {
      formAccessCodes.value[formId] = {};
    }
    formAccessCodes.value[formId][memberId] = accessCode;
    
    // Save to localStorage
    if (storageKey.value) {
      const accessCodesKey = storageKey.value + '_access_codes';
      localStorage.setItem(accessCodesKey, JSON.stringify(formAccessCodes.value));
    }
  };

  const loadAccessCodesFromStorage = () => {
    if (!storageKey.value) return;
    
    const accessCodesKey = storageKey.value + '_access_codes';
    const raw = localStorage.getItem(accessCodesKey);
    try {
      formAccessCodes.value = raw ? JSON.parse(raw) : {};
    } catch {
      formAccessCodes.value = {};
    }
  };

  // API functions for form responses and access codes
  const getFormByAccessCode = async (accessCode: string) => {
    try {
      const response = await fetch(`https://six-1040-3dev-backend.onrender.com/api/AccessCode/getAccessCodeInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode }),
      });

      if (!response.ok) {
        throw new Error('Invalid access code');
      }

      const { accessCodeInfo } = await response.json();
      
      // Get the form template
      const formResponse = await fetch(`https://six-1040-3dev-backend.onrender.com/api/FormTemplate/getTemplate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId: accessCodeInfo.formId }),
      });

      if (!formResponse.ok) {
        throw new Error('Form not found');
      }

      const { template } = await formResponse.json();
      
      return {
        accessCodeInfo,
        form: template,
      };
    } catch (error) {
      console.error('Error getting form by access code:', error);
      throw error;
    }
  };

  const getQuestionsForRole = async (formTemplate: any, memberRole: string | null) => {
    try {
      // Filter questions based on role targeting (client-side filtering)
      const allQuestions = formTemplate.questions || [];
      
      const filteredQuestions = allQuestions.filter((question: any) => {
        // If no target roles specified, show to everyone
        if (!question.targetRoles || question.targetRoles.length === 0) {
          return true;
        }

        // If member has no role, don't show role-targeted questions
        if (!memberRole) {
          return false;
        }

        // Show question if member's role is in the target roles
        return question.targetRoles.includes(memberRole);
      });

      return filteredQuestions;
    } catch (error) {
      console.error('Error getting questions for role:', error);
      throw error;
    }
  };

  const submitFormResponse = async (accessCode: string, responses: Record<number, string>) => {
    try {
      console.log('Submitting form response:', { accessCode, responses });
      
      const response = await fetch(`https://six-1040-3dev-backend.onrender.com/api/AccessCode/submitFormResponse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          accessCode,
          responses 
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error response:', errorData);
        throw new Error(errorData.error || 'Failed to submit form response');
      }

      const result = await response.json();
      console.log('Successful response:', result);
      
      const { responseId } = result;
      return responseId;
    } catch (error) {
      console.error('Error submitting form response:', error);
      throw error;
    }
  };

  const getFormResponses = async (formId: string) => {
    if (!currentAdminId.value) {
      throw new Error('No current admin');
    }

    try {
      const response = await fetch(`https://six-1040-3dev-backend.onrender.com/api/AccessCode/getFormResponses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          formId,
          createdBy: currentAdminId.value 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get form responses');
      }

      const { responses } = await response.json();
      return responses;
    } catch (error) {
      console.error('Error getting form responses:', error);
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
    getAccessCode,
    setAccessCode,
    loadAccessCodesFromStorage,
    getFormByAccessCode,
    getQuestionsForRole,
    submitFormResponse,
    getFormResponses,
  };
};