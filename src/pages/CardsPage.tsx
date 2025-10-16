import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Search, Eye, EyeOff, Copy, Edit2, Trash2, CreditCard, Download } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { decryptFile } from '@/lib/crypto';
import { DocumentPreviewModal } from '@/components/DocumentPreviewModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardStore } from '@/store/cardStore';
import { CardRecord, DocumentAttachment } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { formatDate, maskCardNumber, formatCardNumber } from '@/lib/utils';
import { FileUploader } from '@/components/FileUploader';

export default function CardsPage() {
  const navigate = useNavigate();
  const { cards, isLoading, fetchCards, addCard, updateCard, deleteCard, searchCards } = useCardStore();
  const encryptionKey = useAuthStore((s) => s.encryptionKey);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSensitiveData, setShowSensitiveData] = useState<Record<string, boolean>>({});
  const [previewDocument, setPreviewDocument] = useState<DocumentAttachment | null>(null);
  
  const [formData, setFormData] = useState({
    bankName: '',
    cardType: 'Credit',
    cardNumber: '',
    cvv: '',
    validTill: '',
    customerId: '',
    pin: '',
    notes: '',
    documents: [] as DocumentAttachment[],
  });

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const filteredCards = searchQuery ? searchCards(searchQuery) : cards;

  const handleAdd = async () => {
    try {
      await addCard(formData);
      toast({
        title: "Success!",
        description: "Card added successfully",
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
    if (!selectedCard?.id) return;
    try {
      await updateCard(selectedCard.id, formData);
      toast({
        title: "Success!",
        description: "Card updated successfully",
        variant: "success",
      });
      setIsEditDialogOpen(false);
      setSelectedCard(null);
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
    if (!selectedCard?.id) return;
    try {
      await deleteCard(selectedCard.id);
      toast({
        title: "Success!",
        description: "Card deleted successfully",
        variant: "success",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCard(null);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (card: CardRecord) => {
    setSelectedCard(card);
    setFormData({
      bankName: card.bankName,
      cardType: card.cardType,
      cardNumber: card.cardNumber,
      cvv: card.cvv,
      validTill: card.validTill,
      customerId: card.customerId || '',
      pin: card.pin || '',
      notes: card.notes || '',
      documents: card.documents || [],
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (card: CardRecord) => {
    setSelectedCard(card);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      bankName: '',
      cardType: 'Credit',
      cardNumber: '',
      cvv: '',
      validTill: '',
      customerId: '',
      pin: '',
      notes: '',
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

  const toggleSensitiveData = (cardId: string, field: string) => {
    const key = `${cardId}-${field}`;
    setShowSensitiveData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskValue = (value: string, show: boolean) => {
    if (!value) return '';
    return show ? value : maskCardNumber(value);
  };

  const CardTypeIcon = ({ type }: { type: string }) => {
    const colors = {
      Credit: 'text-blue-400',
      Debit: 'text-green-400',
      Prepaid: 'text-purple-400',
    };
    return <CreditCard className={`w-5 h-5 ${colors[type as keyof typeof colors] || 'text-gray-400'}`} />;
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 text-foreground hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <CreditCard className="w-10 h-10 text-primary" />
                Cards
              </h1>
              <p className="text-muted-foreground">Manage your credit and debit cards securely</p>
            </div>
            
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Add Card
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search cards..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading cards...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center">
                <CreditCard className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">{searchQuery ? 'No Cards Found' : 'No Cards Yet'}</h2>
              <p className="text-gray-400 mb-6">{searchQuery ? 'Try adjusting your search query' : 'Start adding your cards to keep them secure.'}</p>
              {!searchQuery && (
                <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Add First Card
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredCards.map((card, index) => (
                <motion.div key={card.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.05 }}>
                  <Card className="group hover:border-primary/50 transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <CardTypeIcon type={card.cardType} />
                          <div>
                            <CardTitle className="text-xl">{card.bankName}</CardTitle>
                            <CardDescription>{card.cardType} Card</CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(card)} className="hover:bg-primary/20 hover:text-primary">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(card)} className="hover:bg-red-500/20 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Card Number</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-mono">{showSensitiveData[`${card.id}-cardNumber`] ? formatCardNumber(card.cardNumber) : maskCardNumber(card.cardNumber)}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSensitiveData(card.id!, 'cardNumber')}>
                              {showSensitiveData[`${card.id}-cardNumber`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(card.cardNumber, 'Card number')}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Valid Till</Label>
                          <span className="text-foreground block">{card.validTill}</span>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">CVV</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-mono">{maskValue(card.cvv, showSensitiveData[`${card.id}-cvv`])}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSensitiveData(card.id!, 'cvv')}>
                              {showSensitiveData[`${card.id}-cvv`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(card.cvv, 'CVV')}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {card.pin && (
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">PIN</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-mono">{maskValue(card.pin, showSensitiveData[`${card.id}-pin`])}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSensitiveData(card.id!, 'pin')}>
                                {showSensitiveData[`${card.id}-pin`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(card.pin, 'PIN')}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {card.customerId && (
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Customer ID</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-mono">{maskValue(card.customerId, showSensitiveData[`${card.id}-customerId`])}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSensitiveData(card.id!, 'customerId')}>
                                {showSensitiveData[`${card.id}-customerId`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(card.customerId, 'Customer ID')}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {card.notes && (
                        <div className="space-y-1 mt-2 pt-2 border-t border-white/10">
                          <Label className="text-xs text-gray-500">Notes</Label>
                          <p className="text-sm text-gray-300">{card.notes}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 flex gap-4">
                        <span>Created: {formatDate(card.createdAt)}</span>
                        <span>Updated: {formatDate(card.updatedAt)}</span>
                      </div>
                      {/* Attachments */}
                      {card.documents && card.documents.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <Label className="text-xs text-gray-500">Attachments</Label>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {card.documents.map((doc) => (
                              <div key={doc.id} className="bg-gray-100 dark:bg-gray-800 p-2 rounded flex items-center gap-2">
                                <span className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-[160px]">{doc.name}</span>
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

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>Add Card</DialogTitle>
              <DialogDescription>Enter your card details. All sensitive data will be encrypted.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input id="bankName" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} placeholder="e.g., HDFC Bank" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cardType">Card Type *</Label>
                  <Select value={formData.cardType} onValueChange={(value) => setFormData({ ...formData, cardType: value })}>
                    <SelectTrigger id="cardType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Credit">Credit Card</SelectItem>
                      <SelectItem value="Debit">Debit Card</SelectItem>
                      <SelectItem value="Prepaid">Prepaid Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cardNumber">Card Number *</Label>
                <Input id="cardNumber" value={formData.cardNumber} onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })} placeholder="1234 5678 9012 3456" type="password" />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input id="cvv" value={formData.cvv} onChange={(e) => setFormData({ ...formData, cvv: e.target.value })} placeholder="123" type="password" maxLength={4} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="validTill">Valid Till *</Label>
                  <Input id="validTill" value={formData.validTill} onChange={(e) => setFormData({ ...formData, validTill: e.target.value })} placeholder="MM/YY" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pin">PIN</Label>
                  <Input id="pin" value={formData.pin} onChange={(e) => setFormData({ ...formData, pin: e.target.value })} placeholder="4-digit PIN" type="password" maxLength={6} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customerId">Customer ID</Label>
                <Input id="customerId" value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })} placeholder="Customer identification number" type="password" />
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
              <Button onClick={handleAdd} disabled={!formData.bankName || !formData.cardNumber || !formData.cvv || !formData.validTill}>Add Card</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog - Similar to Add */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>Edit Card</DialogTitle>
              <DialogDescription>Update your card details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-bankName">Bank Name *</Label>
                  <Input id="edit-bankName" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} placeholder="e.g., HDFC Bank" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-cardType">Card Type *</Label>
                  <Select value={formData.cardType} onValueChange={(value) => setFormData({ ...formData, cardType: value })}>
                    <SelectTrigger id="edit-cardType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Credit">Credit Card</SelectItem>
                      <SelectItem value="Debit">Debit Card</SelectItem>
                      <SelectItem value="Prepaid">Prepaid Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-cardNumber">Card Number *</Label>
                <div className="flex items-center gap-2">
                  <Input id="edit-cardNumber" value={formData.cardNumber} onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })} placeholder="1234 5678 9012 3456" type={showSensitiveData[`${selectedCard?.id}-cardNumber`] ? 'text' : 'password'} />
                  <Button variant="ghost" size="icon" onClick={() => toggleSensitiveData(selectedCard?.id ?? '', 'cardNumber')}>
                    {showSensitiveData[`${selectedCard?.id}-cardNumber`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-cvv">CVV *</Label>
                  <Input id="edit-cvv" value={formData.cvv} onChange={(e) => setFormData({ ...formData, cvv: e.target.value })} placeholder="123" maxLength={4} />
                  <Button variant="ghost" size="icon" onClick={() => toggleSensitiveData(selectedCard?.id ?? '', 'cvv')}>
                    {showSensitiveData[`${selectedCard?.id}-cvv`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-validTill">Valid Till *</Label>
                  <Input id="edit-validTill" value={formData.validTill} onChange={(e) => setFormData({ ...formData, validTill: e.target.value })} placeholder="MM/YY" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-pin">PIN</Label>
                  <Input id="edit-pin" value={formData.pin} onChange={(e) => setFormData({ ...formData, pin: e.target.value })} placeholder="4-digit PIN" maxLength={6} />
                  <Button variant="ghost" size="icon" onClick={() => toggleSensitiveData(selectedCard?.id ?? '', 'pin')}>
                    {showSensitiveData[`${selectedCard?.id}-pin`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-customerId">Customer ID</Label>
                  <div className="flex items-center gap-2">
                    <Input id="edit-customerId" value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })} placeholder="Customer identification number" type={showSensitiveData[`${selectedCard?.id}-customerId`] ? 'text' : 'password'} />
                    <Button variant="ghost" size="icon" onClick={() => toggleSensitiveData(selectedCard?.id ?? '', 'customerId')}>
                      {showSensitiveData[`${selectedCard?.id}-customerId`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea id="edit-notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." rows={3} />
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
              <Button onClick={handleEdit} disabled={!formData.bankName || !formData.cardNumber || !formData.cvv || !formData.validTill}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-card text-card-foreground rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>Delete Card</DialogTitle>
              <DialogDescription>Are you sure you want to delete this card? This action cannot be undone.</DialogDescription>
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
