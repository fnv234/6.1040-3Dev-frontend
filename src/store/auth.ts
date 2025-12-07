import { ref, computed } from 'vue';
import { hrAdmin } from '@/api/client';
import type { HRAdmin } from '@/types';

const CURRENT_ADMIN_KEY = 'hrCurrentAdmin';
const ADMIN_ID_KEY = 'hrAdminId';
const ADMIN_EMAIL_KEY = 'hrAdminEmail';
const SESSION_ID_KEY = 'hrSessionId';

// Generate a unique session ID for this browser tab
function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Create session-specific storage keys
function getSessionKey(baseKey: string): string {
  const sessionId = getOrCreateSessionId();
  return `${baseKey}_${sessionId}`;
}

function loadCurrentAdmin(): HRAdmin | null {
  const raw = localStorage.getItem(getSessionKey(CURRENT_ADMIN_KEY));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as HRAdmin;
    // Validate that the parsed data has required fields
    if (parsed && parsed._id && parsed.email) {
      return parsed;
    }
    // Invalid data, clear localStorage
    clearCurrentAdmin();
    return null;
  } catch (error) {
    // Invalid JSON, clear localStorage
    clearCurrentAdmin();
    return null;
  }
}

function saveCurrentAdmin(admin: HRAdmin) {
  localStorage.setItem(getSessionKey(CURRENT_ADMIN_KEY), JSON.stringify(admin));
  localStorage.setItem(getSessionKey(ADMIN_ID_KEY), admin._id);
  localStorage.setItem(getSessionKey(ADMIN_EMAIL_KEY), admin.email);
}

function clearCurrentAdmin() {
  localStorage.removeItem(getSessionKey(CURRENT_ADMIN_KEY));
  localStorage.removeItem(getSessionKey(ADMIN_ID_KEY));
  localStorage.removeItem(getSessionKey(ADMIN_EMAIL_KEY));
}

// Remove global currentAdmin ref - it will be created per store instance

const currentAdmin = ref<HRAdmin | null>(loadCurrentAdmin());

export function useAuthStore() {
  const isAuthenticated = computed(() => !!currentAdmin.value);

  async function register(email: string, password: string): Promise<HRAdmin> {
    try {
      // Register with backend
      const registerResponse = await hrAdmin.registerHRAdmin({ email, password });
      const adminId = registerResponse.data.hrAdmin;

      // Get full admin data
      const adminResponse = await hrAdmin.getHRAdmin({ hrAdminId: adminId });
      const admin = adminResponse.data.hrAdminData;

      // Save to state and localStorage
      const hrAdminData: HRAdmin = {
        _id: admin._id,
        email: admin.email
      };
      currentAdmin.value = hrAdminData;
      saveCurrentAdmin(hrAdminData);

      return hrAdminData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      throw new Error(errorMessage);
    }
  }

  async function login(email: string, password: string): Promise<HRAdmin> {
    try {
      // Authenticate with backend
      const authResponse = await hrAdmin.authenticateHRAdmin({ email, password });
      const adminId = authResponse.data.hrAdmin;

      // Get full admin data
      const adminResponse = await hrAdmin.getHRAdmin({ hrAdminId: adminId });
      const admin = adminResponse.data.hrAdminData;

      // Save to state and localStorage
      const hrAdminData: HRAdmin = {
        _id: admin._id,
        email: admin.email
      };
      currentAdmin.value = hrAdminData;
      saveCurrentAdmin(hrAdminData);

      return hrAdminData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Invalid email or password.';
      throw new Error(errorMessage);
    }
  }

  function logout() {
    currentAdmin.value = null;
    clearCurrentAdmin();
  }

  return {
    currentAdmin,
    isAuthenticated,
    register,
    login,
    logout
  };
}
