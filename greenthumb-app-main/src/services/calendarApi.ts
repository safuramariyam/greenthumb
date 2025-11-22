// src/services/calendarApi.ts

const API_BASE_URL = 'http://localhost:8000';

export interface CalendarTask {
  id: number;
  title: string;
  type: string;
  date: string;
  completed: boolean;
  description?: string;
  priority: string;
}

export interface CreateCalendarTaskData {
  title: string;
  type: string;
  date: string;
  description?: string;
  priority?: string;
}

export interface UpdateCalendarTaskData {
  title?: string;
  type?: string;
  date?: string;
  completed?: boolean;
  description?: string;
  priority?: string;
}

/**
 * Get all calendar tasks
 */
export async function getCalendarTasks(): Promise<CalendarTask[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/calendar/tasks`, {
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

    const result: CalendarTask[] = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching calendar tasks:', error);
    throw error;
  }
}

/**
 * Get a specific calendar task
 */
export async function getCalendarTask(taskId: number): Promise<CalendarTask> {
  try {
    const response = await fetch(`${API_BASE_URL}/calendar/tasks/${taskId}`, {
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

    const result: CalendarTask = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching calendar task:', error);
    throw error;
  }
}

/**
 * Create a new calendar task
 */
export async function createCalendarTask(taskData: CreateCalendarTaskData): Promise<CalendarTask> {
  try {
    const response = await fetch(`${API_BASE_URL}/calendar/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
        `HTTP error! status: ${response.status}`
      );
    }

    const result: CalendarTask = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating calendar task:', error);
    throw error;
  }
}

/**
 * Update a calendar task
 */
export async function updateCalendarTask(taskId: number, taskData: UpdateCalendarTaskData): Promise<CalendarTask> {
  try {
    const response = await fetch(`${API_BASE_URL}/calendar/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
        `HTTP error! status: ${response.status}`
      );
    }

    const result: CalendarTask = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating calendar task:', error);
    throw error;
  }
}

/**
 * Delete a calendar task
 */
export async function deleteCalendarTask(taskId: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/calendar/tasks/${taskId}`, {
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
    console.error('Error deleting calendar task:', error);
    throw error;
  }
}

/**
 * Get upcoming tasks within specified days
 */
export async function getUpcomingTasks(days: number = 7): Promise<CalendarTask[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/calendar/tasks/upcoming?days=${days}`, {
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

    const result: CalendarTask[] = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching upcoming tasks:', error);
    throw error;
  }
}

/**
 * WebSocket connection for real-time updates
 */
export class CalendarWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds

  constructor(
    private onMessage: (data: any) => void,
    private onError?: (error: Event) => void,
    private onOpen?: () => void,
    private onClose?: () => void
  ) {}

  connect(): void {
    try {
      this.ws = new WebSocket('ws://localhost:8000/calendar/ws');

      this.ws.onopen = () => {
        console.log('Calendar WebSocket connected');
        this.reconnectAttempts = 0;
        if (this.onOpen) this.onOpen();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Calendar WebSocket error:', error);
        if (this.onError) this.onError(error);
      };

      this.ws.onclose = () => {
        console.log('Calendar WebSocket disconnected');
        if (this.onClose) this.onClose();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}