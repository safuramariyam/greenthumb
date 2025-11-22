import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/ImageUpload';
import { soilHealthData } from '@/utils/dummyData';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { formatNumber, formatDecimal } from '@/utils/dateUtils';

const SoilAnalysis = () => {
  const { t, i18n } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [formData, setFormData] = useState(soilHealthData);

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = () => {
    setShowResults(true);
  };

  const getRecommendation = (key: string, value: number) => {
    const recommendations: Record<string, string> = {
      ph: value < 6 ? 'Add lime to increase pH' : value > 7.5 ? 'Add sulfur to decrease pH' : 'pH level is optimal',
      nitrogen: value < 40 ? 'Apply nitrogen-rich fertilizer' : 'Nitrogen level is good',
      phosphorus: value < 25 ? 'Add phosphate fertilizer' : 'Phosphorus level is adequate',
      potassium: value < 50 ? 'Apply potassium fertilizer' : 'Potassium level is healthy',
      moisture: value < 30 ? 'Increase irrigation' : value > 70 ? 'Reduce watering' : 'Moisture is optimal',
    };
    return recommendations[key] || 'Level is normal';
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold text-foreground">{t('soil.analysis')}</h1>
        <p className="text-muted-foreground">Upload soil images and input nutrient data</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('soil.uploadImage')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                onImageSelect={handleImageSelect}
                preview={image || undefined}
                onClear={() => setImage(null)}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('soil.parameters')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(formData).map(([key, value]) => {
                // Map keys to correct translation keys
                const translationKeyMap: Record<string, string> = {
                  ph: 'phLevel',
                  nitrogen: 'nitrogenShort',
                  phosphorus: 'phosphorusShort',
                  potassium: 'potassiumShort',
                };
                const translationKey = translationKeyMap[key] || key;
                return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>
                    {t(`soil.${translationKey}`)}
                  </Label>
                  <Input
                    id={key}
                    type="number"
                    value={value}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
                );
              })}
              <Button onClick={handleAnalyze} className="w-full" size="lg">
                {t('soil.analyze')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {showResults && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('soil.results')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {useMemo(() => {
                return Object.entries(formData).map(([key, value]) => {
                  const isOptimal =
                    (key === 'ph' && value >= 6 && value <= 7.5) ||
                    (key === 'nitrogen' && value >= 40) ||
                    (key === 'phosphorus' && value >= 25) ||
                    (key === 'potassium' && value >= 50) ||
                    (key === 'moisture' && value >= 30 && value <= 70);

                  const formattedValue = key === 'ph' || key === 'temperature' 
                    ? formatDecimal(value, 1) 
                    : formatNumber(value);

                  return (
                    <motion.div
                      key={key}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-start gap-3 p-4 rounded-lg bg-muted/50"
                    >
                      {isOptimal ? (
                        <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">
                          {t(`soil.${key === 'ph' ? 'phLevel' : key}`)}: {formattedValue}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getRecommendation(key, value)}
                        </p>
                      </div>
                    </motion.div>
                  );
                });
              }, [formData, i18n.language, t])}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default SoilAnalysis;
