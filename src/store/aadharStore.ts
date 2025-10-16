import { create } from 'zustand';
import { db } from '@/lib/db';
import { AadharRecord } from '@/types';
import { useAuthStore } from './authStore';
import { encryptRecord, decryptRecord } from '@/lib/crypto';
import { generateId } from '@/lib/utils';

interface AadharStore {
  aadhars: AadharRecord[];
  isLoading: boolean;
  error: string | null;
  
  fetchAadhars: () => Promise<void>;
  addAadhar: (data: Omit<AadharRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAadhar: (id: string, data: Partial<Omit<AadharRecord, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteAadhar: (id: string) => Promise<void>;
  searchAadhars: (query: string) => AadharRecord[];
  clearError: () => void;
}

export const useAadharStore = create<AadharStore>((set, get) => ({
  aadhars: [],
  isLoading: false,
  error: null,

  fetchAadhars: async () => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const encryptedAadhars = await db.aadhar.toArray();
      const aadhars = await Promise.all(
        encryptedAadhars.map(async (aadhar) => {
          const decrypted = await decryptRecord(
            aadhar as any,
            ['aadharNumber', 'enrollmentNumber', 'vid', 'notes'],
            encryptionKey
          );
          return decrypted as unknown as AadharRecord;
        })
      );
      set({ aadhars, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addAadhar: async (data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const now = Date.now();
      const aadhar: AadharRecord = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      const encrypted = await encryptRecord(
        aadhar as any,
        ['aadharNumber', 'enrollmentNumber', 'vid', 'notes'],
        encryptionKey
      );

      await db.aadhar.add(encrypted as any);
      
      set((state) => ({
        aadhars: [...state.aadhars, aadhar],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateAadhar: async (id, data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const existingAadhar = get().aadhars.find((a) => a.id === id);
      if (!existingAadhar) {
        throw new Error('Aadhar not found');
      }

      const updated: AadharRecord = {
        ...existingAadhar,
        ...data,
        updatedAt: Date.now(),
      };

      const encrypted = await encryptRecord(
        updated as any,
        ['aadharNumber', 'enrollmentNumber', 'vid', 'notes'],
        encryptionKey
      );

      await db.aadhar.update(id, encrypted as any);
      
      set((state) => ({
        aadhars: state.aadhars.map((a) => (a.id === id ? updated : a)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteAadhar: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.aadhar.delete(id);
      set((state) => ({
        aadhars: state.aadhars.filter((a) => a.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  searchAadhars: (query: string) => {
    const { aadhars } = get();
    if (!query.trim()) return aadhars;

    const lowerQuery = query.toLowerCase();
    return aadhars.filter(
      (aadhar) =>
        aadhar.name?.toLowerCase().includes(lowerQuery) ||
        aadhar.address?.toLowerCase().includes(lowerQuery)
    );
  },

  clearError: () => set({ error: null }),
}));
