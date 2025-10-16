import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ShieldAlert, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/authStore';

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuthStore();
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [securityData, setSecurityData] = useState({ answer1: '', answer2: '' });
  const [newPasswordData, setNewPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVerify = async () => {
    if (!securityData.answer1 || !securityData.answer2) {
      toast({ title: "Error", description: "Please answer both security questions", variant: "destructive" });
      return;
    }

    // Just move to next step - verification happens during reset
    toast({ title: "Success!", description: "Proceeding to password reset", variant: "success" });
    setStep('reset');
  };

  const handleReset = async () => {
    if (newPasswordData.newPassword !== newPasswordData.confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    if (newPasswordData.newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    try {
      setIsProcessing(true);
      await resetPassword(
        securityData.answer1,
        securityData.answer2,
        newPasswordData.newPassword
      );

      toast({ 
        title: "Success!", 
        description: "Password reset successfully. Please login with your new password.", 
        variant: "success" 
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get security questions from localStorage
  const authData = JSON.parse(localStorage.getItem('vault_auth') || '{}');
  const question1 = authData.securityQuestion1 || 'What is your favorite color?';
  const question2 = authData.securityQuestion2 || 'What city were you born in?';

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/settings')} className="mb-4 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <ShieldAlert className="w-10 h-10 text-red-500" />
            Reset Master Password
          </h1>
          <p className="text-gray-400">Verify your identity and set a new password</p>
        </motion.div>

        <div className="space-y-6">
          {/* Warning Alert */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert className="border-red-500/50">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <AlertDescription className="text-red-200">
                This will reset your master password. All your data will be re-encrypted with the new password.
                You must answer your security questions correctly.
              </AlertDescription>
            </Alert>
          </motion.div>

          {step === 'verify' ? (
            /* Step 1: Verify Security Questions */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Step 1: Verify Identity</CardTitle>
                  <CardDescription>Answer your security questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="answer1">{question1}</Label>
                    <Input
                      id="answer1"
                      type="text"
                      value={securityData.answer1}
                      onChange={(e) => setSecurityData({ ...securityData, answer1: e.target.value })}
                      placeholder="Your answer"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="answer2">{question2}</Label>
                    <Input
                      id="answer2"
                      type="text"
                      value={securityData.answer2}
                      onChange={(e) => setSecurityData({ ...securityData, answer2: e.target.value })}
                      placeholder="Your answer"
                    />
                  </div>
                  <Button
                    onClick={handleVerify}
                    disabled={!securityData.answer1 || !securityData.answer2 || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      'Verify Answers'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* Step 2: Set New Password */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-green-500/50">
                <CardHeader>
                  <CardTitle className="text-green-500">Step 2: Set New Password</CardTitle>
                  <CardDescription>Choose a strong new master password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPasswordData.newPassword}
                      onChange={(e) => setNewPasswordData({ ...newPasswordData, newPassword: e.target.value })}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={newPasswordData.confirmPassword}
                      onChange={(e) => setNewPasswordData({ ...newPasswordData, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                    />
                  </div>
                  <Button
                    onClick={handleReset}
                    disabled={!newPasswordData.newPassword || !newPasswordData.confirmPassword || isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Info Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle>How Password Reset Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-300">
                <div>
                  <h4 className="font-semibold text-white mb-1">Step 1: Verification</h4>
                  <p>Answer both security questions you set during account creation.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Step 2: New Password</h4>
                  <p>Set a new strong password (at least 6 characters).</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Re-encryption</h4>
                  <p>All your vault data will be automatically re-encrypted with the new password.</p>
                </div>
                <div className="pt-2 border-t border-white/10 text-yellow-500">
                  <p className="font-semibold">⚠️ Important:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your security answers are case-insensitive</li>
                    <li>Wrong answers will prevent password reset</li>
                    <li>You'll need to login again after reset</li>
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
