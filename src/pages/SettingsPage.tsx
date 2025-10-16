import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Shield, Moon, Database, User, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { username, logout, changePassword } = useAuthStore();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast({ title: "Success!", description: "Password changed successfully. Please login again.", variant: "success" });
      setIsChangePasswordOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const calculateStorageUsage = () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2); // Convert to KB
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            Settings
          </h1>
          <p className="text-gray-400">Manage your vault preferences</p>
        </motion.div>

        <div className="grid gap-6">
          {/* Account Information */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Account Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Username</Label>
                  <Input value={username || ''} disabled className="bg-white/5" />
                </div>
                <div className="grid gap-2">
                  <Label>Created</Label>
                  <Input value={new Date(localStorage.getItem('vault_user_created') || Date.now()).toLocaleDateString()} disabled className="bg-white/5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Security</CardTitle>
                <CardDescription>Manage your security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Change Password</Label>
                    <p className="text-sm text-gray-400">Update your master password</p>
                  </div>
                  <Button onClick={() => setIsChangePasswordOpen(true)} variant="outline">Change</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Appearance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Moon className="w-5 h-5" />Appearance</CardTitle>
                <CardDescription>Dark theme enabled</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">Light mode coming soon!</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Storage */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" />Storage</CardTitle>
                <CardDescription>Your vault storage usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Local Storage Used</Label>
                    <p className="text-sm text-gray-400">All data stored on device</p>
                  </div>
                  <span className="text-2xl font-bold text-primary">{calculateStorageUsage()} KB</span>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <Button onClick={() => navigate('/backup-restore')} variant="outline" className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Backup & Restore
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-red-500/50">
              <CardHeader>
                <CardTitle className="text-red-500">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/password-reset')} variant="destructive" className="w-full">
                  Reset Master Password
                </Button>
                <p className="text-xs text-gray-500 mt-2">* This will require security questions</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Change Password Dialog */}
        <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="current">Current Password</Label>
                <Input id="current" type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new">New Password</Label>
                <Input id="new" type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input id="confirm" type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
              <Button onClick={handleChangePassword} disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}>Change Password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
