import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Sprout, Scissors, Package, Calendar as CalendarIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateShort } from '@/utils/dateUtils';
import {
  getCalendarTasks,
  updateCalendarTask,
  createCalendarTask,
  deleteCalendarTask,
  CalendarTask as APICalendarTask,
  CalendarWebSocket,
  CreateCalendarTaskData
} from '@/services/calendarApi';
import { useToast } from '@/hooks/use-toast';

const Calendar = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<APICalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState<CalendarWebSocket | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<CreateCalendarTaskData>({
    title: '',
    type: 'watering',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    description: '',
    priority: 'medium'
  });

  // Map task titles to translation keys
  const taskTitleMap: Record<string, string> = {
    'Water rice field': 'waterRiceField',
    'Apply organic fertilizer': 'applyOrganicFertilizer',
    'Prune tomato plants': 'pruneTomatoPlants',
    'Harvest wheat crop': 'harvestWheatCrop',
  };

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedTasks = await getCalendarTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initialize WebSocket connection
  useEffect(() => {
    const websocket = new CalendarWebSocket(
      (data) => {
        // Handle real-time updates
        if (data.type === 'task_updated') {
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task.id === data.task.id ? data.task : task
            )
          );
        } else if (data.type === 'task_created') {
          setTasks(prevTasks => [...prevTasks, data.task]);
        } else if (data.type === 'task_deleted') {
          setTasks(prevTasks =>
            prevTasks.filter(task => task.id !== data.task_id)
          );
        }
      },
      (error) => {
        console.error('WebSocket error:', error);
      },
      () => {
        console.log('WebSocket connected');
      },
      () => {
        console.log('WebSocket disconnected');
      }
    );

    websocket.connect();
    setWs(websocket);

    return () => {
      websocket.disconnect();
    };
  }, []);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle task completion toggle
  const handleTaskToggle = async (taskId: number, completed: boolean) => {
    try {
      await updateCalendarTask(taskId, { completed });
      // Update local state immediately for better UX
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, completed } : task
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
      // Revert the change on error
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, completed: !completed } : task
        )
      );
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteCalendarTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  // Handle creating new task
  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const createdTask = await createCalendarTask(newTask);
      setTasks(prevTasks => [...prevTasks, createdTask]);
      setIsCreateDialogOpen(false);
      setNewTask({
        title: '',
        type: 'watering',
        date: new Date().toISOString().split('T')[0],
        description: '',
        priority: 'medium'
      });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  // Reset form when dialog closes
  const handleDialogClose = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setNewTask({
        title: '',
        type: 'watering',
        date: new Date().toISOString().split('T')[0],
        description: '',
        priority: 'medium'
      });
    }
  };

  // Memoize tasks with translated titles that update with language
  const translatedTasks = useMemo(() => {
    return tasks.map(task => ({
      ...task,
      translatedTitle: taskTitleMap[task.title]
        ? t(`calendar.tasks.${taskTitleMap[task.title]}`)
        : task.title, // Use original title if not in translation map
    }));
  }, [tasks, i18n.language, t]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('calendar.title')}</h1>
            <p className="text-muted-foreground">{t('calendar.upcoming')}</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter task title"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={newTask.type}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="watering">Watering</SelectItem>
                      <SelectItem value="fertilizing">Fertilizing</SelectItem>
                      <SelectItem value="pruning">Pruning</SelectItem>
                      <SelectItem value="harvesting">Harvesting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newTask.date}
                    onChange={(e) => setNewTask(prev => ({ ...prev, date: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    Priority
                  </Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="col-span-3"
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask}>
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('calendar.timelineView')}
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${ws?.isConnected() ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-xs text-muted-foreground">
                    {ws?.isConnected() ? 'Live' : 'Offline'}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {translatedTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={(checked) => handleTaskToggle(task.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getTaskIcon(task.type)}
                          <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.translatedTitle}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{formatDateShort(task.date)}</span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
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
                { type: 'watering', label: t('calendar.watering') },
                { type: 'fertilizing', label: t('calendar.fertilizing') },
                { type: 'pruning', label: t('calendar.pruning') },
                { type: 'harvesting', label: t('calendar.harvesting') },
              ].map((category, index) => {
                const count = tasks.filter(task => task.type === category.type).length;
                return (
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
                      {t('calendar.taskCount', { count })}
                    </span>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Calendar;
