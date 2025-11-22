import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  TestTube,
  Leaf,
  Sprout,
  FileText,
  MapPin,
  MessageSquare,
  Calendar,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard' },
    { icon: TestTube, label: t('nav.soilAnalysis'), path: '/soil-analysis' },
    { icon: Leaf, label: t('nav.plantHealth'), path: '/plant-health' },
    { icon: Sprout, label: t('nav.cropRecommendations'), path: '/crop-recommendations' },
    { icon: Calendar, label: t('nav.calendar'), path: '/calendar' },
    { icon: Award, label: t('nav.sustainability'), path: '/sustainability' },
    
  ];

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="bg-sidebar text-sidebar-foreground w-64 min-h-screen p-4 hidden lg:block border-r border-sidebar-border"
    >
      <nav className="space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.div
              key={item.path}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-md'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </motion.aside>
  );
};

export default Sidebar;
