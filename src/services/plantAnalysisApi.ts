const API_BASE_URL = 'http://localhost:8000';

export interface PlantAnalysisResult {
  crop_type: string;
  disease_status: string;
  severity_level: number;
  confidence: number;
  recommendations: string[];
}

export const analyzePlant = async (file: File): Promise<PlantAnalysisResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`);
  }

  return response.json();
};