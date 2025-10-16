import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Search, Eye, EyeOff, Copy, Edit2, Trash2, FolderCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMiscStore } from '@/store/miscStore';
import { MiscRecord, DocumentAttachment } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { formatDate, maskCardNumber } from '@/lib/utils';
import { FileUploader } from '@/components/FileUploader';

export default function MiscPage() {
  const navigate = useNavigate();
  const { misc, isLoading, fetchMisc, addMisc, updateMisc, deleteMisc, searchMisc } = useMiscStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMisc, setSelectedMisc] = useState<MiscRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSensitiveData, setShowSensitiveData] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({ title: '', type: '', content: '', url: '', username: '', password: '', notes: '', documents: [] as DocumentAttachment[] });

  useEffect(() => { fetchMisc(); }, [fetchMisc]);
  const filteredMisc = searchQuery ? searchMisc(searchQuery) : misc;

  const handleAdd = async () => {
    try {
      await addMisc(formData);
      toast({ title: "Success!", description: "Record added successfully", variant: "success" });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedMisc?.id) return;
    try {
      await updateMisc(selectedMisc.id, formData);
      toast({ title: "Success!", description: "Record updated successfully", variant: "success" });
      setIsEditDialogOpen(false);
      setSelectedMisc(null);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedMisc?.id) return;
    try {
      await deleteMisc(selectedMisc.id);
      toast({ title: "Success!", description: "Record deleted successfully", variant: "success" });
      setIsDeleteDialogOpen(false);
      setSelectedMisc(null);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const openEditDialog = (misc: MiscRecord) => {
    setSelectedMisc(misc);
    setFormData({ title: misc.title, type: misc.type, content: misc.content, url: misc.url || '', username: misc.username || '', password: misc.password || '', notes: misc.notes || '', documents: misc.documents || [] });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => { setFormData({ title: '', type: '', content: '', url: '', username: '', password: '', notes: '', documents: [] as DocumentAttachment[] }); };
  const toggleSensitiveData = (id: string, field: string) => { setShowSensitiveData(prev => ({ ...prev, [`${id}-${field}`]: !prev[`${id}-${field}`] })); };
  const copyToClipboard = (text: string, label: string) => { navigator.clipboard.writeText(text); toast({ title: "Copied!", description: `${label} copied` }); };
  const maskValue = (value: string, show: boolean) => (!value ? '' : show ? value : maskCardNumber(value));

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 text-white hover:bg-white/10"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div><h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3"><FolderCog className="w-10 h-10 text-primary" />Miscellaneous</h1><p className="text-gray-400">Manage other documents & credentials</p></div>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg" className="gap-2"><Plus className="w-5 h-5" />Add Record</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div><p className="mt-4 text-gray-400">Loading...</p></div>
        ) : filteredMisc.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-8 text-center"><div className="max-w-md mx-auto"><div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center"><FolderCog className="w-10 h-10 text-primary" /></div><h2 className="text-2xl font-bold text-white mb-3">{searchQuery ? 'No Records Found' : 'No Records Yet'}</h2><p className="text-gray-400 mb-6">{searchQuery ? 'Try different keywords' : 'Add your first record'}</p>{!searchQuery && <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg"><Plus className="w-5 h-5 mr-2" />Add First Record</Button>}</div></motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredMisc.map((misc, index) => (
                <motion.div key={misc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className="group hover:border-primary/50 transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div><CardTitle>{misc.title}</CardTitle><CardDescription>{misc.type}</CardDescription></div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(misc)} className="hover:bg-primary/20"><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedMisc(misc); setIsDeleteDialogOpen(true); }} className="hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="space-y-1"><Label className="text-xs text-gray-500">Content</Label><div className="flex items-center gap-2"><span className="text-white font-mono break-all">{maskValue(misc.content, showSensitiveData[`${misc.id}-content`])}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSensitiveData(misc.id!, 'content')}>{showSensitiveData[`${misc.id}-content`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</Button><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(misc.content, 'Content')}><Copy className="w-3 h-3" /></Button></div></div>
                      {misc.url && <div className="space-y-1"><Label className="text-xs text-gray-500">URL</Label><a href={misc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{misc.url}</a></div>}
                      {misc.username && (
                        <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                          <div className="space-y-1"><Label className="text-xs text-gray-500">Username</Label><div className="flex items-center gap-2"><span className="text-white font-mono">{maskValue(misc.username, showSensitiveData[`${misc.id}-username`])}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSensitiveData(misc.id!, 'username')}>{showSensitiveData[`${misc.id}-username`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</Button><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(misc.username, 'Username')}><Copy className="w-3 h-3" /></Button></div></div>
                          {misc.password && <div className="space-y-1"><Label className="text-xs text-gray-500">Password</Label><div className="flex items-center gap-2"><span className="text-white font-mono">{maskValue(misc.password, showSensitiveData[`${misc.id}-password`])}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSensitiveData(misc.id!, 'password')}>{showSensitiveData[`${misc.id}-password`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</Button><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(misc.password, 'Password')}><Copy className="w-3 h-3" /></Button></div></div>}
                        </div>
                      )}
                      {misc.notes && <div className="space-y-1 mt-2 pt-2 border-t border-white/10"><Label className="text-xs text-gray-500">Notes</Label><p className="text-sm text-gray-300">{misc.notes}</p></div>}
                      <div className="text-xs text-gray-500 flex gap-4"><span>Created: {formatDate(misc.createdAt)}</span><span>Updated: {formatDate(misc.updatedAt)}</span></div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Miscellaneous Record</DialogTitle><DialogDescription>Store any other important information.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="title">Title *</Label><Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., WiFi Password" /></div>
                <div className="grid gap-2"><Label htmlFor="type">Type *</Label><Input id="type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} placeholder="e.g., Login, Document" /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="content">Content *</Label><Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={3} placeholder="Main content/information" /></div>
              <div className="grid gap-2"><Label htmlFor="url">URL</Label><Input id="url" type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://example.com" /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="username">Username</Label><Input id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} type="password" /></div>
                <div className="grid gap-2"><Label htmlFor="password">Password</Label><Input id="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} type="password" /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
              <div className="grid gap-2"><Label>Documents</Label><FileUploader documents={formData.documents} onDocumentsChange={(documents) => setFormData({ ...formData, documents })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!formData.title || !formData.type || !formData.content}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Record</DialogTitle><DialogDescription>Update record details.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="edit-title">Title *</Label><Input id="edit-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="edit-type">Type *</Label><Input id="edit-type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="edit-content">Content *</Label><Textarea id="edit-content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={3} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-url">URL</Label><Input id="edit-url" type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="edit-username">Username</Label><Input id="edit-username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="edit-password">Password</Label><Input id="edit-password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
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
            <DialogHeader><DialogTitle>Delete Record</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
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
