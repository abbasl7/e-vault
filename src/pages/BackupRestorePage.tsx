import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Download, Upload, Database, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { encrypt, decrypt, deriveKey, hexToBuffer } from '@/lib/crypto';

export default function BackupRestorePage() {
  const navigate = useNavigate();
  const [backupPassword, setBackupPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Fixed salt for backup encryption (can be public)
  const BACKUP_SALT = hexToBuffer('6261636b75702d73616c742d76312d666978656400000000000000000000'); // "backup-salt-v1-fixed"

  const handleExportBackup = async () => {
    if (!backupPassword || backupPassword.length < 6) {
      toast({ title: "Error", description: "Backup password must be at least 6 characters", variant: "destructive" });
      return;
    }

    try {
      setIsExporting(true);
      
      // Collect all vault data from localStorage
      const vaultData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vault_')) {
          vaultData[key] = localStorage.getItem(key) || '';
        }
      }

      // Create backup object
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: vaultData,
      };

      // Encrypt backup with password
      const backupJson = JSON.stringify(backup);
      const backupKey = await deriveKey(backupPassword, BACKUP_SALT);
      const encryptedBackup = await encrypt(backupJson, backupKey);

      // Download as file
      const blob = new Blob([JSON.stringify(encryptedBackup)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `securevault-backup-${new Date().toISOString().split('T')[0]}.vault`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success!", description: "Backup exported successfully", variant: "success" });
      setBackupPassword('');
    } catch (error) {
      toast({ title: "Error", description: "Failed to export backup: " + (error as Error).message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!backupPassword) {
      toast({ title: "Error", description: "Enter backup password first", variant: "destructive" });
      return;
    }

    try {
      setIsImporting(true);

      // Read file
      const text = await file.text();
      const encryptedBackup = JSON.parse(text);

      // Decrypt backup
      const backupKey = await deriveKey(backupPassword, BACKUP_SALT);
      const decryptedJson = await decrypt(encryptedBackup, backupKey);
      const backup = JSON.parse(decryptedJson);

      // Validate backup
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup file');
      }

      // Restore data
      for (const [key, value] of Object.entries(backup.data)) {
        localStorage.setItem(key, value as string);
      }

      toast({ title: "Success!", description: "Backup restored successfully. Please refresh the page.", variant: "success" });
      
      // Reload after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast({ title: "Error", description: "Failed to restore backup: " + (error as Error).message, variant: "destructive" });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/settings')} className="mb-4 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="w-10 h-10 text-primary" />
            Backup & Restore
          </h1>
          <p className="text-gray-400">Export and import your encrypted vault data</p>
        </motion.div>

        <div className="grid gap-6">
          {/* Info Alert */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Your backup will be encrypted with a separate password. Keep this password safe - you'll need it to restore your data.
              </AlertDescription>
            </Alert>
          </motion.div>

          {/* Export Backup */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Backup
                </CardTitle>
                <CardDescription>Create an encrypted backup of all your vault data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="export-password">Backup Password *</Label>
                  <Input
                    id="export-password"
                    type="password"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    placeholder="Choose a strong password for backup"
                  />
                  <p className="text-xs text-gray-500">Use a different password from your master password</p>
                </div>
                <Button
                  onClick={handleExportBackup}
                  disabled={!backupPassword || isExporting}
                  className="w-full gap-2"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export Backup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Import Backup */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-yellow-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-500">
                  <Upload className="w-5 h-5" />
                  Restore Backup
                </CardTitle>
                <CardDescription>Restore your vault data from an encrypted backup file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-yellow-500/50">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-200">
                    Warning: This will overwrite all existing data in your vault!
                  </AlertDescription>
                </Alert>
                <div className="grid gap-2">
                  <Label htmlFor="import-password">Backup Password *</Label>
                  <Input
                    id="import-password"
                    type="password"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    placeholder="Enter backup file password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="import-file">Backup File *</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".vault"
                    onChange={handleImportBackup}
                    disabled={!backupPassword || isImporting}
                    className="cursor-pointer file:cursor-pointer"
                  />
                </div>
                {isImporting && (
                  <div className="flex items-center gap-2 text-yellow-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent"></div>
                    <span>Restoring backup...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* How It Works */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-300">
                <div>
                  <h4 className="font-semibold text-white mb-1">Export Backup:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>All your vault data is collected</li>
                    <li>Encrypted with your backup password</li>
                    <li>Downloaded as a .vault file</li>
                    <li>Store this file safely (cloud, USB, etc.)</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <h4 className="font-semibold text-white mb-1">Restore Backup:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Upload your .vault backup file</li>
                    <li>Enter the backup password</li>
                    <li>Data is decrypted and restored</li>
                    <li>Page refreshes automatically</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-white/10 text-yellow-500">
                  <p className="font-semibold">⚠️ Important:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Keep your backup file and password safe</li>
                    <li>Regular backups are recommended</li>
                    <li>Restore will overwrite current data</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
