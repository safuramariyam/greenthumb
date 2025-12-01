import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { chartData } from '@/utils/dummyData';
import { TestTube, Leaf, TrendingUp, Activity, Calendar, CheckCircle, Clock, Plus, CalendarDays, Bell, X } from 'lucide-react';
import { getMonthAbbr, formatNumber, formatNumberWithPercent, formatDateShort } from '@/utils/dateUtils';
import { getCalendarTasks, getUpcomingTasks, CalendarTask } from '@/services/calendarApi';
import { getWeatherRecommendations, WeatherRecommendation, getWeatherIconUrl, formatWeatherCondition } from '@/services/weatherApi';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  NotificationData,
  NotificationResponse,
  browserNotifications,
  showTaskReminderNotification,
  showOverdueTaskNotification,
  showWeatherAlertNotification,
  formatNotificationTime,
  getNotificationIcon
} from '@/services/notificationsApi';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [weatherRecommendations, setWeatherRecommendations] = useState<WeatherRecommendation[]>([]);
  const [weatherSummary, setWeatherSummary] = useState<{
    will_rain_today: boolean;
    rain_probability: number;
    temperature_trend: string;
    next_3_days: any[];
  } | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch calendar and weather data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch calendar data
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

        // Fetch weather data
        try {
          const weatherData = await getWeatherRecommendations();
          setWeatherRecommendations(weatherData.recommendations);
          setWeatherSummary(weatherData.weather_summary);
        } catch (weatherError) {
          console.warn('Weather data not available:', weatherError);
          // Don't fail the whole dashboard if weather fails
        }

        // Fetch notifications
        try {
          const notificationsData = await getNotifications();
          setNotifications(notificationsData.notifications);
          setUnreadCount(notificationsData.unread_count);

          // Show browser notifications for unread items
          if (notificationsData.unread_count > 0) {
            const unreadNotifications = notificationsData.notifications.filter(n => !n.read);
            unreadNotifications.forEach(notification => {
              switch (notification.type) {
                case 'task_reminder':
                  // Extract hours from message (rough parsing)
                  const hoursMatch = notification.message.match(/in (\d+) hours/);
                  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 24;
                  showTaskReminderNotification(notification.title.replace('Task Reminder: ', ''), notification.message.split(' (')[0], hours);
                  break;
                case 'overdue_alert':
                  const daysMatch = notification.message.match(/(\d+) days overdue/);
                  const days = daysMatch ? parseInt(daysMatch[1]) : 1;
                  showOverdueTaskNotification(notification.title.replace('Overdue Task: ', ''), notification.message.split(' (')[1]?.replace(')', '') || '', days);
                  break;
                case 'weather_alert':
                  showWeatherAlertNotification(notification.message);
                  break;
              }
            });
          }
        } catch (notificationsError) {
          console.warn('Notifications not available:', notificationsError);
          // Don't fail the whole dashboard if notifications fail
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('dashboard.welcome')}</h1>
            <p className="text-muted-foreground">{t('dashboard.overview')}</p>
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await markAllNotificationsRead();
                              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                              setUnreadCount(0);
                            } catch (error) {
                              console.error('Error marking all as read:', error);
                            }
                          }}
                          className="text-xs"
                        >
                          Mark all read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNotifications(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={async () => {
                          if (!notification.read) {
                            try {
                              await markNotificationRead(notification.id);
                              setNotifications(prev =>
                                prev.map(n =>
                                  n.id === notification.id ? { ...n, read: true } : n
                                )
                              );
                              setUnreadCount(prev => Math.max(0, prev - 1));
                            } catch (error) {
                              console.error('Error marking as read:', error);
                            }
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatNotificationTime(notification.created_at)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await deleteNotification(notification.id);
                                setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                if (!notification.read) {
                                  setUnreadCount(prev => Math.max(0, prev - 1));
                                }
                              } catch (error) {
                                console.error('Error deleting notification:', error);
                              }
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
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

      {/* Weather Integration Widget */}
      {weatherSummary && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">🌤️</span>
                Weather Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Weather Summary */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {weatherSummary.next_3_days[0] && (
                    <img
                      src={getWeatherIconUrl(weatherSummary.next_3_days[0].weather_icon)}
                      alt={weatherSummary.next_3_days[0].description}
                      className="w-12 h-12"
                    />
                  )}
                  <div>
                    <p className="font-medium">
                      {weatherSummary.next_3_days[0]?.temperature}°C
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatWeatherCondition(weatherSummary.next_3_days[0]?.weather_condition || 'Unknown')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {weatherSummary.will_rain_today ? '🌧️ Rain expected' : '☀️ No rain today'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rain chance: {weatherSummary.rain_probability}%
                  </p>
                </div>
              </div>

              {/* Weather Recommendations */}
              {weatherRecommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Farming Recommendations:</h4>
                  {weatherRecommendations.slice(0, 3).map((rec, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg text-sm ${
                        rec.severity === 'high' ? 'bg-red-50 border border-red-200' :
                        rec.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      <p className="font-medium">{rec.recommendation}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 3-Day Forecast Preview */}
              {weatherSummary.next_3_days.length > 1 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">3-Day Forecast:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {weatherSummary.next_3_days.slice(1, 4).map((day, index) => (
                      <div key={index} className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <img
                          src={getWeatherIconUrl(day.weather_icon)}
                          alt={day.description}
                          className="w-8 h-8 mx-auto my-1"
                        />
                        <p className="text-xs font-medium">{day.temperature}°C</p>
                        <p className="text-xs text-muted-foreground">
                          {day.precipitation > 0 ? `${day.precipitation}mm` : 'No rain'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
