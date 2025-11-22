import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sustainabilityTips } from '@/utils/dummyData';
import { Progress } from '@/components/ui/progress';
import { Leaf, TrendingUp } from 'lucide-react';
import { formatNumber } from '@/utils/dateUtils';

const Sustainability = () => {
  const { t, i18n } = useTranslation();
  const sustainabilityScore = 78;
  
  // Format score reactively to language changes
  const formattedScore = useMemo(() => formatNumber(sustainabilityScore), [i18n.language]);

  // Map tip categories to translation keys
  const tipCategoryMap: Record<string, string> = {
    'Drip Irrigation': 'dripIrrigation',
    'Composting': 'composting',
    'Crop Rotation': 'cropRotation',
    'Mulching': 'mulching',
  };

  // Memoize tips with translations that update with language
  const translatedTips = useMemo(() => {
    return sustainabilityTips.map(tip => ({
      ...tip,
      translatedTitle: t(`sustainability.tips.${tipCategoryMap[tip.title] || tip.title.toLowerCase().replace(/\s+/g, '')}.title`),
      translatedDescription: t(`sustainability.tips.${tipCategoryMap[tip.title] || tip.title.toLowerCase().replace(/\s+/g, '')}.description`),
    }));
  }, [i18n.language, t]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold text-foreground">{t('sustainability.title')}</h1>
        <p className="text-muted-foreground">{t('sustainability.trackPractices')}</p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-full">
                <Leaf className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <p className="text-sm opacity-90">{t('sustainability.yourScore')}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-bold">{formattedScore}</span>
                  <span className="text-lg">/100</span>
                  <TrendingUp className="h-5 w-5 ml-2" />
                </div>
                <Progress value={sustainabilityScore} className="mt-3 bg-white/20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('sustainability.ecoTips')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {translatedTips.map((tip, index) => (
            <motion.div
              key={tip.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{tip.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-2">{tip.translatedTitle}</h3>
                      <p className="text-sm text-muted-foreground">{tip.translatedDescription}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sustainability;
