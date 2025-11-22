"""
Calendar Management Routes
Handles maintenance calendar tasks with CRUD operations and real-time updates
"""

import json
import os
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from pathlib import Path

router = APIRouter()

# Data Models
class CalendarTask(BaseModel):
    id: int
    title: str
    type: str  # 'watering', 'fertilizing', 'pruning', 'harvesting'
    date: str  # ISO date string
    completed: bool = False
    description: Optional[str] = None
    priority: str = "medium"  # 'low', 'medium', 'high'

class CalendarTaskCreate(BaseModel):
    title: str
    type: str
    date: str
    description: Optional[str] = None
    priority: str = "medium"

class CalendarTaskUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    date: Optional[str] = None
    completed: Optional[bool] = None
    description: Optional[str] = None
    priority: Optional[str] = "medium"

# Data storage
CALENDAR_DATA_FILE = Path("data/calendar_tasks.json")

def load_calendar_tasks() -> List[dict]:
    """Load calendar tasks from JSON file"""
    if not CALENDAR_DATA_FILE.exists():
        # Initialize with default tasks
        default_tasks = [
            {
                "id": 1,
                "title": "Water rice field",
                "type": "watering",
                "date": "2025-11-01",
                "completed": False,
                "description": "Irrigate the rice field with 2 inches of water",
                "priority": "high"
            },
            {
                "id": 2,
                "title": "Apply organic fertilizer",
                "type": "fertilizing",
                "date": "2025-11-03",
                "completed": False,
                "description": "Apply compost and organic manure to improve soil fertility",
                "priority": "medium"
            },
            {
                "id": 3,
                "title": "Prune tomato plants",
                "type": "pruning",
                "date": "2025-11-05",
                "completed": False,
                "description": "Remove dead leaves and excess branches from tomato plants",
                "priority": "medium"
            },
            {
                "id": 4,
                "title": "Harvest wheat crop",
                "type": "harvesting",
                "date": "2025-11-10",
                "completed": False,
                "description": "Harvest mature wheat crop and prepare for storage",
                "priority": "high"
            }
        ]
        save_calendar_tasks(default_tasks)
        return default_tasks

    try:
        with open(CALENDAR_DATA_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading calendar tasks: {e}")
        return []

def save_calendar_tasks(tasks: List[dict]):
    """Save calendar tasks to JSON file"""
    CALENDAR_DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(CALENDAR_DATA_FILE, 'w') as f:
            json.dump(tasks, f, indent=2)
    except Exception as e:
        print(f"Error saving calendar tasks: {e}")

def get_next_task_id() -> int:
    """Get the next available task ID"""
    tasks = load_calendar_tasks()
    if not tasks:
        return 1
    return max(task['id'] for task in tasks) + 1

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to client: {e}")
                self.active_connections.remove(connection)

manager = ConnectionManager()

# API Endpoints
@router.get("/tasks", response_model=List[CalendarTask])
async def get_calendar_tasks():
    """Get all calendar tasks"""
    tasks = load_calendar_tasks()
    return [CalendarTask(**task) for task in tasks]

@router.get("/tasks/upcoming")
async def get_upcoming_tasks(days: int = 7):
    """Get upcoming tasks within specified days"""
    from datetime import datetime, timedelta

    tasks = load_calendar_tasks()
    today = datetime.now().date()
    end_date = today + timedelta(days=days)

    upcoming = []
    for task in tasks:
        task_date = datetime.fromisoformat(task['date']).date()
        if today <= task_date <= end_date and not task['completed']:
            upcoming.append(CalendarTask(**task))

    return upcoming

@router.get("/tasks/{task_id}", response_model=CalendarTask)
async def get_calendar_task(task_id: int):
    """Get a specific calendar task"""
    tasks = load_calendar_tasks()
    task = next((t for t in tasks if t['id'] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return CalendarTask(**task)

@router.post("/tasks", response_model=CalendarTask)
async def create_calendar_task(task: CalendarTaskCreate):
    """Create a new calendar task"""
    tasks = load_calendar_tasks()
    new_task = {
        "id": get_next_task_id(),
        "title": task.title,
        "type": task.type,
        "date": task.date,
        "completed": False,
        "description": task.description,
        "priority": task.priority
    }
    tasks.append(new_task)
    save_calendar_tasks(tasks)

    # Broadcast update to all connected clients
    await manager.broadcast({
        "type": "task_created",
        "task": new_task
    })

    return CalendarTask(**new_task)

@router.put("/tasks/{task_id}", response_model=CalendarTask)
async def update_calendar_task(task_id: int, task_update: CalendarTaskUpdate):
    """Update a calendar task"""
    tasks = load_calendar_tasks()
    task_index = next((i for i, t in enumerate(tasks) if t['id'] == task_id), None)

    if task_index is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update only provided fields
    for field, value in task_update.dict(exclude_unset=True).items():
        if value is not None:
            tasks[task_index][field] = value

    save_calendar_tasks(tasks)

    # Broadcast update to all connected clients
    await manager.broadcast({
        "type": "task_updated",
        "task": tasks[task_index]
    })

    return CalendarTask(**tasks[task_index])

@router.delete("/tasks/{task_id}")
async def delete_calendar_task(task_id: int):
    """Delete a calendar task"""
    tasks = load_calendar_tasks()
    task_index = next((i for i, t in enumerate(tasks) if t['id'] == task_id), None)

    if task_index is None:
        raise HTTPException(status_code=404, detail="Task not found")

    deleted_task = tasks.pop(task_index)
    save_calendar_tasks(tasks)

    # Broadcast update to all connected clients
    await manager.broadcast({
        "type": "task_deleted",
        "task_id": task_id
    })

    return {"message": "Task deleted successfully"}

@router.websocket("/ws")
async def calendar_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time calendar updates"""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for client messages
            data = await websocket.receive_text()
            # For now, just echo back (could be used for client-initiated updates)
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)