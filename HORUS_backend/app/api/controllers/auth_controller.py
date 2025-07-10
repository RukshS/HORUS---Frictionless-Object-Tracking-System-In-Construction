from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from jose import jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorCollection
import os
from dotenv import load_dotenv
import sys
from app.models.user import TokenData, User, UserCreate, UserUpdate, UserUpdate


# Load AUTH environment variables from parent directory's .env file
load_dotenv()
AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY")
AUTH_ALGORITHM = os.getenv("AUTH_ALGORITHM", "HS256")  # Fixed typo and added default
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Security utilities
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/signin")

class AuthController:
    """Controller class for handling user authentication"""

    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, AUTH_SECRET_KEY, algorithm=AUTH_ALGORITHM)
        return encoded_jwt

    async def create_user(self, user: UserCreate):
        existing_user = await self.collection.find_one(User.email == user.email)

        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        hashed_password = self.get_password_hash(user.password)

        # Create a new user instance using Beanie model
        new_user = User(
            email=user.email,
            admin_name=user.admin_name,
            company_name=user.company_name,
            contact_no=user.contact_no,
            hashed_password=hashed_password
        )
        await new_user.insert() # Save to MongoDB

        access_token = self.create_access_token(data={"sub": new_user.email})
        return {"token": access_token, "token_type": "bearer"}
    
    async def login_user(self, form_data: OAuth2PasswordRequestForm = Depends()):
        # OAuth2PasswordRequestForm uses 'username' for the identifier field
        user = await self.collection.find_one(User.email == form_data.username)

        if not user or not self.verify_password(form_data.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token = self.create_access_token(data={"sub": user["email"]})
        return {"token": access_token, "token_type": "bearer"}
    
    async def get_current_user(self, token: str = Depends(oauth2_scheme)) -> User:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, AUTH_SECRET_KEY, algorithms=[AUTH_ALGORITHM])
            email: str = payload.get("sub")
            print("No error till here")
            if email is None:
                raise credentials_exception
            token_data = TokenData(email=email)
        except JWTError:
            raise credentials_exception
        
        user = await self.collection.find_one(User.email == token_data.email)
        if user is None:
            raise credentials_exception
        
        # Convert MongoDB document to User model for consistent response
        return {
            "email": user["email"],
            "admin_name": user["admin_name"],
            "company_name": user["company_name"],
            "contact_no": user["contact_no"],
            "location": user.get("location", "")
        }

    async def get_current_active_user(self, current_user: User = Depends(get_current_user)) -> User:
        # Add logic here if you have an "is_active" flag on the user model
        # if not current_user.is_active:
        #     raise HTTPException(status_code=400, detail="Inactive user")
        return current_user

    async def update_user_profile(self, email: str, profile_data: UserUpdate):
        """Update user profile information"""
        # Create update dictionary only with provided fields
        update_data = {}
        if profile_data.admin_name is not None:
            update_data["admin_name"] = profile_data.admin_name
        if profile_data.company_name is not None:
            update_data["company_name"] = profile_data.company_name
        if profile_data.contact_no is not None:
            update_data["contact_no"] = profile_data.contact_no
        if profile_data.location is not None:
            update_data["location"] = profile_data.location
        if profile_data.emergency_contact is not None:
            update_data["emergency_contact"] = profile_data.emergency_contact

        # Note: Email updates are not allowed for security reasons

        if not update_data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data provided for update")

        # Update the user in the database
        result = await self.collection.update_one(
            {"email": email},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Fetch and return the updated user
        updated_user = await self.collection.find_one({"email": email})
        if not updated_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found after update")

        return {
            "email": updated_user["email"],
            "admin_name": updated_user["admin_name"],
            "company_name": updated_user["company_name"],
            "contact_no": updated_user["contact_no"],
            "location": updated_user.get("location", "")
        }
