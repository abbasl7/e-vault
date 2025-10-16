# SecureVault PWA - Technical Requirements

> **Document Version:** 1.0.0  
> **Last Updated:** October 15, 2025  
> **Technology:** Progressive Web App

---

## 🛠️ Technology Stack

### Core Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.0",
    "zustand": "^4.5.2",
    "dexie": "^4.0.1",
    "dexie-react-hooks": "^1.1.7",
    "framer-motion": "^11.1.7",
    "lucide-react": "^0.379.0",
    "react-hook-form": "^7.51.3",
    "zod": "^3.23.6",
    "@hookform/resolvers": "^3.3.4",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.2.11",
    "vite-plugin-pwa": "^0.19.8",
    "workbox-window": "^7.0.0",
    "typescript": "^5.4.5",
    "tailwindcss": "^3.4.3",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "@tailwindcss/forms": "^0.5.7",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5"
  }
}
```

---

## 🔐 Encryption & Security Requirements

### TR-1: Encryption Implementation

#### TR-1.1: Key Derivation (PBKDF2)
**Requirement:** Derive encryption key from user password.

```typescript
// Implementation specification
interface KeyDerivationConfig {
  algorithm: 'PBKDF2';
  hash: 'SHA-256';
  iterations: 100000; // OWASP recommended minimum
  keyLength: 256; // bits
  saltLength: 16; // bytes
}

async function deriveKey(
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

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}
```

**Acceptance Criteria:**
- [ ] Uses native Web Crypto API
- [ ] 100,000 iterations minimum
- [ ] Salt is cryptographically random
- [ ] Salt is unique per user
- [ ] Salt is stored (not the key)

#### TR-1.2: Encryption (AES-GCM)
**Requirement:** Encrypt sensitive data using AES-GCM-256.

```typescript
interface EncryptionConfig {
  algorithm: 'AES-GCM';
  keyLength: 256; // bits
  ivLength: 12; // bytes (96 bits recommended for GCM)
  tagLength: 128; // bits
}

async function encrypt(
  data: string,
  key: CryptoKey
): Promise<EncryptedData> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
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
```

**Acceptance Criteria:**
- [ ] Uses AES-GCM (authenticated encryption)
- [ ] Unique IV per encryption operation
- [ ] IV is stored alongside ciphertext
- [ ] Tag length is 128 bits
- [ ] No IV reuse

#### TR-1.3: Password Hashing
**Requirement:** Hash master password for verification.

```typescript
async function hashPassword(
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
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bufferToHex(hashBuffer);
}
```

**Acceptance Criteria:**
- [ ] Never stores password in plain text
- [ ] Uses same PBKDF2 parameters as key derivation
- [ ] Hash is compared in constant time (if possible)
- [ ] Salt is random and unique

---

## 🗄️ Database Requirements (IndexedDB)

### TR-2: Database Implementation (Dexie.js)

#### TR-2.1: Database Schema

```typescript
import Dexie, { Table } from 'dexie';

interface AuthData {
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

interface BankRecord {
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
  createdAt: number;
  updatedAt: number;
}

// Similar interfaces for other categories...

class SecureVaultDB extends Dexie {
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
}

export const db = new SecureVaultDB();
```

**Acceptance Criteria:**
- [ ] Uses Dexie.js wrapper for IndexedDB
- [ ] All tables defined with proper indexes
- [ ] Versioning strategy for migrations
- [ ] TypeScript interfaces for type safety
- [ ] ID generation (UUID v4)

#### TR-2.2: Data Encryption Layer

```typescript
interface EncryptionService {
  encryptField(value: string, key: CryptoKey): Promise<string>;
  decryptField(encrypted: string, key: CryptoKey): Promise<string>;
  encryptRecord<T>(record: T, fields: (keyof T)[], key: CryptoKey): Promise<T>;
  decryptRecord<T>(record: T, fields: (keyof T)[], key: CryptoKey): Promise<T>;
}

// Wrapper for transparent encryption
class EncryptedRepository<T> {
  constructor(
    private table: Table<T, string>,
    private encryptedFields: (keyof T)[],
    private getKey: () => CryptoKey | null
  ) {}

  async add(record: Omit<T, 'id'>): Promise<string> {
    const key = this.getKey();
    if (!key) throw new Error('Not authenticated');
    
    const encrypted = await encryptRecord(record, this.encryptedFields, key);
    return this.table.add({ ...encrypted, id: crypto.randomUUID() } as T);
  }

  async get(id: string): Promise<T | undefined> {
    const record = await this.table.get(id);
    if (!record) return undefined;
    
    const key = this.getKey();
    if (!key) throw new Error('Not authenticated');
    
    return decryptRecord(record, this.encryptedFields, key);
  }

