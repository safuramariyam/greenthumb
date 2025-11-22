"""
FastAPI Backend for Plant Disease & Soil Analysis
Main application server
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import shutil
import os
from pathlib import Path
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
from typing import List, Dict
from pydantic import BaseModel
import uvicorn
import logging

from models.disease_classifier import PlantDiseaseClassifier
from models.soil_analyzer import SoilAnalyzer
from utils.dataset_handler import DatasetHandler
from utils.training import ModelTrainer
from utils.soil_processing import SoilImageProcessor

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="GreenThumb Plant & Soil Analysis API",
    description="AI-powered plant disease detection and soil analysis",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models and utilities
classifier = None
dataset_handler = None
trainer = None
soil_analyzer = None
image_processor = None

# Response Models
class PredictionResponse(BaseModel):
    crop_type: str
    disease_status: str
    severity_level: int
    confidence: float
    recommendations: List[str]

class TrainingConfig(BaseModel):
    epochs: int = 50
    batch_size: int = 8
    learning_rate: float = 0.001
    test_split: float = 0.2

class SoilAnalysisResponse(BaseModel):
    pH: float
    moisture: float
    nitrogen: float
    phosphorus: float
    potassium: float
    texture: str
    texture_breakdown: Dict[str, int]
    recommendations: List[str]
    confidence: float

class ManualSoilAnalysisRequest(BaseModel):
    pH: float
    nitrogen: float
    phosphorus: float
    potassium: float
    moisture: float

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    global classifier, dataset_handler, trainer, soil_analyzer, image_processor
    
    # Create necessary directories
    Path("data/raw").mkdir(parents=True, exist_ok=True)
    Path("data/processed").mkdir(parents=True, exist_ok=True)
    Path("models/saved").mkdir(parents=True, exist_ok=True)
    Path("models/checkpoints").mkdir(parents=True, exist_ok=True)
    
    # Initialize plant disease models
    dataset_handler = DatasetHandler(base_path="data")
    classifier = PlantDiseaseClassifier(model_path="models/saved/plant_classifier.pth")
    trainer = ModelTrainer(dataset_handler=dataset_handler, classifier=classifier)
    
    # Initialize soil analysis models
    soil_analyzer = SoilAnalyzer()
    image_processor = SoilImageProcessor()
    
    logger.info("✓ Plant Disease Analysis Backend Started")
    logger.info("✓ Soil Analysis Backend Started")

# ============================================================
# PLANT DISEASE ENDPOINTS
# ============================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Plant Disease & Soil Analysis API",
        "gpu_available": torch.cuda.is_available(),
        "plant_disease_model": "Ready",
        "soil_analysis_model": "Ready"
    }

@app.post("/analyze")
async def analyze_plant(file: UploadFile = File(...)):
    """
    Analyze a single plant image for disease
    """
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        prediction = classifier.predict(image)
        recommendations = classifier.get_recommendations(
            prediction["crop_type"],
            prediction["disease_status"],
            prediction["severity_level"]
        )
        
        return PredictionResponse(
            crop_type=prediction["crop_type"],
            disease_status=prediction["disease_status"],
            severity_level=prediction["severity_level"],
            confidence=prediction["confidence"],
            recommendations=recommendations
        )
    
    except Exception as e:
        logger.error(f"Plant analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-analyze")
async def batch_analyze(files: List[UploadFile] = File(...)):
    """
    Analyze multiple plant images
    """
    results = []
    
    for file in files:
        try:
            contents = await file.read()
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            prediction = classifier.predict(image)
            
            results.append({
                "filename": file.filename,
                "prediction": prediction,
                "status": "success"
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": str(e),
                "status": "failed"
            })
    
    return {
        "results": results,
        "total": len(files),
        "successful": sum(1 for r in results if r["status"] == "success")
    }

@app.post("/train")
async def train_model(config: TrainingConfig, background_tasks: BackgroundTasks):
    """
    Start model training with custom configuration
    """
    try:
        if not dataset_handler.validate_dataset():
            raise HTTPException(
                status_code=400,
                detail="Dataset not properly organized. Please upload training images first."
            )
        
        background_tasks.add_task(
            trainer.train,
            epochs=config.epochs,
            batch_size=config.batch_size,
            learning_rate=config.learning_rate,
            test_split=config.test_split
        )
        
        return {
            "status": "training_started",
            "config": config.dict(),
            "message": "Model training started in background"
        }
    
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dataset-stats")
async def get_dataset_stats():
    """
    Get statistics about the training dataset
    """
    stats = dataset_handler.get_statistics()
    return stats

@app.get("/model-info")
async def get_model_info():
    """
    Get current model information
    """
    return {
        "model_type": "ResNet50 + Custom Classifier",
        "crops_supported": classifier.crops_list,
        "severity_levels": [0, 20, 40, 60, 80, 100],
        "input_size": [224, 224],
        "status": "Ready"
    }

# ============================================================
# SOIL ANALYSIS ENDPOINTS
# ============================================================

@app.post("/soil/analyze-image", response_model=SoilAnalysisResponse)
async def analyze_soil_image(file: UploadFile = File(...)):
    """
    Analyze soil image to predict parameters
    """
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG)"
            )
        
        image_bytes = await file.read()
        
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
        raise HTTPException(status_code=500, detail=f"Soil analysis failed: {str(e)}")

@app.post("/soil/analyze-manual", response_model=SoilAnalysisResponse)
async def analyze_soil_manual(data: ManualSoilAnalysisRequest):
    """
    Analyze soil using manual parameter input (no image)
    """
    try:
        features = {
            'r': 128 + (data.pH - 6.5) * 10,
            'g': 100 + (data.nitrogen / 2),
            'b': 80 + (data.phosphorus),
            'h': 20 + (data.moisture / 5),
            's': 50 + (data.potassium / 5),
            'v': 100 - (data.moisture / 2),
            'edge_density': data.nitrogen / 2,
            'roughness': data.moisture * 10
        }
        
        predictions = soil_analyzer.predict_from_features(features)
        recommendations = soil_analyzer.get_crop_recommendations(predictions)
        
        return SoilAnalysisResponse(
            pH=data.pH,
            moisture=data.moisture,
            nitrogen=data.nitrogen,
            phosphorus=data.phosphorus,
            potassium=data.potassium,
            texture=predictions['texture'],
            texture_breakdown=predictions['texture_breakdown'],
            recommendations=recommendations,
            confidence=0.85
        )
        
    except Exception as e:
        logger.error(f"Manual soil analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/soil/texture-types")
async def get_texture_types():
    """Get information about different soil texture types"""
    return {
        "textures": [
            {
                "name": "Sandy",
                "description": "Large particles, excellent drainage, low nutrient retention",
                "ideal_for": ["Carrots", "Potatoes", "Radishes", "Peanuts"]
            },
            {
                "name": "Clay",
                "description": "Small particles, poor drainage, high nutrient retention",
                "ideal_for": ["Cabbage", "Broccoli", "Brussels sprouts", "Kale"]
            },
            {
                "name": "Loamy",
                "description": "Balanced mixture - ideal for most plants",
                "ideal_for": ["Most vegetables", "Flowers", "Shrubs", "Herbs"]
            },
            {
                "name": "Silty",
                "description": "Medium particles, good fertility and moisture retention",
                "ideal_for": ["Most crops", "Perennials", "Shrubs"]
            }
        ]
    }

@app.get("/soil/ph-guide")
async def get_ph_guide():
    """Get pH level guide for different crops"""
    return {
        "ph_ranges": {
            "highly_acidic": {"range": "4.0-5.5", "crops": ["Blueberries", "Azaleas", "Cranberries"]},
            "slightly_acidic": {"range": "5.5-6.5", "crops": ["Potatoes", "Strawberries", "Tomatoes"]},
            "neutral": {"range": "6.5-7.5", "crops": ["Most vegetables", "Wheat", "Corn", "Soybeans"]},
            "alkaline": {"range": "7.5-9.0", "crops": ["Asparagus", "Cabbage", "Beets"]}
        }
    }

@app.get("/soil/npk-guide")
async def get_npk_guide():
    """Get NPK requirements guide"""
    return {
        "nitrogen": {
            "description": "Essential for leaf and stem growth",
            "low": "0-50 mg/kg - Yellowing leaves, stunted growth",
            "medium": "50-100 mg/kg - Adequate for most crops",
            "high": "100-200 mg/kg - Ideal for leafy greens, corn"
        },
        "phosphorus": {
            "description": "Essential for root development and flowering",
            "low": "0-20 mg/kg - Purple leaves, poor flowering",
            "medium": "20-40 mg/kg - Adequate for most crops",
            "high": "40-80 mg/kg - Ideal for tomatoes, peppers, flowers"
        },
        "potassium": {
            "description": "Essential for plant health and disease resistance",
            "low": "0-100 mg/kg - Brown leaf edges, weak stems",
            "medium": "100-200 mg/kg - Adequate for most crops",
            "high": "200-300 mg/kg - Ideal for fruits, root vegetables"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)