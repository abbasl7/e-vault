import Dexie, { Table } from 'dexie';
import type {
  AuthData,
  BankRecord,
  CardRecord,
  PolicyRecord,
  AadharRecord,
  PanRecord,
  LicenseRecord,
  VoterIdRecord,
  MiscRecord,
} from '@/types';

export class SecureVaultDB extends Dexie {
  auth!: Table<AuthData, string>;
  banks!: Table<BankRecord, string>;
  cards!: Table<CardRecord, string>;
  policies!: Table<PolicyRecord, string>;
  aadhar!: Table<AadharRecord, string>;
  pan!: Table<PanRecord, string>;
  license!: Table<LicenseRecord, string>;
  voterid!: Table<VoterIdRecord, string>;
  misc!: Table<MiscRecord, string>;

  constructor() {
    super('SecureVaultDB');
    
    this.version(1).stores({
      auth: 'id',
      banks: 'id, bankName, createdAt',
      cards: 'id, bankName, cardType, createdAt',
      policies: 'id, company, createdAt',
      aadhar: 'id, createdAt',
      pan: 'id, createdAt',
      license: 'id, createdAt',
      voterid: 'id, createdAt',
      misc: 'id, type, createdAt',
    });
  }

  /**
   * Clear all data from all tables (for logout/reset)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.banks.clear(),
      this.cards.clear(),
      this.policies.clear(),
      this.aadhar.clear(),
      this.pan.clear(),
      this.license.clear(),
      this.voterid.clear(),
      this.misc.clear(),
    ]);
  }
}

export const db = new SecureVaultDB();

// Helper function to get encrypted field names for each category
export const getEncryptedFields = (category: string): string[] => {
  const fieldMap: Record<string, string[]> = {
    banks: ['accountNo', 'cifNo', 'username', 'profilePrivy', 'mPin', 'tPin', 'notes', 'privy'],
    cards: ['cardNumber', 'cvv', 'customerId', 'pin', 'notes'],
    policies: ['notes'],
    aadhar: ['aadharNumber', 'enrollmentNumber', 'vid', 'notes'],
    pan: ['panNumber', 'notes'],
    license: ['licenseNumber', 'notes'],
    voterid: ['voterIdNumber', 'notes'],
    misc: ['content', 'username', 'password', 'notes'],
  };
  
  return fieldMap[category] || [];
};
