import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Landmark,
  Shield,
  Fingerprint,
  FileText,
  CarFront,
  Vote,
  FolderOpen,
  Files,
  LogOut,
  Settings,
} from 'lucide-react';

const categories = [
  { id: 'banks', name: 'Banks', icon: Landmark, color: 'bg-[#1976D2]', route: '/banks' },
  { id: 'cards', name: 'Cards', icon: CreditCard, color: 'bg-[#FB8C00]', route: '/cards' },
  { id: 'policies', name: 'Insurance', icon: Shield, color: 'bg-[#388E3C]', route: '/policies' },
  { id: 'aadhar', name: 'Aadhaar', icon: Fingerprint, color: 'bg-[#00897B]', route: '/aadhar' },
  { id: 'pan', name: 'PAN', icon: FileText, color: 'bg-[#D32F2F]', route: '/pan' },
  { id: 'license', name: 'License', icon: CarFront, color: 'bg-[#7B1FA2]', route: '/license' },
  { id: 'voterid', name: 'Voter ID', icon: Vote, color: 'bg-[#455A64]', route: '/voterid' },
  { id: 'misc', name: 'Misc', icon: FolderOpen, color: 'bg-[#546E7A]', route: '/misc' },
  { id: 'documents', name: 'All Documents', icon: Files, color: 'bg-gradient-to-br from-purple-500 to-pink-500', route: '/documents' },
];

export default function DashboardPage() {
  const { username, logout } = useAuthStore();
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    // You could load category counts here from the database
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {username}!
              </h1>
              <p className="text-gray-400">
                Your secure vault is ready
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/settings')}
                className="glass border-white/20"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onHoverStart={() => setHoveredCard(category.id)}
                onHoverEnd={() => setHoveredCard(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <button
                  onClick={() => navigate(category.route)}
                  className={`w-full aspect-square ${category.color} rounded-2xl p-6 shadow-xl transition-all duration-300 relative overflow-hidden group`}
                >
                  {/* Animated glow effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={hoveredCard === category.id ? {
                      background: [
                        'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                        'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                        'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                      ],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    <motion.div
                      animate={hoveredCard === category.id ? {
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.1, 1.1, 1.1, 1],
                      } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className="w-12 h-12 md:w-16 md:h-16 text-white mb-3 md:mb-4" />
                    </motion.div>
                    <h3 className="text-white font-bold text-lg md:text-xl text-center">
                      {category.name}
                    </h3>
                    <p className="text-white/80 text-sm mt-2">0 items</p>
                  </div>

                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                  />
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 text-sm">
            All your data is encrypted and stored locally on this device
          </p>
          <p className="text-gray-600 text-xs mt-2">
            SecureVault PWA • Offline-First • Zero-Knowledge
          </p>
        </motion.div>
      </div>
    </div>
  );
}
