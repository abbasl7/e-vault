import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, X, File, Image, FileText, Eye, Download } from 'lucide-react';
import { Button } from './ui/button';
import { DocumentAttachment } from '@/types';
import { encryptFile, decryptFile } from '@/lib/crypto';
import { useAuthStore } from '@/store/authStore';

interface FileUploaderProps {
  documents: DocumentAttachment[];
  onDocumentsChange: (documents: DocumentAttachment[]) => void;
  maxFiles?: number;
  maxFileSizeMB?: number;
  acceptedTypes?: string[];
}

export function FileUploader({
  documents,
  onDocumentsChange,
  maxFiles = 10,
  maxFileSizeMB = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentAttachment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const encryptionKey = useAuthStore((state) => state.encryptionKey);

  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await uploadFiles(files);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!encryptionKey) {
      alert('Authentication key not available');
      return;
    }

    // Check max files limit
    if (documents.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);

    try {
      const newDocuments: DocumentAttachment[] = [];

      for (const file of files) {
        // Validate file type
        if (!acceptedTypes.includes(file.type)) {
          alert(`File type ${file.type} not supported. Please upload JPEG, PNG, or PDF files.`);
          continue;
        }

        // Validate file size
        if (file.size > maxFileSizeBytes) {
          alert(`File ${file.name} exceeds ${maxFileSizeMB}MB limit`);
          continue;
        }

        // Encrypt the file
        const encrypted = await encryptFile(file, encryptionKey);

        const doc: DocumentAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: Date.now(),
          encrypted,
        };

        newDocuments.push(doc);
      }

      // Add to documents array
      onDocumentsChange([...documents, ...newDocuments]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (docId: string) => {
    onDocumentsChange(documents.filter((doc) => doc.id !== docId));
    
    // Close preview if deleted
    if (previewDoc?.id === docId) {
      closePreview();
    }
  };

  const handlePreview = async (doc: DocumentAttachment) => {
    if (!encryptionKey) {
      alert('Authentication key not available');
      return;
    }

    try {
      const blob = await decryptFile(doc.encrypted, encryptionKey, doc.type);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewDoc(doc);
    } catch (error) {
      console.error('Preview error:', error);
      alert('Failed to preview file');
    }
  };

  const handleDownload = async (doc: DocumentAttachment) => {
    if (!encryptionKey) {
      alert('Authentication key not available');
      return;
    }

    try {
      const blob = await decryptFile(doc.encrypted, encryptionKey, doc.type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewDoc(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type === 'application/pdf') return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-700'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Drag & drop files here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 font-medium"
            disabled={isUploading || documents.length >= maxFiles}
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500">
          Max {maxFiles} files, {maxFileSizeMB}MB each (JPEG, PNG, PDF)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || documents.length >= maxFiles}
          aria-label="File upload input"
        />
      </div>

      {isUploading && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          🔒 Encrypting and uploading files...
        </div>
      )}

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Attached Documents ({documents.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(doc.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()} • 🔒 Encrypted
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(doc.type.startsWith('image/') || doc.type === 'application/pdf') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(doc)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    title="Delete"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={closePreview}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {previewDoc.name}
              </h3>
              <Button variant="ghost" size="sm" onClick={closePreview}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4">
              {previewDoc.type.startsWith('image/') ? (
                <img src={previewUrl} alt={previewDoc.name} className="max-w-full h-auto" />
              ) : previewDoc.type === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh]"
                  title={previewDoc.name}
                />
              ) : (
                <p className="text-gray-600">Preview not available for this file type</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
