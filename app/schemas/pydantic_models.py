from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


# ==================== ENUMS ====================
class VehicleType(str, Enum):
    MOTORCYCLE = "motorcycle"
    CAR = "car"
    BUS = "bus"


class TripStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EMERGENCY = "emergency"
    CANCELLED = "cancelled"


class EmergencyStatus(str, Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    PENDING = "pending"


class SafetyCheckStatus(str, Enum):
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"


# ==================== USER SCHEMAS ====================
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    vehicle_preference: Optional[VehicleType] = None


class UserResponse(UserBase):
    id: str
    vehicle_preference: Optional[VehicleType] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserInDB(UserBase):
    id: str
    hashed_password: str
    vehicle_preference: Optional[VehicleType] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ==================== AUTH SCHEMAS ====================
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


# ==================== VEHICLE SCHEMAS ====================
class VehicleBase(BaseModel):
    vehicle_type: VehicleType
    license_plate: str
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleResponse(VehicleBase):
    id: str
    user_id: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== SAFETY CHECK SCHEMAS ====================
class SafetyCheckItem(BaseModel):
    item_name: str
    description: str
    is_checked: bool = False


class SafetyCheckCreate(BaseModel):
    trip_id: Optional[str] = None
    items: List[SafetyCheckItem] = [
        SafetyCheckItem(item_name="vehicle_state", description="Estado general del vehículo"),
        SafetyCheckItem(item_name="lights", description="Luces funcionando correctamente"),
        SafetyCheckItem(item_name="brakes", description="Frenos en buen estado"),
        SafetyCheckItem(item_name="tires", description="Neumáticos inflados adecuadamente"),
        SafetyCheckItem(item_name="mirrors", description="Espejos ajustados correctamente"),
        SafetyCheckItem(item_name="documents", description="Documentos al día"),
        SafetyCheckItem(item_name="safety_gear", description="Casco/cinturón puesto"),
        SafetyCheckItem(item_name="first_aid", description="Kit de primeros auxilios presente"),
    ]


class SafetyCheckResponse(BaseModel):
    id: str
    user_id: str
    trip_id: Optional[str] = None
    items: List[SafetyCheckItem]
    status: SafetyCheckStatus
    passed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== TRIP SCHEMAS ====================
class LocationPoint(BaseModel):
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    timestamp: datetime


class TripCreate(BaseModel):
    vehicle_type: VehicleType
    origin_latitude: float
    origin_longitude: float
    origin_address: Optional[str] = None
    destination_latitude: float
    destination_longitude: float
    destination_address: Optional[str] = None
    notes: Optional[str] = None


class TripUpdate(BaseModel):
    status: Optional[TripStatus] = None
    end_latitude: Optional[float] = None
    end_longitude: Optional[float] = None
    end_address: Optional[str] = None


class TripResponse(BaseModel):
    id: str
    user_id: str
    vehicle_type: VehicleType
    status: TripStatus
    route: List[LocationPoint] = []
    origin: LocationPoint
    destination: Optional[LocationPoint] = None
    distance_km: float = 0.0
    duration_minutes: int = 0
    safety_check_id: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TripLocationUpdate(BaseModel):
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    accuracy: Optional[float] = None
    speed: Optional[float] = None


# ==================== EMERGENCY SCHEMAS ====================
class EmergencyBase(BaseModel):
    emergency_type: str
    description: Optional[str] = None


class EmergencyCreate(EmergencyBase):
    latitude: float
    longitude: float
    address: Optional[str] = None


class EmergencyUpdate(BaseModel):
    status: Optional[EmergencyStatus] = None
    resolution_notes: Optional[str] = None


class EmergencyResponse(BaseModel):
    id: str
    user_id: str
    trip_id: Optional[str] = None
    emergency_type: str
    description: Optional[str] = None
    location: LocationPoint
    status: EmergencyStatus
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== DASHBOARD SCHEMAS ====================
class DashboardStats(BaseModel):
    total_trips: int
    completed_trips: int
    active_trips: int
    total_emergencies: int
    safety_checks_passed: int
    total_distance_km: float
    total_duration_minutes: int


class RecentTripItem(BaseModel):
    id: str
    vehicle_type: VehicleType
    status: TripStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    distance_km: float
    
    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_trips: List[RecentTripItem]
    has_active_trip: bool
