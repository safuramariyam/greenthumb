import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Leaf, Sprout, TestTube, TrendingUp } from 'lucide-react';
import Navbar from '@/components/Navbar';

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: TestTube,
      title: t('home.soilAnalysis'),
      description: t('home.soilAnalysisDesc'),
    },
    {
      icon: Leaf,
      title: t('home.plantHealth'),
      description: t('home.plantHealthDesc'),
    },
    {
      icon: Sprout,
      title: t('home.cropRecommendations'),
      description: t('home.cropRecommendationsDesc'),
    },
    {
      icon: TrendingUp,
      title: t('home.analyticsDashboard'),
      description: t('home.analyticsDashboardDesc'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-block bg-gradient-primary p-6 rounded-3xl mb-8"
          >
            <Leaf className="h-16 w-16 text-primary-foreground" />
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            {t('app.title')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('app.description')}
          </p>
          <Button onClick={() => navigate('/auth')} size="lg" className="text-lg px-8">
            {t('common.getStarted')}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="bg-gradient-accent p-3 rounded-lg inline-block mb-4">
                  <Icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
