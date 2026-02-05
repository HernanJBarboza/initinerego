from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.config.database import db
from app.routers.auth import get_current_user
from app.schemas.pydantic_models import (
    TripCreate, 
    TripResponse, 
    TripUpdate,
    TripLocationUpdate,
    TripStatus,
    LocationPoint
)


router = APIRouter(
    prefix="/trips",
    tags=["Trips"]
)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two GPS coordinates"""
    R = 6371  # Earth's radius in km
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c


async def check_active_trip(user_id: str) -> bool:
    """Check if user has an active trip"""
    trips_collection = db.get_collection("trips")
    active_trip = await trips_collection.find_one({
        "user_id": user_id,
        "status": TripStatus.IN_PROGRESS.value
    })
    return active_trip is not None


async def get_active_trip(user_id: str) -> Optional[dict]:
    """Get user's active trip if exists"""
    trips_collection = db.get_collection("trips")
    return await trips_collection.find_one({
        "user_id": user_id,
        "status": TripStatus.IN_PROGRESS.value
    })


async def get_valid_safety_check(user_id: str) -> Optional[dict]:
    """Get user's most recent valid safety check"""
    safety_checks_collection = db.get_collection("safety_checks")
    return await safety_checks_collection.find_one({
        "user_id": user_id,
        "status": "passed"
    }, sort=[("passed_at", -1)])


@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip_data: TripCreate,
    current_user = Depends(get_current_user)
):
    """Start a new trip (requires valid safety check)"""
    # Check for existing active trip
    if await check_active_trip(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an active trip"
        )
    
    # Verify safety check is passed
    safety_check = await get_valid_safety_check(current_user.id)
    if not safety_check:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid safety check required before starting a trip"
        )
    
    trips_collection = db.get_collection("trips")
    
    # Create origin point
    origin = LocationPoint(
        latitude=trip_data.origin_latitude,
        longitude=trip_data.origin_longitude,
        altitude=None,
        accuracy=None,
        speed=None,
        timestamp=datetime.utcnow()
    )
    
    # Create trip document
    trip_doc = {
        "user_id": current_user.id,
        "vehicle_type": trip_data.vehicle_type.value,
        "status": TripStatus.IN_PROGRESS.value,
        "route": [],
        "origin": origin.dict(),
        "destination": None,
        "distance_km": 0.0,
        "duration_minutes": 0,
        "safety_check_id": str(safety_check["_id"]),
        "started_at": datetime.utcnow(),
        "completed_at": None,
        "created_at": datetime.utcnow()
    }
    
    result = await trips_collection.insert_one(trip_doc)
    trip_id = str(result.inserted_id)
    
    # Return response
    trip_doc["id"] = trip_id
    trip_doc.pop("_id")
    
    return TripResponse(**trip_doc)


@router.get("/active", response_model=TripResponse)
async def get_active_trip_info(
    current_user = Depends(get_current_user)
):
    """Get current active trip"""
    trip_doc = await get_active_trip(current_user.id)
    
    if trip_doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active trip found"
        )
    
    trip_doc["id"] = str(trip_doc.pop("_id"))
    return TripResponse(**trip_doc)


