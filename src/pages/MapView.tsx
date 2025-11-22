import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mapLocations } from '@/utils/dummyData';
import { MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatNumberWithPercent, formatDecimal } from '@/utils/dateUtils';

const MapView = () => {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-accent text-accent-foreground';
      case 'moderate':
        return 'bg-secondary text-secondary-foreground';
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <TrendingUp className="h-4 w-4" />;
      case 'moderate':
        return <Minus className="h-4 w-4" />;
      case 'critical':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold text-foreground">{t('map.title')}</h1>
        <p className="text-muted-foreground">View field locations and health status</p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-0">
            <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">Interactive map placeholder</p>
                  <p className="text-sm text-muted-foreground">
                    Integrate with mapping service for live field tracking
                  </p>
                </div>
              </div>

              {mapLocations.map((location, index) => (
                <motion.div
                  key={location.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="absolute"
                  style={{
                    left: `${20 + index * 30}%`,
                    top: `${30 + index * 15}%`,
                  }}
                >
                  <div
                    className={`p-2 rounded-full shadow-lg ${getStatusColor(
                      location.status
                    )} animate-pulse`}
                  >
                    <MapPin className="h-6 w-6" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mapLocations.map((location, index) => (
          <motion.div
            key={location.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  {location.name}
                  <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(location.status)}`}>
                    {getStatusIcon(location.status)}
                    {t(`map.${location.status}`)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('dashboard.soilHealth')}</span>
                    <span className="font-medium">{formatNumberWithPercent(location.soilHealth)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('map.location')}</span>
                    <span className="font-mono text-xs">
                      {formatDecimal(location.lat, 4)}, {formatDecimal(location.lng, 4)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MapView;
