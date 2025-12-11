# schemas.py
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# --- Existing User Schemas ---
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
    is_active: bool
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
    croma_price: Optional[float] = None
    reliance_price: Optional[float] = None
    ajio_price: Optional[float] = None

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
    croma_price: Optional[float] = None
    reliance_price: Optional[float] = None
    ajio_price: Optional[float] = None
    created_at: datetime
    image_data: Optional[str] = None

    class Config:
        from_attributes = True

# --- Manual Search Schemas ---
class ManualSearchBase(BaseModel):
    query: str
    amazon_price: Optional[float] = None
    flipkart_price: Optional[float] = None
    snapdeal_price: Optional[float] = None
    croma_price: Optional[float] = None
    reliance_price: Optional[float] = None
    ajio_price: Optional[float] = None

class ManualSearchCreate(ManualSearchBase):
    user_id: int

class ManualSearch(ManualSearchBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ManualSearchWithPrices(BaseModel):
    query: str
    amazon_price: Optional[float] = None
    flipkart_price: Optional[float] = None
    snapdeal_price: Optional[float] = None
    croma_price: Optional[float] = None
    reliance_price: Optional[float] = None
    ajio_price: Optional[float] = None
    search_id: int = 0

    class Config:
        from_attributes = True
        
# --- Password Reset Schemas ---
class ResetRequest(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

# --- Admin Schemas ---
class AdminLogin(BaseModel):
    email: str
    password: str
    admin_key: str

class AdminSession(BaseModel):
    valid: bool
    admin_name: str
    email: Optional[str] = None
    last_login: Optional[datetime] = None

class SystemStats(BaseModel):
    total_users: int
    active_users: int
    total_searches: int
    searches_today: int
    api_uptime: float
    active_scrapers: int
    server_time: datetime
    database_size: Optional[str] = None
    memory_usage: Optional[str] = None
    recent_users_7d: Optional[int] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pin: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    is_active: Optional[bool] = None

class AdminUsersResponse(BaseModel):
    users: List[Dict[str, Any]]
    page: int
    limit: int
    total: int
    total_pages: int
    filters: Dict[str, Any]

class AdminSearchesResponse(BaseModel):
    image_searches: List[Dict[str, Any]]
    manual_searches: List[Dict[str, Any]]
    total_image: int
    total_manual: int
    total: int
    filters: Dict[str, Any]

# --- Feedback Schemas ---
class FeedbackType(str, Enum):
    SUGGESTION = "suggestion"
    BUG = "bug"
    COMPLIMENT = "compliment"
    FEATURE = "feature"

class FeedbackCreate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    rating: int = 0
    message: str
    type: FeedbackType = FeedbackType.SUGGESTION
    
    @validator('rating')
    def validate_rating(cls, v):
        if v < 0 or v > 5:
            raise ValueError('Rating must be between 0 and 5')
        return v
    
    @validator('message')
    def validate_message(cls, v):
        if not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()

class FeedbackResponse(BaseModel):
    success: bool
    message: str
    email_sent: bool

# --- Contact Schemas ---
class ContactMessage(BaseModel):
    message: str
    userEmail: Optional[str] = None
    name: Optional[str] = None
    
    @validator('message')
    def validate_message(cls, v):
        if not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()

class ContactResponse(BaseModel):
    success: bool
    message: str
    email_sent: bool

# --- Analytics Schemas ---
class AnalyticsSummary(BaseModel):
    total_users: int
    active_users: int
    new_users_today: int
    total_searches: int
    image_searches: int
    manual_searches: int
    timeframe: str

class UserGrowthPoint(BaseModel):
    date: str
    day: str
    count: int

class SearchTrendPoint(BaseModel):
    date: str
    day: str
    image_searches: int
    manual_searches: int
    total: int

class PlatformStats(BaseModel):
    amazon: int
    flipkart: int
    snapdeal: int
    croma: int
    reliance: int
    ajio: int

class CategoryDistribution(BaseModel):
    electronics: int
    fashion: int
    general: int

class Demographics(BaseModel):
    gender_distribution: Dict[str, int]
    age_groups: Dict[str, int]

class DashboardAnalytics(BaseModel):
    summary: AnalyticsSummary
    user_growth: List[UserGrowthPoint]
    search_trends: List[SearchTrendPoint]
    category_distribution: CategoryDistribution
    platform_stats: PlatformStats
    demographics: Demographics
    timestamp: str

# --- Export Schemas ---
class SearchExport(BaseModel):
    type: str
    id: int
    user_id: int
    product_query: str
    amazon_price: Optional[float]
    flipkart_price: Optional[float]
    snapdeal_price: Optional[float]
    croma_price: Optional[float]
    reliance_price: Optional[float]
    ajio_price: Optional[float]
    created_at: datetime

class ExportResponse(BaseModel):
    image_searches: List[Dict[str, Any]]
    manual_searches: List[Dict[str, Any]]
    export_date: str
    total_records: int