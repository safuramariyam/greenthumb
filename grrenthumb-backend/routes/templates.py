"""
Task Templates Routes
Pre-defined task templates for different crops and seasons
"""

import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path

router = APIRouter()

# Data Models
class TaskTemplate(BaseModel):
    id: str
    name: str
    description: str
    crop_type: str
    season: str
    tasks: List[Dict[str, Any]]  # List of task definitions
    created_at: str

class TemplateCategory(BaseModel):
    name: str
    description: str
    templates: List[TaskTemplate]

# Template Data Storage
TEMPLATES_FILE = Path("data/task_templates.json")

def load_templates() -> List[Dict[str, Any]]:
    """Load task templates from JSON file"""
    if not TEMPLATES_FILE.exists():
        return get_default_templates()
    try:
        with open(TEMPLATES_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading templates: {e}")
        return get_default_templates()

def save_templates(templates: List[Dict[str, Any]]):
    """Save task templates to JSON file"""
    TEMPLATES_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(TEMPLATES_FILE, 'w') as f:
            json.dump(templates, f, indent=2, default=str)
    except Exception as e:
        print(f"Error saving templates: {e}")

def get_default_templates() -> List[Dict[str, Any]]:
    """Get default task templates"""
    return [
        {
            "id": "rice_monsoon",
            "name": "Rice Monsoon Cultivation",
            "description": "Complete rice cultivation cycle for monsoon season",
            "crop_type": "rice",
            "season": "monsoon",
            "tasks": [
                {
                    "title": "Land Preparation",
                    "type": "general",
                    "description": "Prepare field by plowing and leveling",
                    "days_from_start": 0,
                    "priority": "high"
                },
                {
                    "title": "Seed Selection & Treatment",
                    "type": "general",
                    "description": "Select quality seeds and treat with fungicide",
                    "days_from_start": 1,
                    "priority": "high"
                },
                {
                    "title": "Seed Sowing/Transplanting",
                    "type": "general",
                    "description": "Sow seeds or transplant seedlings",
                    "days_from_start": 7,
                    "priority": "high"
                },
                {
                    "title": "Water Management",
                    "type": "watering",
                    "description": "Maintain 2-5 cm water level",
                    "days_from_start": 14,
                    "priority": "medium"
                },
                {
                    "title": "First Fertilizer Application",
                    "type": "fertilizing",
                    "description": "Apply nitrogen fertilizer",
                    "days_from_start": 21,
                    "priority": "medium"
                },
                {
                    "title": "Weed Control",
                    "type": "general",
                    "description": "Remove weeds manually or with herbicide",
                    "days_from_start": 28,
                    "priority": "medium"
                },
                {
                    "title": "Pest Monitoring",
                    "type": "general",
                    "description": "Check for pests and apply control measures if needed",
                    "days_from_start": 35,
                    "priority": "low"
                },
                {
                    "title": "Second Fertilizer Application",
                    "type": "fertilizing",
                    "description": "Apply phosphorus and potassium",
                    "days_from_start": 42,
                    "priority": "medium"
                },
                {
                    "title": "Drain Water",
                    "type": "watering",
                    "description": "Drain water 1-2 weeks before harvest",
                    "days_from_start": 105,
                    "priority": "high"
                },
                {
                    "title": "Harvest Rice",
                    "type": "harvesting",
                    "description": "Harvest when grains are golden yellow",
                    "days_from_start": 120,
                    "priority": "high"
                }
            ],
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "wheat_winter",
            "name": "Wheat Winter Cultivation",
            "description": "Complete wheat cultivation cycle for winter season",
            "crop_type": "wheat",
            "season": "winter",
            "tasks": [
                {
                    "title": "Field Preparation",
                    "type": "general",
                    "description": "Plow and prepare field for sowing",
                    "days_from_start": 0,
                    "priority": "high"
                },
                {
                    "title": "Seed Selection",
                    "type": "general",
                    "description": "Choose high-quality wheat seeds",
                    "days_from_start": 1,
                    "priority": "high"
                },
                {
                    "title": "Sowing Wheat",
                    "type": "general",
                    "description": "Sow seeds at proper depth and spacing",
                    "days_from_start": 7,
                    "priority": "high"
                },
                {
                    "title": "Irrigation Setup",
                    "type": "watering",
                    "description": "Ensure irrigation system is ready",
                    "days_from_start": 10,
                    "priority": "medium"
                },
                {
                    "title": "First Irrigation",
                    "type": "watering",
                    "description": "Provide first irrigation after sowing",
                    "days_from_start": 14,
                    "priority": "medium"
                },
                {
                    "title": "Fertilizer Application",
                    "type": "fertilizing",
                    "description": "Apply NPK fertilizer",
                    "days_from_start": 21,
                    "priority": "medium"
                },
                {
                    "title": "Weed Management",
                    "type": "general",
                    "description": "Control weeds in the field",
                    "days_from_start": 35,
                    "priority": "low"
                },
                {
                    "title": "Second Irrigation",
                    "type": "watering",
                    "description": "Irrigate during tillering stage",
                    "days_from_start": 45,
                    "priority": "medium"
                },
                {
                    "title": "Pest Control",
                    "type": "general",
                    "description": "Monitor and control pests",
                    "days_from_start": 60,
                    "priority": "low"
                },
                {
                    "title": "Final Irrigation",
                    "type": "watering",
                    "description": "Last irrigation before harvest",
                    "days_from_start": 110,
                    "priority": "high"
                },
                {
                    "title": "Harvest Wheat",
                    "type": "harvesting",
                    "description": "Harvest when grains are hard and golden",
                    "days_from_start": 140,
                    "priority": "high"
                }
            ],
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "tomato_summer",
            "name": "Tomato Summer Cultivation",
            "description": "Complete tomato cultivation cycle for summer season",
            "crop_type": "tomato",
            "season": "summer",
            "tasks": [
                {
                    "title": "Nursery Preparation",
                    "type": "general",
                    "description": "Prepare nursery beds for seedlings",
                    "days_from_start": 0,
                    "priority": "high"
                },
                {
                    "title": "Seed Sowing",
                    "type": "general",
                    "description": "Sow tomato seeds in nursery",
                    "days_from_start": 1,
                    "priority": "high"
                },
                {
                    "title": "Seedling Care",
                    "type": "general",
                    "description": "Water and protect seedlings",
                    "days_from_start": 7,
                    "priority": "medium"
                },
                {
                    "title": "Field Preparation",
                    "type": "general",
                    "description": "Prepare main field with proper beds",
                    "days_from_start": 14,
                    "priority": "high"
                },
                {
                    "title": "Transplanting",
                    "type": "general",
                    "description": "Transplant seedlings to main field",
                    "days_from_start": 21,
                    "priority": "high"
                },
                {
                    "title": "Staking Setup",
                    "type": "general",
                    "description": "Install stakes for plant support",
                    "days_from_start": 28,
                    "priority": "medium"
                },
                {
                    "title": "Irrigation Setup",
                    "type": "watering",
                    "description": "Set up drip irrigation system",
                    "days_from_start": 25,
                    "priority": "medium"
                },
                {
                    "title": "Fertilizer Application",
                    "type": "fertilizing",
                    "description": "Apply balanced NPK fertilizer",
                    "days_from_start": 30,
                    "priority": "medium"
                },
                {
                    "title": "Pest Monitoring",
                    "type": "general",
                    "description": "Regular pest and disease monitoring",
                    "days_from_start": 35,
                    "priority": "low"
                },
                {
                    "title": "Pruning",
                    "type": "pruning",
                    "description": "Remove suckers and lower leaves",
                    "days_from_start": 45,
                    "priority": "medium"
                },
                {
                    "title": "Fruit Harvesting",
                    "type": "harvesting",
                    "description": "Harvest ripe tomatoes regularly",
                    "days_from_start": 70,
                    "priority": "high"
                }
            ],
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "cotton_summer",
            "name": "Cotton Summer Cultivation",
            "description": "Complete cotton cultivation cycle for summer season",
            "crop_type": "cotton",
            "season": "summer",
            "tasks": [
                {
                    "title": "Field Preparation",
                    "type": "general",
                    "description": "Deep plow and prepare field",
                    "days_from_start": 0,
                    "priority": "high"
                },
                {
                    "title": "Seed Treatment",
                    "type": "general",
                    "description": "Treat cotton seeds with fungicide",
                    "days_from_start": 1,
                    "priority": "high"
                },
                {
                    "title": "Sowing",
                    "type": "general",
                    "description": "Sow treated seeds at proper spacing",
                    "days_from_start": 7,
                    "priority": "high"
                },
                {
                    "title": "Thinning",
                    "type": "general",
                    "description": "Thin seedlings for proper spacing",
                    "days_from_start": 21,
                    "priority": "medium"
                },
                {
                    "title": "Fertilizer Application",
                    "type": "fertilizing",
                    "description": "Apply nitrogen and phosphorus",
                    "days_from_start": 30,
                    "priority": "medium"
                },
                {
                    "title": "Irrigation",
                    "type": "watering",
                    "description": "Provide adequate water during critical stages",
                    "days_from_start": 35,
                    "priority": "medium"
                },
                {
                    "title": "Pest Control",
                    "type": "general",
                    "description": "Monitor and control bollworms and other pests",
                    "days_from_start": 45,
                    "priority": "low"
                },
                {
                    "title": "Weed Management",
                    "type": "general",
                    "description": "Control weeds in the field",
                    "days_from_start": 50,
                    "priority": "low"
                },
                {
                    "title": "Boll Development Monitoring",
                    "type": "general",
                    "description": "Monitor boll development and maturity",
                    "days_from_start": 90,
                    "priority": "medium"
                },
                {
                    "title": "Harvest Cotton",
                    "type": "harvesting",
                    "description": "Pick cotton when bolls are fully open",
                    "days_from_start": 150,
                    "priority": "high"
                }
            ],
            "created_at": datetime.now().isoformat()
        }
    ]

# API Endpoints
@router.get("", response_model=List[TaskTemplate])
async def get_task_templates():
    """Get all available task templates"""
    templates = load_templates()
    return [TaskTemplate(**template) for template in templates]

@router.get("/categories")
async def get_template_categories():
    """Get templates organized by categories"""
    templates = load_templates()

    categories = {
        "monsoon": {
            "name": "Monsoon Season",
            "description": "Crops suitable for monsoon/rainy season",
            "templates": [t for t in templates if t["season"] == "monsoon"]
        },
        "winter": {
            "name": "Winter Season",
            "description": "Crops suitable for winter season",
            "templates": [t for t in templates if t["season"] == "winter"]
        },
        "summer": {
            "name": "Summer Season",
            "description": "Crops suitable for summer season",
            "templates": [t for t in templates if t["season"] == "summer"]
        }
    }

    return categories

@router.get("/{template_id}", response_model=TaskTemplate)
async def get_task_template(template_id: str):
    """Get a specific task template"""
    templates = load_templates()
    template = next((t for t in templates if t["id"] == template_id), None)

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return TaskTemplate(**template)

@router.post("/apply/{template_id}")
async def apply_task_template(template_id: str, start_date: str = None):
    """Apply a task template to create calendar tasks"""
    from routes.calendar import load_calendar_tasks, save_calendar_tasks, get_next_task_id

    templates = load_templates()
    template = next((t for t in templates if t["id"] == template_id), None)

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Use provided start date or today
    if not start_date:
        start_date = datetime.now().date()
    else:
        start_date = datetime.fromisoformat(start_date).date()

    # Load existing tasks
    existing_tasks = load_calendar_tasks()

    # Create tasks from template
    new_tasks = []
    for task_def in template["tasks"]:
        task_date = start_date + timedelta(days=task_def["days_from_start"])

        new_task = {
            "id": get_next_task_id(),
            "title": task_def["title"],
            "type": task_def["type"],
            "date": task_date.isoformat(),
            "completed": False,
            "description": task_def.get("description", ""),
            "priority": task_def.get("priority", "medium")
        }
        new_tasks.append(new_task)

    # Add new tasks to existing tasks
    existing_tasks.extend(new_tasks)
    save_calendar_tasks(existing_tasks)

    return {
        "message": f"Created {len(new_tasks)} tasks from template '{template['name']}'",
        "tasks_created": len(new_tasks),
        "start_date": start_date.isoformat(),
        "template_name": template["name"]
    }

@router.get("/crop/{crop_type}")
async def get_templates_by_crop(crop_type: str):
    """Get templates for a specific crop type"""
    templates = load_templates()
    crop_templates = [t for t in templates if t["crop_type"].lower() == crop_type.lower()]

    return crop_templates

@router.get("/season/{season}")
async def get_templates_by_season(season: str):
    """Get templates for a specific season"""
    templates = load_templates()
    season_templates = [t for t in templates if t["season"].lower() == season.lower()]

    return season_templates