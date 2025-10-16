# SecureVault PWA - System Architecture

> **Version:** 1.0.0  
> **Last Updated:** October 15, 2025  
> **Technology:** Progressive Web App (React 18 + TypeScript)

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Environment                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              Service Worker Layer                       │ │
│ │  • Offline caching (Workbox)                           │ │
│ │  • Asset precaching                                    │ │
│ │  • Runtime caching strategies                          │ │
│ │  • Background sync (future)                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                            ▼                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              React Application Layer                    │ │
│ │  ┌───────────────────────────────────────────────────┐ │ │
│ │  │        Authentication & Security Module          │ │ │
│ │  │  • Master password verification (PBKDF2)         │ │ │
│ │  │  • Security questions for recovery               │ │ │
│ │  │  • Session management (auto-logout)              │ │ │
│ │  │  • Encryption key derivation                     │ │ │
│ │  └───────────────────────────────────────────────────┘ │ │
│ │  ┌───────────────────────────────────────────────────┐ │ │
│ │  │        State Management (Zustand)                │ │ │
│ │  │  • Global app state                              │ │ │
│ │  │  • Authentication state                          │ │ │
│ │  │  • Category data stores (8 modules)              │ │ │
│ │  │  • UI state (theme, modals, etc.)                │ │ │
│ │  └───────────────────────────────────────────────────┘ │ │
│ │  ┌───────────────────────────────────────────────────┐ │ │
│ │  │        UI Components Layer                       │ │ │
│ │  │  • shadcn/ui base components                     │ │ │
│ │  │  • Custom animated components                    │ │ │
│ │  │  • Page layouts & navigation                     │ │ │
│ │  │  • Form components with validation               │ │ │
│ │  └───────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                            ▼                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              Encryption Layer                           │ │
│ │  • Web Crypto API (AES-GCM-256)                        │ │
│ │  • PBKDF2 key derivation (100k iterations)             │ │
│ │  • Transparent encryption/decryption                   │ │
│ │  • No keys stored in plain text                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                            ▼                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              Storage Layer                              │ │
│ │  ┌─────────────────────┐  ┌──────────────────────────┐ │ │
│ │  │   IndexedDB         │  │  LocalStorage (minimal)  │ │ │
│ │  │  (Dexie.js wrapper) │  │  • Theme preference      │ │ │
│ │  │                     │  │  • Last login time       │ │ │
│ │  │  Object Stores:     │  │  • UI preferences        │ │ │
│ │  │  • auth_data        │  └──────────────────────────┘ │ │
│ │  │  • banks            │                               │ │
│ │  │  • cards            │                               │ │
│ │  │  • policies         │                               │ │
│ │  │  • aadhar           │                               │ │
│ │  │  • pan              │                               │ │
│ │  │  • license          │                               │ │
│ │  │  • voterid          │                               │ │
│ │  │  • misc             │                               │ │
│ │  └─────────────────────┘                               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Technology Stack

### Core Framework
```typescript
{
  "framework": "React 18.3.1",
  "language": "TypeScript 5.4.5",
  "buildTool": "Vite 5.2.11",
  "packageManager": "npm"
}
```

### UI & Styling
```typescript
{
  "styling": "Tailwind CSS 3.4.3",
  "components": "shadcn/ui (Radix UI primitives)",
  "animations": "Framer Motion 11.1.7",
  "icons": "Lucide React 0.379.0",
  "fonts": "Geist Sans & Geist Mono"
}
```

### State & Data
```typescript
{
  "stateManagement": "Zustand 4.5.2",
  "database": "Dexie.js 4.0.1 (IndexedDB wrapper)",
  "forms": "React Hook Form 7.51.3",
  "validation": "Zod 3.23.6"
}
```

### Security & Encryption
```typescript
{
  "encryption": "Web Crypto API (native)",
  "hashing": "PBKDF2 with 100,000 iterations",
  "algorithm": "AES-GCM-256",
  "keyStorage": "Never stored, derived on-demand"
}
```

### PWA Features
```typescript
{
  "serviceWorker": "Workbox 7.0.0",
  "pwaPlugin": "vite-plugin-pwa 0.19.8",
  "manifest": "PWA manifest with offline support",
  "installPrompt": "Custom install UI"
}
```

---

## 🔐 Security Architecture

### Encryption Flow

```
User Password Input
       ↓
PBKDF2 Key Derivation (100k iterations + salt)
       ↓
Derived Key (256-bit)
       ↓
┌──────────────────────────────────┐
│  Encryption (Write to DB)        │
│  Data → AES-GCM-256 → IndexedDB  │
└──────────────────────────────────┘
       ↓
┌──────────────────────────────────┐
│  Decryption (Read from DB)       │
│  IndexedDB → AES-GCM-256 → Data  │
└──────────────────────────────────┘
```

