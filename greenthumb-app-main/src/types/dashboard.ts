// src/types/dashboard.ts

// Plant Health Analysis
export interface PlantAnalysis {
  crop_type: string;
  disease_status: string;
  severity_level: number;
  confidence: number;
  recommendations: string[];
  analyzed_at: Date;
}

// Soil Analysis
export interface SoilAnalysis {
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
  analyzed_at: Date;
}

// Maintenance Task - Auto-generated from analyses
export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  type: 'watering' | 'fertilizing' | 'pruning' | 'harvesting' | 'pest_control' | 'disease_treatment';
  date: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: 'soil_analysis' | 'plant_analysis' | 'calendar' | 'manual';
  completed: boolean;
  completedAt?: Date;
  field?: string;
  crop?: string;
}

// Sustainability Metrics
export interface SustainabilityMetrics {
  overall_score: number; // 0-100
  water_efficiency: number;
  organic_practices: number;
  disease_management: number;
  soil_health: number;
  biodiversity: number;
  carbon_footprint: number;
  trends: {
    date: Date;
    score: number;
  }[];
}

// Sustainability Action
export interface SustainabilityAction {
  id: string;
  title: string;
  description: string;
  impact_score: number; // -50 to +50
  category: 'water' | 'organic' | 'disease' | 'soil' | 'biodiversity' | 'carbon';
  completed: boolean;
  completedAt?: Date;
}

// Dashboard Summary - Everything in one place
export interface DashboardSummary {
  last_plant_analysis?: PlantAnalysis;
  last_soil_analysis?: SoilAnalysis;
  upcoming_tasks: MaintenanceTask[];
  sustainability_metrics: SustainabilityMetrics;
  active_issues: {
    type: 'disease' | 'soil' | 'pest';
    severity: 'low' | 'medium' | 'high';
    message: string;
    action: string;
  }[];
  recommendations: string[];
  updated_at: Date;
}

// Farmer-Friendly Context
export interface FarmerContext {
  total_fields: number;
  total_crops: Map<string, number>;
  active_issues_count: number;
  tasks_today: number;
  sustainability_trend: 'improving' | 'stable' | 'declining';
}