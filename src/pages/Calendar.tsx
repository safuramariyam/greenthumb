import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calendarTasks } from '@/utils/dummyData';
import { Droplets, Sprout, Scissors, Package, Calendar as CalendarIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDateShort } from '@/utils/dateUtils';

const Calendar = () => {
  const { t, i18n } = useTranslation();

  // Map task titles to translation keys
  const taskTitleMap: Record<string, string> = {
    'Water rice field': 'waterRiceField',
    'Apply organic fertilizer': 'applyOrganicFertilizer',
    'Prune tomato plants': 'pruneTomatoPlants',
    'Harvest wheat crop': 'harvestWheatCrop',
  };

  // Memoize tasks with translated titles that update with language
  const translatedTasks = useMemo(() => {
    return calendarTasks.map(task => ({
      ...task,
      translatedTitle: t(`calendar.tasks.${taskTitleMap[task.title] || task.title}`),
    }));
  }, [i18n.language, t]);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'watering':
        return <Droplets className="h-5 w-5 text-primary" />;
      case 'fertilizing':
        return <Sprout className="h-5 w-5 text-accent" />;
      case 'pruning':
        return <Scissors className="h-5 w-5 text-secondary" />;
      case 'harvesting':
        return <Package className="h-5 w-5 text-primary-light" />;
      default:
        return <CalendarIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold text-foreground">{t('calendar.title')}</h1>
        <p className="text-muted-foreground">{t('calendar.upcoming')}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('calendar.timelineView')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {translatedTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Checkbox id={`task-${task.id}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getTaskIcon(task.type)}
                        <h3 className="font-medium">{task.translatedTitle}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDateShort(task.date)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
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
              <CardTitle>{t('calendar.taskCategories')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { type: 'watering', label: t('calendar.watering'), count: 3 },
                { type: 'fertilizing', label: t('calendar.fertilizing'), count: 2 },
                { type: 'pruning', label: t('calendar.pruning'), count: 1 },
                { type: 'harvesting', label: t('calendar.harvesting'), count: 1 },
              ].map((category, index) => (
                <motion.div
                  key={category.type}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {getTaskIcon(category.type)}
                    <span className="font-medium">{category.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t('calendar.taskCount', { count: category.count })}
                  </span>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Calendar;
