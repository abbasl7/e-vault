import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DocumentAttachment } from '@/types';
import { decryptFile } from '@/lib/crypto';

interface DocumentPreviewModalProps {
  document: DocumentAttachment | null;
  isOpen: boolean;
  onClose: () => void;
  encryptionKey: CryptoKey | null;
}

export function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
  encryptionKey,
}: DocumentPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!document || !isOpen) return;

    let isMounted = true;

    const loadPreview = async () => {
      setIsLoading(true);
      setError('');
      setPreviewUrl('');

      try {
        if (!encryptionKey) throw new Error('No encryption key');
        const decryptedBlob = await decryptFile(document.encrypted, encryptionKey, document.type);
        const url = URL.createObjectURL(decryptedBlob);
        if (isMounted) {
          setPreviewUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load preview');
          console.error('Preview error:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      isMounted = false;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [document, isOpen, encryptionKey]);

  const isImage = document?.type.startsWith('image/');
  const isPdf = document?.type === 'application/pdf';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        {isLoading && (
          <div className="flex items-center justify-center h-96 bg-background">
            <div className="text-center">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
              <p className="text-muted-foreground">Decrypting...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-96 bg-background">
            <div className="text-center">
              <p className="text-destructive">{error}</p>
            </div>
          </div>
        )}

        {previewUrl && !isLoading && (
          <div className="w-full h-full bg-background">
            {isImage ? (
              <img
                src={previewUrl}
                alt={document?.name}
                className="w-full h-full object-contain"
              />
            ) : isPdf ? (
              <iframe
                src={previewUrl}
                className="w-full h-[80vh]"
                title={document?.name}
              />
            ) : (
              <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Preview not available for this file type</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
