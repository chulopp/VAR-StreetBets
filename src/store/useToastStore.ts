import { create } from 'zustand';

export type ToastType = 'success' | 'warning' | 'info';

interface ToastState {
  message: string;
  isVisible: boolean;
  type: ToastType;
  timeoutId: any;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  message: '',
  isVisible: false,
  type: 'info',
  timeoutId: null,

  showToast: (message, type = 'info') => {
    const currentTimeoutId = get().timeoutId;
    if (currentTimeoutId) {
      clearTimeout(currentTimeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      set({ isVisible: false, timeoutId: null });
    }, 3000);

    set({
      message,
      type,
      isVisible: true,
      timeoutId: newTimeoutId,
    });
  },

  hideToast: () => {
    const currentTimeoutId = get().timeoutId;
    if (currentTimeoutId) {
      clearTimeout(currentTimeoutId);
    }
    set({ isVisible: false, timeoutId: null });
  },
}));
