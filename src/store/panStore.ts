import { create } from 'zustand';
import { db } from '@/lib/db';
import { PanRecord } from '@/types';
import { useAuthStore } from './authStore';
import { encryptRecord, decryptRecord } from '@/lib/crypto';
import { generateId } from '@/lib/utils';

interface PanStore {
  pans: PanRecord[];
  isLoading: boolean;
  error: string | null;
  
  fetchPans: () => Promise<void>;
  addPan: (data: Omit<PanRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePan: (id: string, data: Partial<Omit<PanRecord, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deletePan: (id: string) => Promise<void>;
  searchPans: (query: string) => PanRecord[];
  clearError: () => void;
}

export const usePanStore = create<PanStore>((set, get) => ({
  pans: [],
  isLoading: false,
  error: null,

  fetchPans: async () => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const encryptedPans = await db.pan.toArray();
      const pans = await Promise.all(
        encryptedPans.map(async (pan) => {
          const decrypted = await decryptRecord(
            pan as any,
            ['panNumber', 'notes'],
            encryptionKey
          );
          return decrypted as unknown as PanRecord;
        })
      );
      set({ pans, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addPan: async (data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const now = Date.now();
      const pan: PanRecord = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      const encrypted = await encryptRecord(
        pan as any,
        ['panNumber', 'notes'],
        encryptionKey
      );

      await db.pan.add(encrypted as any);
      
      set((state) => ({
        pans: [...state.pans, pan],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updatePan: async (id, data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const existingPan = get().pans.find((p) => p.id === id);
      if (!existingPan) {
        throw new Error('PAN not found');
      }

      const updated: PanRecord = {
        ...existingPan,
        ...data,
        updatedAt: Date.now(),
      };

      const encrypted = await encryptRecord(
        updated as any,
        ['panNumber', 'notes'],
        encryptionKey
      );

      await db.pan.update(id, encrypted as any);
      
      set((state) => ({
        pans: state.pans.map((p) => (p.id === id ? updated : p)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deletePan: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.pan.delete(id);
      set((state) => ({
        pans: state.pans.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  searchPans: (query: string) => {
    const { pans } = get();
    if (!query.trim()) return pans;

    const lowerQuery = query.toLowerCase();
    return pans.filter(
      (pan) =>
        pan.name?.toLowerCase().includes(lowerQuery) ||
        pan.fatherName?.toLowerCase().includes(lowerQuery)
    );
  },

  clearError: () => set({ error: null }),
}));
