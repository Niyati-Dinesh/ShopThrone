from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Float, Boolean, LargeBinary, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base
from datetime import datetime
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from enum import Enum
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    pin = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    searches = relationship("ImageSearch", back_populates="user", cascade="all, delete-orphan")
    manual_searches = relationship("ManualSearch", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}')>"


class ImageSearch(Base):
    __tablename__ = "image_searches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_data = Column(LargeBinary, nullable=True)
    predicted_product = Column(String, nullable=False)

    amazon_price = Column(Float, nullable=True)
    flipkart_price = Column(Float, nullable=True)
    snapdeal_price = Column(Float, nullable=True)
    croma_price = Column(Float, nullable=True)
    reliance_price = Column(Float, nullable=True)
    ajio_price = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="searches")


class ManualSearch(Base):
    __tablename__ = "manual_searches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    query = Column(String, nullable=False)

    amazon_price = Column(Float, nullable=True)
    flipkart_price = Column(Float, nullable=True)
    snapdeal_price = Column(Float, nullable=True)
    croma_price = Column(Float, nullable=True)
    reliance_price = Column(Float, nullable=True)
    ajio_price = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="manual_searches")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    email = Column(String(255), nullable=False) 
    token = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")

    def __repr__(self):
        return f"<PasswordResetToken(id={self.id}, user_id={self.user_id}, email={self.email})>"


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="admin")
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<AdminUser(id={self.id}, email='{self.email}', role='{self.role}')>"


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String, nullable=False)
    module = Column(String, nullable=False)
    message = Column(String, nullable=False)
    details = Column(Text, nullable=True)

    ip_address = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    admin_id = Column(Integer, ForeignKey("admin_users.id"))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    admin = relationship("AdminUser", foreign_keys=[admin_id])

    def __repr__(self):
        return f"<SystemLog(id={self.id}, level='{self.level}', module='{self.module}')>"


class SystemCache(Base):
    __tablename__ = "system_cache"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)  # stored as JSON string manually
    expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<SystemCache(id={self.id}, key='{self.key}')>"


class RateLimit(Base):
    __tablename__ = "rate_limits"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, nullable=False, index=True)
    endpoint = Column(String, nullable=False)
    request_count = Column(Integer, default=0)
    last_request = Column(DateTime, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<RateLimit(id={self.id}, ip='{self.ip_address}', endpoint='{self.endpoint}')>"


class AnalyticsCache(Base):
    __tablename__ = "analytics_cache"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    data = Column(Text, nullable=False)  # store JSON manually as string
    expires_at = Column(DateTime, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    updated_by = Column(Integer, nullable=True)

    def __repr__(self):
        return f"<SystemSetting(key='{self.key}', value='{self.value}')>"


class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<AdminLog(id={self.id}, action='{self.action}')>"
    
    
# Add after other schemas in main.py
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
    

class ContactMessageModel(Base):
    __tablename__ = "contact_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    user_email = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String, nullable=True)
    
    def __repr__(self):
        return f"<ContactMessage(id={self.id}, email='{self.email}')>"

class FeedbackModel(Base):
    __tablename__ = "feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    rating = Column(Integer, default=0)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # 'suggestion', 'bug', 'compliment', 'feature'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    user = relationship("User", foreign_keys=[user_id])
    
    def __repr__(self):
        return f"<Feedback(id={self.id}, type='{self.type}', rating={self.rating})>"