### Key Security Principles

1. **Zero Knowledge Architecture**
   - Master password never stored
   - Only salted hash stored for verification
   - Encryption key derived on each session

2. **Encryption at Rest**
   - All sensitive data encrypted in IndexedDB
   - Each record individually encrypted
   - Unique IV per encryption operation

3. **Session Management**
   - Auto-logout after inactivity (5 minutes)
   - Password required for sensitive operations
   - No session persistence across browser restarts

4. **Secure Backup**
   - Backups encrypted with user password
   - AES-GCM-256 encryption
   - Includes authentication data (hash, salt, questions)

---

## 📂 Project Structure

```
vault2/
├── public/
│   ├── icons/               # PWA icons (various sizes)
│   ├── manifest.json        # PWA manifest
│   └── robots.txt
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── layout/         # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   ├── auth/           # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SetupForm.tsx
│   │   │   └── PasswordResetForm.tsx
│   │   ├── dashboard/      # Dashboard components
│   │   │   ├── CategoryCard.tsx
│   │   │   ├── StatsWidget.tsx
│   │   │   └── QuickActions.tsx
│   │   └── categories/     # Category-specific components
│   │       ├── BankForm.tsx
│   │       ├── CardForm.tsx
│   │       ├── DataList.tsx
│   │       └── ...
│   ├── pages/              # Page components
│   │   ├── LoginPage.tsx
│   │   ├── SetupPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── BanksPage.tsx
│   │   ├── CardsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── ...
│   ├── lib/                # Utility libraries
│   │   ├── crypto.ts       # Encryption utilities
│   │   ├── db.ts           # Dexie database setup
│   │   ├── validation.ts   # Zod schemas
│   │   └── utils.ts        # Helper functions
│   ├── store/              # Zustand stores
│   │   ├── authStore.ts    # Authentication state
│   │   ├── bankStore.ts    # Banks data
│   │   ├── cardStore.ts    # Cards data
│   │   ├── uiStore.ts      # UI state (theme, etc.)
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useDatabase.ts
│   │   ├── useEncryption.ts
│   │   └── useInactivity.ts
│   ├── types/              # TypeScript types
│   │   ├── index.ts
│   │   ├── database.ts
│   │   └── auth.ts
│   ├── styles/             # Global styles
│   │   ├── globals.css
│   │   └── animations.css
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── vite-env.d.ts       # Vite type definitions
├── .env.example            # Environment variables example
├── index.html              # HTML entry point
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind config
├── vite.config.ts          # Vite config
└── README.md               # Project documentation
```

---

## 🗄️ Database Schema (IndexedDB)

### Object Stores

#### 1. `auth_data` Store
```typescript
interface AuthData {
  id: 'master'; // Single record
  masterHash: string; // PBKDF2 hash
  salt: string; // Random salt
  username: string;
  securityQuestion1: string;
  securityAnswer1: string; // Hashed
  securityQuestion2: string;
  securityAnswer2: string; // Hashed
  createdAt: number;
  updatedAt: number;
}
```

#### 2. `banks` Store
```typescript
interface BankRecord {
  id: string; // UUID
  title: string;
  accountNo: string; // Encrypted
  bankName: string;
  ifsc: string;
  cifNo: string; // Encrypted
  username: string; // Encrypted
  profilePrivy: string; // Encrypted
  mPin: string; // Encrypted
  tPin: string; // Encrypted
  notes: string; // Encrypted
  privy: string; // Encrypted
  createdAt: number;
  updatedAt: number;
}
```

#### 3. `cards` Store
```typescript
interface CardRecord {
  id: string;
  bankName: string;
  cardType: string;
  cardNumber: string; // Encrypted
  cvv: string; // Encrypted
  validTill: string;
  customerId: string; // Encrypted
  pin: string; // Encrypted
  notes: string; // Encrypted
  createdAt: number;
  updatedAt: number;
}
```

#### 4. `policies` Store
```typescript
interface PolicyRecord {
  id: string;
  name: string;
  amount: string;
  company: string;
  nextPremiumDate: string;
  premiumValue: string;
  maturityValue: string;
  notes: string; // Encrypted
  createdAt: number;
  updatedAt: number;
}
```

#### 5-8. `aadhar`, `pan`, `license`, `voterid`, `misc` Stores
Similar structure with category-specific fields.

---

## 🎨 Component Architecture