  // Similar for update, delete, getAll...
}
```

**Acceptance Criteria:**
- [ ] Transparent encryption/decryption
- [ ] Only encrypted data stored in IndexedDB
- [ ] Decryption happens at read time
- [ ] Errors handled gracefully
- [ ] No plain text in database

---

## 🎨 UI/UX Requirements

### TR-3: Design System

#### TR-3.1: Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Category colors
        banks: '#1976D2',
        cards: '#FB8C00',
        policies: '#388E3C',
        aadhar: '#00897B',
        pan: '#D32F2F',
        license: '#7B1FA2',
        voterid: '#455A64',
        misc: '#546E7A',
      },
      fontFamily: {
        sans: ['Geist Sans', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'glow': 'glow 1s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
```

**Acceptance Criteria:**
- [ ] Dark mode support
- [ ] Custom color palette
- [ ] Animation utilities defined
- [ ] Responsive breakpoints
- [ ] Accessible color contrast

#### TR-3.2: Animation Requirements (Framer Motion)

```typescript
// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  hover: { 
    scale: 1.05,
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.95 },
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};
```

**Performance Requirements:**
- [ ] All animations run at 60 FPS
- [ ] Use GPU-accelerated properties (transform, opacity)
- [ ] Reduce motion for accessibility
- [ ] No layout thrashing
- [ ] Smooth page transitions

#### TR-3.3: Component Requirements (shadcn/ui)

**Required Components:**
- Button (primary, secondary, ghost, destructive)
- Input (text, password, number)
- Card (with header, content, footer)
- Dialog (modal)
- Form (with validation)
- Select (dropdown)
- Checkbox
- Label
- Separator
- Toast (notifications)
- Avatar
- Badge
- Tooltip
- Skeleton (loading states)

**Acceptance Criteria:**
- [ ] All components accessible (ARIA)
- [ ] Keyboard navigation support
- [ ] Focus states visible
- [ ] Dark mode compatible
- [ ] Consistent spacing/sizing

---

## 🔌 State Management Requirements

### TR-4: Zustand Stores

#### TR-4.1: Auth Store

```typescript
interface AuthStore {
  isAuthenticated: boolean;
  username: string | null;
  encryptionKey: CryptoKey | null;
  lastActivity: number;
  
  // Actions
  login: (password: string) => Promise<void>;
  logout: () => void;
  setupAccount: (data: SetupData) => Promise<void>;
  resetPassword: (answers: string[], newPassword: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateActivity: () => void;
  checkInactivity: () => boolean;
}

const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  username: null,
  encryptionKey: null,
  lastActivity: Date.now(),
  
  login: async (password) => {
    // Implementation
  },
  
  logout: () => {
    set({ 
      isAuthenticated: false, 
      username: null, 
      encryptionKey: null 
    });
  },
  
  // ... other actions
}));
```

#### TR-4.2: Category Stores (Generic Pattern)

```typescript
interface CategoryStore<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  
  fetchAll: () => Promise<void>;
  getById: (id: string) => T | undefined;
  add: (item: Omit<T, 'id'>) => Promise<string>;
  update: (id: string, item: Partial<T>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  search: (query: string) => T[];
  clear: () => void;
}

function createCategoryStore<T>(
  tableName: string,
  encryptedFields: (keyof T)[]
) {
  return create<CategoryStore<T>>((set, get) => ({
    items: [],
    loading: false,
    error: null,
    
    fetchAll: async () => {
      set({ loading: true, error: null });
      try {
        const key = useAuthStore.getState().encryptionKey;
        if (!key) throw new Error('Not authenticated');
        
        const repo = new EncryptedRepository(
          db[tableName],
          encryptedFields,
          () => key
        );
        
        const items = await repo.getAll();
        set({ items, loading: false });
      } catch (error) {
        set({ error: error.message, loading: false });
      }
    },
    
    // ... other actions
  }));
}
```

**Acceptance Criteria:**
- [ ] Single source of truth
- [ ] Actions are async-safe
- [ ] Optimistic updates for UX
- [ ] Error handling built-in
- [ ] TypeScript types enforced

---

## 🌐 PWA Requirements

### TR-5: Service Worker Configuration

#### TR-5.1: Vite PWA Plugin Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'SecureVault',
        short_name: 'Vault',
        description: 'Secure offline personal document manager',
        theme_color: '#3b82f6',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
```

**Acceptance Criteria:**
- [ ] Precaches all app assets
- [ ] Updates automatically
- [ ] Works offline completely
- [ ] Manifest includes all required fields
- [ ] Icons for all sizes (72-512px)

#### TR-5.2: Install Prompt

```typescript
interface InstallPromptStore {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  showPrompt: () => void;
  dismissPrompt: () => void;
}

const useInstallStore = create<InstallPromptStore>((set, get) => ({
  deferredPrompt: null,
  isInstalled: false,
  
  showPrompt: async () => {
    const prompt = get().deferredPrompt;
    if (!prompt) return;
    
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    
    if (outcome === 'accepted') {
      set({ isInstalled: true, deferredPrompt: null });
    }
  },
  
  dismissPrompt: () => {
    set({ deferredPrompt: null });
  },
}));

// Event listener
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  useInstallStore.setState({ deferredPrompt: e });
});
```

**Acceptance Criteria:**
- [ ] Custom install UI (not browser default)
- [ ] Respects user dismissal
- [ ] Shows only when installable
- [ ] Hides after installation

---

## 🧪 Testing Requirements

### TR-6: Testing Strategy

#### TR-6.1: Unit Tests (Vitest)

```typescript
// Example test structure
describe('Encryption Service', () => {
  it('should derive key from password', async () => {
    const password = 'SecurePassword123!';
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt);
    
    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
  });
  
  it('should encrypt and decrypt data correctly', async () => {
    const data = 'Sensitive information';
    const key = await generateTestKey();
    
    const encrypted = await encrypt(data, key);
    const decrypted = await decrypt(encrypted, key);
    
    expect(decrypted).toBe(data);
  });
  
  it('should fail to decrypt with wrong key', async () => {
    const data = 'Sensitive information';
    const key1 = await generateTestKey();
    const key2 = await generateTestKey();
    
    const encrypted = await encrypt(data, key1);
    
    await expect(decrypt(encrypted, key2)).rejects.toThrow();
  });
});
```

**Test Coverage Requirements:**
- [ ] Encryption/decryption functions: 100%
- [ ] Database operations: >90%
- [ ] Store actions: >85%
- [ ] Utility functions: >90%
- [ ] Overall coverage: >80%

#### TR-6.2: Component Tests (React Testing Library)

```typescript
describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
  
  it('should show error for invalid password', async () => {
    render(<LoginForm />);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });
    
    await userEvent.type(passwordInput, 'wrong');
    await userEvent.click(loginButton);
    
    expect(await screen.findByText(/invalid password/i)).toBeInTheDocument();
  });
});
```

**Component Test Requirements:**
- [ ] All page components tested
- [ ] Form validation tested
- [ ] User interactions tested
- [ ] Accessibility tested
- [ ] Error states tested

---

## 📊 Performance Requirements

### TR-7: Performance Metrics

#### TR-7.1: Lighthouse Scores

**Targets:**
- Performance: ≥90
- Accessibility: ≥95
- Best Practices: ≥95
- SEO: ≥90
- PWA: ≥95

#### TR-7.2: Core Web Vitals

- **LCP (Largest Contentful Paint):** <2.5s
- **FID (First Input Delay):** <100ms
- **CLS (Cumulative Layout Shift):** <0.1
- **FCP (First Contentful Paint):** <1.8s
- **TTI (Time to Interactive):** <3.5s

#### TR-7.3: Encryption Performance

- **Key derivation:** <1s (PBKDF2 with 100k iterations)
- **Single record encryption:** <50ms
- **Single record decryption:** <50ms
- **Bulk encryption (100 records):** <3s
- **Database query:** <100ms

#### TR-7.4: Bundle Size

- **Initial bundle:** <500KB (gzipped)
- **Lazy-loaded chunks:** <200KB each
- **Total app size:** <2MB
- **Service Worker:** <50KB

**Optimization Techniques:**
- [ ] Code splitting by route
- [ ] Tree shaking
- [ ] Minification
- [ ] Gzip/Brotli compression
- [ ] Image optimization
- [ ] Font subsetting

---

## 🔒 Security Requirements

### TR-8: Security Checklist

#### TR-8.1: Data Security

- [ ] All sensitive data encrypted at rest
- [ ] AES-GCM-256 encryption
- [ ] Unique IV per encryption
- [ ] PBKDF2 key derivation (100k iterations)
- [ ] No encryption keys stored
- [ ] Secure random number generation (crypto.getRandomValues)

#### TR-8.2: Authentication Security

- [ ] Master password never stored in plain text
- [ ] Password hashed with salt
- [ ] Security questions hashed
- [ ] Auto-logout after inactivity
- [ ] Session not persisted
- [ ] Failed login attempts limited

#### TR-8.3: Code Security

- [ ] No console.log in production
- [ ] No hardcoded secrets
- [ ] Input validation (Zod schemas)
- [ ] XSS protection (React default)
- [ ] CSP headers configured
- [ ] HTTPS-only deployment

#### TR-8.4: Backup Security

- [ ] Backups encrypted with user password
- [ ] Backup includes salt and hash
- [ ] Backup file extension: .vaultbackup
- [ ] No plain text backups
- [ ] Restore validates encryption

---

## 📱 Responsive Design Requirements

### TR-9: Breakpoints

```typescript
const breakpoints = {
  sm: '640px',  // Mobile landscape
  md: '768px',  // Tablet portrait
  lg: '1024px', // Tablet landscape
  xl: '1280px', // Desktop
  '2xl': '1536px', // Large desktop
};
```

**Layout Requirements:**

#### Mobile (<640px)
- [ ] Single column layout
- [ ] Bottom navigation
- [ ] Full-width cards
- [ ] 2-column grid for categories
- [ ] Touch-friendly (44px targets)
- [ ] Swipe gestures

#### Tablet (640px-1024px)
- [ ] 2-column layouts
- [ ] Sidebar navigation (optional)
- [ ] 3-column grid for categories
- [ ] Larger touch targets
- [ ] Split view for details

#### Desktop (>1024px)
- [ ] 3-column layouts
- [ ] Persistent sidebar
- [ ] 4-column grid for categories
- [ ] Hover states
- [ ] Keyboard shortcuts
- [ ] Mouse interactions

---

## ♿ Accessibility Requirements

### TR-10: WCAG 2.1 AA Compliance

#### TR-10.1: Keyboard Navigation

- [ ] All interactive elements keyboard accessible
- [ ] Logical tab order
- [ ] Focus indicators visible (3px outline)
- [ ] Skip to main content link
- [ ] Escape closes modals
- [ ] Arrow keys for navigation (lists)

#### TR-10.2: Screen Reader Support

- [ ] ARIA labels on all interactive elements
- [ ] ARIA live regions for dynamic content
- [ ] Alt text for images/icons
- [ ] Semantic HTML (headings, nav, main, etc.)
- [ ] Form labels associated with inputs

#### TR-10.3: Visual Accessibility

- [ ] Color contrast ratio ≥4.5:1 (normal text)
- [ ] Color contrast ratio ≥3:1 (large text)
- [ ] No color-only indicators
- [ ] Focus indicators ≥3px
- [ ] Text resizable up to 200%
- [ ] Reduced motion support

---

## 🚀 Deployment Requirements

### TR-11: Build & Deployment

#### TR-11.1: Build Configuration

```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

