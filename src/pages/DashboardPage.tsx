import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useBankStore } from '@/store/bankStore';
import { useCardStore } from '@/store/cardStore';
import { usePolicyStore } from '@/store/policyStore';
import { useAadharStore } from '@/store/aadharStore';
import { usePanStore } from '@/store/panStore';
import { useLicenseStore } from '@/store/licenseStore';
import { useVoterIdStore } from '@/store/voterIdStore';
import { useMiscStore } from '@/store/miscStore';
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
  Moon,
  Sun,
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
];

export default function DashboardPage() {
  const { username, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [installAvailable, setInstallAvailable] = useState<boolean>(false);

  // Reactive counts using store hooks
  const banksCount = useBankStore((s) => s.banks.length);
  const cardsCount = useCardStore((s) => s.cards.length);
  const policiesCount = usePolicyStore((s) => s.policies.length);
  const aadharCount = useAadharStore((s) => s.aadhars.length);
  const panCount = usePanStore((s) => s.pans.length);
  const licenseCount = useLicenseStore((s) => s.licenses.length);
  const voteridCount = useVoterIdStore((s) => s.voterIds.length);
  const miscCount = useMiscStore((s) => s.misc.length);

  useEffect(() => {
    // Fetch stores once on mount so they populate their state
    (async () => {
      try {
        const bankStore = (await import('@/store/bankStore')).useBankStore;
        const cardStore = (await import('@/store/cardStore')).useCardStore;
        const policyStore = (await import('@/store/policyStore')).usePolicyStore;
        const aadharStore = (await import('@/store/aadharStore')).useAadharStore;
        const panStore = (await import('@/store/panStore')).usePanStore;
        const licenseStore = (await import('@/store/licenseStore')).useLicenseStore;
        const voterStore = (await import('@/store/voterIdStore')).useVoterIdStore;
        const miscStore = (await import('@/store/miscStore')).useMiscStore;

        await Promise.all([
          bankStore.getState().fetchBanks(),
          cardStore.getState().fetchCards(),
          policyStore.getState().fetchPolicies(),
          aadharStore.getState().fetchAadhars(),
          panStore.getState().fetchPans(),
          licenseStore.getState().fetchLicenses(),
          voterStore.getState().fetchVoterIds(),
          miscStore.getState().fetchMisc(),
        ]);
      } catch (err) {
        console.error('Failed to initialize stores', err);
      }
    })();

    // Listen for beforeinstallprompt so we can show install button
    const onBefore = (e: any) => {
      e.preventDefault();
      (window as any).__deferredPrompt = e;
      setInstallAvailable(true);
    };
    window.addEventListener('beforeinstallprompt', onBefore as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore as EventListener);
    };
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
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-md p-2 bg-primary/10 flex items-center justify-center">
                <img src="/eternalvault-logo.svg" alt="EternalVault" className="w-9 h-9" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-foreground">EternalVault</h1>
                <p className="text-muted-foreground">Welcome back, {username}!</p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="glass border-white/20"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/settings')}
                className="glass border-white/20"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/documents')}
                className="glass border-white/10"
                title="All Documents"
              >
                <Files className="w-5 h-5" />
              </Button>
              {installAvailable && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const p = (window as any).__deferredPrompt;
                    if (p) {
                      p.prompt();
                      p.userChoice.then((choice: any) => {
                        if (choice.outcome === 'accepted') console.log('User accepted install');
                      });
                    } else if ((window as any).__installApp) {
                      (window as any).__installApp();
                    }
                  }}
                  className="glass border-white/10"
                  title="Install App"
                >
                  <FolderOpen className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                size="icon"
                title="Logout"
                className="text-destructive"
              >
                <LogOut className="w-5 h-5" />
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
                      <Icon className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-foreground mb-2 sm:mb-3 md:mb-4" />
                    </motion.div>
                    <h3 className="text-foreground font-bold text-md sm:text-lg md:text-xl text-center">
                      {category.name}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-2">{(category.id === 'banks' ? banksCount : category.id === 'cards' ? cardsCount : category.id === 'policies' ? policiesCount : category.id === 'aadhar' ? aadharCount : category.id === 'pan' ? panCount : category.id === 'license' ? licenseCount : category.id === 'voterid' ? voteridCount : category.id === 'misc' ? miscCount : 0)} item{(category.id === 'banks' ? banksCount : category.id === 'cards' ? cardsCount : category.id === 'policies' ? policiesCount : category.id === 'aadhar' ? aadharCount : category.id === 'pan' ? panCount : category.id === 'license' ? licenseCount : category.id === 'voterid' ? voteridCount : category.id === 'misc' ? miscCount : 0) !== 1 ? 's' : ''}</p>
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
          <p className="text-muted-foreground text-sm">
            All your data is encrypted and stored locally on this device
          </p>
          <p className="text-muted-foreground/70 text-xs mt-2">
            EternalVault • Offline-First • Zero-Knowledge
          </p>
        </motion.div>
      </div>
    </div>
  );
}
