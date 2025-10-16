import { create } from 'zustand';
import { db } from '@/lib/db';
import { deriveKey, hashPassword, generateSaltHex, hexToBuffer } from '@/lib/crypto';
import type { AuthData, SetupData } from '@/types';

interface AuthStore {
  isAuthenticated: boolean;
  username: string | null;
  encryptionKey: CryptoKey | null;
  lastActivity: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (password: string) => Promise<void>;
  logout: () => void;
  setupAccount: (data: SetupData) => Promise<void>;
  resetPassword: (answer1: string, answer2: string, newPassword: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateActivity: () => void;
  checkInactivity: () => boolean;
  setError: (error: string | null) => void;
}

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  username: null,
  encryptionKey: null,
  lastActivity: Date.now(),
  isLoading: false,
  error: null,

  login: async (password: string) => {
    try {
      set({ isLoading: true, error: null });

      const authData = await db.auth.get('master');
      if (!authData) {
        throw new Error('No account found. Please set up an account first.');
      }

      // Verify password
      const hash = await hashPassword(password, authData.salt);
      if (hash !== authData.masterHash) {
        throw new Error('Invalid password');
      }

      // Derive encryption key
      const key = await deriveKey(password, hexToBuffer(authData.salt));

      set({
        isAuthenticated: true,
        username: authData.username,
        encryptionKey: key,
        lastActivity: Date.now(),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    set({
      isAuthenticated: false,
      username: null,
      encryptionKey: null,
      lastActivity: 0,
    });
  },

  setupAccount: async (data: SetupData) => {
    try {
      set({ isLoading: true, error: null });

      // Generate salt
      const saltHex = generateSaltHex();

      // Hash master password
      const masterHash = await hashPassword(data.password, saltHex);

      // Hash security answers
      const answer1Hash = await hashPassword(data.securityAnswer1.toLowerCase(), saltHex);
      const answer2Hash = await hashPassword(data.securityAnswer2.toLowerCase(), saltHex);

      // Create auth data
      const authData: AuthData = {
        id: 'master',
        masterHash,
        salt: saltHex,
        username: data.username,
        securityQuestion1: data.securityQuestion1,
        securityAnswer1Hash: answer1Hash,
        securityQuestion2: data.securityQuestion2,
        securityAnswer2Hash: answer2Hash,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.auth.put(authData);

      // Derive encryption key
      const salt = hexToBuffer(saltHex);
      const key = await deriveKey(data.password, salt);

      set({
        isAuthenticated: true,
        username: data.username,
        encryptionKey: key,
        lastActivity: Date.now(),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Setup failed',
        isLoading: false,
      });
      throw error;
    }
  },

  resetPassword: async (answer1: string, answer2: string, newPassword: string) => {
    try {
      set({ isLoading: true, error: null });

      const authData = await db.auth.get('master');
      if (!authData) {
        throw new Error('No account found');
      }

      // Verify security answers
      const answer1Hash = await hashPassword(answer1.toLowerCase(), authData.salt);
      const answer2Hash = await hashPassword(answer2.toLowerCase(), authData.salt);

      if (answer1Hash !== authData.securityAnswer1Hash) {
        throw new Error('Incorrect answer to security question 1');
      }
      if (answer2Hash !== authData.securityAnswer2Hash) {
        throw new Error('Incorrect answer to security question 2');
      }

      // Update password
      const newHash = await hashPassword(newPassword, authData.salt);
      authData.masterHash = newHash;
      authData.updatedAt = Date.now();
      
      await db.auth.put(authData);

      // Note: In a real scenario, you'd need to re-encrypt all data with the new key
      // For simplicity, we'll just update the auth data
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Password reset failed',
        isLoading: false,
      });
      throw error;
    }
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    try {
      set({ isLoading: true, error: null });

      const authData = await db.auth.get('master');
      if (!authData) {
        throw new Error('No account found');
      }

      // Verify old password
      const oldHash = await hashPassword(oldPassword, authData.salt);
      if (oldHash !== authData.masterHash) {
        throw new Error('Incorrect current password');
      }

      // Update password
      const newHash = await hashPassword(newPassword, authData.salt);
      authData.masterHash = newHash;
      authData.updatedAt = Date.now();
      
      await db.auth.put(authData);

      // Derive new encryption key
      const salt = hexToBuffer(authData.salt);
      const newKey = await deriveKey(newPassword, salt);

      set({
        encryptionKey: newKey,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Password change failed',
        isLoading: false,
      });
      throw error;
    }
  },

  updateActivity: () => {
    set({ lastActivity: Date.now() });
  },

  checkInactivity: () => {
    const { lastActivity, isAuthenticated } = get();
    if (!isAuthenticated) return false;

    const inactive = Date.now() - lastActivity > INACTIVITY_TIMEOUT;
    if (inactive) {
      get().logout();
    }
    return inactive;
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
