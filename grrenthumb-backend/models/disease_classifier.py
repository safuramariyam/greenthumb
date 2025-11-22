"""
Plant Disease Classifier Model
models/disease_classifier.py
"""

import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple
import json

class PlantDiseaseClassifier:
    """
    Custom classifier for plant diseases with severity prediction
    """
    
    # 10 Crop types
    CROPS = [
        "tomato", "potato", "rice", "wheat", "maize",
        "chili", "banana", "cotton", "apple", "grapes"
    ]
    
    # Severity levels: 0 (healthy), 20, 40, 60, 80, 100 (dead)
    SEVERITY_LEVELS = [0, 20, 40, 60, 80, 100]
    
    # Severity to status mapping
    SEVERITY_STATUS = {
        0: "Healthy",
        20: "Minimal Disease (20%)",
        40: "Moderate Disease (40%)",
        60: "Severe Disease (60%)",
        80: "Very Severe Disease (80%)",
        100: "Dead/Completely Affected (100%)"
    }
    
    def __init__(self, model_path: str = None, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.crops_list = self.CROPS
        self.severity_levels = self.SEVERITY_LEVELS
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        # Build model architecture
        self.model = self._build_model()
        
        if model_path and Path(model_path).exists():
            self.load_model(model_path)
        else:
            print("Using untrained model - train before production use")
        
        self.model.to(self.device)
        self.model.eval()
    
    def _build_model(self) -> nn.Module:
        """Build ResNet50-based classifier"""
        # Load pretrained ResNet50
        base_model = models.resnet50(pretrained=True)
        
        # Remove final classification layer
        num_features = base_model.fc.in_features
        base_model.fc = nn.Identity()
        
        # Build custom head with multiple outputs
        class CustomHead(nn.Module):
            def __init__(self, input_features: int):
                super().__init__()
                
                # Shared layers
                self.shared = nn.Sequential(
                    nn.Linear(input_features, 512),
                    nn.ReLU(),
                    nn.Dropout(0.3),
                    nn.Linear(512, 256),
                    nn.ReLU(),
                    nn.Dropout(0.3)
                )
                
                # Crop classifier (10 crops)
                self.crop_classifier = nn.Linear(256, len(PlantDiseaseClassifier.CROPS))
                
                # Severity classifier (6 levels)
                self.severity_classifier = nn.Linear(256, len(PlantDiseaseClassifier.SEVERITY_LEVELS))
            
            def forward(self, x):
                x = self.shared(x)
                crop_logits = self.crop_classifier(x)
                severity_logits = self.severity_classifier(x)
                return crop_logits, severity_logits
        
        class FullModel(nn.Module):
            def __init__(self, base, head):
                super().__init__()
                self.base = base
                self.head = head
            
            def forward(self, x):
                features = self.base(x)
                return self.head(features)
        
        head = CustomHead(num_features)
        model = FullModel(base_model, head)
        
        return model
    
    def predict(self, image: Image.Image) -> Dict:
        """
        Predict crop type and disease severity for a single image
        
        Args:
            image: PIL Image object
        
        Returns:
            Dictionary with prediction results
        """
        # Preprocess image
        img_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            crop_logits, severity_logits = self.model(img_tensor)
        
        # Get predictions
        crop_probs = torch.softmax(crop_logits, dim=1)
        severity_probs = torch.softmax(severity_logits, dim=1)
        
        crop_idx = crop_probs.argmax(dim=1).item()
        severity_idx = severity_probs.argmax(dim=1).item()
        
        crop_type = self.CROPS[crop_idx]
        severity_level = self.SEVERITY_LEVELS[severity_idx]
        disease_status = self.SEVERITY_STATUS[severity_level]
        
        confidence = max(
            crop_probs[0, crop_idx].item(),
            severity_probs[0, severity_idx].item()
        )
        
        return {
            "crop_type": crop_type,
            "disease_status": disease_status,
            "severity_level": severity_level,
            "confidence": round(confidence, 4),
            "crop_probabilities": dict(zip(self.CROPS, crop_probs[0].cpu().numpy())),
            "severity_probabilities": dict(
                zip([str(s) for s in self.SEVERITY_LEVELS], severity_probs[0].cpu().numpy())
            )
        }
    
    def get_recommendations(self, crop_type: str, disease_status: str, severity_level: int) -> List[str]:
        """
        Generate recommendations based on prediction
        """
        recommendations = []
        
        # Severity-based recommendations
        if severity_level == 0:
            recommendations.append("✓ Plant is healthy. Continue regular maintenance.")
            recommendations.append("✓ Maintain proper irrigation and fertilization schedule.")
        elif severity_level == 20:
            recommendations.append("⚠ Early signs of disease detected.")
            recommendations.append("✓ Monitor closely and isolate affected plant if possible.")
            recommendations.append("✓ Consider preventive fungicide/pesticide spray.")
        elif severity_level in [40, 60]:
            recommendations.append("⚠ Moderate to severe disease progression detected.")
            recommendations.append("✓ Apply appropriate fungicide/pesticide immediately.")
            recommendations.append("✓ Remove affected leaves and improve air circulation.")
            recommendations.append("✓ Increase monitoring frequency.")
        elif severity_level in [80, 100]:
            recommendations.append("🚨 Plant is heavily affected or dead.")
            recommendations.append("✓ Consider removing the plant to prevent spread.")
            recommendations.append("✓ Disinfect nearby plants and garden tools.")
            recommendations.append("✓ Review environmental conditions and adjust growing practices.")
        
        # Crop-specific recommendations
        crop_tips = {
            "tomato": "Ensure proper spacing and ventilation to prevent fungal diseases.",
            "potato": "Maintain soil moisture balance to prevent late blight.",
            "rice": "Manage water levels to reduce fungal pressure.",
            "wheat": "Rotate crops annually to break disease cycles.",
            "maize": "Use disease-resistant varieties when available.",
            "chili": "Avoid overhead watering to reduce fungal issues.",
            "banana": "Monitor for Panama disease and use resistant rootstocks.",
            "cotton": "Regular scouting for pest-related diseases.",
            "apple": "Prune affected branches and improve tree structure.",
            "grapes": "Use fungicide programs during high-risk seasons."
        }
        
        if crop_type.lower() in crop_tips:
            recommendations.append(f"💡 {crop_type.capitalize()}-specific tip: {crop_tips[crop_type.lower()]}")
        
        return recommendations
    
    def save_model(self, model_path: str):
        """Save model checkpoint"""
        Path(model_path).parent.mkdir(parents=True, exist_ok=True)
        torch.save(self.model.state_dict(), model_path)
        print(f"Model saved to {model_path}")
    
    def load_model(self, model_path: str):
        """Load model checkpoint"""
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        print(f"Model loaded from {model_path}")
    
    def reset(self):
        """Reset model to untrained state"""
        self.model = self._build_model()
        self.model.to(self.device)
        print("Model reset to initial state")
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        return {
            "architecture": "ResNet50 + Custom Multi-task Head",
            "crops": len(self.CROPS),
            "severity_levels": len(self.SEVERITY_LEVELS),
            "device": str(self.device),
            "total_parameters": sum(p.numel() for p in self.model.parameters())
        }