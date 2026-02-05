from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.config.database import db
from app.routers.auth import get_current_user
from app.routers.trips import get_active_trip
from app.schemas.pydantic_models import (
    EmergencyCreate, 
    EmergencyResponse,
    EmergencyUpdate,
    EmergencyStatus,
    LocationPoint
)


router = APIRouter(
    prefix="/emergencies",
    tags=["Emergencies"]
)

# Emergency contacts
EMERGENCY_CONTACTS = {
    "police": {"name": "Policía", "phone": "123"},
    "ambulance": {"name": "Ambulancia", "phone": "125"},
    "firefighters": {"name": "Bomberos", "phone": "119"}
}


@router.post("/", response_model=EmergencyResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency(
    emergency_data: EmergencyCreate,
    current_user = Depends(get_current_user)
):
    """Create a new emergency alert"""
    emergencies_collection = db.get_collection("emergencies")
    
    # Get active trip if exists
    active_trip = await get_active_trip(current_user.id)
    trip_id = str(active_trip["_id"]) if active_trip else None
    
    # Create location point
    location = LocationPoint(
        latitude=emergency_data.latitude,
        longitude=emergency_data.longitude,
        timestamp=datetime.utcnow()
    )
    
    # Create emergency document
    emergency_doc = {
        "user_id": current_user.id,
        "trip_id": trip_id,
        "emergency_type": emergency_data.emergency_type,
        "description": emergency_data.description,
        "location": location.dict(),
        "status": EmergencyStatus.ACTIVE.value,
        "resolved_at": None,
        "resolution_notes": None,
        "created_at": datetime.utcnow()
    }
    
    result = await emergencies_collection.insert_one(emergency_doc)
    emergency_id = str(result.inserted_id)
    
    # Update active trip to emergency status if exists
    if active_trip:
        trips_collection = db.get_collection("trips")
        await trips_collection.update_one(
            {"_id": active_trip["_id"]},
            {"$set": {"status": "emergency"}}
        )
    
    # Return response
    emergency_doc["id"] = emergency_id
    emergency_doc.pop("_id")
    
    return EmergencyResponse(**emergency_doc)


@router.get("/emergency-contacts")
async def get_emergency_contacts():
    """Get list of emergency contacts"""
    return EMERGENCY_CONTACTS


@router.get("/", response_model=list[EmergencyResponse])
async def get_user_emergencies(
    status_filter: Optional[EmergencyStatus] = None,
    limit: int = 20,
    current_user = Depends(get_current_user)
):
    """Get all emergencies for current user"""
    emergencies_collection = db.get_collection("emergencies")
    
    # Build query
    query = {"user_id": current_user.id}
    if status_filter:
        query["status"] = status_filter.value
    
    # Get emergencies
    emergencies = await emergencies_collection.find(
        query,
        sort=[("created_at", -1)],
        limit=limit
    ).to_list(length=limit)
    
    # Convert to response format
    result = []
    for emergency in emergencies:
        emergency["id"] = str(emergency.pop("_id"))
        result.append(EmergencyResponse(**emergency))
    
    return result


@router.get("/{emergency_id}", response_model=EmergencyResponse)
async def get_emergency_by_id(
    emergency_id: str,
    current_user = Depends(get_current_user)
):
    """Get a specific emergency by ID"""
    try:
        emergencies_collection = db.get_collection("emergencies")
        
        emergency_doc = await emergencies_collection.find_one({
            "_id": ObjectId(emergency_id),
            "user_id": current_user.id
        })
        
        if emergency_doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Emergency not found"
            )
        
        emergency_doc["id"] = str(emergency_doc.pop("_id"))
        return EmergencyResponse(**emergency_doc)
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid emergency ID"
        )


@router.put("/{emergency_id}/resolve", response_model=EmergencyResponse)
async def resolve_emergency(
    emergency_id: str,
    resolution_data: EmergencyUpdate,
    current_user = Depends(get_current_user)
):
    """Resolve an emergency"""
    try:
        emergencies_collection = db.get_collection("emergencies")
        
        # Verify ownership
        emergency_doc = await emergencies_collection.find_one({
            "_id": ObjectId(emergency_id),
            "user_id": current_user.id
        })
        
        if emergency_doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Emergency not found"
            )
        
        if emergency_doc["status"] != EmergencyStatus.ACTIVE.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Emergency is not active"
            )
        
        # Update emergency
        update_data = {
            "status": EmergencyStatus.RESOLVED.value,
            "resolved_at": datetime.utcnow()
        }
        
        if resolution_data.resolution_notes:
            update_data["resolution_notes"] = resolution_data.resolution_notes
        
        result = await emergencies_collection.update_one(
            {"_id": ObjectId(emergency_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to resolve emergency"
            )
        
        # Get updated emergency
        emergency_doc = await emergencies_collection.find_one({"_id": ObjectId(emergency_id)})
        emergency_doc["id"] = str(emergency_doc.pop("_id"))
        
        return EmergencyResponse(**emergency_doc)
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid emergency ID"
        )
