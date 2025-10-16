import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Search, Eye, EyeOff, Copy, Edit2, Trash2, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLicenseStore } from '@/store/licenseStore';
import { LicenseRecord, DocumentAttachment } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { formatDate, maskCardNumber } from '@/lib/utils';
import { FileUploader } from '@/components/FileUploader';

export default function LicensePage() {
  const navigate = useNavigate();
  const { licenses, isLoading, fetchLicenses, addLicense, updateLicense, deleteLicense, searchLicenses } = useLicenseStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSensitiveData, setShowSensitiveData] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({ licenseNumber: '', name: '', dateOfIssue: '', validTill: '', vehicleClasses: '', stateOfIssue: '', notes: '', documents: [] as DocumentAttachment[] });

  useEffect(() => { fetchLicenses(); }, [fetchLicenses]);
  const filteredLicenses = searchQuery ? searchLicenses(searchQuery) : licenses;

  const handleAdd = async () => {
    try {
      await addLicense(formData);
      toast({ title: "Success!", description: "License added successfully", variant: "success" });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedLicense?.id) return;
    try {
      await updateLicense(selectedLicense.id, formData);
      toast({ title: "Success!", description: "License updated successfully", variant: "success" });
      setIsEditDialogOpen(false);
      setSelectedLicense(null);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedLicense?.id) return;
    try {
      await deleteLicense(selectedLicense.id);
      toast({ title: "Success!", description: "License deleted successfully", variant: "success" });
      setIsDeleteDialogOpen(false);
      setSelectedLicense(null);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const openEditDialog = (license: LicenseRecord) => {
    setSelectedLicense(license);
    setFormData({ licenseNumber: license.licenseNumber, name: license.name, dateOfIssue: license.dateOfIssue, validTill: license.validTill, vehicleClasses: license.vehicleClasses, stateOfIssue: license.stateOfIssue, notes: license.notes || '', documents: license.documents || [] });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => { setFormData({ licenseNumber: '', name: '', dateOfIssue: '', validTill: '', vehicleClasses: '', stateOfIssue: '', notes: '', documents: [] as DocumentAttachment[] }); };
  const toggleSensitiveData = (id: string, field: string) => { setShowSensitiveData(prev => ({ ...prev, [`${id}-${field}`]: !prev[`${id}-${field}`] })); };
  const copyToClipboard = (text: string, label: string) => { navigator.clipboard.writeText(text); toast({ title: "Copied!", description: `${label} copied` }); };
  const maskValue = (value: string, show: boolean) => (!value ? '' : show ? value : maskCardNumber(value));

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 text-foreground hover:bg-white/10"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div><h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3"><Car className="w-10 h-10 text-primary" />Driving Licenses</h1><p className="text-muted-foreground">Manage driving license details</p></div>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg" className="gap-2"><Plus className="w-5 h-5" />Add License</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div><p className="mt-4 text-gray-400">Loading...</p></div>
        ) : filteredLicenses.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-8 text-center"><div className="max-w-md mx-auto"><div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center"><Car className="w-10 h-10 text-primary" /></div><h2 className="text-2xl font-bold text-white mb-3">{searchQuery ? 'No Licenses Found' : 'No Licenses Yet'}</h2><p className="text-gray-400 mb-6">{searchQuery ? 'Try different keywords' : 'Add your first driving license'}</p>{!searchQuery && <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg"><Plus className="w-5 h-5 mr-2" />Add First License</Button>}</div></motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredLicenses.map((license, index) => (
                <motion.div key={license.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className="group hover:border-primary/50 transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div><CardTitle>{license.name}</CardTitle><CardDescription>{license.stateOfIssue}</CardDescription></div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(license)} className="hover:bg-primary/20"><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedLicense(license); setIsDeleteDialogOpen(true); }} className="hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label className="text-xs text-gray-500">License Number</Label><div className="flex items-center gap-2"><span className="text-foreground font-mono">{maskValue(license.licenseNumber, showSensitiveData[`${license.id}-licenseNumber`])}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSensitiveData(license.id!, 'licenseNumber')}>{showSensitiveData[`${license.id}-licenseNumber`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</Button><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(license.licenseNumber, 'License number')}><Copy className="w-3 h-3" /></Button></div></div>
                                                <div className="space-y-1"><Label className="text-xs text-gray-500">Vehicle Classes</Label><span className="text-foreground block">{license.vehicleClasses}</span></div>
                                                <div className="space-y-1"><Label className="text-xs text-gray-500">Date of Issue</Label><span className="text-foreground block">{license.dateOfIssue}</span></div>
                                                <div className="space-y-1"><Label className="text-xs text-gray-500">Valid Till</Label><span className="text-foreground block">{license.validTill}</span></div>
                      </div>
                      {license.notes && <div className="space-y-1 mt-2 pt-2 border-t border-white/10"><Label className="text-xs text-gray-500">Notes</Label><p className="text-sm text-gray-300">{license.notes}</p></div>}
                      <div className="text-xs text-gray-500 flex gap-4"><span>Created: {formatDate(license.createdAt)}</span><span>Updated: {formatDate(license.updatedAt)}</span></div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground rounded-lg shadow-lg">
            <DialogHeader><DialogTitle>Add Driving License</DialogTitle><DialogDescription>Enter license details.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="name">Name *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="stateOfIssue">State of Issue *</Label><Input id="stateOfIssue" value={formData.stateOfIssue} onChange={(e) => setFormData({ ...formData, stateOfIssue: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="licenseNumber">License Number *</Label><Input id="licenseNumber" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} type="password" /></div>
              <div className="grid gap-2"><Label htmlFor="vehicleClasses">Vehicle Classes *</Label><Input id="vehicleClasses" value={formData.vehicleClasses} onChange={(e) => setFormData({ ...formData, vehicleClasses: e.target.value })} placeholder="e.g., LMV, MCWG" /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="dateOfIssue">Date of Issue *</Label><Input id="dateOfIssue" type="date" value={formData.dateOfIssue} onChange={(e) => setFormData({ ...formData, dateOfIssue: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="validTill">Valid Till *</Label><Input id="validTill" type="date" value={formData.validTill} onChange={(e) => setFormData({ ...formData, validTill: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
              <div className="grid gap-2"><Label>Documents</Label><FileUploader documents={formData.documents} onDocumentsChange={(documents) => setFormData({ ...formData, documents })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!formData.name || !formData.licenseNumber || !formData.dateOfIssue || !formData.validTill || !formData.vehicleClasses || !formData.stateOfIssue}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground rounded-lg shadow-lg">
            <DialogHeader><DialogTitle>Edit License</DialogTitle><DialogDescription>Update license details.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="edit-name">Name *</Label><Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="edit-stateOfIssue">State of Issue *</Label><Input id="edit-stateOfIssue" value={formData.stateOfIssue} onChange={(e) => setFormData({ ...formData, stateOfIssue: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label htmlFor="edit-licenseNumber">License Number *</Label><Input id="edit-licenseNumber" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-vehicleClasses">Vehicle Classes *</Label><Input id="edit-vehicleClasses" value={formData.vehicleClasses} onChange={(e) => setFormData({ ...formData, vehicleClasses: e.target.value })} /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="edit-dateOfIssue">Date of Issue *</Label><Input id="edit-dateOfIssue" type="date" value={formData.dateOfIssue} onChange={(e) => setFormData({ ...formData, dateOfIssue: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="edit-validTill">Valid Till *</Label><Input id="edit-validTill" type="date" value={formData.validTill} onChange={(e) => setFormData({ ...formData, validTill: e.target.value })} /></div>
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
            <DialogHeader><DialogTitle>Delete License</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
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
