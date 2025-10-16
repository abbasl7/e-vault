import { create } from 'zustand';
import { db } from '@/lib/db';
import { CardRecord } from '@/types';
import { useAuthStore } from './authStore';
import { encryptRecord, decryptRecord } from '@/lib/crypto';
import { generateId } from '@/lib/utils';

interface CardStore {
  cards: CardRecord[];
  isLoading: boolean;
  error: string | null;
  
  fetchCards: () => Promise<void>;
  addCard: (data: Omit<CardRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCard: (id: string, data: Partial<Omit<CardRecord, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  searchCards: (query: string) => CardRecord[];
  clearError: () => void;
}

export const useCardStore = create<CardStore>((set, get) => ({
  cards: [],
  isLoading: false,
  error: null,

  fetchCards: async () => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const encryptedCards = await db.cards.toArray();
      const cards = await Promise.all(
        encryptedCards.map(async (card) => {
          const decrypted = await decryptRecord(
            card as any,
            ['cardNumber', 'cvv', 'customerId', 'pin', 'notes'],
            encryptionKey
          );
          return decrypted as unknown as CardRecord;
        })
      );
      set({ cards, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addCard: async (data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const now = Date.now();
      const card: CardRecord = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      const encrypted = await encryptRecord(
        card as any,
        ['cardNumber', 'cvv', 'customerId', 'pin', 'notes'],
        encryptionKey
      );

      await db.cards.add(encrypted as any);
      
      set((state) => ({
        cards: [...state.cards, card],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateCard: async (id, data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const existingCard = get().cards.find((c) => c.id === id);
      if (!existingCard) {
        throw new Error('Card not found');
      }

      const updated: CardRecord = {
        ...existingCard,
        ...data,
        updatedAt: Date.now(),
      };

      const encrypted = await encryptRecord(
        updated as any,
        ['cardNumber', 'cvv', 'customerId', 'pin', 'notes'],
        encryptionKey
      );

      await db.cards.update(id, encrypted as any);
      
      set((state) => ({
        cards: state.cards.map((c) => (c.id === id ? updated : c)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteCard: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.cards.delete(id);
      set((state) => ({
        cards: state.cards.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  searchCards: (query: string) => {
    const { cards } = get();
    if (!query.trim()) return cards;

    const lowerQuery = query.toLowerCase();
    return cards.filter(
      (card) =>
        card.bankName?.toLowerCase().includes(lowerQuery) ||
        card.cardType?.toLowerCase().includes(lowerQuery)
    );
  },

  clearError: () => set({ error: null }),
}));