**Build Outputs:**
- [ ] Production bundle in `dist/`
- [ ] Source maps (separate files)
- [ ] Asset hashing for cache busting
- [ ] Service Worker generated
- [ ] Manifest.json included

#### TR-11.2: Deployment Checklist

- [ ] HTTPS enforced
- [ ] Gzip/Brotli compression enabled
- [ ] Cache headers configured
- [ ] CSP headers set
- [ ] No CORS issues (offline app)
- [ ] Service Worker registered
- [ ] Manifest linked in HTML

#### TR-11.3: Environment Configuration

```env
# .env.production
VITE_APP_NAME=SecureVault
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEV_TOOLS=false
VITE_ENABLE_CONSOLE_LOG=false
```

---

## 📈 Monitoring & Logging

### TR-12: Error Tracking

```typescript
// Error boundary for React
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error:', error, errorInfo);
    }
    
    // Store error locally for debugging
    db.errorLogs.add({
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: Date.now(),
    });
  }
}
```

**Logging Requirements:**
- [ ] Console logs only in development
- [ ] Critical errors logged to IndexedDB
- [ ] User-friendly error messages
- [ ] No sensitive data in logs
- [ ] Log rotation (max 100 entries)

---

## 🔄 Version Control & CI/CD

### TR-13: Git Workflow

**Branch Strategy:**
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

**Commit Convention:**
```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Examples:
  feat(auth): add biometric authentication
  fix(encryption): resolve IV reuse bug
  docs(readme): update installation instructions
```

---

## ✅ Definition of Done

### Feature Completion Checklist

- [ ] Code written and peer-reviewed
- [ ] Unit tests written and passing
- [ ] Component tests written and passing
- [ ] Manual testing completed
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Accessibility tested (keyboard + screen reader)
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] Dark mode works correctly
- [ ] Performance tested (Lighthouse score)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated

---

**Technical Requirements Version:** 1.0.0  
**Approval Status:** Approved for Implementation  
**Ready for Development:** ✅