@router.post("/{trip_id}/location", response_model=TripResponse)
async def update_trip_location(
    trip_id: str,
    location_data: TripLocationUpdate,
    current_user = Depends(get_current_user)
):
    """Update trip with new GPS location"""
    try:
        trips_collection = db.get_collection("trips")
        
        # Verify trip ownership and status
        trip_doc = await trips_collection.find_one({
            "_id": ObjectId(trip_id),
            "user_id": current_user.id,
            "status": TripStatus.IN_PROGRESS.value
        })
        
        if trip_doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active trip not found"
            )
        
        # Create location point
        location = LocationPoint(
            latitude=location_data.latitude,
            longitude=location_data.longitude,
            altitude=location_data.altitude,
            accuracy=location_data.accuracy,
            speed=location_data.speed,
            timestamp=datetime.utcnow()
        )
        
        # Add to route
        route = trip_doc.get("route", [])
        route.append(location.dict())
        
        # Calculate distance if we have a previous point
        if len(route) >= 2:
            prev_point = route[-2]
            distance = haversine_distance(
                prev_point["latitude"], prev_point["longitude"],
                location.latitude, location.longitude
            )
            trip_doc["distance_km"] += distance
        
        # Update duration
        if trip_doc.get("started_at"):
            duration = (datetime.utcnow() - trip_doc["started_at"]).total_seconds() / 60
            trip_doc["duration_minutes"] = int(duration)
        
        # Update trip
        result = await trips_collection.update_one(
            {"_id": ObjectId(trip_id)},
            {
                "$set": {
                    "route": route,
                    "distance_km": trip_doc["distance_km"],
                    "duration_minutes": trip_doc["duration_minutes"]
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update trip location"
            )
        
        # Get updated trip
        trip_doc = await trips_collection.find_one({"_id": ObjectId(trip_id)})
        trip_doc["id"] = str(trip_doc.pop("_id"))
        
        return TripResponse(**trip_doc)
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid trip ID"
        )


@router.put("/{trip_id}/complete", response_model=TripResponse)
async def complete_trip(
    trip_id: str,
    end_latitude: float,
    end_longitude: float,
    end_address: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Complete a trip"""
    try:
        trips_collection = db.get_collection("trips")
        
        # Verify trip ownership and status
        trip_doc = await trips_collection.find_one({
            "_id": ObjectId(trip_id),
            "user_id": current_user.id,
            "status": TripStatus.IN_PROGRESS.value
        })
        
        if trip_doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active trip not found"
            )
        
        # Calculate final distance
        if trip_doc.get("origin"):
            origin = trip_doc["origin"]
            final_distance = haversine_distance(
                origin["latitude"], origin["longitude"],
                end_latitude, end_longitude
            )
        
        # Calculate final duration
        duration = 0
        if trip_doc.get("started_at"):
            duration = (datetime.utcnow() - trip_doc["started_at"]).total_seconds() / 60
        
        # Create destination point
        destination = LocationPoint(
            latitude=end_latitude,
            longitude=end_longitude,
            timestamp=datetime.utcnow()
        )
        
        # Update trip to completed
        result = await trips_collection.update_one(
            {"_id": ObjectId(trip_id)},
            {
                "$set": {
                    "status": TripStatus.COMPLETED.value,
                    "destination": destination.dict(),
                    "distance_km": final_distance if 'final_distance' in dir() else trip_doc.get("distance_km", 0),
                    "duration_minutes": int(duration),
                    "completed_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to complete trip"
            )
        
        # Get updated trip
        trip_doc = await trips_collection.find_one({"_id": ObjectId(trip_id)})
        trip_doc["id"] = str(trip_doc.pop("_id"))
        
        return TripResponse(**trip_doc)
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid trip ID"
        )


@router.put("/{trip_id}/emergency", response_model=TripResponse)
async def set_trip_emergency(
    trip_id: str,
    current_user = Depends(get_current_user)
):
    """Set trip status to emergency"""
    try:
        trips_collection = db.get_collection("trips")
        
        result = await trips_collection.update_one(
            {"_id": ObjectId(trip_id), "user_id": current_user.id},
            {"$set": {"status": TripStatus.EMERGENCY.value}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )
        
        # Get updated trip
        trip_doc = await trips_collection.find_one({"_id": ObjectId(trip_id)})
        trip_doc["id"] = str(trip_doc.pop("_id"))
        
        return TripResponse(**trip_doc)
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid trip ID"
        )


@router.get("/", response_model=list[TripResponse])
async def get_user_trips(
    status_filter: Optional[TripStatus] = None,
    limit: int = 20,
    current_user = Depends(get_current_user)
):
    """Get all trips for current user"""
    trips_collection = db.get_collection("trips")
    
    # Build query
    query = {"user_id": current_user.id}
    if status_filter:
        query["status"] = status_filter.value
    
    # Get trips
    trips = await trips_collection.find(
        query,
        sort=[("created_at", -1)],
        limit=limit
    ).to_list(length=limit)
    
    # Convert to response format
    result = []
    for trip in trips:
        trip["id"] = str(trip.pop("_id"))
        result.append(TripResponse(**trip))
    
    return result


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip_by_id(
    trip_id: str,
    current_user = Depends(get_current_user)
):
    """Get a specific trip by ID"""
    try:
        trips_collection = db.get_collection("trips")
        
        trip_doc = await trips_collection.find_one({
            "_id": ObjectId(trip_id),
            "user_id": current_user.id
        })
        
        if trip_doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )
        
        trip_doc["id"] = str(trip_doc.pop("_id"))
        return TripResponse(**trip_doc)
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid trip ID"
        )
