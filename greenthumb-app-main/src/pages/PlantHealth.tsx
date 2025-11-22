import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import { AlertTriangle, CheckCircle, Info, Loader } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatNumberWithPercent } from '@/utils/dateUtils';
import { analyzePlantImage, AnalysisResult } from '@/services/plantAnalysisApi';

interface Analysis extends AnalysisResult {
  timestamp?: string;
}

const PlantHealth = () => {
  const { t, i18n } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setImageFile(file);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      setError('No image selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzePlantImage(imageFile);
      
      setAnalysis({
        ...result,
        timestamp: new Date().toLocaleString(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to analyze image. Please try again.';
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: number): string => {
    if (severity === 0) return 'text-green-600';
    if (severity <= 20) return 'text-yellow-600';
    if (severity <= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityLabel = (severity: number): string => {
    if (severity === 0) return 'Healthy';
    if (severity <= 20) return 'Mild';
    if (severity <= 40) return 'Moderate';
    if (severity <= 60) return 'Severe';
    if (severity <= 80) return 'Very Severe';
    return 'Critical';
  };

  const diseaseSeverityPercentage = analysis 
    ? Math.min(100, (analysis.severity_level / 100) * 100) 
    : 0;

  return (
    <div className="space-y-8 pb-8">
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 shadow-lg"
      >
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">
            {t('plant.health')}
          </h1>
          <p className="text-primary-foreground/90 text-lg">
            Upload leaf images to detect diseases instantly using AI
          </p>
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
                  setImageFile(null);
                  setAnalysis(null);
                  setError(null);
                }}
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
                >
                  <p className="font-medium">Error: {error}</p>
                </motion.div>
              )}

              {image && !analysis && (
                <Button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full shadow-md hover:shadow-lg transition-all" 
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      🔍 Analyze Plant Health
                    </>
                  )}
                </Button>
              )}

              {analysis && (
                <Button 
                  onClick={() => {
                    setImage(null);
                    setImageFile(null);
                    setAnalysis(null);
                    setError(null);
                  }}
                  variant="outline"
                  className="w-full" 
                  size="lg"
                >
                  🔄 Analyze Another Image
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
                {/* Crop Type */}
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="p-5 rounded-xl bg-gradient-to-br from-blue/10 to-blue/5 border-2 border-blue/20 shadow-sm"
                >
                  <p className="font-medium text-muted-foreground mb-1">Crop Type</p>
                  <p className="text-2xl font-bold text-blue-600 capitalize">
                    {analysis.crop_type}
                  </p>
                </motion.div>

                {/* Disease Status */}
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
                      <p className="font-medium text-muted-foreground mb-1">
                        Disease Status
                      </p>
                      <p className="text-2xl font-bold text-destructive">
                        {analysis.disease_status}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Severity Level */}
                <div className="space-y-3 p-4 rounded-xl bg-accent/5 border border-accent/20">
                  <div className="flex justify-between items-center">
                    <span className="font-medium flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      Severity Level
                    </span>
                    <span className={`font-bold text-lg ${getSeverityColor(analysis.severity_level)}`}>
                      {getSeverityLabel(analysis.severity_level)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{analysis.severity_level}%</span>
                      <span>Affected</span>
                    </div>
                    <Progress 
                      value={analysis.severity_level} 
                      className="h-3"
                    />
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="font-medium flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      Confidence
                    </span>
                    <span className="font-bold text-lg text-primary">
                      {formatNumberWithPercent(analysis.confidence * 100)}
                    </span>
                  </div>
                  <Progress 
                    value={analysis.confidence * 100}
                    className="h-3"
                  />
                </div>

                {/* Recommendations */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Info className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-semibold text-lg">Recommendations</p>
                  </div>
                  <ul className="space-y-3">
                    {analysis.recommendations.map((recommendation: string, index: number) => (
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
                        <span className="text-sm leading-relaxed">{recommendation}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Timestamp */}
                {analysis.timestamp && (
                  <p className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
                    Analysis performed at: {analysis.timestamp}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlantHealth;