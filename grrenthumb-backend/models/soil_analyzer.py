"""
Soil Analysis Model
Analyzes soil images to predict pH, moisture, NPK values, and texture
"""
import numpy as np
from typing import Dict, Tuple, List
import logging

logger = logging.getLogger(__name__)

class SoilAnalyzer:
    """Soil analysis model using color and texture features"""
    
    def __init__(self):
        self.texture_classes = ['Sandy', 'Loamy', 'Clay', 'Silty', 'Sandy Loam', 'Clay Loam']
        logger.info("SoilAnalyzer initialized")
        
    def predict_from_features(self, features: Dict) -> Dict:
        """
        Predict soil parameters from image features
        
        Args:
            features: Dictionary containing color and texture features
            
        Returns:
            Dictionary with pH, moisture, NPK, texture predictions
        """
        try:
            # Extract color features
            r = features.get('r', 128)
            g = features.get('g', 100)
            b = features.get('b', 80)
            h = features.get('h', 20)
            s = features.get('s', 50)
            v = features.get('v', 100)
            
            # Extract texture features
            edge_density = features.get('edge_density', 10)
            roughness = features.get('roughness', 500)
            
            # pH Prediction (based on color - darker soils often more acidic)
            brightness = (r + g + b) / 3
            pH = 5.5 + (brightness / 255) * 2.5  # Range: 5.5-8.0
            pH = np.clip(pH, 4.0, 9.0)
            
            # Moisture Prediction (darker = more moisture)
            moisture = 100 - (v / 255 * 80)  # Range: 20-100%
            moisture = np.clip(moisture, 10, 95)
            
            # Nitrogen Prediction (related to organic matter - darker soils)
            nitrogen = 20 + ((255 - brightness) / 255) * 150  # Range: 20-170 mg/kg
            nitrogen = np.clip(nitrogen, 10, 200)
            
            # Phosphorus Prediction (moderate correlation with redness)
            phosphorus = 15 + (r / 255) * 45  # Range: 15-60 mg/kg
            phosphorus = np.clip(phosphorus, 5, 80)
            
            # Potassium Prediction (related to saturation)
            potassium = 50 + (s / 255) * 200  # Range: 50-250 mg/kg
            potassium = np.clip(potassium, 30, 300)
            
            # Texture Classification
            texture, texture_breakdown = self._classify_texture(
                edge_density, roughness, brightness
            )
            
            # Confidence score
            confidence = self._calculate_confidence(features)
            
            result = {
                'pH': round(float(pH), 2),
                'moisture': round(float(moisture), 1),
                'nitrogen': round(float(nitrogen), 1),
                'phosphorus': round(float(phosphorus), 1),
                'potassium': round(float(potassium), 1),
                'texture': texture,
                'texture_breakdown': texture_breakdown,
                'confidence': round(float(confidence), 2)
            }
            
            logger.info(f"Soil analysis complete: pH={result['pH']}, texture={result['texture']}")
            return result
            
        except Exception as e:
            logger.error(f"Error in soil prediction: {str(e)}")
            raise
    
    def _classify_texture(self, edge_density: float, roughness: float, 
                         brightness: float) -> Tuple[str, Dict]:
        """Classify soil texture based on features"""
        # Normalize features
        edge_norm = min(edge_density / 100, 1.0)
        rough_norm = min(roughness / 1000, 1.0)
        bright_norm = brightness / 255
        
        # Calculate scores for each texture type
        sandy_score = edge_norm * 0.4 + rough_norm * 0.4 + bright_norm * 0.2
        clay_score = (1 - edge_norm) * 0.5 + (1 - rough_norm) * 0.3 + (1 - bright_norm) * 0.2
        loamy_score = 1 - abs(edge_norm - 0.5) - abs(rough_norm - 0.5)
        silty_score = (1 - rough_norm) * 0.6 + (1 - abs(bright_norm - 0.5)) * 0.4
        
        scores = {
            'Sandy': sandy_score,
            'Clay': clay_score,
            'Loamy': loamy_score,
            'Silty': silty_score
        }
        
        texture = max(scores, key=scores.get)
        
        # Calculate percentages
        if texture == 'Sandy':
            breakdown = {'sand': 70, 'silt': 15, 'clay': 15}
        elif texture == 'Clay':
            breakdown = {'sand': 20, 'silt': 25, 'clay': 55}
        elif texture == 'Silty':
            breakdown = {'sand': 15, 'silt': 70, 'clay': 15}
        else:  # Loamy
            breakdown = {'sand': 40, 'silt': 40, 'clay': 20}
        
        return texture, breakdown
    
    def _calculate_confidence(self, features: Dict) -> float:
        """Calculate prediction confidence"""
        required = ['r', 'g', 'b', 'edge_density', 'roughness']
        present = sum(1 for f in required if f in features and features[f] is not None)
        
        base_confidence = present / len(required)
        
        # Adjust for feature quality
        variance_penalty = 0
        if 'edge_variance' in features:
            variance_penalty = min(features['edge_variance'] / 100, 0.2)
        
        confidence = base_confidence - variance_penalty
        return np.clip(confidence, 0.5, 1.0)
    
    def get_crop_recommendations(self, soil_params: Dict) -> List[str]:
        """Get crop recommendations based on soil parameters"""
        pH = soil_params['pH']
        nitrogen = soil_params['nitrogen']
        phosphorus = soil_params['phosphorus']
        potassium = soil_params['potassium']
        texture = soil_params['texture']
        
        recommendations = []
        
        # pH-based recommendations
        if 6.0 <= pH <= 7.5:
            recommendations.extend(['Wheat', 'Corn', 'Soybeans'])
        elif pH < 6.0:
            recommendations.extend(['Potatoes', 'Blueberries', 'Sweet Potatoes'])
        else:
            recommendations.extend(['Asparagus', 'Cabbage', 'Beets'])
        
        # NPK-based recommendations
        if nitrogen > 100:
            recommendations.extend(['Leafy Greens', 'Spinach', 'Lettuce'])
        if phosphorus > 30:
            recommendations.extend(['Tomatoes', 'Peppers', 'Root vegetables'])
        if potassium > 150:
            recommendations.extend(['Fruits', 'Carrots', 'Onions'])
        
        # Texture-based recommendations
        if texture == 'Sandy':
            recommendations.extend(['Carrots', 'Radishes', 'Peanuts'])
        elif texture == 'Clay':
            recommendations.extend(['Broccoli', 'Brussels sprouts', 'Kale'])
        elif texture == 'Loamy':
            recommendations.extend(['Most vegetables', 'Flowers', 'Herbs'])
        else:  # Silty
            recommendations.extend(['Most crops', 'Perennials', 'Shrubs'])
        
        # Remove duplicates and limit
        recommendations = list(dict.fromkeys(recommendations))[:6]
        return recommendations