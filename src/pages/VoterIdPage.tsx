import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Search, Eye, EyeOff, Copy, Edit2, Trash2, Vote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoterIdStore } from '@/store/voterIdStore';
import { VoterIdRecord, DocumentAttachment } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { formatDate, maskCardNumber } from '@/lib/utils';
import { FileUploader } from '@/components/FileUploader';

export default function VoterIdPage() {
  const navigate = useNavigate();
  const { voterIds, isLoading, fetchVoterIds, addVoterId, updateVoterId, deleteVoterId, searchVoterIds } = useVoterIdStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVoterId, setSelectedVoterId] = useState<VoterIdRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSensitiveData, setShowSensitiveData] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({ voterIdNumber: '', name: '', dateOfBirth: '', constituency: '', state: '', notes: '', documents: [] as DocumentAttachment[] });

  useEffect(() => { fetchVoterIds(); }, [fetchVoterIds]);
  const filteredVoterIds = searchQuery ? searchVoterIds(searchQuery) : voterIds;

  const handleAdd = async () => {
    try {
      await addVoterId(formData);
      toast({ title: "Success!", description: "Voter ID added successfully", variant: "success" });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedVoterId?.id) return;
    try {
      await updateVoterId(selectedVoterId.id, formData);
      toast({ title: "Success!", description: "Voter ID updated successfully", variant: "success" });
      setIsEditDialogOpen(false);
      setSelectedVoterId(null);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedVoterId?.id) return;
    try {
      await deleteVoterId(selectedVoterId.id);
      toast({ title: "Success!", description: "Voter ID deleted successfully", variant: "success" });
      setIsDeleteDialogOpen(false);
      setSelectedVoterId(null);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const openEditDialog = (voterId: VoterIdRecord) => {
    setSelectedVoterId(voterId);
    setFormData({ voterIdNumber: voterId.voterIdNumber, name: voterId.name, dateOfBirth: voterId.dateOfBirth, constituency: voterId.constituency, state: voterId.state, notes: voterId.notes || '', documents: voterId.documents || [] });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => { setFormData({ voterIdNumber: '', name: '', dateOfBirth: '', constituency: '', state: '', notes: '', documents: [] as DocumentAttachment[] }); };
  const toggleSensitiveData = (id: string, field: string) => { setShowSensitiveData(prev => ({ ...prev, [`${id}-${field}`]: !prev[`${id}-${field}`] })); };
  const copyToClipboard = (text: string, label: string) => { navigator.clipboard.writeText(text); toast({ title: "Copied!", description: `${label} copied` }); };
  const maskValue = (value: string, show: boolean) => (!value ? '' : show ? value : maskCardNumber(value));

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 text-foreground hover:bg-white/10"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div><h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3"><Vote className="w-10 h-10 text-primary" />Voter IDs</h1><p className="text-muted-foreground">Manage voter ID cards</p></div>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg" className="gap-2"><Plus className="w-5 h-5" />Add Voter ID</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div><p className="mt-4 text-gray-400">Loading...</p></div>
        ) : filteredVoterIds.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-8 text-center"><div className="max-w-md mx-auto"><div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center"><Vote className="w-10 h-10 text-primary" /></div><h2 className="text-2xl font-bold text-white mb-3">{searchQuery ? 'No Voter IDs Found' : 'No Voter IDs Yet'}</h2><p className="text-gray-400 mb-6">{searchQuery ? 'Try different keywords' : 'Add your first voter ID'}</p>{!searchQuery && <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg"><Plus className="w-5 h-5 mr-2" />Add First Voter ID</Button>}</div></motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredVoterIds.map((voterId, index) => (
                <motion.div key={voterId.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className="group hover:border-primary/50 transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div><CardTitle>{voterId.name}</CardTitle><CardDescription>{voterId.constituency}, {voterId.state}</CardDescription></div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(voterId)} className="hover:bg-primary/20"><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedVoterId(voterId); setIsDeleteDialogOpen(true); }} className="hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label className="text-xs text-gray-500">Voter ID Number</Label><div className="flex items-center gap-2"><span className="text-white font-mono">{maskValue(voterId.voterIdNumber, showSensitiveData[`${voterId.id}-voterIdNumber`])}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSensitiveData(voterId.id!, 'voterIdNumber')}>{showSensitiveData[`${voterId.id}-voterIdNumber`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</Button><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(voterId.voterIdNumber, 'Voter ID')}><Copy className="w-3 h-3" /></Button></div></div>
                        <div className="space-y-1"><Label className="text-xs text-gray-500">Date of Birth</Label><span className="text-white block">{voterId.dateOfBirth}</span></div>
                      </div>
                      {voterId.notes && <div className="space-y-1 mt-2 pt-2 border-t border-white/10"><Label className="text-xs text-gray-500">Notes</Label><p className="text-sm text-gray-300">{voterId.notes}</p></div>}
                      <div className="text-xs text-gray-500 flex gap-4"><span>Created: {formatDate(voterId.createdAt)}</span><span>Updated: {formatDate(voterId.updatedAt)}</span></div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl bg-card text-card-foreground rounded-lg shadow-lg">
            <DialogHeader><DialogTitle>Add Voter ID</DialogTitle><DialogDescription>Enter voter ID details.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="name">Name *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="dateOfBirth">Date of Birth *</Label><Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="voterIdNumber">Voter ID Number *</Label><Input id="voterIdNumber" value={formData.voterIdNumber} onChange={(e) => setFormData({ ...formData, voterIdNumber: e.target.value.toUpperCase() })} type="password" placeholder="ABC1234567" /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="constituency">Constituency *</Label><Input id="constituency" value={formData.constituency} onChange={(e) => setFormData({ ...formData, constituency: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="state">State *</Label><Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
              <div className="grid gap-2"><Label>Documents</Label><FileUploader documents={formData.documents} onDocumentsChange={(documents) => setFormData({ ...formData, documents })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!formData.name || !formData.voterIdNumber || !formData.dateOfBirth || !formData.constituency || !formData.state}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl bg-card text-card-foreground rounded-lg shadow-lg">
            <DialogHeader><DialogTitle>Edit Voter ID</DialogTitle><DialogDescription>Update voter ID details.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="edit-name">Name *</Label><Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="edit-dateOfBirth">Date of Birth *</Label><Input id="edit-dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="edit-voterIdNumber">Voter ID Number *</Label><Input id="edit-voterIdNumber" value={formData.voterIdNumber} onChange={(e) => setFormData({ ...formData, voterIdNumber: e.target.value.toUpperCase() })} /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="edit-constituency">Constituency *</Label><Input id="edit-constituency" value={formData.constituency} onChange={(e) => setFormData({ ...formData, constituency: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="edit-state">State *</Label><Input id="edit-state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} /></div>
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
          <DialogContent className="bg-card text-card-foreground rounded-lg shadow-lg">
            <DialogHeader><DialogTitle>Delete Voter ID</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
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
