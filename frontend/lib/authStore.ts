import { create } from 'zustand';

export interface AuthUser {
  userId: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  checkAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,

  login: (user: AuthUser) => {
    localStorage.setItem('auth', JSON.stringify(user));
    set({ user, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('auth');
    set({ user: null, isLoading: false });
  },

  checkAuth: () => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('auth');
      if (auth) {
        try {
          const user = JSON.parse(auth);
          set({ user, isLoading: false });
        } catch (e) {
          localStorage.removeItem('auth');
          set({ user: null, isLoading: false });
        }
      } else {
        set({ user: null, isLoading: false });
      }
    }
  },

  isAuthenticated: () => {
    return get().user !== null;
  },
}));
