from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends
from app.config.database import db
from app.routers.auth import get_current_user
from app.routers.trips import check_active_trip
from app.schemas.pydantic_models import (
    DashboardResponse,
    DashboardStats,
    RecentTripItem,
    TripStatus
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/", response_model=DashboardResponse)
async def get_dashboard(
    current_user = Depends(get_current_user)
):
    """Get user dashboard with statistics"""
    users_collection = db.get_collection("users")
    trips_collection = db.get_collection("trips")
    emergencies_collection = db.get_collection("emergencies")
    safety_checks_collection = db.get_collection("safety_checks")
    
    # Get user info
    user_doc = await users_collection.find_one({"_id": current_user.id})
    
    # Calculate statistics
    total_trips = await trips_collection.count_documents({"user_id": current_user.id})
    completed_trips = await trips_collection.count_documents({
        "user_id": current_user.id,
        "status": TripStatus.COMPLETED.value
    })
    active_trips = await trips_collection.count_documents({
        "user_id": current_user.id,
        "status": TripStatus.IN_PROGRESS.value
    })
    emergencies_count = await emergencies_collection.count_documents({
        "user_id": current_user.id
    })
    safety_checks_passed = await safety_checks_collection.count_documents({
        "user_id": current_user.id,
        "status": "passed"
    })
    
    # Calculate total distance and duration
    trip_stats = await trips_collection.aggregate([
        {"$match": {"user_id": current_user.id}},
        {"$group": {
            "_id": None,
            "total_distance": {"$sum": "$distance_km"},
            "total_duration": {"$sum": "$duration_minutes"}
        }}
    ]).to_list(length=1)
    
    total_distance = trip_stats[0]["total_distance"] if trip_stats else 0
    total_duration = trip_stats[0]["total_duration"] if trip_stats else 0
    
    # Get recent trips
    recent_trips_cursor = trips_collection.find(
        {"user_id": current_user.id},
        sort=[("created_at", -1)],
        limit=5
    )
    recent_trips = await recent_trips_cursor.to_list(length=5)
    
    recent_trips_list = []
    for trip in recent_trips:
        trip_item = {
            "id": str(trip["_id"]),
            "vehicle_type": trip.get("vehicle_type", "car"),
            "status": trip.get("status", "not_started"),
            "started_at": trip.get("started_at"),
            "completed_at": trip.get("completed_at"),
            "distance_km": trip.get("distance_km", 0)
        }
        recent_trips_list.append(RecentTripItem(**trip_item))
    
    # Check for active trip
    has_active = await check_active_trip(current_user.id)
    
    # Build response
    stats = DashboardStats(
        total_trips=total_trips,
        completed_trips=completed_trips,
        active_trips=active_trips,
        total_emergencies=emergencies_count,
        safety_checks_passed=safety_checks_passed,
        total_distance_km=round(total_distance, 2),
        total_duration_minutes=total_duration
    )
    
    return DashboardResponse(
        stats=stats,
        recent_trips=recent_trips_list,
        has_active_trip=has_active
    )


@router.get("/weekly-stats")
async def get_weekly_stats(
    current_user = Depends(get_current_user)
):
    """Get weekly statistics"""
    trips_collection = db.get_collection("trips")
    
    # Calculate date range (last 7 days)
    today = datetime.utcnow()
    week_ago = today - timedelta(days=7)
    
    # Aggregate weekly data
    weekly_data = await trips_collection.aggregate([
        {
            "$match": {
                "user_id": current_user.id,
                "started_at": {"$gte": week_ago}
            }
        },
        {
            "$group": {
                "_id": {"$dayOfWeek": "$started_at"},
                "trips": {"$sum": 1},
                "distance": {"$sum": "$distance_km"},
                "duration": {"$sum": "$duration_minutes"}
            }
        },
        {"$sort": {"_id": 1}}
    ]).to_list(length=7)
    
    # Format response (day 1 = Sunday)
    days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    result = []
    
    for i in range(1, 8):
        day_data = next((d for d in weekly_data if d["_id"] == i), None)
        result.append({
            "day": days[i-1],
            "trips": day_data["trips"] if day_data else 0,
            "distance_km": round(day_data["distance"], 2) if day_data else 0,
            "duration_minutes": day_data["duration"] if day_data else 0
        })
    
    return result


@router.get("/monthly-summary")
async def get_monthly_summary(
    current_user = Depends(get_current_user)
):
    """Get monthly summary statistics"""
    trips_collection = db.get_collection("trips")
    
    # Calculate date range (current month)
    today = datetime.utcnow()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Aggregate monthly data
    monthly_data = await trips_collection.aggregate([
        {
            "$match": {
                "user_id": current_user.id,
                "started_at": {"$gte": month_start}
            }
        },
        {
            "$group": {
                "_id": None,
                "total_trips": {"$sum": 1},
                "completed_trips": {
                    "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
                },
                "total_distance": {"$sum": "$distance_km"},
                "total_duration": {"$sum": "$duration_minutes"},
                "emergencies": {
                    "$sum": {"$cond": [{"$eq": ["$status", "emergency"]}, 1, 0]}
                }
            }
        }
    ]).to_list(length=1)
    
    if not monthly_data:
        return {
            "total_trips": 0,
            "completed_trips": 0,
            "total_distance": 0,
            "total_duration": 0,
            "emergencies": 0,
            "completion_rate": 0
        }
    
    data = monthly_data[0]
    completion_rate = (data["completed_trips"] / data["total_trips"] * 100) if data["total_trips"] > 0 else 0
    
    return {
        "total_trips": data["total_trips"],
        "completed_trips": data["completed_trips"],
        "total_distance": round(data["total_distance"], 2),
        "total_duration": data["total_duration"],
        "emergencies": data["emergencies"],
        "completion_rate": round(completion_rate, 1)
    }
