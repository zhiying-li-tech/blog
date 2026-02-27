import { create } from 'zustand';
import type { User } from '@/types/user';
import { authApi, usersApi } from '@/lib/api';
import { setTokens, clearTokens, isLoggedIn } from '@/lib/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  _fetched: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

let fetchPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  _fetched: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login({ email, password });
      const { user, tokens } = res.data.data;
      setTokens(tokens.access_token, tokens.refresh_token);
      set({ user, token: tokens.access_token, isLoading: false, _fetched: true });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register({ username, email, password });
      const { user, tokens } = res.data.data;
      setTokens(tokens.access_token, tokens.refresh_token);
      set({ user, token: tokens.access_token, isLoading: false, _fetched: true });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    clearTokens();
    fetchPromise = null;
    set({ user: null, token: null, _fetched: false });
  },

  fetchUser: async () => {
    if (!isLoggedIn()) return;
    if (get()._fetched && get().user) return;

    if (fetchPromise) {
      await fetchPromise;
      return;
    }

    set({ isLoading: true });
    fetchPromise = (async () => {
      try {
        const res = await usersApi.getMe();
        set({ user: res.data.data, isLoading: false, _fetched: true });
      } catch {
        clearTokens();
        set({ user: null, token: null, isLoading: false, _fetched: true });
      } finally {
        fetchPromise = null;
      }
    })();

    await fetchPromise;
  },

  setUser: (user: User | null) => {
    set({ user });
  },
}));
