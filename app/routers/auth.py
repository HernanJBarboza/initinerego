from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from bson import ObjectId
from app.config.database import db
from app.utils.auth_utils import (
    verify_password, 
    get_password_hash, 
    create_user_token,
    decode_access_token
)
from app.schemas.pydantic_models import (
    UserCreate, 
    UserResponse, 
    Token,
    TokenData
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    """Get the current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = decode_access_token(token)
    if token_data is None:
        raise credentials_exception
    
    # Get user from database
    users_collection = db.get_collection("users")
    user_doc = await users_collection.find_one({"_id": ObjectId(token_data.user_id)})
    
    if user_doc is None:
        raise credentials_exception
    
    # Convert ObjectId to string
    user_doc["id"] = str(user_doc.pop("_id"))
    return UserResponse(**user_doc)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    users_collection = db.get_collection("users")
    
    # Check if email already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user document
    user_doc = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "phone": user_data.phone,
        "hashed_password": hashed_password,
        "emergency_contact": user_data.emergency_contact,
        "emergency_phone": user_data.emergency_phone,
        "vehicle_preference": None,
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
    
    # Insert user
    result = await users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create token
    access_token = create_user_token(user_id=user_id, email=user_data.email)
    
    # Return user response
    user_doc["id"] = user_id
    user_doc.pop("_id")
    user_doc.pop("hashed_password")
    user_response = UserResponse(**user_doc)
    
    return Token(access_token=access_token, user=user_response)


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user and return access token"""
    users_collection = db.get_collection("users")
    
    # Find user by email
    user_doc = await users_collection.find_one({"email": form_data.username})
    if user_doc is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    hashed_password = user_doc.get("hashed_password", "")
    if not verify_password(form_data.password, hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token
    user_id = str(user_doc.pop("_id"))
    access_token = create_user_token(user_id=user_id, email=user_doc["email"])
    
    # Prepare response
    user_doc["id"] = user_id
    user_doc.pop("_id")
    user_doc.pop("hashed_password")
    user_response = UserResponse(**user_doc)
    
    return Token(access_token=access_token, user=user_response)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: UserResponse = Depends(get_current_user)):
    """Refresh access token"""
    access_token = create_user_token(
        user_id=current_user.id, 
        email=current_user.email
    )
    return Token(access_token=access_token, user=current_user)
