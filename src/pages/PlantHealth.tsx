import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatNumberWithPercent } from '@/utils/dateUtils';
import { analyzePlant, PlantAnalysisResult } from '@/services/plantAnalysisApi';

const PlantHealth = () => {
  const { t, i18n } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PlantAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setLoading(true);
    try {
      // Convert base64 image to File
      const response = await fetch(image);
      const blob = await response.blob();
      const file = new File([blob], 'plant.jpg', { type: 'image/jpeg' });

      const result = await analyzePlant(file);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      // Fallback to dummy data for now
      setAnalysis({
        crop_type: 'Tomato',
        disease_status: 'Leaf Blight',
        severity_level: 60,
        confidence: 0.87,
        recommendations: [
          'Remove infected leaves immediately',
          'Apply copper-based fungicide',
          'Improve air circulation around plants',
          'Avoid overhead watering',
          'Monitor plants daily for progression',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 shadow-lg"
      >
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">{t('plant.health')}</h1>
          <p className="text-primary-foreground/90 text-lg">Upload leaf images to detect diseases instantly</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light/20 rounded-full -translate-y-1/2 translate-x-1/2" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-md border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-br from-accent/10 to-transparent">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-accent/20">
                  🌿
                </div>
                {t('plant.uploadLeaf')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <ImageUpload
                onImageSelect={handleImageSelect}
                preview={image || undefined}
                onClear={() => {
                  setImage(null);
                  setAnalysis(null);
                }}
              />
              {image && !analysis && (
                <Button
                  onClick={handleAnalyze}
                  className="w-full shadow-md hover:shadow-lg transition-all"
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : '🔍 Analyze Plant Health'}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {analysis && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-md border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-primary/10">
                    📊
                  </div>
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-blue/10 to-blue/5 border-2 border-blue/20 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue/20">
                        🌱
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-muted-foreground mb-1">Plant Type</p>
                        <p className="text-2xl font-bold text-blue-600">{analysis.crop_type}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5 border-2 border-destructive/20 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-destructive/20">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-muted-foreground mb-1">Disease Type</p>
                        <p className="text-2xl font-bold text-destructive">{analysis.disease_status}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-orange/10 to-orange/5 border-2 border-orange/20 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-orange/20">
                        ⚠️
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-muted-foreground mb-1">Severity Level</p>
                        <p className="text-2xl font-bold text-orange-600">{analysis.severity_level}%</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-accent/5 border border-accent/20">
                  <div className="flex justify-between items-center">
                    <span className="font-medium flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      {t('plant.confidence')}
                    </span>
                    {useMemo(() => (
                      <span className="font-bold text-lg text-accent">{formatNumberWithPercent(analysis.confidence * 100)}</span>
                    ), [analysis.confidence, i18n.language])}
                  </div>
                  <Progress value={analysis.confidence * 100} className="h-3" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Info className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-semibold text-lg">{t('plant.treatment')}</p>
                  </div>
                  <ul className="space-y-3">
                    {analysis.recommendations.map((step: string, index: number) => (
                      <motion.li
                        key={index}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="p-1 rounded-full bg-accent/20 mt-0.5">
                          <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                        </div>
                        <span className="text-sm leading-relaxed">{step}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlantHealth;
