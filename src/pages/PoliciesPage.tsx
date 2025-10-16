import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Search, Edit2, Trash2, Shield, Eye, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePolicyStore } from '@/store/policyStore';
import { PolicyRecord, DocumentAttachment } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import { FileUploader } from '@/components/FileUploader';
import { useAuthStore } from '@/store/authStore';
import { decryptFile } from '@/lib/crypto';
import { DocumentPreviewModal } from '@/components/DocumentPreviewModal';

export default function PoliciesPage() {
  const navigate = useNavigate();
  const { policies, isLoading, fetchPolicies, addPolicy, updatePolicy, deletePolicy, searchPolicies } = usePolicyStore();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDocument, setPreviewDocument] = useState<DocumentAttachment | null>(null);
  const encryptionKey = useAuthStore((s) => s.encryptionKey);
  
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    company: '',
    nextPremiumDate: '',
    premiumValue: '',
    maturityValue: '',
    notes: '',
    documents: [] as DocumentAttachment[],
  });

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const filteredPolicies = searchQuery ? searchPolicies(searchQuery) : policies;

  const handleAdd = async () => {
    try {
      await addPolicy(formData);
      toast({ title: "Success!", description: "Policy added successfully", variant: "success" });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedPolicy?.id) return;
    try {
      await updatePolicy(selectedPolicy.id, formData);
      toast({ title: "Success!", description: "Policy updated successfully", variant: "success" });
      setIsEditDialogOpen(false);
      setSelectedPolicy(null);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedPolicy?.id) return;
    try {
      await deletePolicy(selectedPolicy.id);
      toast({ title: "Success!", description: "Policy deleted successfully", variant: "success" });
      setIsDeleteDialogOpen(false);
      setSelectedPolicy(null);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const openEditDialog = (policy: PolicyRecord) => {
    setSelectedPolicy(policy);
    setFormData({
      name: policy.name,
      amount: policy.amount,
      company: policy.company,
      nextPremiumDate: policy.nextPremiumDate,
      premiumValue: policy.premiumValue,
      maturityValue: policy.maturityValue,
      notes: policy.notes || '',
      documents: policy.documents || [],
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (policy: PolicyRecord) => {
    setSelectedPolicy(policy);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', amount: '', company: '', nextPremiumDate: '', premiumValue: '', maturityValue: '', notes: '', documents: [] as DocumentAttachment[] });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 text-foreground hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
          </Button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Shield className="w-10 h-10 text-primary" />Insurance Policies
              </h1>
              <p className="text-muted-foreground">Manage your insurance policies</p>
            </div>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg" className="gap-2">
              <Plus className="w-5 h-5" />Add Policy
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search policies..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading policies...</p>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">{searchQuery ? 'No Policies Found' : 'No Policies Yet'}</h2>
              <p className="text-gray-400 mb-6">{searchQuery ? 'Try adjusting your search query' : 'Start adding your insurance policies.'}</p>
              {!searchQuery && (
                <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />Add First Policy
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredPolicies.map((policy, index) => (
                <motion.div key={policy.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.05 }}>
                  <Card className="group hover:border-primary/50 transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{policy.name}</CardTitle>
                          <CardDescription>{policy.company}</CardDescription>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(policy)} className="hover:bg-primary/20 hover:text-primary">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(policy)} className="hover:bg-red-500/20 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Policy Amount</Label>
                          <span className="text-foreground block">₹{policy.amount}</span>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Premium Value</Label>
                          <span className="text-foreground block">₹{policy.premiumValue}</span>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Maturity Value</Label>
                          <span className="text-foreground block">₹{policy.maturityValue}</span>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Next Premium Date</Label>
                          <span className="text-foreground block">{policy.nextPremiumDate}</span>
                        </div>
                      </div>
                      {policy.notes && (
                        <div className="space-y-1 mt-2 pt-2 border-t border-border">
                          <Label className="text-xs text-muted-foreground">Notes</Label>
                          <p className="text-sm text-muted-foreground">{policy.notes}</p>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground flex gap-4">
                        <span>Created: {formatDate(policy.createdAt)}</span>
                        <span>Updated: {formatDate(policy.updatedAt)}</span>
                      </div>
                      {policy.documents && policy.documents.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <Label className="text-xs text-muted-foreground">Attachments</Label>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {policy.documents.map((doc) => (
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>Add Insurance Policy</DialogTitle>
              <DialogDescription>Enter your policy details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Policy Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Life Insurance" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="e.g., LIC" />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Policy Amount *</Label>
                  <Input id="amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="10,00,000" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="premiumValue">Premium Value *</Label>
                  <Input id="premiumValue" value={formData.premiumValue} onChange={(e) => setFormData({ ...formData, premiumValue: e.target.value })} placeholder="50,000" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maturityValue">Maturity Value *</Label>
                  <Input id="maturityValue" value={formData.maturityValue} onChange={(e) => setFormData({ ...formData, maturityValue: e.target.value })} placeholder="15,00,000" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nextPremiumDate">Next Premium Date *</Label>
                <Input id="nextPremiumDate" value={formData.nextPremiumDate} onChange={(e) => setFormData({ ...formData, nextPremiumDate: e.target.value })} type="date" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." rows={3} />
              </div>
              
              {/* Document Upload */}
              <div className="grid gap-2">
                <Label>Documents</Label>
                <FileUploader
                  documents={formData.documents}
                  onDocumentsChange={(documents) => setFormData({ ...formData, documents })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!formData.name || !formData.company || !formData.amount || !formData.premiumValue || !formData.maturityValue || !formData.nextPremiumDate}>Add Policy</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>Edit Insurance Policy</DialogTitle>
              <DialogDescription>Update your policy details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Policy Name *</Label>
                  <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-company">Company *</Label>
                  <Input id="edit-company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">Policy Amount *</Label>
                  <Input id="edit-amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-premiumValue">Premium Value *</Label>
                  <Input id="edit-premiumValue" value={formData.premiumValue} onChange={(e) => setFormData({ ...formData, premiumValue: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-maturityValue">Maturity Value *</Label>
                  <Input id="edit-maturityValue" value={formData.maturityValue} onChange={(e) => setFormData({ ...formData, maturityValue: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-nextPremiumDate">Next Premium Date *</Label>
                <Input id="edit-nextPremiumDate" value={formData.nextPremiumDate} onChange={(e) => setFormData({ ...formData, nextPremiumDate: e.target.value })} type="date" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea id="edit-notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
              </div>
              
              {/* Document Upload */}
              <div className="grid gap-2">
                <Label>Documents</Label>
                <FileUploader
                  documents={formData.documents}
                  onDocumentsChange={(documents) => setFormData({ ...formData, documents })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-card text-card-foreground rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>Delete Policy</DialogTitle>
              <DialogDescription>Are you sure you want to delete "{selectedPolicy?.name}"? This action cannot be undone.</DialogDescription>
            </DialogHeader>
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
