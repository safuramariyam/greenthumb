"""
Dataset Handler Module
utils/dataset_handler.py
"""

import torch
from torch.utils.data import Dataset
import torchvision.transforms as transforms
from pathlib import Path
from PIL import Image
from typing import Dict, List, Tuple
import numpy as np
from collections import defaultdict
import json

class PlantDiseaseDataset(Dataset):
    """
    PyTorch Dataset for plant disease classification
    Expected structure:
    data/raw/
        crop_name/
            severity_level/
                image_001.jpg
                image_002.jpg
                ...
    """
    
    CROPS = [
        "tomato", "potato", "rice", "wheat", "maize",
        "chili", "banana", "cotton", "apple", "grapes"
    ]
    
    SEVERITY_LEVELS = [0, 20, 40, 60, 80, 100]
    
    def __init__(self, data_path: str, transform=None):
        self.data_path = Path(data_path)
        self.transform = transform or self._get_default_transform()
        self.images = []
        self.crop_to_idx = {crop: i for i, crop in enumerate(self.CROPS)}
        self.severity_to_idx = {severity: i for i, severity in enumerate(self.SEVERITY_LEVELS)}
        
        self._load_images()
    
    def _get_default_transform(self):
        """Default image transformations"""
        return transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.2, contrast=0.2),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    
    def _load_images(self):
        """Load all images from directory structure"""
        raw_path = self.data_path / "raw"
        
        if not raw_path.exists():
            print(f"Warning: {raw_path} does not exist")
            return
        
        # Iterate through crop directories
        for crop_dir in raw_path.iterdir():
            if not crop_dir.is_dir():
                continue
            
            crop_name = crop_dir.name.lower()
            if crop_name not in self.crop_to_idx:
                print(f"Warning: Unknown crop type '{crop_name}' skipped")
                continue
            
            crop_idx = self.crop_to_idx[crop_name]
            
            # Iterate through severity directories
            for severity_dir in crop_dir.iterdir():
                if not severity_dir.is_dir():
                    continue
                
                try:
                    severity_level = int(severity_dir.name)
                    if severity_level not in self.severity_to_idx:
                        print(f"Warning: Invalid severity '{severity_level}' skipped")
                        continue
                    
                    severity_idx = self.severity_to_idx[severity_level]
                    
                    # Load images from this directory
                    for image_path in severity_dir.glob("*.[jJ][pP][gG]"):
                        self.images.append({
                            "path": str(image_path),
                            "crop_idx": crop_idx,
                            "severity_idx": severity_idx,
                            "crop_name": crop_name,
                            "severity_level": severity_level
                        })
                    
                    for image_path in severity_dir.glob("*.[pP][nN][gG]"):
                        self.images.append({
                            "path": str(image_path),
                            "crop_idx": crop_idx,
                            "severity_idx": severity_idx,
                            "crop_name": crop_name,
                            "severity_level": severity_level
                        })
                
                except ValueError:
                    print(f"Warning: Invalid severity directory name '{severity_dir.name}'")
                    continue
    
    def __len__(self) -> int:
        return len(self.images)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, int]:
        """
        Returns:
            image: Tensor
            crop_label: int (0-9)
            severity_label: int (0-5)
        """
        item = self.images[idx]
        
        # Load and transform image
        image = Image.open(item["path"]).convert("RGB")
        
        if self.transform:
            image = self.transform(image)
        
        return image, item["crop_idx"], item["severity_idx"]

class DatasetHandler:
    """
    Handles dataset preparation and statistics
    """
    
    CROPS = [
        "tomato", "potato", "rice", "wheat", "maize",
        "chili", "banana", "cotton", "apple", "grapes"
    ]
    
    SEVERITY_LEVELS = [0, 20, 40, 60, 80, 100]
    
    def __init__(self, base_path: str = "data"):
        self.base_path = Path(base_path)
        self.dataset = None
    
    def get_pytorch_dataset(self, transform=None) -> PlantDiseaseDataset:
        """Get PyTorch dataset"""
        self.dataset = PlantDiseaseDataset(str(self.base_path), transform=transform)
        return self.dataset
    
    def validate_dataset(self) -> bool:
        """Check if dataset has minimum requirements"""
        dataset = self.get_pytorch_dataset()
        return len(dataset) > 0
    
    def get_statistics(self) -> Dict:
        """Get comprehensive dataset statistics"""
        dataset = self.get_pytorch_dataset()
        
        if len(dataset) == 0:
            return {
                "status": "empty",
                "total_images": 0,
                "crops": {},
                "message": "No images in dataset"
            }
        
        # Count images per crop and severity
        crop_counts = defaultdict(lambda: defaultdict(int))
        crop_names = self.CROPS
        
        for item in dataset.images:
            crop_name = item["crop_name"]
            severity = item["severity_level"]
            crop_counts[crop_name][severity] += 1
        
        # Format statistics
        stats = {
            "status": "ready",
            "total_images": len(dataset),
            "crops_available": len(crop_counts),
            "crops": {}
        }
        
        for crop_name in crop_names:
            if crop_name in crop_counts:
                stats["crops"][crop_name] = dict(crop_counts[crop_name])
            else:
                stats["crops"][crop_name] = {}
        
        return stats
    
    def create_directory_structure(self):
        """Create expected directory structure for data organization"""
        raw_path = self.base_path / "raw"
        
        for crop in self.CROPS:
            for severity in self.SEVERITY_LEVELS:
                severity_path = raw_path / crop / str(severity)
                severity_path.mkdir(parents=True, exist_ok=True)
        
        print(f"✓ Directory structure created at {raw_path}")
    
    def get_data_organization_guide(self) -> str:
        """Get guide for organizing training data"""
        guide = """
DATASET ORGANIZATION GUIDE
==========================

Expected Directory Structure:
data/raw/
├── tomato/
│   ├── 0/          (Healthy - 5-10 images)
│   ├── 20/         (20% affected - 5-10 images)
│   ├── 40/         (40% affected - 5-10 images)
│   ├── 60/         (60% affected - 5-10 images)
│   ├── 80/         (80% affected - 5-10 images)
│   └── 100/        (Dead/100% affected - 5-10 images)
├── potato/
│   ├── 0/
│   ├── 20/
│   ├── 40/
│   ├── 60/
│   ├── 80/
│   └── 100/
├── rice/
├── wheat/
├── maize/
├── chili/
├── banana/
├── cotton/
├── apple/
└── grapes/

TOTAL: 10 crops × 6 severity levels × 5-10 images = 300-600 training images

Severity Levels Explained:
- 0:   Completely healthy plant/leaf
- 20:  ~20% of leaf/plant shows disease symptoms
- 40:  ~40% of leaf/plant shows disease symptoms
- 60:  ~60% of leaf/plant shows disease symptoms
- 80:  ~80% of leaf/plant shows disease symptoms
- 100: Plant completely dead or 100% affected

Requirements per severity:
✓ At least 5 images per severity level (ideally 8-10)
✓ Clear, well-lit photographs
✓ Various angles and distances
✓ Consistent image quality
✓ Supported formats: JPG, PNG

Upload Method (via API):
POST /upload-training-data?crop_type=tomato&severity=0
File: image.jpg

After organizing all images:
1. Call: POST /dataset-stats (verify organization)
2. Call: POST /train (start training with default config)
"""
        return guide