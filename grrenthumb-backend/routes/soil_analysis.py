"""
Soil Analysis API Routes
Endpoints for soil image analysis and predictions
"""
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict
import logging

from models.soil_analyzer import SoilAnalyzer
from utils.soil_processing import SoilImageProcessor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/soil", tags=["Soil Analysis"])

# Initialize models
soil_analyzer = SoilAnalyzer()
image_processor = SoilImageProcessor()

# Response Models
class SoilAnalysisResponse(BaseModel):
    """Soil analysis response model"""
    pH: float = Field(..., description="Soil pH level (4.0-9.0)")
    moisture: float = Field(..., description="Moisture percentage (0-100)")
    nitrogen: float = Field(..., description="Nitrogen content (mg/kg)")
    phosphorus: float = Field(..., description="Phosphorus content (mg/kg)")
    potassium: float = Field(..., description="Potassium content (mg/kg)")
    texture: str = Field(..., description="Soil texture type")
    texture_breakdown: Dict[str, int] = Field(..., description="Sand, Silt, Clay percentages")
    recommendations: List[str] = Field(..., description="Crop recommendations")
    confidence: float = Field(..., description="Analysis confidence (0-1)")

class TextureInfo(BaseModel):
    """Soil texture information"""
    name: str
    description: str
    ideal_for: List[str]

class PhRangeInfo(BaseModel):
    """pH range information"""
    range: str
    crops: List[str]

# Main Analysis Endpoint
@router.post("/analyze", response_model=SoilAnalysisResponse)
async def analyze_soil(file: UploadFile = File(...)):
    """
    Analyze soil image to predict parameters
    
    Upload a soil image to get:
    - pH level
    - Moisture content
    - NPK values (Nitrogen, Phosphorus, Potassium)
    - Soil texture classification
    - Crop recommendations
    
    Args:
        file: Soil image (JPG, PNG)
        
    Returns:
        Complete soil analysis with recommendations
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG)"
            )
        
        # Read image
        image_bytes = await file.read()
        
        # Validate image
        if not image_processor.validate_image(image_bytes):
            raise HTTPException(
                status_code=400,
                detail="Invalid image or image size not supported"
            )
        
        logger.info(f"Processing soil image: {file.filename}")
        
        # Extract features
        features = image_processor.process_image_file(image_bytes)
        
        # Get predictions
        predictions = soil_analyzer.predict_from_features(features)
        
        # Get recommendations
        recommendations = soil_analyzer.get_crop_recommendations(predictions)
        
        logger.info(f"Soil analysis complete for {file.filename}")
        
        return SoilAnalysisResponse(
            pH=predictions['pH'],
            moisture=predictions['moisture'],
            nitrogen=predictions['nitrogen'],
            phosphorus=predictions['phosphorus'],
            potassium=predictions['potassium'],
            texture=predictions['texture'],
            texture_breakdown=predictions['texture_breakdown'],
            recommendations=recommendations,
            confidence=predictions['confidence']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Soil analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Soil analysis failed: {str(e)}"
        )

# Information Endpoints
@router.get("/texture-types")
async def get_texture_types():
    """Get information about different soil texture types"""
    return {
        "textures": [
            TextureInfo(
                name="Sandy",
                description="Large particles, excellent drainage, low nutrient retention",
                ideal_for=["Carrots", "Potatoes", "Radishes", "Peanuts"]
            ),
            TextureInfo(
                name="Clay",
                description="Small particles, poor drainage, high nutrient retention",
                ideal_for=["Cabbage", "Broccoli", "Brussels sprouts", "Kale"]
            ),
            TextureInfo(
                name="Loamy",
                description="Balanced mixture of sand, silt, and clay - ideal for most plants",
                ideal_for=["Most vegetables", "Flowers", "Shrubs", "Herbs"]
            ),
            TextureInfo(
                name="Silty",
                description="Medium particles, good fertility and moisture retention",
                ideal_for=["Most crops", "Perennials", "Shrubs"]
            )
        ]
    }

@router.get("/ph-guide")
async def get_ph_guide():
    """Get pH level guide for different crops"""
    return {
        "ph_ranges": {
            "highly_acidic": PhRangeInfo(
                range="4.0-5.5",
                crops=["Blueberries", "Azaleas", "Rhododendrons", "Cranberries"]
            ),
            "slightly_acidic": PhRangeInfo(
                range="5.5-6.5",
                crops=["Potatoes", "Strawberries", "Tomatoes", "Sweet Potatoes"]
            ),
            "neutral": PhRangeInfo(
                range="6.5-7.5",
                crops=["Most vegetables", "Wheat", "Corn", "Soybeans", "Lettuce"]
            ),
            "alkaline": PhRangeInfo(
                range="7.5-9.0",
                crops=["Asparagus", "Cabbage", "Cauliflower", "Beets"]
            )
        }
    }

@router.get("/npk-guide")
async def get_npk_guide():
    """Get NPK (Nitrogen, Phosphorus, Potassium) requirements guide"""
    return {
        "nitrogen": {
            "description": "Essential for leaf and stem growth",
            "low": {"range": "0-50 mg/kg", "symptoms": ["Yellowing leaves", "Stunted growth"]},
            "medium": {"range": "50-100 mg/kg", "status": "Adequate for most crops"},
            "high": {"range": "100-200 mg/kg", "ideal_for": ["Leafy greens", "Corn", "Grass"]}
        },
        "phosphorus": {
            "description": "Essential for root development and flowering",
            "low": {"range": "0-20 mg/kg", "symptoms": ["Purple leaves", "Poor flowering"]},
            "medium": {"range": "20-40 mg/kg", "status": "Adequate for most crops"},
            "high": {"range": "40-80 mg/kg", "ideal_for": ["Tomatoes", "Peppers", "Flowers"]}
        },
        "potassium": {
            "description": "Essential for overall plant health and disease resistance",
            "low": {"range": "0-100 mg/kg", "symptoms": ["Brown leaf edges", "Weak stems"]},
            "medium": {"range": "100-200 mg/kg", "status": "Adequate for most crops"},
            "high": {"range": "200-300 mg/kg", "ideal_for": ["Fruits", "Root vegetables"]}
        }
    }

@router.get("/info")
async def get_soil_analysis_info():
    """Get general information about soil analysis"""
    return {
        "description": "Soil analysis using computer vision and color analysis",
        "parameters_analyzed": [
            "pH level (4.0-9.0)",
            "Moisture content (0-100%)",
            "Nitrogen content (mg/kg)",
            "Phosphorus content (mg/kg)",
            "Potassium content (mg/kg)",
            "Soil texture (Sandy/Clay/Loamy/Silty)"
        ],
        "tips": [
            "Use clear, well-lit images of soil samples",
            "Take photos from directly above the soil",
            "Ensure the soil surface is visible and in focus",
            "Remove any debris or vegetation from the sample",
            "Use images of dry or slightly moist soil for best results"
        ],
        "limitations": [
            "Predictions are estimates based on visual features",
            "For precise measurements, use laboratory soil testing",
            "Results may vary based on image quality and lighting"
        ]
    }