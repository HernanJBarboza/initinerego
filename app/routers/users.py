from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.config.database import db
from app.routers.auth import get_current_user
from app.schemas.pydantic_models import UserResponse, UserUpdate, VehicleType


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    update_data: UserUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update current user information"""
    users_collection = db.get_collection("users")
    
    # Build update dict (exclude None values)
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data to update"
        )
    
    update_dict["updated_at"] = datetime.utcnow()
    
    # Update user
    result = await users_collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update user"
        )
    
    # Get updated user
    user_doc = await users_collection.find_one({"_id": ObjectId(current_user.id)})
    user_doc["id"] = str(user_doc.pop("_id"))
    user_doc.pop("hashed_password")
    
    return UserResponse(**user_doc)


@router.put("/me/vehicle-preference", response_model=UserResponse)
async def update_vehicle_preference(
    vehicle_type: VehicleType,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update user's vehicle preference"""
    users_collection = db.get_collection("users")
    
    result = await users_collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {
            "$set": {
                "vehicle_preference": vehicle_type.value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update vehicle preference"
        )
    
    # Get updated user
    user_doc = await users_collection.find_one({"_id": ObjectId(current_user.id)})
    user_doc["id"] = str(user_doc.pop("_id"))
    user_doc.pop("hashed_password")
    
    return UserResponse(**user_doc)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user by ID (for admin purposes)"""
    try:
        users_collection = db.get_collection("users")
        user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        if user_doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_doc["id"] = str(user_doc.pop("_id"))
        user_doc.pop("hashed_password")
        
        return UserResponse(**user_doc)
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
