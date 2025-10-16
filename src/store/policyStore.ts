import { create } from 'zustand';
import { db } from '@/lib/db';
import { PolicyRecord } from '@/types';
import { useAuthStore } from './authStore';
import { encryptRecord, decryptRecord } from '@/lib/crypto';
import { generateId } from '@/lib/utils';

interface PolicyStore {
  policies: PolicyRecord[];
  isLoading: boolean;
  error: string | null;
  
  fetchPolicies: () => Promise<void>;
  addPolicy: (data: Omit<PolicyRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePolicy: (id: string, data: Partial<Omit<PolicyRecord, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deletePolicy: (id: string) => Promise<void>;
  searchPolicies: (query: string) => PolicyRecord[];
  clearError: () => void;
}

export const usePolicyStore = create<PolicyStore>((set, get) => ({
  policies: [],
  isLoading: false,
  error: null,

  fetchPolicies: async () => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const encryptedPolicies = await db.policies.toArray();
      const policies = await Promise.all(
        encryptedPolicies.map(async (policy) => {
          const decrypted = await decryptRecord(
            policy as any,
            ['notes'],
            encryptionKey
          );
          return decrypted as unknown as PolicyRecord;
        })
      );
      set({ policies, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addPolicy: async (data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const now = Date.now();
      const policy: PolicyRecord = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      const encrypted = await encryptRecord(
        policy as any,
        ['notes'],
        encryptionKey
      );

      await db.policies.add(encrypted as any);
      
      set((state) => ({
        policies: [...state.policies, policy],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updatePolicy: async (id, data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const existingPolicy = get().policies.find((p) => p.id === id);
      if (!existingPolicy) {
        throw new Error('Policy not found');
      }

      const updated: PolicyRecord = {
        ...existingPolicy,
        ...data,
        updatedAt: Date.now(),
      };

      const encrypted = await encryptRecord(
        updated as any,
        ['notes'],
        encryptionKey
      );

      await db.policies.update(id, encrypted as any);
      
      set((state) => ({
        policies: state.policies.map((p) => (p.id === id ? updated : p)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deletePolicy: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.policies.delete(id);
      set((state) => ({
        policies: state.policies.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  searchPolicies: (query: string) => {
    const { policies } = get();
    if (!query.trim()) return policies;

    const lowerQuery = query.toLowerCase();
    return policies.filter(
      (policy) =>
        policy.name?.toLowerCase().includes(lowerQuery) ||
        policy.company?.toLowerCase().includes(lowerQuery)
    );
  },

  clearError: () => set({ error: null }),
}));
