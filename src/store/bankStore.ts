import { create } from 'zustand';
import { db } from '@/lib/db';
import { BankRecord } from '@/types';
import { useAuthStore } from './authStore';
import { encryptRecord, decryptRecord } from '@/lib/crypto';
import { generateId } from '@/lib/utils';

interface BankStore {
  banks: BankRecord[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchBanks: () => Promise<void>;
  addBank: (data: Omit<BankRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBank: (id: string, data: Partial<Omit<BankRecord, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteBank: (id: string) => Promise<void>;
  searchBanks: (query: string) => BankRecord[];
  clearError: () => void;
}

export const useBankStore = create<BankStore>((set, get) => ({
  banks: [],
  isLoading: false,
  error: null,

  fetchBanks: async () => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const encryptedBanks = await db.banks.toArray();
      const banks = await Promise.all(
        encryptedBanks.map(async (bank) => {
          const decrypted = await decryptRecord(
            bank as any,
            [
              'accountNo',
              'cifNo',
              'username',
              'profilePrivy',
              'mPin',
              'tPin',
              'notes',
              'privy',
            ],
            encryptionKey
          );
          return decrypted as unknown as BankRecord;
        })
      );
      set({ banks, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addBank: async (data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const now = Date.now();
      const bank: BankRecord = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      const encrypted = await encryptRecord(
        bank as any,
        [
          'accountNo',
          'cifNo',
          'username',
          'profilePrivy',
          'mPin',
          'tPin',
          'notes',
          'privy',
        ],
        encryptionKey
      );

      await db.banks.add(encrypted as any);
      
      // Optimistic update
      set((state) => ({
        banks: [...state.banks, bank],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateBank: async (id, data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const existingBank = get().banks.find((b) => b.id === id);
      if (!existingBank) {
        throw new Error('Bank not found');
      }

      const updated: BankRecord = {
        ...existingBank,
        ...data,
        updatedAt: Date.now(),
      };

      const encrypted = await encryptRecord(
        updated as any,
        [
          'accountNo',
          'cifNo',
          'username',
          'profilePrivy',
          'mPin',
          'tPin',
          'notes',
          'privy',
        ],
        encryptionKey
      );

      await db.banks.update(id, encrypted as any);
      
      // Optimistic update
      set((state) => ({
        banks: state.banks.map((b) => (b.id === id ? updated : b)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteBank: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.banks.delete(id);
      
      // Optimistic update
      set((state) => ({
        banks: state.banks.filter((b) => b.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  searchBanks: (query: string) => {
    const { banks } = get();
    if (!query.trim()) return banks;

    const lowerQuery = query.toLowerCase();
    return banks.filter(
      (bank) =>
        bank.title?.toLowerCase().includes(lowerQuery) ||
        bank.bankName?.toLowerCase().includes(lowerQuery) ||
        bank.ifsc?.toLowerCase().includes(lowerQuery) ||
        bank.username?.toLowerCase().includes(lowerQuery)
    );
  },

  clearError: () => set({ error: null }),
}));
