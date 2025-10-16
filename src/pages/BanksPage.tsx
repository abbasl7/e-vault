import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Search, Eye, EyeOff, Copy, Edit2, Trash2, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBankStore } from '@/store/bankStore';
import { BankRecord, DocumentAttachment } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { formatDate, maskCardNumber } from '@/lib/utils';
import { FileUploader } from '@/components/FileUploader';

export default function BanksPage() {
  const navigate = useNavigate();
  const { banks, isLoading, fetchBanks, addBank, updateBank, deleteBank, searchBanks } = useBankStore();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSensitiveData, setShowSensitiveData] = useState<Record<string, boolean>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    accountNo: '',
    bankName: '',
    ifsc: '',
    cifNo: '',
    username: '',
    profilePrivy: '',
    mPin: '',
    tPin: '',
    notes: '',
    privy: '',
    documents: [] as DocumentAttachment[],
  });

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const filteredBanks = searchQuery ? searchBanks(searchQuery) : banks;

  const handleAdd = async () => {
    try {
      await addBank(formData);
      toast({
        title: "Success!",
        description: "Bank account added successfully",
        variant: "success",
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedBank?.id) return;
    try {
      await updateBank(selectedBank.id, formData);
      toast({
        title: "Success!",
        description: "Bank account updated successfully",
        variant: "success",
      });
      setIsEditDialogOpen(false);
      setSelectedBank(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedBank?.id) return;
    try {
      await deleteBank(selectedBank.id);
      toast({
        title: "Success!",
        description: "Bank account deleted successfully",
        variant: "success",
      });
      setIsDeleteDialogOpen(false);
      setSelectedBank(null);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (bank: BankRecord) => {
    setSelectedBank(bank);
    setFormData({
      title: bank.title,
      accountNo: bank.accountNo,
      bankName: bank.bankName,
      ifsc: bank.ifsc,
      cifNo: bank.cifNo || '',
      username: bank.username || '',
      profilePrivy: bank.profilePrivy || '',
      mPin: bank.mPin || '',
      tPin: bank.tPin || '',
      notes: bank.notes || '',
      privy: bank.privy || '',
      documents: bank.documents || [],
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (bank: BankRecord) => {
    setSelectedBank(bank);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      accountNo: '',
      bankName: '',
      ifsc: '',
      cifNo: '',
      username: '',
      profilePrivy: '',
      mPin: '',
      tPin: '',
      notes: '',
      privy: '',
      documents: [] as DocumentAttachment[],
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
      variant: "default",
    });
  };

  const toggleSensitiveData = (bankId: string, field: string) => {
    const key = `${bankId}-${field}`;
    setShowSensitiveData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskValue = (value: string, show: boolean) => {
    if (!value) return '';
    return show ? value : maskCardNumber(value);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Building2 className="w-10 h-10 text-primary" />
                Banks
              </h1>
              <p className="text-gray-400">Manage your bank account details securely</p>
            </div>
            
            <Button
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
              size="lg"
              className="gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Bank Account
            </Button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search banks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Banks List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading banks...</p>
          </div>
        ) : filteredBanks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                {searchQuery ? 'No Banks Found' : 'No Banks Yet'}
              </h2>
              <p className="text-gray-400 mb-6">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Start adding your bank account details to keep them secure and easily accessible.'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => {
                    resetForm();
                    setIsAddDialogOpen(true);
                  }}
                  size="lg"
                  className="gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add First Bank Account
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredBanks.map((bank, index) => (
                <motion.div
                  key={bank.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:border-primary/50 transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{bank.title}</CardTitle>
                          <CardDescription>{bank.bankName}</CardDescription>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(bank)}
                            className="hover:bg-primary/20 hover:text-primary"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(bank)}
                            className="hover:bg-red-500/20 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Account Number */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Account Number</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono">
                              {maskValue(bank.accountNo, showSensitiveData[`${bank.id}-accountNo`])}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleSensitiveData(bank.id!, 'accountNo')}
                            >
                              {showSensitiveData[`${bank.id}-accountNo`] ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(bank.accountNo, 'Account number')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* IFSC Code */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">IFSC Code</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono">{bank.ifsc}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(bank.ifsc, 'IFSC code')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* CIF Number */}
                        {bank.cifNo && (
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">CIF Number</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-mono">
                                {maskValue(bank.cifNo, showSensitiveData[`${bank.id}-cifNo`])}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleSensitiveData(bank.id!, 'cifNo')}
                              >
                                {showSensitiveData[`${bank.id}-cifNo`] ? (
                                  <EyeOff className="w-3 h-3" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(bank.cifNo, 'CIF number')}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Username */}
                        {bank.username && (
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Username</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-white">{bank.username}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(bank.username, 'Username')}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* MPIN */}
                        {bank.mPin && (
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">MPIN</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-mono">
                                {maskValue(bank.mPin, showSensitiveData[`${bank.id}-mPin`])}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleSensitiveData(bank.id!, 'mPin')}
                              >
                                {showSensitiveData[`${bank.id}-mPin`] ? (
                                  <EyeOff className="w-3 h-3" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(bank.mPin, 'MPIN')}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* TPIN */}
                        {bank.tPin && (
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">TPIN</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-mono">
                                {maskValue(bank.tPin, showSensitiveData[`${bank.id}-tPin`])}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleSensitiveData(bank.id!, 'tPin')}
                              >
                                {showSensitiveData[`${bank.id}-tPin`] ? (
                                  <EyeOff className="w-3 h-3" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(bank.tPin, 'TPIN')}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {bank.notes && (
                        <div className="space-y-1 mt-2 pt-2 border-t border-white/10">
                          <Label className="text-xs text-gray-500">Notes</Label>
                          <p className="text-sm text-gray-300">{bank.notes}</p>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="text-xs text-gray-500 flex gap-4">
                        <span>Created: {formatDate(bank.createdAt)}</span>
                        <span>Updated: {formatDate(bank.updatedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
              <DialogDescription>
                Enter your bank account details. All sensitive data will be encrypted.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Account Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., My Savings Account"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g., HDFC Bank"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ifsc">IFSC Code *</Label>
                  <Input
                    id="ifsc"
                    value={formData.ifsc}
                    onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                    placeholder="e.g., HDFC0001234"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accountNo">Account Number *</Label>
                <Input
                  id="accountNo"
                  value={formData.accountNo}
                  onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                  placeholder="Your account number"
                  type="password"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cifNo">CIF Number</Label>
                  <Input
                    id="cifNo"
                    value={formData.cifNo}
                    onChange={(e) => setFormData({ ...formData, cifNo: e.target.value })}
                    placeholder="Customer ID"
                    type="password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Online banking username"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="mPin">MPIN</Label>
                  <Input
                    id="mPin"
                    value={formData.mPin}
                    onChange={(e) => setFormData({ ...formData, mPin: e.target.value })}
                    placeholder="Mobile PIN"
                    type="password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tPin">TPIN</Label>
                  <Input
                    id="tPin"
                    value={formData.tPin}
                    onChange={(e) => setFormData({ ...formData, tPin: e.target.value })}
                    placeholder="Transaction PIN"
                    type="password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profilePrivy">Profile Password</Label>
                  <Input
                    id="profilePrivy"
                    value={formData.profilePrivy}
                    onChange={(e) => setFormData({ ...formData, profilePrivy: e.target.value })}
                    placeholder="Profile password"
                    type="password"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or details..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="privy">Additional Security Info</Label>
                <Input
                  id="privy"
                  value={formData.privy}
                  onChange={(e) => setFormData({ ...formData, privy: e.target.value })}
                  placeholder="Any other sensitive information"
                  type="password"
                />
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
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!formData.title || !formData.bankName || !formData.accountNo || !formData.ifsc}
              >
                Add Bank Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Bank Account</DialogTitle>
              <DialogDescription>
                Update your bank account details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Same form fields as Add Dialog */}
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Account Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., My Savings Account"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-bankName">Bank Name *</Label>
                  <Input
                    id="edit-bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g., HDFC Bank"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-ifsc">IFSC Code *</Label>
                  <Input
                    id="edit-ifsc"
                    value={formData.ifsc}
                    onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                    placeholder="e.g., HDFC0001234"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-accountNo">Account Number *</Label>
                <Input
                  id="edit-accountNo"
                  value={formData.accountNo}
                  onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                  placeholder="Your account number"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-cifNo">CIF Number</Label>
                  <Input
                    id="edit-cifNo"
                    value={formData.cifNo}
                    onChange={(e) => setFormData({ ...formData, cifNo: e.target.value })}
                    placeholder="Customer ID"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-username">Username</Label>
                  <Input
                    id="edit-username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Online banking username"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-mPin">MPIN</Label>
                  <Input
                    id="edit-mPin"
                    value={formData.mPin}
                    onChange={(e) => setFormData({ ...formData, mPin: e.target.value })}
                    placeholder="Mobile PIN"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-tPin">TPIN</Label>
                  <Input
                    id="edit-tPin"
                    value={formData.tPin}
                    onChange={(e) => setFormData({ ...formData, tPin: e.target.value })}
                    placeholder="Transaction PIN"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-profilePrivy">Profile Password</Label>
                  <Input
                    id="edit-profilePrivy"
                    value={formData.profilePrivy}
                    onChange={(e) => setFormData({ ...formData, profilePrivy: e.target.value })}
                    placeholder="Profile password"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or details..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-privy">Additional Security Info</Label>
                <Input
                  id="edit-privy"
                  value={formData.privy}
                  onChange={(e) => setFormData({ ...formData, privy: e.target.value })}
                  placeholder="Any other sensitive information"
                />
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
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={!formData.title || !formData.bankName || !formData.accountNo || !formData.ifsc}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Bank Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedBank?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
