// TypeScript type definitions

export interface EncryptedData {
  iv: string;
  data: string;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  uploadedAt: number;
  encrypted: EncryptedData;
}

export interface AuthData {
  id: 'master';
  masterHash: string;
  salt: string;
  username: string;
  securityQuestion1: string;
  securityAnswer1Hash: string;
  securityQuestion2: string;
  securityAnswer2Hash: string;
  createdAt: number;
  updatedAt: number;
}

export interface BankRecord {
  id?: string;
  title: string;
  accountNo: string; // encrypted
  bankName: string;
  ifsc: string;
  cifNo: string; // encrypted
  username: string; // encrypted
  profilePrivy: string; // encrypted
  mPin: string; // encrypted
  tPin: string; // encrypted
  notes: string; // encrypted
  privy: string; // encrypted
  documents?: DocumentAttachment[];
  createdAt: number;
  updatedAt: number;
}

export interface CardRecord {
  id?: string;
  bankName: string;
  cardType: string;
  cardNumber: string; // encrypted
  cvv: string; // encrypted
  validTill: string;
  customerId: string; // encrypted
  pin: string; // encrypted
  notes: string; // encrypted
  documents?: DocumentAttachment[];
  createdAt: number;
  updatedAt: number;
}

export interface PolicyRecord {
  id?: string;
  name: string;
  amount: string;
  company: string;
  nextPremiumDate: string;
  premiumValue: string;
  maturityValue: string;
  notes: string; // encrypted
  documents?: DocumentAttachment[];
  createdAt: number;
  updatedAt: number;
}

export interface AadharRecord {
  id?: string;
  aadharNumber: string; // encrypted
  name: string;
  dateOfBirth: string;
  address: string;
  enrollmentNumber: string; // encrypted
  vid: string; // encrypted
  notes: string; // encrypted
  documents?: DocumentAttachment[];
  createdAt: number;
  updatedAt: number;
}

export interface PanRecord {
  id?: string;
  panNumber: string; // encrypted
  name: string;
  dateOfBirth: string;
  fatherName: string;
  notes: string; // encrypted
  documents?: DocumentAttachment[];
  createdAt: number;
  updatedAt: number;
}

export interface LicenseRecord {
  id?: string;
  licenseNumber: string; // encrypted
  name: string;
  dateOfIssue: string;
  validTill: string;
  vehicleClasses: string;
  stateOfIssue: string;
  notes: string; // encrypted
  documents?: DocumentAttachment[];
  createdAt: number;
  updatedAt: number;
}

export interface VoterIdRecord {
  id?: string;
  voterIdNumber: string; // encrypted
  name: string;
  dateOfBirth: string;
  constituency: string;
  state: string;
  notes: string; // encrypted
  documents?: DocumentAttachment[];
  createdAt: number;
  updatedAt: number;
}

export interface MiscRecord {
  id?: string;
  title: string;
  type: string;
  content: string; // encrypted
  url: string;
  username: string; // encrypted
  password: string; // encrypted
  notes: string; // encrypted
  documents?: DocumentAttachment[];
  createdAt: number;
  updatedAt: number;
}

export type CategoryType =
  | 'banks'
  | 'cards'
  | 'policies'
  | 'aadhar'
  | 'pan'
  | 'license'
  | 'voterid'
  | 'misc';

export interface CategoryInfo {
  id: CategoryType;
  name: string;
  icon: string;
  color: string;
  route: string;
}

export interface SetupData {
  username: string;
  password: string;
  securityQuestion1: string;
  securityAnswer1: string;
  securityQuestion2: string;
  securityAnswer2: string;
}

export interface BackupData {
  version: string;
  timestamp: number;
  auth: AuthData;
  banks: BankRecord[];
  cards: CardRecord[];
  policies: PolicyRecord[];
  aadhar: AadharRecord[];
  pan: PanRecord[];
  license: LicenseRecord[];
  voterid: VoterIdRecord[];
  misc: MiscRecord[];
}
