import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Download, Eye, ExternalLink, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBankStore } from '@/store/bankStore';
import { useCardStore } from '@/store/cardStore';
import { usePolicyStore } from '@/store/policyStore';
import { useAadharStore } from '@/store/aadharStore';
import { usePanStore } from '@/store/panStore';
import { useLicenseStore } from '@/store/licenseStore';
import { useVoterIdStore } from '@/store/voterIdStore';
import { useMiscStore } from '@/store/miscStore';
import { useAuthStore } from '@/store/authStore';
import type { CardRecord, PolicyRecord, AadharRecord, PanRecord, LicenseRecord, VoterIdRecord, MiscRecord } from '@/types';
import { DocumentAttachment } from '@/types';
import { decryptFile } from '@/lib/crypto';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface DocumentWithMeta extends DocumentAttachment {
  categoryName: string;
  categoryPath: string;
  recordId: string;
  recordName: string;
}

export default function AllDocumentsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDocument, setPreviewDocument] = useState<DocumentWithMeta | null>(null);
  const setIsPreviewLoading = (_: boolean) => undefined; // placeholder (not needed)

  // Get all stores
  const { banks } = useBankStore();
  const { cards } = useCardStore();
  const { policies } = usePolicyStore();
  const { aadhars } = useAadharStore();
  const { pans } = usePanStore();
  const { licenses } = useLicenseStore();
  const { voterIds } = useVoterIdStore();
  const { misc } = useMiscStore();
  const encryptionKey = useAuthStore((s) => s.encryptionKey);

  // Aggregate all documents from all categories
  const allDocuments = useMemo(() => {
    const docs: DocumentWithMeta[] = [];

    // Banks
    banks.forEach((bank) => {
      bank.documents?.forEach((doc) => {
        docs.push({
          ...doc,
          categoryName: 'Banks',
          categoryPath: '/banks',
          recordId: String(bank.id ?? ''),
          recordName: bank.bankName ?? '',
        });
      });
    });

    // Cards
    cards.forEach((card: CardRecord) => {
      card.documents?.forEach((doc) => {
        const last4 = String(card.cardNumber ?? '').slice(-4);
        docs.push({
          ...doc,
          categoryName: 'Cards',
          categoryPath: '/cards',
          recordId: String(card.id ?? ''),
          recordName: `${card.cardType ?? ''}${last4 ? ' - ' + last4 : ''}`,
        });
      });
    });

    // Policies
    policies.forEach((policy: PolicyRecord) => {
      policy.documents?.forEach((doc) => {
        docs.push({
          ...doc,
          categoryName: 'Policies',
          categoryPath: '/policies',
          recordId: String(policy.id ?? ''),
          recordName: policy.name ?? '',
        });
      });
    });

    // Aadhaar
    aadhars.forEach((aadhar: AadharRecord) => {
      aadhar.documents?.forEach((doc) => {
        const last4 = String(aadhar.aadharNumber ?? '').slice(-4);
        docs.push({
          ...doc,
          categoryName: 'Aadhaar',
          categoryPath: '/aadhar',
          recordId: String(aadhar.id ?? ''),
          recordName: `Aadhaar${last4 ? ' - ' + last4 : ''}`,
        });
      });
    });

    // PAN
    pans.forEach((pan: PanRecord) => {
      pan.documents?.forEach((doc) => {
        docs.push({
          ...doc,
          categoryName: 'PAN',
          categoryPath: '/pan',
          recordId: String(pan.id ?? ''),
          recordName: pan.panNumber ?? '',
        });
      });
    });

    // License
    licenses.forEach((license: LicenseRecord) => {
      license.documents?.forEach((doc) => {
        docs.push({
          ...doc,
          categoryName: 'License',
          categoryPath: '/license',
          recordId: String(license.id ?? ''),
          recordName: license.licenseNumber ?? '',
        });
      });
    });

    // Voter ID
    voterIds.forEach((voterId: VoterIdRecord) => {
      voterId.documents?.forEach((doc) => {
        docs.push({
          ...doc,
          categoryName: 'Voter ID',
          categoryPath: '/voterid',
          recordId: String(voterId.id ?? ''),
          recordName: voterId.voterIdNumber ?? '',
        });
      });
    });

    // Miscellaneous
    misc.forEach((misc: MiscRecord) => {
      misc.documents?.forEach((doc) => {
        docs.push({
          ...doc,
          categoryName: 'Miscellaneous',
          categoryPath: '/misc',
          recordId: String(misc.id ?? ''),
          recordName: misc.title ?? '',
        });
      });
    });

    // Sort by upload date (newest first)
    return docs.sort((a, b) => b.uploadedAt - a.uploadedAt);
  }, [banks, cards, policies, aadhars, pans, licenses, voterIds, misc]);

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return allDocuments;

    const query = searchQuery.toLowerCase();
    return allDocuments.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.categoryName.toLowerCase().includes(query) ||
        doc.recordName.toLowerCase().includes(query)
    );
  }, [allDocuments, searchQuery]);

  // Group documents by category
  const documentsByCategory = useMemo(() => {
    const grouped: Record<string, DocumentWithMeta[]> = {};
    filteredDocuments.forEach((doc) => {
      if (!grouped[doc.categoryName]) {
        grouped[doc.categoryName] = [];
      }
      grouped[doc.categoryName].push(doc);
    });
    return grouped;
  }, [filteredDocuments]);

  const handlePreview = async (doc: DocumentWithMeta) => {
    setPreviewDocument(doc);
    setIsPreviewLoading(true);
    // Preview will be handled by the Dialog component
  };

  const handleDownload = async (doc: DocumentWithMeta) => {
    try {
      const decryptedBlob = await decryptFile(doc.encrypted, encryptionKey as CryptoKey, doc.type);
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Banks': 'bg-blue-500',
      'Cards': 'bg-purple-500',
      'Policies': 'bg-green-500',
      'Aadhaar': 'bg-orange-500',
      'PAN': 'bg-red-500',
      'License': 'bg-yellow-500',
      'Voter ID': 'bg-pink-500',
      'Miscellaneous': 'bg-gray-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  All Documents
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} across all categories
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search documents by name, category, or record..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredDocuments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No documents found' : 'No documents uploaded yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Upload documents to your records to see them here'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {Object.entries(documentsByCategory).map(([category, docs]) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {category}
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">{docs.length}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docs.map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
                    >
                      {/* Document Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(doc.size)} • {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Record Info */}
                      <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Record</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {doc.recordName}
                            </p>
                          </div>
                          <span className={`${getCategoryColor(doc.categoryName)} text-white ml-2 px-2 py-0.5 rounded text-xs`}>{doc.categoryName}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handlePreview(doc)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(doc.categoryPath)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {previewDocument && (
            <DocumentPreview
              document={previewDocument}
              encryptionKey={encryptionKey}
              onLoad={() => setIsPreviewLoading(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Document Preview Component
function DocumentPreview({
  document,
  encryptionKey,
  onLoad,
}: {
  document: DocumentWithMeta;
  encryptionKey: CryptoKey | null;
  onLoad: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useState(() => {
    const loadPreview = async () => {
      try {
        if (!encryptionKey) throw new Error('No encryption key');
        const decryptedBlob = await decryptFile(document.encrypted, encryptionKey, document.type);
        const url = URL.createObjectURL(decryptedBlob);
        setPreviewUrl(url);
        onLoad();
      } catch (err) {
        console.error('Preview failed:', err);
        setError('Failed to load preview');
        onLoad();
      }
    };

    loadPreview();

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  });

  if (error) {
    return (
      <div className="p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (!previewUrl) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Decrypting...</p>
      </div>
    );
  }

  const isImage = document.type.startsWith('image/');

  return (
    <div className="w-full h-full">
      {isImage ? (
        <img
          src={previewUrl}
          alt={document.name}
          className="w-full h-full object-contain"
        />
      ) : (
        <iframe
          src={previewUrl}
          title={document.name}
          className="w-full h-[80vh]"
        />
      )}
    </div>
  );
}
