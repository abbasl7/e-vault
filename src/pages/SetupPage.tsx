import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Shield, CheckCircle2 } from 'lucide-react';

const securityQuestions = [
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite book?",
  "What was your childhood nickname?",
];

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [question1, setQuestion1] = useState('');
  const [answer1, setAnswer1] = useState('');
  const [question2, setQuestion2] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const setupAccount = useAuthStore((state) => state.setupAccount);

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: '' };
    if (pwd.length < 8) return { strength: 25, label: 'Weak', color: 'bg-red-500' };
    if (pwd.length < 12) return { strength: 50, label: 'Fair', color: 'bg-yellow-500' };
    if (pwd.length < 16) return { strength: 75, label: 'Good', color: 'bg-blue-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleNext = () => {
    setError('');
    
    if (step === 1) {
      if (!username || username.length < 2) {
        setError('Username must be at least 2 characters');
        return;
      }
      if (!password || password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!question1 || !answer1 || !question2 || !answer2) {
      setError('Please answer both security questions');
      return;
    }

    if (question1 === question2) {
      setError('Please choose different security questions');
      return;
    }

    setIsLoading(true);

    try {
      await setupAccount({
        username,
        password,
        securityQuestion1: question1,
        securityAnswer1: answer1,
        securityQuestion2: question2,
        securityAnswer2: answer2,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4"
            >
              <Shield className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Your Vault</h1>
            <p className="text-gray-400">
              {step === 1 ? 'Set up your account credentials' : 'Set security questions for recovery'}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-white/10 text-gray-500'}`}>
              {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
            </div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-white/10 text-gray-500'}`}>
              2
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your username"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Password Strength</span>
                      <span className={`text-xs font-medium ${passwordStrength.strength >= 75 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength.strength}%` }}
                        className={`h-full ${passwordStrength.color}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Re-enter your password"
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Button onClick={handleNext} className="w-full h-12 text-base">
                Continue
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="question1" className="block text-sm font-medium text-gray-300 mb-2">
                  Security Question 1
                </label>
                <select
                  id="question1"
                  value={question1}
                  onChange={(e) => setQuestion1(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select a question</option>
                  {securityQuestions.map((q) => (
                    <option key={q} value={q} className="bg-gray-800">
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="answer1" className="block text-sm font-medium text-gray-300 mb-2">
                  Answer 1
                </label>
                <input
                  type="text"
                  id="answer1"
                  value={answer1}
                  onChange={(e) => setAnswer1(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your answer"
                  required
                />
              </div>

              <div>
                <label htmlFor="question2" className="block text-sm font-medium text-gray-300 mb-2">
                  Security Question 2
                </label>
                <select
                  id="question2"
                  value={question2}
                  onChange={(e) => setQuestion2(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select a question</option>
                  {securityQuestions.filter(q => q !== question1).map((q) => (
                    <option key={q} value={q} className="bg-gray-800">
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="answer2" className="block text-sm font-medium text-gray-300 mb-2">
                  Answer 2
                </label>
                <input
                  type="text"
                  id="answer2"
                  value={answer2}
                  onChange={(e) => setAnswer2(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your answer"
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Creating...
                    </span>
                  ) : (
                    'Create Vault'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Your master password cannot be recovered. Make sure to remember it!
        </p>
      </motion.div>
    </div>
  );
}
