import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Search, Eye, EyeOff, Copy, Edit2, Trash2, CreditCard as CardIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePanStore } from '@/store/panStore';
import { PanRecord, DocumentAttachment } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { formatDate, maskCardNumber } from '@/lib/utils';
import { FileUploader } from '@/components/FileUploader';

export default function PanPage() {
  const navigate = useNavigate();
  const { pans, isLoading, fetchPans, addPan, updatePan, deletePan, searchPans } = usePanStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPan, setSelectedPan] = useState<PanRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSensitiveData, setShowSensitiveData] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({ panNumber: '', name: '', dateOfBirth: '', fatherName: '', notes: '', documents: [] as DocumentAttachment[] });

  useEffect(() => { fetchPans(); }, [fetchPans]);
  const filteredPans = searchQuery ? searchPans(searchQuery) : pans;

  const handleAdd = async () => {
    try {
      await addPan(formData);
      toast({ title: "Success!", description: "PAN added successfully", variant: "success" });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedPan?.id) return;
    try {
      await updatePan(selectedPan.id, formData);
      toast({ title: "Success!", description: "PAN updated successfully", variant: "success" });
      setIsEditDialogOpen(false);
      setSelectedPan(null);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedPan?.id) return;
    try {
      await deletePan(selectedPan.id);
      toast({ title: "Success!", description: "PAN deleted successfully", variant: "success" });
      setIsDeleteDialogOpen(false);
      setSelectedPan(null);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const openEditDialog = (pan: PanRecord) => {
    setSelectedPan(pan);
    setFormData({ panNumber: pan.panNumber, name: pan.name, dateOfBirth: pan.dateOfBirth, fatherName: pan.fatherName, notes: pan.notes || '', documents: pan.documents || [] });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => { setFormData({ panNumber: '', name: '', dateOfBirth: '', fatherName: '', notes: '', documents: [] as DocumentAttachment[] }); };
  const toggleSensitiveData = (id: string, field: string) => { setShowSensitiveData(prev => ({ ...prev, [`${id}-${field}`]: !prev[`${id}-${field}`] })); };
  const copyToClipboard = (text: string, label: string) => { navigator.clipboard.writeText(text); toast({ title: "Copied!", description: `${label} copied` }); };
  const maskValue = (value: string, show: boolean) => (!value ? '' : show ? value : maskCardNumber(value));

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 text-white hover:bg-white/10"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div><h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3"><CardIcon className="w-10 h-10 text-primary" />PAN Cards</h1><p className="text-gray-400">Manage PAN card details</p></div>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg" className="gap-2"><Plus className="w-5 h-5" />Add PAN</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div><p className="mt-4 text-gray-400">Loading...</p></div>
        ) : filteredPans.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-8 text-center"><div className="max-w-md mx-auto"><div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center"><CardIcon className="w-10 h-10 text-primary" /></div><h2 className="text-2xl font-bold text-white mb-3">{searchQuery ? 'No Records Found' : 'No PAN Cards Yet'}</h2><p className="text-gray-400 mb-6">{searchQuery ? 'Try different keywords' : 'Add your first PAN card'}</p>{!searchQuery && <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg"><Plus className="w-5 h-5 mr-2" />Add First PAN</Button>}</div></motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredPans.map((pan, index) => (
                <motion.div key={pan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className="group hover:border-primary/50 transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div><CardTitle>{pan.name}</CardTitle><CardDescription>Father: {pan.fatherName}</CardDescription></div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(pan)} className="hover:bg-primary/20"><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedPan(pan); setIsDeleteDialogOpen(true); }} className="hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label className="text-xs text-gray-500">PAN Number</Label><div className="flex items-center gap-2"><span className="text-white font-mono">{maskValue(pan.panNumber, showSensitiveData[`${pan.id}-panNumber`])}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSensitiveData(pan.id!, 'panNumber')}>{showSensitiveData[`${pan.id}-panNumber`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</Button><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(pan.panNumber, 'PAN number')}><Copy className="w-3 h-3" /></Button></div></div>
                        <div className="space-y-1"><Label className="text-xs text-gray-500">Date of Birth</Label><span className="text-white block">{pan.dateOfBirth}</span></div>
                      </div>
                      {pan.notes && <div className="space-y-1 mt-2 pt-2 border-t border-white/10"><Label className="text-xs text-gray-500">Notes</Label><p className="text-sm text-gray-300">{pan.notes}</p></div>}
                      <div className="text-xs text-gray-500 flex gap-4"><span>Created: {formatDate(pan.createdAt)}</span><span>Updated: {formatDate(pan.updatedAt)}</span></div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add PAN Card</DialogTitle><DialogDescription>Enter PAN card details.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="name">Name *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="dateOfBirth">Date of Birth *</Label><Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="panNumber">PAN Number * (10 characters)</Label><Input id="panNumber" value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" type="password" maxLength={10} /></div>
              <div className="grid gap-2"><Label htmlFor="fatherName">Father's Name *</Label><Input id="fatherName" value={formData.fatherName} onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
              <div className="grid gap-2"><Label>Documents</Label><FileUploader documents={formData.documents} onDocumentsChange={(documents) => setFormData({ ...formData, documents })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!formData.name || !formData.panNumber || !formData.dateOfBirth || !formData.fatherName}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit PAN Card</DialogTitle><DialogDescription>Update PAN details.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="edit-name">Name *</Label><Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="edit-dateOfBirth">Date of Birth *</Label><Input id="edit-dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="edit-panNumber">PAN Number *</Label><Input id="edit-panNumber" value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })} maxLength={10} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-fatherName">Father's Name *</Label><Input id="edit-fatherName" value={formData.fatherName} onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })} /></div>
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
            <DialogHeader><DialogTitle>Delete PAN Card</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
