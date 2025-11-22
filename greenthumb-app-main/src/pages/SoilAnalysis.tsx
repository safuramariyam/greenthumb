import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUpload from '@/components/ImageUpload';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { formatNumber, formatDecimal } from '@/utils/dateUtils';
import {
  analyzeSoilImage,
  analyzeSoilManual,
  SoilAnalysisResult,
  ManualSoilAnalysisData,
} from '@/services/soilAnalysisApi';

const SoilAnalysis = () => {
  const { t, i18n } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [results, setResults] = useState<SoilAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisMethod, setAnalysisMethod] = useState<'image' | 'manual'>('image');
  const [formData, setFormData] = useState<ManualSoilAnalysisData>({
    pH: 6.5,
    nitrogen: 60,
    phosphorus: 25,
    potassium: 100,
    moisture: 50,
  });

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

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

  const handleAnalyzeImage = async () => {
    if (!imageFile) {
      setError('No image selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeSoilImage(imageFile);
      setResults(result);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to analyze soil image. Please try again.';
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeManual = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeSoilManual(formData);
      setResults(result);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to analyze soil parameters. Please try again.';
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isParameterOptimal = (key: string, value: number): boolean => {
    switch (key) {
      case 'pH':
        return value >= 6 && value <= 7.5;
      case 'nitrogen':
        return value >= 40;
      case 'phosphorus':
        return value >= 25;
      case 'potassium':
        return value >= 50;
      case 'moisture':
        return value >= 30 && value <= 70;
      default:
        return false;
    }
  };

  const getParameterStatus = (key: string, value: number): string => {
    const isOptimal = isParameterOptimal(key, value);
    return isOptimal ? 'Optimal' : 'Needs Adjustment';
  };

  const getParameterRecommendation = (key: string, value: number): string => {
    const recommendations: Record<string, (val: number) => string> = {
      pH: (val) =>
        val < 6
          ? 'Add lime to increase pH level'
          : val > 7.5
          ? 'Add sulfur to decrease pH level'
          : 'pH level is optimal for most crops',
      nitrogen: (val) =>
        val < 40
          ? 'Apply nitrogen-rich fertilizer (urea, ammonium nitrate)'
          : 'Nitrogen level is good',
      phosphorus: (val) =>
        val < 25
          ? 'Add phosphate fertilizer (superphosphate, DAP)'
          : 'Phosphorus level is adequate',
      potassium: (val) =>
        val < 50
          ? 'Apply potassium fertilizer (potash, KCl)'
          : 'Potassium level is healthy',
      moisture: (val) =>
        val < 30
          ? 'Increase irrigation frequency'
          : val > 70
          ? 'Reduce watering, improve drainage'
          : 'Moisture level is optimal',
    };

    const fn = recommendations[key];
    return fn ? fn(value) : 'Level is within normal range';
  };

  return (
    <div className="space-y-8 pb-8">
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-green-500 p-8 shadow-lg"
      >
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">
            {t('soil.analysis')}
          </h1>
          <p className="text-green-50 text-lg">
            Analyze soil health and get personalized recommendations
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      </motion.div>

      <Tabs 
        value={analysisMethod} 
        onValueChange={(val) => setAnalysisMethod(val as 'image' | 'manual')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image">📷 Image Analysis</TabsTrigger>
          <TabsTrigger value="manual">📝 Manual Input</TabsTrigger>
        </TabsList>

        {/* IMAGE ANALYSIS TAB */}
        <TabsContent value="image" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-md border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-br from-green-50 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-100">
                      🌍
                    </div>
                    Upload Soil Sample
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    preview={image || undefined}
                    onClear={() => {
                      setImage(null);
                      setImageFile(null);
                      setResults(null);
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

                  {image && !results && (
                    <Button 
                      onClick={handleAnalyzeImage}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing Soil...
                        </>
                      ) : (
                        <>
                          🔬 Analyze Soil Sample
                        </>
                      )}
                    </Button>
                  )}

                  {results && (
                    <Button 
                      onClick={() => {
                        setImage(null);
                        setImageFile(null);
                        setResults(null);
                        setError(null);
                      }}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      🔄 Analyze Another Sample
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {results && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <SoilResultsCard results={results} />
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* MANUAL INPUT TAB */}
        <TabsContent value="manual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-md border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-br from-green-50 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-100">
                      📊
                    </div>
                    Input Soil Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="flex justify-between mb-2">
                        <span>pH Level</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatDecimal(formData.pH, 1)}
                        </span>
                      </Label>
                      <Input
                        type="number"
                        min="4"
                        max="9"
                        step="0.1"
                        value={formData.pH}
                        onChange={(e) =>
                          setFormData({ ...formData, pH: parseFloat(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="flex justify-between mb-2">
                        <span>Nitrogen (mg/kg)</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatNumber(formData.nitrogen)}
                        </span>
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="200"
                        value={formData.nitrogen}
                        onChange={(e) =>
                          setFormData({ ...formData, nitrogen: parseFloat(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="flex justify-between mb-2">
                        <span>Phosphorus (mg/kg)</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatNumber(formData.phosphorus)}
                        </span>
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="80"
                        value={formData.phosphorus}
                        onChange={(e) =>
                          setFormData({ ...formData, phosphorus: parseFloat(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="flex justify-between mb-2">
                        <span>Potassium (mg/kg)</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatNumber(formData.potassium)}
                        </span>
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="300"
                        value={formData.potassium}
                        onChange={(e) =>
                          setFormData({ ...formData, potassium: parseFloat(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="flex justify-between mb-2">
                        <span>Moisture (%)</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatNumber(formData.moisture)}%
                        </span>
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.moisture}
                        onChange={(e) =>
                          setFormData({ ...formData, moisture: parseFloat(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
                    >
                      <p className="font-medium">Error: {error}</p>
                    </motion.div>
                  )}

                  {!results && (
                    <Button 
                      onClick={handleAnalyzeManual}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          📈 Analyze Parameters
                        </>
                      )}
                    </Button>
                  )}

                  {results && (
                    <Button 
                      onClick={() => setResults(null)}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      🔄 New Analysis
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {results && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <SoilResultsCard results={results} />
              </motion.div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Results Card Component
const SoilResultsCard = ({ results }: { results: SoilAnalysisResult }) => {
  const parameterLabels: Record<string, string> = {
    pH: 'pH Level',
    moisture: 'Moisture',
    nitrogen: 'Nitrogen (N)',
    phosphorus: 'Phosphorus (P)',
    potassium: 'Potassium (K)',
  };

  const getParameterStatus = (key: string, value: number): boolean => {
    switch (key) {
      case 'pH':
        return value >= 6 && value <= 7.5;
      case 'nitrogen':
        return value >= 40;
      case 'phosphorus':
        return value >= 25;
      case 'potassium':
        return value >= 50;
      case 'moisture':
        return value >= 30 && value <= 70;
      default:
        return false;
    }
  };

  const getParameterRecommendation = (key: string, value: number): string => {
    const recommendations: Record<string, (val: number) => string> = {
      pH: (val) =>
        val < 6
          ? 'Add lime to increase pH'
          : val > 7.5
          ? 'Add sulfur to decrease pH'
          : 'pH is optimal',
      nitrogen: (val) =>
        val < 40 ? 'Apply nitrogen fertilizer' : 'Nitrogen level is good',
      phosphorus: (val) =>
        val < 25 ? 'Add phosphate fertilizer' : 'Phosphorus is adequate',
      potassium: (val) =>
        val < 50 ? 'Apply potassium fertilizer' : 'Potassium is healthy',
      moisture: (val) =>
        val < 30
          ? 'Increase irrigation'
          : val > 70
          ? 'Reduce watering'
          : 'Moisture is optimal',
    };
    return recommendations[key]?.(value) || 'Level is normal';
  };

  return (
    <Card className="shadow-md border-2">
      <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            📊
          </div>
          Analysis Results
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Soil Texture */}
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-5 border-2 border-blue-200"
        >
          <p className="font-medium text-muted-foreground mb-2">Soil Texture</p>
          <p className="text-2xl font-bold text-blue-600 capitalize">
            {results.texture}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Sand: {results.texture_breakdown.sand}% | Silt: {results.texture_breakdown.silt}% | Clay: {results.texture_breakdown.clay}%
          </p>
        </motion.div>

        {/* Parameters */}
        <div className="space-y-3">
          {Object.entries({
            pH: results.pH,
            nitrogen: results.nitrogen,
            phosphorus: results.phosphorus,
            potassium: results.potassium,
            moisture: results.moisture,
          }).map(([key, value]) => {
            const isOptimal = getParameterStatus(key, value);
            const displayValue = key === 'pH' 
              ? formatDecimal(value, 1) 
              : `${formatNumber(value)}${key === 'moisture' ? '%' : ''}`;

            return (
              <motion.div
                key={key}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                {isOptimal ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">
                    {parameterLabels[key]}: <span className="text-lg font-bold">{displayValue}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getParameterRecommendation(key, value)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Recommendations */}
        <div className="space-y-3 border-t pt-4">
          <p className="font-semibold flex items-center gap-2">
            <span>🌱</span> Crop Recommendations
          </p>
          <div className="flex flex-wrap gap-2">
            {results.recommendations.map((crop, idx) => (
              <motion.span
                key={idx}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
              >
                {crop}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Confidence */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Analysis Confidence: {(results.confidence * 100).toFixed(1)}%
        </div>
      </CardContent>
    </Card>
  );
};

export default SoilAnalysis;