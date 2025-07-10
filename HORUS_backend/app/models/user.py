from pydantic import BaseModel, EmailStr, Field
from beanie import Document
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    admin_name: str = Field(..., min_length=2)
    company_name: str = Field(..., min_length=2)
    contact_no: str = Field(..., min_length=4)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class User(Document, UserBase): # Beanie ODM model for MongoDB
    hashed_password: str

    class Settings:
        name = "users" 

class Token(BaseModel):
    token: str 
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    admin_name: str
    company_name: str
    email: str
    contact_no: str
    location: Optional[str] = ""
    emergency_contact: Optional[str] = ""
    created_at: Optional[str] = ""
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    admin_name: Optional[str] = None
    company_name: Optional[str] = None
    contact_no: Optional[str] = None
    location: Optional[str] = None
    emergency_contact: Optional[str] = None
    # Note: Email updates are not allowed for security reasons
    
    class Config:
        from_attributes = True
