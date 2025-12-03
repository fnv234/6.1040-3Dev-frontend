import { ref } from 'vue';

interface Toast {
  id: string;
  title: string;
  description?: string;
  color?: 'green' | 'red' | 'orange' | 'blue' | 'gray';
  duration?: number;
}

const toasts = ref<Toast[]>([]);
let toastId = 0;

export function useToast() {
  const add = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${toastId++}`;
    const duration = toast.duration || 5000;
    
    toasts.value.push({
      id,
      ...toast
    });

    // Auto-remove after duration
    setTimeout(() => {
      remove(id);
    }, duration);
  };

  const remove = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    let color: Toast['color'] = 'blue';

    if (type === 'success') {
      color = 'green';
    } else if (type === 'error') {
      color = 'red';
    } else {
      color = 'blue';
    }

    add({
      title: message,
      color,
    });
  };

  return {
    toasts,
    add,
    remove,
    showToast,
  };
}