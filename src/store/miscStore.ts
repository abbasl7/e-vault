import { create } from 'zustand';
import { db } from '@/lib/db';
import { MiscRecord } from '@/types';
import { useAuthStore } from './authStore';
import { encryptRecord, decryptRecord } from '@/lib/crypto';
import { generateId } from '@/lib/utils';

interface MiscStore {
  misc: MiscRecord[];
  isLoading: boolean;
  error: string | null;
  
  fetchMisc: () => Promise<void>;
  addMisc: (data: Omit<MiscRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMisc: (id: string, data: Partial<Omit<MiscRecord, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteMisc: (id: string) => Promise<void>;
  searchMisc: (query: string) => MiscRecord[];
  clearError: () => void;
}

export const useMiscStore = create<MiscStore>((set, get) => ({
  misc: [],
  isLoading: false,
  error: null,

  fetchMisc: async () => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const encryptedMisc = await db.misc.toArray();
      const misc = await Promise.all(
        encryptedMisc.map(async (item) => {
          const decrypted = await decryptRecord(
            item as any,
            ['content', 'username', 'password', 'notes'],
            encryptionKey
          );
          return decrypted as unknown as MiscRecord;
        })
      );
      set({ misc, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addMisc: async (data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const now = Date.now();
      const item: MiscRecord = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      const encrypted = await encryptRecord(
        item as any,
        ['content', 'username', 'password', 'notes'],
        encryptionKey
      );

      await db.misc.add(encrypted as any);
      
      set((state) => ({
        misc: [...state.misc, item],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateMisc: async (id, data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const existingItem = get().misc.find((m) => m.id === id);
      if (!existingItem) {
        throw new Error('Item not found');
      }

      const updated: MiscRecord = {
        ...existingItem,
        ...data,
        updatedAt: Date.now(),
      };

      const encrypted = await encryptRecord(
        updated as any,
        ['content', 'username', 'password', 'notes'],
        encryptionKey
      );

      await db.misc.update(id, encrypted as any);
      
      set((state) => ({
        misc: state.misc.map((m) => (m.id === id ? updated : m)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteMisc: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.misc.delete(id);
      set((state) => ({
        misc: state.misc.filter((m) => m.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  searchMisc: (query: string) => {
    const { misc } = get();
    if (!query.trim()) return misc;

    const lowerQuery = query.toLowerCase();
    return misc.filter(
      (item) =>
        item.title?.toLowerCase().includes(lowerQuery) ||
        item.type?.toLowerCase().includes(lowerQuery)
    );
  },

  clearError: () => set({ error: null }),
}));
