from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.config.database import db
from app.routers.auth import get_current_user
from app.schemas.pydantic_models import VehicleCreate, VehicleResponse


router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)


@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle_data: VehicleCreate,
    current_user = Depends(get_current_user)
):
    """Register a new vehicle for the user"""
    vehicles_collection = db.get_collection("vehicles")
    
    # Check if license plate already registered
    existing = await vehicles_collection.find_one({
        "license_plate": vehicle_data.license_plate.upper()
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="License plate already registered"
        )
    
    # Create vehicle document
    vehicle_doc = {
        "user_id": current_user.id,
        "vehicle_type": vehicle_data.vehicle_type.value,
        "license_plate": vehicle_data.license_plate.upper(),
        "brand": vehicle_data.brand,
        "model": vehicle_data.model,
        "year": vehicle_data.year,
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    result = await vehicles_collection.insert_one(vehicle_doc)
    vehicle_id = str(result.inserted_id)
    
    # Return response
    vehicle_doc["id"] = vehicle_id
    vehicle_doc.pop("_id")
    
    return VehicleResponse(**vehicle_doc)


@router.get("/", response_model=list[VehicleResponse])
async def get_user_vehicles(
    current_user = Depends(get_current_user)
):
    """Get all vehicles for current user"""
    vehicles_collection = db.get_collection("vehicles")
    
    vehicles = await vehicles_collection.find(
        {"user_id": current_user.id}
    ).to_list(length=100)
    
    result = []
    for vehicle in vehicles:
        vehicle["id"] = str(vehicle.pop("_id"))
        result.append(VehicleResponse(**vehicle))
    
    return result


@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle_by_id(
    vehicle_id: str,
    current_user = Depends(get_current_user)
):
    """Get a specific vehicle by ID"""
    try:
        vehicles_collection = db.get_collection("vehicles")
        
        vehicle_doc = await vehicles_collection.find_one({
            "_id": ObjectId(vehicle_id),
            "user_id": current_user.id
        })
        
        if vehicle_doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vehicle not found"
            )
        
        vehicle_doc["id"] = str(vehicle_doc.pop("_id"))
        return VehicleResponse(**vehicle_doc)
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid vehicle ID"
        )


@router.put("/{vehicle_id}/deactivate", response_model=VehicleResponse)
async def deactivate_vehicle(
    vehicle_id: str,
    current_user = Depends(get_current_user)
):
    """Deactivate a vehicle"""
    try:
        vehicles_collection = db.get_collection("vehicles")
        
        result = await vehicles_collection.update_one(
            {"_id": ObjectId(vehicle_id), "user_id": current_user.id},
            {"$set": {"is_active": False}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vehicle not found"
            )
        
        vehicle_doc = await vehicles_collection.find_one({"_id": ObjectId(vehicle_id)})
        vehicle_doc["id"] = str(vehicle_doc.pop("_id"))
        
        return VehicleResponse(**vehicle_doc)
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid vehicle ID"
        )
