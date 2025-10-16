# Quick Copy-Paste Guide for Adding Document Upload to 7 Pages

## Pages to Update:
1. CardsPage.tsx
2. PoliciesPage.tsx
3. AadharPage.tsx
4. PanPage.tsx
5. LicensePage.tsx
6. VoterIdPage.tsx
7. MiscPage.tsx

---

## For Each Page, Make These 5 Changes:

### Change 1: Update Imports (at top of file)

**Find the line that imports the record type**, then add `DocumentAttachment` and `FileUploader`:

#### CardsPage.tsx
```typescript
import { CardRecord, DocumentAttachment } from '@/types';
import { FileUploader } from '@/components/FileUploader';
```

#### PoliciesPage.tsx
```typescript
import { PolicyRecord, DocumentAttachment } from '@/types';
import { FileUploader } from '@/components/FileUploader';
```

#### AadharPage.tsx
```typescript
import { AadharRecord, DocumentAttachment } from '@/types';
import { FileUploader } from '@/components/FileUploader';
```

#### PanPage.tsx
```typescript
import { PanRecord, DocumentAttachment } from '@/types';
import { FileUploader } from '@/components/FileUploader';
```

#### LicensePage.tsx
```typescript
import { LicenseRecord, DocumentAttachment } from '@/types';
import { FileUploader } from '@/components/FileUploader';
```

#### VoterIdPage.tsx
```typescript
import { VoterIdRecord, DocumentAttachment } from '@/types';
import { FileUploader } from '@/components/FileUploader';
```

#### MiscPage.tsx
```typescript
import { MiscRecord, DocumentAttachment } from '@/types';
import { FileUploader } from '@/components/FileUploader';
```

---

### Change 2: Add to formData state

**Find the `const [formData, setFormData] = useState({` line**, add `documents` field:

```typescript
const [formData, setFormData] = useState({
  // ...all existing fields (don't change them)...
  documents: [] as DocumentAttachment[],  // ADD THIS LINE
});
```

---

### Change 3: Add FileUploader to Add Dialog

**Find the Add dialog's last form field** (usually Notes or similar), then add this **BEFORE** `</div>` and `<DialogFooter>`:

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

**Look for this pattern:**
```tsx
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea ... />
            </div>
          </div>              {/* ← ADD BEFORE THIS CLOSING DIV */}
          <DialogFooter>    {/* ← AND BEFORE THIS */}
```

---

### Change 4: Add FileUploader to Edit Dialog

**Same as Change 3**, but in the Edit dialog. Find the Edit dialog's last field and add the same FileUploader component:

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

---

### Change 5: Update resetForm Function

**Find the `const resetForm = () => {` function**, add `documents: []`:

```typescript
const resetForm = () => {
  setFormData({
    // ...all existing fields (don't change them)...
    documents: [] as DocumentAttachment[],  // ADD THIS LINE
  });
};
```

---

### Change 6: Update openEditDialog Function

**Find the `const openEditDialog = (record) => {` function**, add `documents: record.documents || []`:

#### Example for CardsPage:
```typescript
const openEditDialog = (card: CardRecord) => {
  setSelectedCard(card);
  setFormData({
    bankName: card.bankName,
    cardType: card.cardType,
    cardNumber: card.cardNumber,
    cvv: card.cvv || '',
    validTill: card.validTill,
    customerId: card.customerId || '',
    pin: card.pin || '',
    notes: card.notes || '',
    documents: card.documents || [],  // ADD THIS LINE
  });
  setIsEditDialogOpen(true);
};
```

Adjust field names for each page (e.g., `pan.documents`, `policy.documents`, etc.).

---

## Complete Example: PanPage.tsx

Here's what PanPage.tsx should look like after all changes:

### Before (current):
```typescript
import { PanRecord } from '@/types';

const [formData, setFormData] = useState({
  panNumber: '',
  name: '',
  dateOfBirth: '',
  fatherName: '',
  notes: ''
});

const resetForm = () => {
  setFormData({
    panNumber: '',
    name: '',
    dateOfBirth: '',
    fatherName: '',
    notes: ''
  });
};

const openEditDialog = (pan: PanRecord) => {
  setFormData({
    panNumber: pan.panNumber,
    name: pan.name,
    dateOfBirth: pan.dateOfBirth,
    fatherName: pan.fatherName,
    notes: pan.notes || ''
  });
  setIsEditDialogOpen(true);
};
```

