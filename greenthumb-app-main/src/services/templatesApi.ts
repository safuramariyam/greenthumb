// src/services/templatesApi.ts

const API_BASE_URL = 'http://localhost:8000';

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  crop_type: string;
  season: string;
  tasks: Array<{
    title: string;
    type: string;
    description?: string;
    days_from_start: number;
    priority: string;
  }>;
  created_at: string;
}

export interface TemplateCategory {
  name: string;
  description: string;
  templates: TaskTemplate[];
}

export interface ApplyTemplateResult {
  message: string;
  tasks_created: number;
  start_date: string;
  template_name: string;
}

/**
 * Get all task templates
 */
export async function getTaskTemplates(): Promise<TaskTemplate[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/templates`, {
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

    const result: TaskTemplate[] = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching task templates:', error);
    throw error;
  }
}

/**
 * Get templates organized by categories
 */
export async function getTemplateCategories(): Promise<Record<string, TemplateCategory>> {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/categories`, {
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

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching template categories:', error);
    throw error;
  }
}

/**
 * Get a specific task template
 */
export async function getTaskTemplate(templateId: string): Promise<TaskTemplate> {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
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

    const result: TaskTemplate = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching task template:', error);
    throw error;
  }
}

/**
 * Apply a task template to create calendar tasks
 */
export async function applyTaskTemplate(
  templateId: string,
  startDate?: string
): Promise<ApplyTemplateResult> {
  try {
    const url = startDate
      ? `${API_BASE_URL}/templates/apply/${templateId}?start_date=${startDate}`
      : `${API_BASE_URL}/templates/apply/${templateId}`;

    const response = await fetch(url, {
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

    const result: ApplyTemplateResult = await response.json();
    return result;
  } catch (error) {
    console.error('Error applying task template:', error);
    throw error;
  }
}

/**
 * Get templates for a specific crop type
 */
export async function getTemplatesByCrop(cropType: string): Promise<TaskTemplate[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/crop/${cropType}`, {
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

    const result: TaskTemplate[] = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching templates by crop:', error);
    throw error;
  }
}

/**
 * Get templates for a specific season
 */
export async function getTemplatesBySeason(season: string): Promise<TaskTemplate[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/season/${season}`, {
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

    const result: TaskTemplate[] = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching templates by season:', error);
    throw error;
  }
}

/**
 * Get crop type icon
 */
export function getCropIcon(cropType: string): string {
  const cropIcons: Record<string, string> = {
    rice: '🌾',
    wheat: '🌾',
    tomato: '🍅',
    cotton: '🌿',
    maize: '🌽',
    potato: '🥔',
    onion: '🧅',
    sugarcane: '🎋'
  };

  return cropIcons[cropType.toLowerCase()] || '🌱';
}

/**
 * Get season icon
 */
export function getSeasonIcon(season: string): string {
  const seasonIcons: Record<string, string> = {
    monsoon: '🌧️',
    summer: '☀️',
    winter: '❄️',
    spring: '🌸',
    autumn: '🍂'
  };

  return seasonIcons[season.toLowerCase()] || '🌱';
}

/**
 * Calculate template duration in days
 */
export function getTemplateDuration(template: TaskTemplate): number {
  if (!template.tasks || template.tasks.length === 0) return 0;

  const maxDays = Math.max(...template.tasks.map(task => task.days_from_start));
  return maxDays;
}

/**
 * Get template difficulty level based on number of tasks
 */
export function getTemplateDifficulty(template: TaskTemplate): 'easy' | 'medium' | 'hard' {
  const taskCount = template.tasks?.length || 0;

  if (taskCount <= 5) return 'easy';
  if (taskCount <= 10) return 'medium';
  return 'hard';
}