### Component Hierarchy

```
App
├── AuthProvider
│   ├── LoginPage
│   ├── SetupPage
│   └── PasswordResetPage
└── AuthenticatedApp
    ├── Layout
    │   ├── Header
    │   │   ├── Logo
    │   │   ├── UserMenu
    │   │   └── ThemeToggle
    │   ├── Navigation
    │   └── Footer
    ├── Router
    │   ├── DashboardPage
    │   │   ├── WelcomeBanner
    │   │   ├── CategoryGrid
    │   │   │   └── CategoryCard × 8
    │   │   └── QuickStats
    │   ├── CategoryPages (Banks, Cards, etc.)
    │   │   ├── DataList
    │   │   │   └── DataCard
    │   │   ├── AddButton
    │   │   └── SearchBar
    │   ├── SettingsPage
    │   │   ├── ProfileSection
    │   │   ├── SecuritySection
    │   │   ├── BackupSection
    │   │   └── ThemeSection
    │   └── BackupPage
    │       ├── BackupButton
    │       └── RestoreButton
    └── GlobalModals
        ├── ConfirmDialog
        ├── DataFormDialog
        └── PasswordPromptDialog
```

---

## 🔄 State Management (Zustand)

### Store Structure

```typescript
// authStore.ts
interface AuthStore {
  isAuthenticated: boolean;
  username: string | null;
  encryptionKey: CryptoKey | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
  setupAccount: (data: SetupData) => Promise<void>;
}

// categoryStore.ts (generic pattern)
interface CategoryStore<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  add: (item: T) => Promise<void>;
  update: (id: string, item: Partial<T>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  search: (query: string) => T[];
}

// uiStore.ts
interface UIStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  activeModal: string | null;
  toggleTheme: () => void;
  openModal: (name: string) => void;
  closeModal: () => void;
}
```

---

## 🚀 Performance Optimizations

### Code Splitting
- Route-based lazy loading
- Component lazy loading for heavy modules
- Dynamic imports for encryption libraries

### Caching Strategy
```typescript
// Service Worker caching
{
  precache: [
    'index.html',
    'main.js',
    'main.css',
    'fonts/*'
  ],
  runtimeCache: {
    images: 'CacheFirst',
    api: 'NetworkFirst',
    static: 'StaleWhileRevalidate'
  }
}
```

### Rendering Optimizations
- React.memo for expensive components
- useMemo for computed values
- useCallback for stable function references
- Virtual scrolling for long lists
- Debounced search inputs

### Bundle Optimization
- Tree shaking
- Minification
- Gzip compression
- Code splitting by route
- Dynamic imports

---

## 🌐 PWA Features

### Manifest Configuration
```json
{
  "name": "SecureVault",
  "short_name": "Vault",
  "description": "Secure offline personal document manager",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [...]
}
```

### Offline Capabilities
- Full app functionality offline
- Service Worker precaching
- IndexedDB for persistent storage
- Offline fallback page
- Update notification

### Install Experience
- Custom install prompt
- Installation instructions
- Platform-specific install flows
- Install success confirmation

---

## 🔧 Build & Deployment

### Build Process
```bash
npm run build
# Output: dist/ folder with optimized assets
```

### Deployment Targets
- Vercel (recommended)
- Netlify
- GitHub Pages
- Self-hosted (nginx/Apache)

### Environment Variables
```env
VITE_APP_NAME=SecureVault
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEV_TOOLS=false
```

---

## 🔮 Future Enhancements

### Phase 2 Features
- Biometric authentication (WebAuthn)
- Local peer-to-peer sync (WebRTC)
- Document scanning (Camera API)
- OCR for auto-fill
- Password generator
- Audit log

### Scalability Considerations
- Multiple user profiles
- Category customization
- Import from other apps
- Export to encrypted PDF
- Advanced search with filters
- Tags and labels

---

## 📊 Monitoring & Analytics

### Performance Metrics
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Total Blocking Time (TBT)

### Error Tracking
- Console error logging
- IndexedDB operation failures
- Encryption/decryption errors
- Service Worker errors

---

## 🔒 Security Considerations

### Threat Model
- ✅ Protection against: Unauthorized access, data theft, offline attacks
- ✅ Security questions for account recovery
- ✅ Auto-logout on inactivity
- ✅ No data transmission (offline-only)

### Best Practices
- No console.log in production
- Secure random number generation
- Proper key derivation
- Memory clearing after use
- HTTPS-only deployment

---

**Architecture Version:** 1.0.0  
**Status:** Ready for Implementation  
**Next Step:** Begin PWA development following this architecture
