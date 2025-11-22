import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

const Reports = () => {
  const { t } = useTranslation();

  const reports = [
    { id: 1, titleKey: 'reports.soilHealthAnalysis', date: '2025-10-28', type: 'soil' },
    { id: 2, titleKey: 'reports.plantDiseaseReport', date: '2025-10-25', type: 'plant' },
    { id: 3, titleKey: 'reports.cropRecommendationSummary', date: '2025-10-20', type: 'crop' },
    { id: 4, titleKey: 'reports.monthlyFarmAnalytics', date: '2025-10-15', type: 'analytics' },
  ];

  const handleDownload = (reportId: number) => {
    // Placeholder for PDF download
    console.log('Downloading report:', reportId);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold text-foreground">{t('reports.title')}</h1>
        <p className="text-muted-foreground">{t('reports.history')}</p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.generateNew')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full md:w-auto">
              <FileText className="h-4 w-4 mr-2" />
              {t('reports.generate')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h3 className="font-medium">{t(report.titleKey)}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(report.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(report.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
