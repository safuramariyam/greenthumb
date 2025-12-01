// src/services/notificationsApi.ts

const API_BASE_URL = 'http://localhost:8000';

export interface NotificationSettings {
  browser_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  upcoming_task_reminder: number;
  overdue_task_alert: boolean;
  weather_alerts: boolean;
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  task_id?: number;
  priority: string;
  created_at: string;
  read: boolean;
}

export interface NotificationResponse {
  notifications: NotificationData[];
  unread_count: number;
}

/**
 * Get notification settings
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/settings`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
        `HTTP error! status: ${response.status}`
      );
    }

    const result: NotificationSettings = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    throw error;
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
        `HTTP error! status: ${response.status}`
      );
    }
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
}

/**
 * Get all notifications
 */
export async function getNotifications(): Promise<NotificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
        `HTTP error! status: ${response.status}`
      );
    }

    const result: NotificationResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
        `HTTP error! status: ${response.status}`
      );
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
        `HTTP error! status: ${response.status}`
      );
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
        `HTTP error! status: ${response.status}`
      );
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

/**
 * Check for new notifications
 */
export async function checkForNewNotifications(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/check`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
        `HTTP error! status: ${response.status}`
      );
    }
  } catch (error) {
    console.error('Error checking for new notifications:', error);
    throw error;
  }
}

/**
 * Browser Notification Manager
 */
export class BrowserNotificationManager {
  private permission: NotificationPermission = 'default';

  constructor() {
    this.checkPermission();
  }

  async checkPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    this.permission = Notification.permission;
    return this.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

// Global notification manager instance
export const browserNotifications = new BrowserNotificationManager();

/**
 * Show task reminder notification
 */
export function showTaskReminderNotification(taskTitle: string, dueDate: string, hoursUntil: number): void {
  browserNotifications.showNotification(
    `Task Reminder: ${taskTitle}`,
    {
      body: `Due in ${hoursUntil} hours (${dueDate})`,
      tag: 'task-reminder',
      requireInteraction: false,
    }
  );
}

/**
 * Show overdue task notification
 */
export function showOverdueTaskNotification(taskTitle: string, dueDate: string, daysOverdue: number): void {
  browserNotifications.showNotification(
    `Overdue Task: ${taskTitle}`,
    {
      body: `${daysOverdue} days overdue (was due ${dueDate})`,
      tag: 'overdue-task',
      requireInteraction: true,
      icon: '/favicon.ico',
    }
  );
}

/**
 * Show weather alert notification
 */
export function showWeatherAlertNotification(message: string): void {
  browserNotifications.showNotification(
    'Weather Alert',
    {
      body: message,
      tag: 'weather-alert',
      requireInteraction: true,
      icon: '/favicon.ico',
    }
  );
}

/**
 * Format notification time
 */
export function formatNotificationTime(createdAt: string): string {
  const now = new Date();
  const notificationTime = new Date(createdAt);
  const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'task_reminder':
      return '⏰';
    case 'overdue_alert':
      return '🚨';
    case 'weather_alert':
      return '🌤️';
    case 'task_completed':
      return '✅';
    default:
      return '📢';
  }
}