import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from './LanguageSwitcher';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface NavbarProps {
  onLogout?: () => void;
  showAuth?: boolean;
}

const Navbar = ({ onLogout, showAuth = false }: NavbarProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/auth');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-card border-b border-border sticky top-0 z-50 shadow-sm"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-primary p-2 rounded-lg group-hover:scale-110 transition-transform">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground hidden sm:inline">
              {t('app.title')}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            {showAuth && (
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                {t('nav.logout')}
              </Button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="md:hidden pb-4 space-y-3"
          >
            <LanguageSwitcher />
            {showAuth && (
              <Button onClick={handleLogout} variant="outline" size="sm" className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                {t('nav.logout')}
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
