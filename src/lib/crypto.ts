// Web Crypto API utilities for encryption/decryption

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

export interface EncryptedData {
  ciphertext: number[];
  iv: number[];
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Convert Uint8Array to hex string
 */
export function bufferToHex(buffer: Uint8Array | ArrayBuffer): string {
  const uint8Array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(uint8Array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generate salt as hex string (for easier storage)
 */
export function generateSaltHex(): string {
  return bufferToHex(generateSalt());
}

/**
 * Derive an encryption key from a password using PBKDF2
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Create a new Uint8Array to avoid ArrayBufferLike type issues
  const saltBuffer = new Uint8Array(salt);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Hash a password with salt for verification (not for encryption)
 */
export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bufferToHex(hashBuffer);
}

/**
 * Encrypt data using AES-GCM
 */
export async function encrypt(
  data: string,
  key: CryptoKey
): Promise<EncryptedData> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    },
    key,
    enc.encode(data)
  );

  return {
    ciphertext: Array.from(new Uint8Array(ciphertext)),
    iv: Array.from(iv),
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decrypt(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<string> {
  const dec = new TextDecoder();

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(encryptedData.iv),
      tagLength: 128,
    },
    key,
    new Uint8Array(encryptedData.ciphertext)
  );

  return dec.decode(plaintext);
}

/**
 * Encrypt a field value (converts EncryptedData to JSON string for storage)
 */
export async function encryptField(
  value: string,
  key: CryptoKey
): Promise<string> {
  if (!value) return '';
  const encrypted = await encrypt(value, key);
  return JSON.stringify(encrypted);
}

/**
 * Decrypt a field value (parses JSON string back to EncryptedData)
 */
export async function decryptField(
  encryptedValue: string,
  key: CryptoKey
): Promise<string> {
  if (!encryptedValue) return '';
  try {
    const encrypted: EncryptedData = JSON.parse(encryptedValue);
    return await decrypt(encrypted, key);
  } catch (error) {
    console.error('Decryption error:', error);
    return '[Decryption Error]';
  }
}

/**
 * Encrypt multiple fields in a record
 */
export async function encryptRecord<T extends Record<string, unknown>>(
  record: T,
  encryptedFields: (keyof T)[],
  key: CryptoKey
): Promise<T> {
  const result = { ...record };

  for (const field of encryptedFields) {
    const value = record[field];
    if (typeof value === 'string') {
      result[field] = (await encryptField(value, key)) as T[keyof T];
    }
  }

  return result;
}

/**
 * Decrypt multiple fields in a record
 */
export async function decryptRecord<T extends Record<string, unknown>>(
  record: T,
  encryptedFields: (keyof T)[],
  key: CryptoKey
): Promise<T> {
  const result = { ...record };

  for (const field of encryptedFields) {
    const value = record[field];
    if (typeof value === 'string') {
      result[field] = (await decryptField(value, key)) as T[keyof T];
    }
  }

  return result;
}

/**
 * Encrypt a file (returns base64 encoded encrypted data)
 */
export async function encryptFile(
  file: File,
  key: CryptoKey
): Promise<{ iv: string; data: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  
  // Encrypt the file data
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    },
    key,
    arrayBuffer
  );

  // Convert to base64 for storage
  return {
    iv: bufferToHex(iv),
    data: bufferToBase64(new Uint8Array(ciphertext)),
  };
}

/**
 * Decrypt a file (returns Blob)
 */
export async function decryptFile(
  encrypted: { iv: string; data: string },
  key: CryptoKey,
  mimeType: string
): Promise<Blob> {
  // Convert base64 back to Uint8Array
  const ciphertext = base64ToBuffer(encrypted.data);
  const ivArray = hexToBuffer(encrypted.iv);

  // Create new Uint8Arrays to avoid type issues
  const ivBuffer = new Uint8Array(ivArray);
  const ciphertextBuffer = new Uint8Array(ciphertext);

  // Decrypt the data
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
      tagLength: 128,
    },
    key,
    ciphertextBuffer
  );

  // Return as Blob with correct MIME type
  return new Blob([plaintext], { type: mimeType });
}

/**
 * Convert Uint8Array to base64 string
 */
function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
