# PWA Install Prompt Fix

## Issue Summary
When the app was deployed to production, the PWA install prompt was not showing up in the browser, preventing users from installing the app to their home screen.

## Root Causes Identified

### 1. Invalid PWA Icons (Primary Issue)
- **Problem**: Icons in `/public/icons/` were stored as base64-encoded text strings instead of binary PNG files
- **Impact**: Browsers couldn't validate the icons, failing PWA installability criteria
- **File sizes**: All icons were ~171 bytes (placeholder/corrupted data)

### 2. Blocked Install Prompt (Secondary Issue)
- **Problem**: The code was calling `preventDefault()` on the `beforeinstallprompt` event without showing an alternative
- **Impact**: Browser's native install banner was suppressed
- **User experience**: No way to install the app except through a manual button (which users didn't know about)

## Solutions Implemented

### 1. Generated Proper PWA Icons
Created high-quality PNG icons from the SVG logo using the `sharp` library:

```bash
npm install --save-dev sharp
node generate-icons.js
```

**Icon Specifications:**
- **Sizes**: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- **Format**: PNG with RGBA color
- **File sizes**: 997 bytes (72x72) to 12KB (512x512)
- **Source**: `/public/eternalvault-logo.svg`

**Critical icons for PWA:**
- `icon-192x192.png` (3.1KB) - Required for Android
- `icon-512x512.png` (12KB) - Required for Android splash screen

### 2. Fixed Install Prompt Logic
Updated `/src/main.tsx` to allow browser's native install prompt:

```typescript
// Before (blocked prompt):
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // ❌ This prevented the browser prompt
  deferredPrompt = e;
});

// After (allows prompt):
window.addEventListener('beforeinstallprompt', (e) => {
  deferredPrompt = e;
  
  const hasShownAutoPrompt = localStorage.getItem('pwa-auto-prompt-shown');
  
  if (!hasShownAutoPrompt) {
    // First time - let browser show native prompt
    localStorage.setItem('pwa-auto-prompt-shown', 'true');
  } else {
    // Subsequent times - prevent to avoid prompt fatigue
    e.preventDefault();
  }
});
```

**Key improvements:**
- ✅ Browser shows native install prompt on first visit
- ✅ localStorage tracks if prompt was shown (prevents annoying repeated prompts)
- ✅ Manual install button still works in Dashboard
- ✅ Respects user choice (doesn't nag repeatedly)

## PWA Installability Checklist

After the fix, the PWA meets all browser requirements:

- [x] **Valid Manifest**: `/manifest.webmanifest` with proper configuration
- [x] **Icons**: 192x192 and 512x512 PNG icons (minimum required)
- [x] **Service Worker**: Registered and actively caching assets
- [x] **HTTPS**: Required for production (handled by deployment platform)
- [x] **Start URL**: Set to `/` in manifest
- [x] **Display Mode**: Set to `standalone` for app-like experience

## Testing the Fix

### Local Testing (Development)
```bash
npm run build
npm run preview
# Visit http://localhost:4173
```

**Note**: The install prompt may not show in development mode since it's HTTP (not HTTPS). Service worker will still register.

### Production Testing (After Deployment)
1. Deploy to Cloudflare Pages, Vercel, or similar (HTTPS required)
2. Visit the deployed URL in Chrome/Edge on desktop or mobile
3. Look for the install prompt in the address bar or banner
4. Alternatively, use the install button in the Dashboard

### Browser DevTools Verification
1. Open DevTools (F12)
2. Go to **Application** tab
3. Check **Service Workers** section - should show registered worker
4. Check **Manifest** section - should show valid manifest with icons
5. Run **Lighthouse** audit - PWA score should be 100

## Files Changed

### Modified Files
- `/src/main.tsx` - Updated install prompt logic
- `/public/icons/*.png` - Regenerated all 8 icon files

### New Files
- `generate-icons.js` - Script to generate icons (git-ignored)
- `PWA_INSTALL_FIX.md` - This documentation

### Dependencies
- Added `sharp` to devDependencies for icon generation

## Browser Compatibility

The PWA install prompt works on:

| Browser | Platform | Status |
|---------|----------|--------|
| Chrome 90+ | Desktop | ✅ Full support |
| Chrome 90+ | Android | ✅ Full support |
| Edge 90+ | Desktop | ✅ Full support |
| Safari 16.4+ | iOS | ✅ Add to Home Screen |
| Firefox 100+ | Desktop/Android | ⚠️ Limited (no auto prompt) |

**Note**: Firefox doesn't show automatic install prompts but users can manually add to home screen.

## Deployment Instructions

When deploying to production:

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist/` folder** to your hosting platform:
   - Cloudflare Pages: Connect GitHub repo
   - Vercel: Import project
   - Netlify: Drag & drop or Git deploy

3. **Ensure HTTPS**: All platforms provide HTTPS by default

4. **Verify installability**: Visit the deployed URL and check for install prompt

## Troubleshooting

### Install prompt not showing?
1. Clear browser cache and localStorage
2. Check DevTools Console for errors
3. Verify all icons load correctly (Network tab)
4. Confirm site is served over HTTPS
5. Try in incognito/private mode

### Icons not loading?
1. Check file permissions in `/public/icons/`
2. Verify icons are binary PNG files: `file public/icons/icon-192x192.png`
3. Rebuild the app: `npm run build`

### Service worker issues?
1. Unregister old service workers in DevTools
2. Hard reload (Ctrl+Shift+R or Cmd+Shift+R)
3. Check service worker registration in Console

## Resources

- [PWA Install Criteria](https://web.dev/install-criteria/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [beforeinstallprompt Event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Last Updated**: October 16, 2025
**Issue**: #[issue-number]
**PR**: #[pr-number]
