import { create } from 'zustand';
import { db } from '@/lib/db';
import { VoterIdRecord } from '@/types';
import { useAuthStore } from './authStore';
import { encryptRecord, decryptRecord } from '@/lib/crypto';
import { generateId } from '@/lib/utils';

interface VoterIdStore {
  voterIds: VoterIdRecord[];
  isLoading: boolean;
  error: string | null;
  
  fetchVoterIds: () => Promise<void>;
  addVoterId: (data: Omit<VoterIdRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVoterId: (id: string, data: Partial<Omit<VoterIdRecord, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteVoterId: (id: string) => Promise<void>;
  searchVoterIds: (query: string) => VoterIdRecord[];
  clearError: () => void;
}

export const useVoterIdStore = create<VoterIdStore>((set, get) => ({
  voterIds: [],
  isLoading: false,
  error: null,

  fetchVoterIds: async () => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const encryptedVoterIds = await db.voterid.toArray();
      const voterIds = await Promise.all(
        encryptedVoterIds.map(async (voterId) => {
          const decrypted = await decryptRecord(
            voterId as any,
            ['voterIdNumber', 'notes'],
            encryptionKey
          );
          return decrypted as unknown as VoterIdRecord;
        })
      );
      set({ voterIds, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addVoterId: async (data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const now = Date.now();
      const voterId: VoterIdRecord = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      const encrypted = await encryptRecord(
        voterId as any,
        ['voterIdNumber', 'notes'],
        encryptionKey
      );

      await db.voterid.add(encrypted as any);
      
      set((state) => ({
        voterIds: [...state.voterIds, voterId],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateVoterId: async (id, data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const existingVoterId = get().voterIds.find((v) => v.id === id);
      if (!existingVoterId) {
        throw new Error('Voter ID not found');
      }

      const updated: VoterIdRecord = {
        ...existingVoterId,
        ...data,
        updatedAt: Date.now(),
      };

      const encrypted = await encryptRecord(
        updated as any,
        ['voterIdNumber', 'notes'],
        encryptionKey
      );

      await db.voterid.update(id, encrypted as any);
      
      set((state) => ({
        voterIds: state.voterIds.map((v) => (v.id === id ? updated : v)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteVoterId: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.voterid.delete(id);
      set((state) => ({
        voterIds: state.voterIds.filter((v) => v.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  searchVoterIds: (query: string) => {
    const { voterIds } = get();
    if (!query.trim()) return voterIds;

    const lowerQuery = query.toLowerCase();
    return voterIds.filter(
      (voterId) =>
        voterId.name?.toLowerCase().includes(lowerQuery) ||
        voterId.constituency?.toLowerCase().includes(lowerQuery) ||
        voterId.state?.toLowerCase().includes(lowerQuery)
    );
  },

  clearError: () => set({ error: null }),
}));
