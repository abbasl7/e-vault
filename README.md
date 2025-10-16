# 🔐 Secure Vault PWA

A modern, secure, offline-first Progressive Web App for managing sensitive information like bank accounts, cards, documents, and more. All data is encrypted client-side with AES-256-GCM and stored locally in IndexedDB.

![PWA](https://img.shields.io/badge/PWA-Ready-success)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-red)

## ✨ Features

### 🔒 Security First
- **Zero-knowledge encryption** - All encryption happens client-side
- **AES-256-GCM** encryption for all sensitive data
- **PBKDF2** key derivation with 100,000 iterations
- **Master password** with security questions for recovery
- **Auto-logout** after 5 minutes of inactivity
- **Encrypted backups** with separate backup password
- **Encrypted file attachments** - Upload documents with full encryption

### 📱 Categories Supported
1. **Bank Accounts** (11 fields)
2. **Credit/Debit Cards** (8 fields)
3. **Insurance Policies** (7 fields)
4. **Aadhaar Cards** (8 fields)
5. **PAN Cards** (5 fields)
6. **Driving Licenses** (7 fields)
7. **Voter IDs** (6 fields)
8. **Miscellaneous Documents** (7 fields with URL, username, password)

### 🎨 Modern UI/UX
- **Glass morphism** design with smooth animations
- **Dark mode** optimized
- **Responsive** design (mobile, tablet, desktop)
- **Framer Motion** animations
- **Touch-friendly** interface
- **Accessible** with ARIA labels

### 💾 Storage & Sync
- **IndexedDB** for offline storage (~50MB capacity)
- **Backup & Restore** with encrypted export/import
- **Document attachments** up to 10 files per record (10MB each)
- **Search** across all categories
- **No backend** required - completely client-side

### 🌐 PWA Features
- **Installable** on all platforms (mobile, desktop)
- **Offline-first** - works without internet
- **Service Worker** for caching
- **App manifest** with custom icons
- **Fast loading** with code splitting
- **HTTPS** ready for production

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd vault2

# Install dependencies
npm install

# Install missing dependency (if needed)
npm install @radix-ui/react-switch

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### First Run
1. Click "Create Account"
2. Set a strong master password
3. Answer two security questions
4. Start adding records!

## 📦 Build & Deploy

### Production Build
```bash
npm run build
```

Output will be in `dist/` folder.

### Deploy to Cloudflare Pages

#### Option 1: GitHub + Cloudflare Dashboard (Recommended)

1. **Push to GitHub**:
```bash
git add .
git commit -m "Deploy Secure Vault PWA"
git push origin main
```

2. **Create Cloudflare Pages Project**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Pages** → **Create a project**
   - Connect to Git → Select your repository
   - Configure build settings:
     - **Framework preset**: Vite
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
     - **Node version**: `18` (set in Environment Variables: `NODE_VERSION = 18`)
   - Click **Save and Deploy**

3. **Live in 3 minutes!** 🎉
   - Your app: `https://your-project.pages.dev`
   - Add custom domain in Cloudflare Pages settings

#### Option 2: Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build
npm run build

# Deploy
wrangler pages deploy dist --project-name=secure-vault
```

See [DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md) for detailed deployment guide.

## 📚 Documentation

- **[COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md)** - Full feature list and progress
- **[DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md)** - Step-by-step deployment guide
- **[COPY_PASTE_GUIDE.md](./COPY_PASTE_GUIDE.md)** - Quick guide to finish remaining work
- **[FIELD_COMPARISON.md](./FIELD_COMPARISON.md)** - Android vs PWA field analysis
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Platform comparison (Cloudflare, Vercel, etc.)

## 🛠️ Tech Stack

### Core
- **React 18.3** - UI library
- **TypeScript 5.5** - Type safety
- **Vite 5.4** - Build tool & dev server

### State Management
- **Zustand** - Lightweight state management
- **Dexie.js** - IndexedDB wrapper

### UI & Styling
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations
- **Lucide React** - Icons

### Security
- **Web Crypto API** - Native browser encryption
- **PBKDF2** - Password-based key derivation
- **AES-256-GCM** - Authenticated encryption

### PWA
- **Vite PWA Plugin** - Service worker & manifest
- **Workbox** - PWA strategies

## 📁 Project Structure

```
vault2/
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn/ui components
│   │   └── FileUploader.tsx # Document upload component
│   ├── lib/
│   │   ├── crypto.ts        # Encryption functions
│   │   ├── db.ts            # IndexedDB setup (Dexie)
│   │   └── utils.ts         # Helper functions
│   ├── pages/
│   │   ├── BanksPage.tsx    # Bank accounts (with document upload ✅)
│   │   ├── CardsPage.tsx    # Credit/debit cards
│   │   ├── PoliciesPage.tsx # Insurance policies
│   │   ├── AadharPage.tsx   # Aadhaar cards
│   │   ├── PanPage.tsx      # PAN cards
│   │   ├── LicensePage.tsx  # Driving licenses
│   │   ├── VoterIdPage.tsx  # Voter IDs
│   │   ├── MiscPage.tsx     # Miscellaneous
│   │   ├── DashboardPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SetupPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── BackupRestorePage.tsx
│   │   └── PasswordResetPage.tsx
│   ├── store/
│   │   ├── authStore.ts     # Authentication
│   │   ├── bankStore.ts     # Banks CRUD
│   │   ├── cardStore.ts     # Cards CRUD
│   │   ├── policyStore.ts   # Policies CRUD
│   │   ├── aadharStore.ts   # Aadhaar CRUD
│   │   ├── panStore.ts      # PAN CRUD
│   │   ├── licenseStore.ts  # License CRUD
│   │   ├── voterIdStore.ts  # Voter ID CRUD
│   │   └── miscStore.ts     # Misc CRUD
│   ├── styles/
│   │   └── globals.css      # Global styles
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   ├── App.tsx              # Main app with routes
│   └── main.tsx             # Entry point
├── public/
│   ├── manifest.json        # PWA manifest
│   └── icons/               # App icons
├── COMPLETION_SUMMARY.md    # Feature completion status
├── DEPLOYMENT_STEPS.md      # Deployment guide
├── COPY_PASTE_GUIDE.md      # Quick setup guide
└── README.md                # This file
```

## 🔐 Security & Privacy

### What We Encrypt
- All sensitive text fields (account numbers, passwords, PINs, etc.)
- All uploaded document files
- Security question answers
- Backup exports

### What We DON'T Encrypt
- Titles and labels (for searchability)
- Timestamps (created/updated dates)
- Non-sensitive metadata (bank names, card types, etc.)

### Zero-Knowledge Architecture
- **No backend** - All data stored locally
- **No analytics** - No tracking or telemetry
- **No cloud sync** - Your data stays on your device
- **Client-side only** - Encryption key never leaves browser
- **Open source** - Code is auditable

### Master Password
- Never stored anywhere
- Used to derive encryption key via PBKDF2
- Lost password = lost data (by design for security)
- Recovery via security questions

## 🧪 Testing

### Local Testing
```bash
npm run dev
# Test all features in browser
```

### Production Testing
```bash
npm run build
npm run preview
# Test production build locally
```

### PWA Testing
1. Build and deploy
2. Visit deployed URL
3. Check browser DevTools → Application → Service Workers
4. Check Lighthouse PWA score
5. Test offline mode (disconnect internet)
6. Test installation (Add to Home Screen)

## 📊 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Opera | 76+ | ✅ Full support |

**Requirements**:
- IndexedDB support
- Web Crypto API support
- Service Worker support
- ES2020+ support

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shadcn/ui** for beautiful accessible components
- **Radix UI** for headless component primitives
- **Dexie.js** for IndexedDB wrapper
- **Tailwind CSS** for utility-first CSS
- **Framer Motion** for smooth animations

## 📞 Support

For issues or questions:
1. Check [COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md) for known issues
2. Check [DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md) for deployment help
3. Open an issue on GitHub

## 🎯 Roadmap

### Completed ✅
- All 8 category stores
- All 15 pages
- Document upload feature (FileUploader component)
- Encrypted backup/restore
- Password reset
- Search functionality
- PWA support

### Planned 🔮
- Biometric authentication (fingerprint/face ID)
- Cloud sync (optional, E2E encrypted)
- Multi-language support
- Import from other password managers
- Browser extension
- Mobile apps (React Native)

---

**Made with ❤️ for privacy and security**
