from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import base64

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str
    phone: str
    address: str
    pin: str 
    age: int
    gender: str

class UserInDB(UserBase):
    id: int
    phone: str
    address: str
    pin: str
    age: int
    gender: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Image Search Schemas ---
class ImageSearchBase(BaseModel):
    predicted_product: str
    amazon_price: Optional[float] = None
    flipkart_price: Optional[float] = None
    snapdeal_price: Optional[float] = None

class ImageSearchCreate(ImageSearchBase):
    user_id: int
    image_data: bytes

class ImageSearchCreateResponse(BaseModel):
    predicted_item: str
    search_id: int

class ImageSearch(BaseModel):
    id: int
    user_id: int
    predicted_product: str
    amazon_price: Optional[float] = None
    flipkart_price: Optional[float] = None
    snapdeal_price: Optional[float] = None
    created_at: datetime
    image_data: Optional[str] = None  # <-- base64 string

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_image(cls, obj):
        img_b64 = base64.b64encode(obj.image_data).decode() if obj.image_data else None
        return cls(
            id=obj.id,
            user_id=obj.user_id,
            predicted_product=obj.predicted_product,
            amazon_price=obj.amazon_price,
            flipkart_price=obj.flipkart_price,
            snapdeal_price=obj.snapdeal_price,
            created_at=obj.created_at,
            image_data=img_b64
        )
