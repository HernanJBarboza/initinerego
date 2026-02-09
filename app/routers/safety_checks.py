from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.config.database import db
from app.routers.auth import get_current_user
from app.schemas.pydantic_models import (
    SafetyCheckCreate, 
    SafetyCheckResponse,
    SafetyCheckItem,
    SafetyCheckStatus
)
from app.routers.trips import check_active_trip


router = APIRouter(
    prefix="/safety-checks",
    tags=["Safety Checks"]
)


@router.post("/", response_model=SafetyCheckResponse, status_code=status.HTTP_201_CREATED)
async def create_safety_check(
    check_data: SafetyCheckCreate,
    current_user = Depends(get_current_user)
):
    """Create a new safety check (must be done before starting a trip)"""
    # Check if user has an active trip
    has_active = await check_active_trip(current_user.id)
    if has_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create safety check while having an active trip"
        )
    
    safety_checks_collection = db.get_collection("safety_checks")
    
    # Create safety check document
    check_doc = {
        "user_id": current_user.id,
        "trip_id": check_data.trip_id,
        "items": [item.dict() for item in check_data.items],
        "status": SafetyCheckStatus.PENDING.value,
        "passed_at": None,
        "created_at": datetime.utcnow()
    }
    
    result = await safety_checks_collection.insert_one(check_doc)
    check_id = str(result.inserted_id)
    
    # Return response
    check_doc["id"] = check_id
    check_doc.pop("_id")
    
    return SafetyCheckResponse(**check_doc)


@router.get("/current", response_model=SafetyCheckResponse)
async def get_current_safety_check(
    current_user = Depends(get_current_user)
):
    """Get the latest safety check for current user"""
    safety_checks_collection = db.get_collection("safety_checks")
    
    # Get most recent safety check
    check_doc = await safety_checks_collection.find_one(
        {"user_id": current_user.id},
        sort=[("created_at", -1)]
    )
    
    if check_doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No safety checks found"
        )
    
    check_doc["id"] = str(check_doc.pop("_id"))
    return SafetyCheckResponse(**check_doc)


@router.put("/{check_id}/update-items", response_model=SafetyCheckResponse)
async def update_safety_check_items(
    check_id: str,
    items: List[SafetyCheckItem],
    current_user = Depends(get_current_user)
):
    """Update items in a safety check"""
    try:
        safety_checks_collection = db.get_collection("safety_checks")
        
        # Verify ownership
        check_doc = await safety_checks_collection.find_one({
            "_id": ObjectId(check_id),
            "user_id": current_user.id
        })
        
        if check_doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Safety check not found"
            )
        
        if check_doc["status"] != SafetyCheckStatus.PENDING.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update items of a completed safety check"
            )
        
        # Update items
        items_dict = [item.dict() for item in items]
        result = await safety_checks_collection.update_one(
            {"_id": ObjectId(check_id)},
            {"$set": {"items": items_dict}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update safety check"
            )
        
        # Get updated check
        check_doc = await safety_checks_collection.find_one({"_id": ObjectId(check_id)})
        check_doc["id"] = str(check_doc.pop("_id"))
        
        return SafetyCheckResponse(**check_doc)
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid safety check ID"
        )


@router.post("/{check_id}/approve", response_model=SafetyCheckResponse)
async def approve_safety_check(
    check_id: str,
    current_user = Depends(get_current_user)
):
    """Approve a safety check (all items must be checked)"""
    try:
        safety_checks_collection = db.get_collection("safety_checks")
        
        # Verify ownership
        check_doc = await safety_checks_collection.find_one({
            "_id": ObjectId(check_id),
            "user_id": current_user.id
        })
        
        if check_doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Safety check not found"
            )
        
        if check_doc["status"] != SafetyCheckStatus.PENDING.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Safety check already approved or rejected"
            )
        
        # Check if all items are verified
        items = check_doc.get("items", [])
        all_checked = all(item.get("is_checked", False) for item in items)
        
        if not all_checked:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All safety check items must be verified before approval"
            )
        
        # Approve the safety check
        result = await safety_checks_collection.update_one(
            {"_id": ObjectId(check_id)},
            {
                "$set": {
                    "status": SafetyCheckStatus.PASSED.value,
                    "passed_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to approve safety check"
            )
        
        # Get updated check
        check_doc = await safety_checks_collection.find_one({"_id": ObjectId(check_id)})
        check_doc["id"] = str(check_doc.pop("_id"))
        
        return SafetyCheckResponse(**check_doc)
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid safety check ID"
        )


@router.get("/{check_id}", response_model=SafetyCheckResponse)
async def get_safety_check_by_id(
    check_id: str,
    current_user = Depends(get_current_user)
):
    """Get a specific safety check by ID"""
    try:
        safety_checks_collection = db.get_collection("safety_checks")
        
        check_doc = await safety_checks_collection.find_one({
            "_id": ObjectId(check_id),
            "user_id": current_user.id
        })
        
        if check_doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Safety check not found"
            )
        
        check_doc["id"] = str(check_doc.pop("_id"))
        return SafetyCheckResponse(**check_doc)
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid safety check ID"
        )
