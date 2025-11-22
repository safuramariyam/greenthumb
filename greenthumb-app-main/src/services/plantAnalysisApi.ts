// src/services/plantAnalysisApi.ts

const API_BASE_URL = 'http://localhost:8000';

export interface AnalysisResult {
  crop_type: string;
  disease_status: string;
  severity_level: number;
  confidence: number;
  recommendations: string[];
}

export interface ApiError {
  detail?: string;
  message?: string;
}

/**
 * Analyze a plant image for disease detection
 * @param file - The image file to analyze
 * @returns Promise with analysis results
 */
export async function analyzePlantImage(file: File): Promise<AnalysisResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || 
        errorData.message || 
        `HTTP error! status: ${response.status}`
      );
    }

    const result: AnalysisResult = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing plant image:', error);
    throw error;
  }
}

/**
 * Check API health status
 * @returns Promise with health status
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('Error checking API health:', error);
    return false;
  }
}

/**
 * Get dataset statistics
 * @returns Promise with dataset info
 */
export async function getDatasetStats(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/dataset-stats`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dataset stats:', error);
    throw error;
  }
}

/**
 * Get model information
 * @returns Promise with model details
 */
export async function getModelInfo(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/model-info`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching model info:', error);
    throw error;
  }
}