### After (with document upload):
```typescript
import { PanRecord, DocumentAttachment } from '@/types';
import { FileUploader } from '@/components/FileUploader';

const [formData, setFormData] = useState({
  panNumber: '',
  name: '',
  dateOfBirth: '',
  fatherName: '',
  notes: '',
  documents: [] as DocumentAttachment[],  // ← ADDED
});

const resetForm = () => {
  setFormData({
    panNumber: '',
    name: '',
    dateOfBirth: '',
    fatherName: '',
    notes: '',
    documents: [] as DocumentAttachment[],  // ← ADDED
  });
};

const openEditDialog = (pan: PanRecord) => {
  setFormData({
    panNumber: pan.panNumber,
    name: pan.name,
    dateOfBirth: pan.dateOfBirth,
    fatherName: pan.fatherName,
    notes: pan.notes || '',
    documents: pan.documents || [],  // ← ADDED
  });
  setIsEditDialogOpen(true);
};

// In the Add Dialog (after notes field):
{/* Document Upload */}
<div className="grid gap-2">
  <Label>Documents</Label>
  <FileUploader
    documents={formData.documents}
    onDocumentsChange={(documents) => setFormData({ ...formData, documents })}
  />
</div>

// Same for Edit Dialog
```

---

## Checklist for Each Page

- [ ] **CardsPage.tsx**
  - [ ] Import DocumentAttachment and FileUploader
  - [ ] Add documents to formData
  - [ ] Add FileUploader to Add dialog
  - [ ] Add FileUploader to Edit dialog
  - [ ] Update resetForm
  - [ ] Update openEditDialog

- [ ] **PoliciesPage.tsx**
  - [ ] Import DocumentAttachment and FileUploader
  - [ ] Add documents to formData
  - [ ] Add FileUploader to Add dialog
  - [ ] Add FileUploader to Edit dialog
  - [ ] Update resetForm
  - [ ] Update openEditDialog

- [ ] **AadharPage.tsx**
  - [ ] Import DocumentAttachment and FileUploader
  - [ ] Add documents to formData
  - [ ] Add FileUploader to Add dialog
  - [ ] Add FileUploader to Edit dialog
  - [ ] Update resetForm
  - [ ] Update openEditDialog

- [ ] **PanPage.tsx**
  - [ ] Import DocumentAttachment and FileUploader
  - [ ] Add documents to formData
  - [ ] Add FileUploader to Add dialog
  - [ ] Add FileUploader to Edit dialog
  - [ ] Update resetForm
  - [ ] Update openEditDialog

- [ ] **LicensePage.tsx**
  - [ ] Import DocumentAttachment and FileUploader
  - [ ] Add documents to formData
  - [ ] Add FileUploader to Add dialog
  - [ ] Add FileUploader to Edit dialog
  - [ ] Update resetForm
  - [ ] Update openEditDialog

- [ ] **VoterIdPage.tsx**
  - [ ] Import DocumentAttachment and FileUploader
  - [ ] Add documents to formData
  - [ ] Add FileUploader to Add dialog
  - [ ] Add FileUploader to Edit dialog
  - [ ] Update resetForm
  - [ ] Update openEditDialog

- [ ] **MiscPage.tsx**
  - [ ] Import DocumentAttachment and FileUploader
  - [ ] Add documents to formData
  - [ ] Add FileUploader to Add dialog
  - [ ] Add FileUploader to Edit dialog
  - [ ] Update resetForm
  - [ ] Update openEditDialog

---

## Time Estimate

- **Per page**: ~2 minutes
- **Total for 7 pages**: ~15 minutes

---

## Test After Completion

```bash
npm run dev
```

1. Go to each category page
2. Click "Add" button
3. Verify "Documents" section appears
4. Try uploading an image (JPEG/PNG)
5. Verify encryption icon 🔒 appears
6. Click eye icon to preview
7. Test download
8. Test delete

---

## No Errors Expected

All type definitions are in place:
- ✅ `DocumentAttachment` interface exists
- ✅ `documents?: DocumentAttachment[]` added to all record types
- ✅ `FileUploader` component exists and works (tested on BanksPage)
- ✅ Encryption functions work

Just copy-paste the code above! 🚀
