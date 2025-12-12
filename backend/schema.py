"""
ShopThrone - Pydantic Schemas
Data validation and serialization schemas
"""

from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ==================== USER SCHEMAS ====================

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    name: str


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str
    phone: str
    address: str
    pin: str 
    age: int
    gender: str


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pin: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    """Schema for user in database"""
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


# ==================== AUTHENTICATION SCHEMAS ====================

class Token(BaseModel):
    """JWT token schema"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token payload data schema"""
    email: Optional[str] = None


class ResetRequest(BaseModel):
    """Password reset request schema"""
    email: EmailStr


class ResetPassword(BaseModel):
    """Password reset schema"""
    email: EmailStr
    otp: str
    new_password: str


# ==================== IMAGE SEARCH SCHEMAS ====================

class ImageSearchBase(BaseModel):
    """Base image search schema"""
    predicted_product: str
    amazon_price: Optional[float] = None
    flipkart_price: Optional[float] = None
    snapdeal_price: Optional[float] = None
    croma_price: Optional[float] = None
    reliance_price: Optional[float] = None
    ajio_price: Optional[float] = None


class ImageSearchCreate(ImageSearchBase):
    """Schema for creating image search"""
    user_id: int
    image_data: bytes


class ImageSearchCreateResponse(BaseModel):
    """Response schema for image search creation"""
    predicted_item: str
    search_id: int


class ImageSearch(BaseModel):
    """Schema for image search response"""
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


# ==================== MANUAL SEARCH SCHEMAS ====================

class ManualSearchBase(BaseModel):
    """Base manual search schema"""
    query: str
    amazon_price: Optional[float] = None
    flipkart_price: Optional[float] = None
    snapdeal_price: Optional[float] = None
    croma_price: Optional[float] = None
    reliance_price: Optional[float] = None
    ajio_price: Optional[float] = None


class ManualSearchCreate(ManualSearchBase):
    """Schema for creating manual search"""
    user_id: int


class ManualSearch(ManualSearchBase):
    """Schema for manual search response"""
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ManualSearchWithPrices(BaseModel):
    """Schema for manual search with prices"""
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


# ==================== ADMIN SCHEMAS ====================

class AdminLogin(BaseModel):
    """Admin login schema"""
    email: str
    password: str
    admin_key: str


class AdminSession(BaseModel):
    """Admin session validation schema"""
    valid: bool
    admin_name: str
    email: Optional[str] = None
    last_login: Optional[datetime] = None


class SystemStats(BaseModel):
    """System statistics schema"""
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


class AdminUsersResponse(BaseModel):
    """Admin users list response schema"""
    users: List[Dict[str, Any]]
    page: int
    limit: int
    total: int
    total_pages: int
    filters: Dict[str, Any]


class AdminSearchesResponse(BaseModel):
    """Admin searches list response schema"""
    image_searches: List[Dict[str, Any]]
    manual_searches: List[Dict[str, Any]]
    total_image: int
    total_manual: int
    total: int
    filters: Dict[str, Any]


# ==================== FEEDBACK SCHEMAS ====================

class FeedbackType(str, Enum):
    """Feedback type enumeration"""
    SUGGESTION = "suggestion"
    BUG = "bug"
    COMPLIMENT = "compliment"
    FEATURE = "feature"


class FeedbackCreate(BaseModel):
    """Schema for creating feedback"""
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
    """Feedback submission response schema"""
    success: bool
    message: str
    email_sent: bool


# ==================== CONTACT SCHEMAS ====================

class ContactMessage(BaseModel):
    """Contact message schema"""
    message: str
    userEmail: Optional[str] = None
    name: Optional[str] = None
    
    @validator('message')
    def validate_message(cls, v):
        if not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()


class ContactResponse(BaseModel):
    """Contact message response schema"""
    success: bool
    message: str
    email_sent: bool


# ==================== ANALYTICS SCHEMAS ====================

class AnalyticsSummary(BaseModel):
    """Analytics summary schema"""
    total_users: int
    active_users: int
    new_users_today: int
    total_searches: int
    image_searches: int
    manual_searches: int
    timeframe: str


class UserGrowthPoint(BaseModel):
    """User growth data point schema"""
    date: str
    day: str
    count: int


class SearchTrendPoint(BaseModel):
    """Search trend data point schema"""
    date: str
    day: str
    image_searches: int
    manual_searches: int
    total: int


class PlatformStats(BaseModel):
    """Platform statistics schema"""
    amazon: int
    flipkart: int
    snapdeal: int
    croma: int
    reliance: int
    ajio: int


class CategoryDistribution(BaseModel):
    """Category distribution schema"""
    electronics: int
    fashion: int
    general: int


class Demographics(BaseModel):
    """Demographics schema"""
    gender_distribution: Dict[str, int]
    age_groups: Dict[str, int]


class DashboardAnalytics(BaseModel):
    """Dashboard analytics schema"""
    summary: AnalyticsSummary
    user_growth: List[UserGrowthPoint]
    search_trends: List[SearchTrendPoint]
    category_distribution: CategoryDistribution
    platform_stats: PlatformStats
    demographics: Demographics
    timestamp: str


class TopProductAnalytics(BaseModel):
    """Top product analytics schema"""
    product: str
    search_count: int
    price_range: Dict[str, Optional[float]]
    category: str


class UserLocationAnalytics(BaseModel):
    """User location analytics schema"""
    id: int
    name: str
    email: str
    address: str
    pin_code: str
    created_at: str


class RegionAnalytics(BaseModel):
    """Region analytics schema"""
    region_code: str
    user_count: int
    active_users: int
    users: List[Dict[str, Any]]


class SearchInsights(BaseModel):
    """Search insights schema"""
    timeframe: str
    top_users: List[Dict[str, Any]]
    success_rate: float
    total_searches_period: int
    successful_searches: int
    timestamp: str


class RealtimeAnalytics(BaseModel):
    """Real-time analytics schema"""
    realtime: Dict[str, Any]
    timestamp: str


# ==================== EXPORT SCHEMAS ====================

class SearchExport(BaseModel):
    """Search export schema"""
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
    """Export response schema"""
    image_searches: List[Dict[str, Any]]
    manual_searches: List[Dict[str, Any]]
    export_date: str
    total_records: int


# ==================== MONITORING SCHEMAS ====================

class SystemMonitoring(BaseModel):
    """System monitoring schema"""
    system: Dict[str, Any]
    database: Dict[str, Any]
    application: Dict[str, Any]


class ScraperStatus(BaseModel):
    """Scraper status schema"""
    scrapers: List[Dict[str, Any]]
    total_enabled: int
    overall_success_rate: float
    timestamp: str


class Notification(BaseModel):
    """Notification schema"""
    id: int
    type: str
    title: str
    message: str
    priority: str
    read: bool
    created_at: str
    action_url: Optional[str] = None


class NotificationsResponse(BaseModel):
    """Notifications response schema"""
    notifications: List[Notification]
    total: int
    unread_count: int


# ==================== SETTINGS SCHEMAS ====================

class SystemSettingsUpdate(BaseModel):
    """System settings update schema"""
    settings: Dict[str, Any]


class SystemSettingsResponse(BaseModel):
    """System settings response schema"""
    settings: Dict[str, Any]
    updated_at: Optional[str] = None