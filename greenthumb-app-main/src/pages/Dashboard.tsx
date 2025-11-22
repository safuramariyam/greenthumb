import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { chartData } from '@/utils/dummyData';
import { TestTube, Leaf, TrendingUp, Activity, Calendar, CheckCircle, Clock, Plus, CalendarDays } from 'lucide-react';
import { getMonthAbbr, formatNumber, formatNumberWithPercent, formatDateShort } from '@/utils/dateUtils';
import { getCalendarTasks, getUpcomingTasks, CalendarTask } from '@/services/calendarApi';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch calendar data on component mount
  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setLoading(true);
        const tasks = await getCalendarTasks();

        // Filter upcoming tasks on frontend (next 7 days)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const upcoming = tasks.filter(task => {
          const taskDate = new Date(task.date);
          return taskDate >= today && taskDate <= nextWeek && !task.completed;
        });

        setCalendarTasks(tasks);
        setUpcomingTasks(upcoming);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        toast({
          title: "Error",
          description: "Failed to load calendar data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [toast]);

  // Calculate real calendar statistics
  const calendarStats = useMemo(() => {
    const totalTasks = calendarTasks.length;
    const completedTasks = calendarTasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    // Tasks completed today
    const today = new Date().toISOString().split('T')[0];
    const completedToday = calendarTasks.filter(task =>
      task.completed && task.date === today
    ).length;

    // Completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      completedToday,
      upcomingCount: upcomingTasks.length,
      completionRate
    };
  }, [calendarTasks, upcomingTasks]);

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

  // Format stats with real calendar data
  const stats = useMemo(() => [
    {
      icon: Calendar,
      label: 'Active Tasks',
      value: formatNumber(calendarStats.pendingTasks),
      color: 'text-primary'
    },
    {
      icon: CheckCircle,
      label: 'Completed Today',
      value: formatNumber(calendarStats.completedToday),
      color: 'text-green-600'
    },
    {
      icon: Clock,
      label: 'Upcoming Tasks',
      value: formatNumber(calendarStats.upcomingCount),
      color: 'text-orange-600'
    },
    {
      icon: TrendingUp,
      label: 'Completion Rate',
      value: formatNumberWithPercent(calendarStats.completionRate),
      color: 'text-secondary'
    },
  ], [calendarStats]);

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

      {/* Calendar Integration Widget */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Upcoming Tasks
              </span>
              <Button size="sm" onClick={() => window.location.href = '/calendar'}>
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.slice(0, 5).map((task, index) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateShort(task.date)} • {task.type}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = '/calendar'}
                      className="text-xs"
                    >
                      View
                    </Button>
                  </div>
                ))}
                {upcomingTasks.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    +{upcomingTasks.length - 5} more tasks
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground mb-2">No upcoming tasks</p>
                <Button size="sm" onClick={() => window.location.href = '/calendar'}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Your First Task
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
