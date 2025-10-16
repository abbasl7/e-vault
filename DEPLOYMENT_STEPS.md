# Cloudflare Pages Deployment Steps

## Current Status
- ✅ All 8 Zustand stores with encryption
- ✅ All 15 pages created (8 categories + 7 utility pages)
- ✅ Document upload feature implemented (FileUploader component + crypto functions)
- ✅ BanksPage has document upload integration (template for other pages)
- ⚠️ 7 pages need document upload UI added (follow BanksPage pattern)
- ⚠️ Backup/Restore needs document support

## Remaining Work Before Deploy

### 1. Complete Document Upload Integration (30 min)
Add to remaining 7 pages (CardsPage, PoliciesPage, AadharPage, PanPage, LicensePage, VoterIdPage, MiscPage):

**For each page, make these 4 changes:**

#### A. Add imports (top of file):
```typescript
import { DocumentAttachment } from '@/types';
import { FileUploader } from '@/components/FileUploader';
```

#### B. Add to formData state:
```typescript
const [formData, setFormData] = useState({
  // ...existing fields...
  documents: [] as DocumentAttachment[],
});
```

#### C. Add before `</div>` and `<DialogFooter>` in both Add and Edit dialogs:
```tsx
{/* Document Upload */}
<div className="grid gap-2">
  <Label>Documents</Label>
  <FileUploader
    documents={formData.documents}
    onDocumentsChange={(documents) => setFormData({ ...formData, documents })}
  />
</div>
```

#### D. Update resetForm function:
```typescript
const resetForm = () => {
  setFormData({
    // ...existing fields...
    documents: [] as DocumentAttachment[],
  });
};
```

#### E. Update openEditDialog function:
```typescript
const openEditDialog = (record: RecordType) => {
  setFormData({
    // ...existing fields...
    documents: record.documents || [],
  });
};
```

### 2. Update Backup/Restore (15 min)
The BackupRestorePage already exports/imports all data from db.ts. Since documents are part of each record type, they will automatically be included in backups. No changes needed!

### 3. Install Missing Dependencies
```bash
npm install @radix-ui/react-switch
```

### 4. Fix TypeScript Warnings
Already fixed:
- ✅ crypto.ts Uint8Array type issues
- ✅ FileUploader aria-label
- ✅ authStore unused import (bufferToHex) - can be removed if needed

### 5. Production Build
```bash
npm run build
```

Expected output: `dist/` folder with optimized build

## Cloudflare Pages Deployment

### Option 1: Via Cloudflare Dashboard (Recommended)

1. **Push to GitHub** (if not already done):
```bash
git add .
git commit -m "Complete Secure Vault PWA with document upload"
git push origin main
```

2. **Create Cloudflare Pages Project**:
   - Go to https://dash.cloudflare.com
   - Navigate to **Pages**
   - Click **Create a project**
   - Click **Connect to Git**
   - Authorize Cloudflare to access your GitHub
   - Select your repository

3. **Configure Build Settings**:
   - **Project name**: `secure-vault` (or your choice)
   - **Production branch**: `main`
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: `18` (in Environment Variables: `NODE_VERSION = 18`)

4. **Deploy**:
   - Click **Save and Deploy**
   - Wait 2-3 minutes for build
   - Your app will be live at: `https://secure-vault.pages.dev`

5. **Custom Domain** (Optional):
   - Go to your Pages project → **Custom domains**
   - Click **Set up a custom domain**
   - Enter: `vault.yourdomain.com`
   - Add CNAME record to your DNS: `vault` → `secure-vault.pages.dev`
   - Wait for SSL certificate (5-10 minutes)
   - Access at: `https://vault.yourdomain.com`

### Option 2: Via Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the project
npm run build

# Deploy
wrangler pages deploy dist --project-name=secure-vault
```

## Post-Deployment Testing

### Critical Tests:
1. ✅ **PWA Installation**: Click "Install" button in browser
2. ✅ **Account Setup**: Create new account with master password
3. ✅ **Login**: Authenticate successfully
4. ✅ **Add Record**: Test adding bank/card with encrypted fields
5. ✅ **Document Upload**: Upload image/PDF, verify encryption icon
6. ✅ **Document Preview**: Click eye icon, verify preview works
7. ✅ **Document Download**: Download encrypted document
8. ✅ **Offline Mode**: Disconnect internet, verify app still works
9. ✅ **Backup**: Export encrypted backup
10. ✅ **Restore**: Import backup in new account
11. ✅ **Search**: Search across categories
12. ✅ **Password Reset**: Test security questions

### Performance Checks:
- Page load < 2s
- Lighthouse PWA score > 90
- HTTPS enabled ✅
- Service Worker active ✅
- IndexedDB encryption working ✅

## Troubleshooting

### Build Fails
- Check Node version: `node --version` (should be 18+)
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Check for TypeScript errors: `npm run build`

### PWA Not Installing
- Must be served over HTTPS (Cloudflare auto-provides)
- Check manifest.json exists in dist
- Check service worker registered in DevTools

### Documents Not Encrypting
- Verify encryptionKey is available in authStore
- Check browser console for crypto errors
- Test in Chrome/Edge (better crypto API support)

## Environment Variables
None needed! All encryption happens client-side.

## Monitoring
- Cloudflare Analytics (free)
- Check deployment logs in Cloudflare Dashboard
- Monitor storage usage (IndexedDB ~50MB limit per domain)

## Success Criteria ✅
- [ ] App deployed to Cloudflare Pages
- [ ] Accessible via HTTPS
- [ ] PWA installable
- [ ] All 8 categories functional
- [ ] Document upload working
- [ ] Backup/restore working
- [ ] Offline mode working
- [ ] Encryption verified (inspect IndexedDB)

## Next Steps After Deployment
1. Add more document types (PDF, DOCX)
2. Add biometric authentication
3. Add cloud sync (optional - reduces privacy)
4. Add export to CSV
5. Add import from other password managers
6. Add 2FA setup

---

**Estimated Time to Deploy**: 15-30 minutes
**Cost**: FREE (Cloudflare Pages free tier)
