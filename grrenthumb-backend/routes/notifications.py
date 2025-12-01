"""
Smart Notifications Routes
Browser notifications, email/SMS reminders, and overdue task alerts
"""

import json
import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from pathlib import Path
import logging

router = APIRouter()

# Setup logging
logger = logging.getLogger(__name__)

# Notification Models
class NotificationSettings(BaseModel):
    browser_notifications: bool = True
    email_notifications: bool = False
    sms_notifications: bool = False
    upcoming_task_reminder: int = 24  # hours before task
    overdue_task_alert: bool = True
    weather_alerts: bool = True

class NotificationData(BaseModel):
    id: str
    type: str  # 'task_reminder', 'overdue_alert', 'weather_alert', 'task_completed'
    title: str
    message: str
    task_id: Optional[int] = None
    priority: str = "normal"  # 'low', 'normal', 'high'
    created_at: str
    read: bool = False

class NotificationResponse(BaseModel):
    notifications: List[NotificationData]
    unread_count: int

# Data storage
NOTIFICATIONS_FILE = Path("data/notifications.json")
SETTINGS_FILE = Path("data/notification_settings.json")

def load_notifications() -> List[Dict[str, Any]]:
    """Load notifications from JSON file"""
    if not NOTIFICATIONS_FILE.exists():
        return []
    try:
        with open(NOTIFICATIONS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading notifications: {e}")
        return []

def save_notifications(notifications: List[Dict[str, Any]]):
    """Save notifications to JSON file"""
    NOTIFICATIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(NOTIFICATIONS_FILE, 'w') as f:
            json.dump(notifications, f, indent=2, default=str)
    except Exception as e:
        logger.error(f"Error saving notifications: {e}")

def load_notification_settings() -> Dict[str, Any]:
    """Load notification settings"""
    if not SETTINGS_FILE.exists():
        return {
            "browser_notifications": True,
            "email_notifications": False,
            "sms_notifications": False,
            "upcoming_task_reminder": 24,
            "overdue_task_alert": True,
            "weather_alerts": True
        }
    try:
        with open(SETTINGS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading notification settings: {e}")
        return {}

def save_notification_settings(settings: Dict[str, Any]):
    """Save notification settings"""
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving notification settings: {e}")

def generate_notification_id() -> str:
    """Generate unique notification ID"""
    return f"notif_{int(datetime.now().timestamp() * 1000)}"

def create_task_reminder_notification(task: Dict[str, Any], hours_until: int) -> Dict[str, Any]:
    """Create a task reminder notification"""
    return {
        "id": generate_notification_id(),
        "type": "task_reminder",
        "title": f"Task Reminder: {task['title']}",
        "message": f"'{task['title']}' is due in {hours_until} hours ({task['date']})",
        "task_id": task["id"],
        "priority": task.get("priority", "normal"),
        "created_at": datetime.now().isoformat(),
        "read": False
    }

def create_overdue_notification(task: Dict[str, Any], days_overdue: int) -> Dict[str, Any]:
    """Create an overdue task notification"""
    return {
        "id": generate_notification_id(),
        "type": "overdue_alert",
        "title": f"Overdue Task: {task['title']}",
        "message": f"'{task['title']}' is {days_overdue} days overdue (was due {task['date']})",
        "task_id": task["id"],
        "priority": "high",
        "created_at": datetime.now().isoformat(),
        "read": False
    }

def create_weather_notification(recommendation: Dict[str, Any]) -> Dict[str, Any]:
    """Create a weather-based notification"""
    return {
        "id": generate_notification_id(),
        "type": "weather_alert",
        "title": "Weather Alert",
        "message": recommendation["recommendation"],
        "priority": recommendation.get("severity", "normal"),
        "created_at": datetime.now().isoformat(),
        "read": False
    }

def check_and_create_notifications():
    """Check for tasks that need notifications and create them"""
    try:
        # Load current data
        notifications = load_notifications()
        settings = load_notification_settings()

        if not settings.get("browser_notifications", True):
            return  # Notifications disabled

        # Load tasks (we'll need to import this from calendar module)
        from routes.calendar import load_calendar_tasks
        tasks = load_calendar_tasks()

        # Load weather recommendations
        try:
            from routes.weather import analyze_weather_impact, get_real_weather_forecast
            weather_forecast = get_real_weather_forecast()
            weather_impact = analyze_weather_impact(weather_forecast)
            weather_recommendations = weather_impact.recommendations
        except:
            weather_recommendations = []

        now = datetime.now()
        reminder_hours = settings.get("upcoming_task_reminder", 24)

        # Check for upcoming task reminders
        for task in tasks:
            if task["completed"]:
                continue

            task_date = datetime.fromisoformat(task["date"])
            hours_until = (task_date - now).total_seconds() / 3600

            # Create reminder if within reminder window and not already notified
            if 0 < hours_until <= reminder_hours:
                existing_reminder = any(
                    n["type"] == "task_reminder" and n["task_id"] == task["id"]
                    for n in notifications
                )
                if not existing_reminder:
                    notifications.append(create_task_reminder_notification(task, int(hours_until)))

        # Check for overdue tasks
        if settings.get("overdue_task_alert", True):
            for task in tasks:
                if task["completed"]:
                    continue

                task_date = datetime.fromisoformat(task["date"])
                days_overdue = (now.date() - task_date.date()).days

                if days_overdue > 0:
                    existing_overdue = any(
                        n["type"] == "overdue_alert" and n["task_id"] == task["id"]
                        for n in notifications
                    )
                    if not existing_overdue:
                        notifications.append(create_overdue_notification(task, days_overdue))

        # Check for weather alerts
        if settings.get("weather_alerts", True):
            for rec in weather_recommendations:
                # Only create weather notifications for high severity
                if rec.get("severity") == "high":
                    existing_weather = any(
                        n["type"] == "weather_alert" and n["message"] == rec["recommendation"]
                        for n in notifications
                    )
                    if not existing_weather:
                        notifications.append(create_weather_notification(rec))

        # Keep only recent notifications (last 30 days)
        cutoff_date = now - timedelta(days=30)
        notifications = [
            n for n in notifications
            if datetime.fromisoformat(n["created_at"]) > cutoff_date
        ]

        # Save updated notifications
        save_notifications(notifications)

    except Exception as e:
        logger.error(f"Error checking notifications: {e}")

# API Endpoints
@router.get("/settings", response_model=NotificationSettings)
async def get_notification_settings():
    """Get current notification settings"""
    settings = load_notification_settings()
    return NotificationSettings(**settings)

@router.put("/settings")
async def update_notification_settings(settings: NotificationSettings):
    """Update notification settings"""
    settings_dict = settings.dict()
    save_notification_settings(settings_dict)
    return {"message": "Settings updated successfully"}

@router.get("", response_model=NotificationResponse)
async def get_notifications():
    """Get all notifications"""
    notifications = load_notifications()

    # Sort by creation date (newest first)
    notifications.sort(key=lambda x: x["created_at"], reverse=True)

    unread_count = sum(1 for n in notifications if not n["read"])

    return NotificationResponse(
        notifications=[NotificationData(**n) for n in notifications],
        unread_count=unread_count
    )

@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    notifications = load_notifications()

    for notification in notifications:
        if notification["id"] == notification_id:
            notification["read"] = True
            break

    save_notifications(notifications)
    return {"message": "Notification marked as read"}

@router.put("/mark-all-read")
async def mark_all_notifications_read():
    """Mark all notifications as read"""
    notifications = load_notifications()

    for notification in notifications:
        notification["read"] = True

    save_notifications(notifications)
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    """Delete a notification"""
    notifications = load_notifications()
    notifications = [n for n in notifications if n["id"] != notification_id]
    save_notifications(notifications)
    return {"message": "Notification deleted"}

@router.post("/check")
async def check_for_new_notifications():
    """Manually trigger notification check"""
    check_and_create_notifications()
    return {"message": "Notification check completed"}

@router.get("/browser-permission")
async def get_browser_permission_status():
    """Get browser notification permission status"""
    # This would be checked on the frontend
    return {"permission": "unknown", "message": "Check permission on frontend"}