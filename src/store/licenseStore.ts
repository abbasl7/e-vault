import { create } from 'zustand';
import { db } from '@/lib/db';
import { LicenseRecord } from '@/types';
import { useAuthStore } from './authStore';
import { encryptRecord, decryptRecord } from '@/lib/crypto';
import { generateId } from '@/lib/utils';

interface LicenseStore {
  licenses: LicenseRecord[];
  isLoading: boolean;
  error: string | null;
  
  fetchLicenses: () => Promise<void>;
  addLicense: (data: Omit<LicenseRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLicense: (id: string, data: Partial<Omit<LicenseRecord, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteLicense: (id: string) => Promise<void>;
  searchLicenses: (query: string) => LicenseRecord[];
  clearError: () => void;
}

export const useLicenseStore = create<LicenseStore>((set, get) => ({
  licenses: [],
  isLoading: false,
  error: null,

  fetchLicenses: async () => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const encryptedLicenses = await db.license.toArray();
      const licenses = await Promise.all(
        encryptedLicenses.map(async (license) => {
          const decrypted = await decryptRecord(
            license as any,
            ['licenseNumber', 'notes'],
            encryptionKey
          );
          return decrypted as unknown as LicenseRecord;
        })
      );
      set({ licenses, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addLicense: async (data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const now = Date.now();
      const license: LicenseRecord = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      const encrypted = await encryptRecord(
        license as any,
        ['licenseNumber', 'notes'],
        encryptionKey
      );

      await db.license.add(encrypted as any);
      
      set((state) => ({
        licenses: [...state.licenses, license],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateLicense: async (id, data) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const existingLicense = get().licenses.find((l) => l.id === id);
      if (!existingLicense) {
        throw new Error('License not found');
      }

      const updated: LicenseRecord = {
        ...existingLicense,
        ...data,
        updatedAt: Date.now(),
      };

      const encrypted = await encryptRecord(
        updated as any,
        ['licenseNumber', 'notes'],
        encryptionKey
      );

      await db.license.update(id, encrypted as any);
      
      set((state) => ({
        licenses: state.licenses.map((l) => (l.id === id ? updated : l)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteLicense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.license.delete(id);
      set((state) => ({
        licenses: state.licenses.filter((l) => l.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  searchLicenses: (query: string) => {
    const { licenses } = get();
    if (!query.trim()) return licenses;

    const lowerQuery = query.toLowerCase();
    return licenses.filter(
      (license) =>
        license.name?.toLowerCase().includes(lowerQuery) ||
        license.stateOfIssue?.toLowerCase().includes(lowerQuery) ||
        license.vehicleClasses?.toLowerCase().includes(lowerQuery)
    );
  },

  clearError: () => set({ error: null }),
}));
