import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { chartData } from '@/utils/dummyData';
import { TestTube, Leaf, TrendingUp, Activity } from 'lucide-react';
import { getMonthAbbr, formatNumber, formatNumberWithPercent } from '@/utils/dateUtils';

const Dashboard = () => {
  const { t, i18n } = useTranslation();

  // Transform chart data to use localized month names - updates when language changes
  const localizedChartData = useMemo(() => {
    return chartData.nutrients.map((item) => {
      const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(item.month);
      return {
        ...item,
        month: monthIndex !== -1 ? getMonthAbbr(monthIndex) : item.month,
      };
    });
  }, [i18n.language]);

  // Transform soil health data with translated names
  const localizedSoilHealthData = useMemo(() => {
    return chartData.soilHealth.map((item) => {
      const nameMap: Record<string, string> = {
        'pH': t('soil.ph'),
        'Moisture': t('soil.moisture'),
        'Temperature': t('soil.temperature'),
        'Organic Matter': t('soil.organicMatter'),
      };
      return {
        ...item,
        name: nameMap[item.name] || item.name,
      };
    });
  }, [i18n.language, t]);

  // Custom tooltip formatter for nutrient charts
  const customTooltipFormatter = (value: any, name: string) => {
    const nutrientNames: Record<string, string> = {
      nitrogen: t('soil.nitrogen'),
      phosphorus: t('soil.phosphorus'),
      potassium: t('soil.potassium'),
    };
    // Format the number according to locale
    const formattedValue = typeof value === 'number' ? formatNumber(value) : value;
    return [formattedValue, nutrientNames[name] || name];
  };

  // Custom label formatter for nutrient charts
  const customLabelFormatter = (name: string) => {
    const nutrientNames: Record<string, string> = {
      nitrogen: t('soil.nitrogen'),
      phosphorus: t('soil.phosphorus'),
      potassium: t('soil.potassium'),
    };
    return nutrientNames[name] || name;
  };

  // Format stats with locale-specific number formatting
  const stats = useMemo(() => [
    { icon: TestTube, label: t('dashboard.soilHealth'), value: formatNumberWithPercent(85), color: 'text-accent' },
    { icon: Leaf, label: t('dashboard.plantHealth'), value: formatNumberWithPercent(92), color: 'text-primary' },
    { icon: TrendingUp, label: t('dashboard.cropYield'), value: formatNumberWithPercent(15, true), color: 'text-secondary' },
    { icon: Activity, label: t('dashboard.activeFields'), value: formatNumber(8), color: 'text-primary-light' },
  ], [i18n.language, t]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold text-foreground">{t('dashboard.welcome')}</h1>
        <p className="text-muted-foreground">{t('dashboard.overview')}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.nutrientLevelsOverTime')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={localizedChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatNumber(value)} />
                  <Tooltip formatter={customTooltipFormatter} />
                  <Legend formatter={customLabelFormatter} />
                  <Line type="monotone" dataKey="nitrogen" name="nitrogen" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="phosphorus" name="phosphorus" stroke="hsl(var(--accent))" strokeWidth={2} />
                  <Line type="monotone" dataKey="potassium" name="potassium" stroke="hsl(var(--secondary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.soilHealthMetrics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={localizedSoilHealthData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tickFormatter={(value) => formatNumber(value)} />
                  <Radar name={t('dashboard.soilHealth')} dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  <Tooltip formatter={(value: any) => formatNumber(value)} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.monthlyNPKDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={localizedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatNumber(value)} />
                <Tooltip formatter={customTooltipFormatter} />
                <Legend formatter={customLabelFormatter} />
                <Bar dataKey="nitrogen" name="nitrogen" fill="hsl(var(--primary))" />
                <Bar dataKey="phosphorus" name="phosphorus" fill="hsl(var(--accent))" />
                <Bar dataKey="potassium" name="potassium" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
