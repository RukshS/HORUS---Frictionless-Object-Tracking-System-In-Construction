from fastapi import APIRouter, status, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
import app.database as db
import app.models.user as user
from app.api.controllers import AuthController
from typing import Dict, Any

router = APIRouter(
    prefix="/api/auth",
    tags=["authentication"],
)
auth_controller = AuthController(db.users_collection)

@router.post("/signup", response_model=user.Token)
async def signup_user(user_data: user.UserCreate):
    """Register a new user"""
    return await auth_controller.create_user(user_data)

@router.post("/signin", response_model=user.Token)
async def signin_user(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate and login a user"""
    return await auth_controller.login_user(form_data)

@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(auth_controller.get_current_user)):
    """Get current authenticated user details"""
    return current_user


@router.put("/update-profile")
async def update_user_profile(
    profile_data: user.UserUpdate,
    current_user: dict = Depends(auth_controller.get_current_user)
):
    """Update current authenticated user profile"""
    return await auth_controller.update_user_profile(current_user["email"], profile_data)


# Define the security scheme 
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/signin")

