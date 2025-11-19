import { ref, computed } from 'vue';

const STORAGE_KEY = 'hrAdmins';
const CURRENT_KEY = 'hrCurrentAdmin';

export interface AdminAccount {
  id: string;
  email: string;
  password: string; // demo only; do NOT do this in production
  displayName: string;
}

function loadAdmins(): AdminAccount[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AdminAccount[];
  } catch {
    return [];
  }
}

function saveAdmins(admins: AdminAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(admins));
}

function loadCurrent(): AdminAccount | null {
  const raw = localStorage.getItem(CURRENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminAccount;
  } catch {
    return null;
  }
}

const admins = ref<AdminAccount[]>(loadAdmins());
const currentAdmin = ref<AdminAccount | null>(loadCurrent());

export function useAuthStore() {
  const isAuthenticated = computed(() => !!currentAdmin.value);

  function register(email: string, password: string): AdminAccount {
    const existing = admins.value.find(a => a.email === email);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }
    const admin: AdminAccount = {
      id: `admin_${Date.now()}`,
      email,
      password,
      displayName: email.split('@')[0]
    };
    admins.value.push(admin);
    saveAdmins(admins.value);
    return admin;
  }

  function login(email: string, password: string): AdminAccount {
    const admin = admins.value.find(a => a.email === email && a.password === password);
    if (!admin) {
      throw new Error('Invalid email or password.');
    }
    currentAdmin.value = admin;
    localStorage.setItem(CURRENT_KEY, JSON.stringify(admin));
    localStorage.setItem('hrAdminToken', `token_${admin.id}`);
    localStorage.setItem('hrAdminEmail', admin.email);
    localStorage.setItem('hrAdminId', admin.id);
    return admin;
  }

  function logout() {
    currentAdmin.value = null;
    localStorage.removeItem(CURRENT_KEY);
    localStorage.removeItem('hrAdminToken');
    localStorage.removeItem('hrAdminEmail');
    localStorage.removeItem('hrAdminId');
  }

  return {
    currentAdmin,
    isAuthenticated,
    register,
    login,
    logout
  };
}
