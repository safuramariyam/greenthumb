// src/services/soilAnalysisApi.ts

const API_BASE_URL = 'http://localhost:8000';

export interface SoilAnalysisResult {
  pH: number;
  moisture: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  texture: string;
  texture_breakdown: {
    sand: number;
    silt: number;
    clay: number;
  };
  recommendations: string[];
  confidence: number;
}

export interface ManualSoilAnalysisData {
  pH: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
}

/**
 * Analyze soil image for soil parameters
 * @param file - The soil image file to analyze
 * @returns Promise with soil analysis results
 */
export async function analyzeSoilImage(file: File): Promise<SoilAnalysisResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/soil/analyze-image`, {
      method: 'POST',
      body: formData,
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

    const result: SoilAnalysisResult = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing soil image:', error);
    throw error;
  }
}

/**
 * Analyze soil using manual parameter input
 * @param data - Manual soil parameters
 * @returns Promise with soil analysis results
 */
export async function analyzeSoilManual(data: ManualSoilAnalysisData): Promise<SoilAnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/soil/analyze-manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || 
        `HTTP error! status: ${response.status}`
      );
    }

    const result: SoilAnalysisResult = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing soil manually:', error);
    throw error;
  }
}

/**
 * Get soil texture types information
 */
export async function getTextureTypes(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/soil/texture-types`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching texture types:', error);
    throw error;
  }
}

/**
 * Get pH guide for different crops
 */
export async function getPhGuide(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/soil/ph-guide`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching pH guide:', error);
    throw error;
  }
}

/**
 * Get NPK requirements guide
 */
export async function getNpkGuide(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/soil/npk-guide`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching NPK guide:', error);
    throw error;
  }
}