// Similar structure to other pages - simplified for efficiency
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Search, Eye, EyeOff, Copy, Edit2, Trash2, Fingerprint, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAadharStore } from '@/store/aadharStore';
import { AadharRecord, DocumentAttachment } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { formatDate, maskCardNumber } from '@/lib/utils';
import { FileUploader } from '@/components/FileUploader';
import { useAuthStore } from '@/store/authStore';
import { decryptFile } from '@/lib/crypto';
import { DocumentPreviewModal } from '@/components/DocumentPreviewModal';

export default function AadharPage() {
  const navigate = useNavigate();
  const { aadhars, isLoading, fetchAadhars, addAadhar, updateAadhar, deleteAadhar, searchAadhars } = useAadharStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAadhar, setSelectedAadhar] = useState<AadharRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSensitiveData, setShowSensitiveData] = useState<Record<string, boolean>>({});
  const [previewDocument, setPreviewDocument] = useState<DocumentAttachment | null>(null);
  const encryptionKey = useAuthStore((s) => s.encryptionKey);
  const [formData, setFormData] = useState({
    aadharNumber: '', name: '', dateOfBirth: '', address: '', enrollmentNumber: '', vid: '', notes: '', documents: [] as DocumentAttachment[],
  });

  useEffect(() => { fetchAadhars(); }, [fetchAadhars]);
  const filteredAadhars = searchQuery ? searchAadhars(searchQuery) : aadhars;

  const handleAdd = async () => {
    try {
      await addAadhar(formData);
      toast({ title: "Success!", description: "Aadhar added successfully", variant: "success" });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedAadhar?.id) return;
    try {
      await updateAadhar(selectedAadhar.id, formData);
      toast({ title: "Success!", description: "Aadhar updated successfully", variant: "success" });
      setIsEditDialogOpen(false);
      setSelectedAadhar(null);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedAadhar?.id) return;
    try {
      await deleteAadhar(selectedAadhar.id);
      toast({ title: "Success!", description: "Aadhar deleted successfully", variant: "success" });
      setIsDeleteDialogOpen(false);
      setSelectedAadhar(null);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const openEditDialog = (aadhar: AadharRecord) => {
    setSelectedAadhar(aadhar);
    setFormData({ aadharNumber: aadhar.aadharNumber, name: aadhar.name, dateOfBirth: aadhar.dateOfBirth, address: aadhar.address, enrollmentNumber: aadhar.enrollmentNumber || '', vid: aadhar.vid || '', notes: aadhar.notes || '', documents: aadhar.documents || [] });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => { setFormData({ aadharNumber: '', name: '', dateOfBirth: '', address: '', enrollmentNumber: '', vid: '', notes: '', documents: [] as DocumentAttachment[] }); };
  const toggleSensitiveData = (id: string, field: string) => { const key = `${id}-${field}`; setShowSensitiveData(prev => ({ ...prev, [key]: !prev[key] })); };
  const copyToClipboard = (text: string, label: string) => { navigator.clipboard.writeText(text); toast({ title: "Copied!", description: `${label} copied to clipboard` }); };
  const maskValue = (value: string, show: boolean) => (!value ? '' : show ? value : maskCardNumber(value));

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 text-white hover:bg-white/10"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div><h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3"><Fingerprint className="w-10 h-10 text-primary" />Aadhaar Cards</h1><p className="text-gray-400">Manage Aadhaar card details</p></div>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg" className="gap-2"><Plus className="w-5 h-5" />Add Aadhaar</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div><p className="mt-4 text-gray-400">Loading...</p></div>
        ) : filteredAadhars.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-8 text-center"><div className="max-w-md mx-auto"><div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center"><Fingerprint className="w-10 h-10 text-primary" /></div><h2 className="text-2xl font-bold text-white mb-3">{searchQuery ? 'No Records Found' : 'No Aadhaar Cards Yet'}</h2><p className="text-gray-400 mb-6">{searchQuery ? 'Try different keywords' : 'Add your first Aadhaar card'}</p>{!searchQuery && <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg"><Plus className="w-5 h-5 mr-2" />Add First Aadhaar</Button>}</div></motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAadhars.map((aadhar, index) => (
                <motion.div key={aadhar.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className="group hover:border-primary/50 transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div><CardTitle>{aadhar.name}</CardTitle><CardDescription>DOB: {aadhar.dateOfBirth}</CardDescription></div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(aadhar)} className="hover:bg-primary/20"><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedAadhar(aadhar); setIsDeleteDialogOpen(true); }} className="hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label className="text-xs text-gray-500">Aadhaar Number</Label><div className="flex items-center gap-2"><span className="text-white font-mono">{maskValue(aadhar.aadharNumber, showSensitiveData[`${aadhar.id}-aadharNumber`])}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSensitiveData(aadhar.id!, 'aadharNumber')}>{showSensitiveData[`${aadhar.id}-aadharNumber`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</Button><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(aadhar.aadharNumber, 'Aadhaar number')}><Copy className="w-3 h-3" /></Button></div></div>
                        <div className="space-y-1"><Label className="text-xs text-gray-500">Address</Label><span className="text-white block text-sm">{aadhar.address}</span></div>
                        {aadhar.enrollmentNumber && <div className="space-y-1"><Label className="text-xs text-gray-500">Enrollment Number</Label><div className="flex items-center gap-2"><span className="text-white font-mono text-sm">{maskValue(aadhar.enrollmentNumber, showSensitiveData[`${aadhar.id}-enrollmentNumber`])}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSensitiveData(aadhar.id!, 'enrollmentNumber')}>{showSensitiveData[`${aadhar.id}-enrollmentNumber`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</Button><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(aadhar.enrollmentNumber, 'Enrollment number')}><Copy className="w-3 h-3" /></Button></div></div>}
                        {aadhar.vid && <div className="space-y-1"><Label className="text-xs text-gray-500">VID</Label><div className="flex items-center gap-2"><span className="text-white font-mono text-sm">{maskValue(aadhar.vid, showSensitiveData[`${aadhar.id}-vid`])}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSensitiveData(aadhar.id!, 'vid')}>{showSensitiveData[`${aadhar.id}-vid`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</Button><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(aadhar.vid, 'VID')}><Copy className="w-3 h-3" /></Button></div></div>}
                      </div>
                      {aadhar.notes && <div className="space-y-1 mt-2 pt-2 border-t border-border"><Label className="text-xs text-muted-foreground">Notes</Label><p className="text-sm text-muted-foreground">{aadhar.notes}</p></div>}
                      <div className="text-xs text-muted-foreground flex gap-4"><span>Created: {formatDate(aadhar.createdAt)}</span><span>Updated: {formatDate(aadhar.updatedAt)}</span></div>
                      {aadhar.documents && aadhar.documents.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <Label className="text-xs text-muted-foreground">Attachments</Label>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {aadhar.documents.map((doc) => (
                              <div key={doc.id} className="bg-card p-2 rounded flex items-center gap-2 border border-border">
                                <span className="text-sm text-foreground truncate max-w-[160px]">{doc.name}</span>
                                <Button variant="ghost" size="icon" onClick={() => setPreviewDocument(doc)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={async () => {
                                  try {
                                    const encKey = useAuthStore.getState().encryptionKey;
                                    if (!encKey) throw new Error('No encryption key');
                                    const blob = await decryptFile(doc.encrypted, encKey, doc.type);
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = doc.name;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  } catch (err) {
                                    console.error('Download error', err);
                                    alert('Failed to download attachment');
                                  }
                                }}>
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Aadhaar</DialogTitle><DialogDescription>Enter Aadhaar card details. Sensitive data will be encrypted.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="name">Name *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="dateOfBirth">Date of Birth *</Label><Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="aadharNumber">Aadhaar Number * (12 digits)</Label><Input id="aadharNumber" value={formData.aadharNumber} onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })} placeholder="1234 5678 9012" type="password" maxLength={12} /></div>
              <div className="grid gap-2"><Label htmlFor="address">Address *</Label><Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="enrollmentNumber">Enrollment Number</Label><Input id="enrollmentNumber" value={formData.enrollmentNumber} onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })} type="password" /></div>
                <div className="grid gap-2"><Label htmlFor="vid">VID (16 digits)</Label><Input id="vid" value={formData.vid} onChange={(e) => setFormData({ ...formData, vid: e.target.value })} type="password" maxLength={16} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
              <div className="grid gap-2"><Label>Documents</Label><FileUploader documents={formData.documents} onDocumentsChange={(documents) => setFormData({ ...formData, documents })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!formData.name || !formData.aadharNumber || !formData.dateOfBirth || !formData.address}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Aadhaar</DialogTitle><DialogDescription>Update Aadhaar details.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="edit-name">Name *</Label><Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="edit-dateOfBirth">Date of Birth *</Label><Input id="edit-dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="edit-aadharNumber">Aadhaar Number *</Label><Input id="edit-aadharNumber" value={formData.aadharNumber} onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })} maxLength={12} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-address">Address *</Label><Textarea id="edit-address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="edit-enrollmentNumber">Enrollment Number</Label><Input id="edit-enrollmentNumber" value={formData.enrollmentNumber} onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="edit-vid">VID</Label><Input id="edit-vid" value={formData.vid} onChange={(e) => setFormData({ ...formData, vid: e.target.value })} maxLength={16} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="edit-notes">Notes</Label><Textarea id="edit-notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
              <div className="grid gap-2"><Label>Documents</Label><FileUploader documents={formData.documents} onDocumentsChange={(documents) => setFormData({ ...formData, documents })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEdit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Aadhaar</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DocumentPreviewModal
          document={previewDocument}
          isOpen={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
          encryptionKey={encryptionKey}
        />
      </div>
    </div>
  );
}
