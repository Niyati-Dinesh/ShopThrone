"""
ShopThrone - Database Operations Module
Handles all database CRUD operations and business logic
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

import models
import schema as schemas
import auth

load_dotenv()

# ==================== USER OPERATIONS ====================

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Get user by email address"""
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    """Get user by ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Create a new user with hashed password"""
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        name=user.name,
        phone=user.phone,
        address=user.address,
        pin=user.pin,
        age=user.age,
        gender=user.gender
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user_data: schemas.UserUpdate) -> Optional[models.User]:
    """Update user information"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None
    
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(user, field) and value is not None:
            setattr(user, field, value)
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> bool:
    """Delete user and all related data"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return False
    
    # Delete related data
    db.query(models.ImageSearch).filter(models.ImageSearch.user_id == user_id).delete()
    db.query(models.ManualSearch).filter(models.ManualSearch.user_id == user_id).delete()
    db.query(models.PasswordResetToken).filter(models.PasswordResetToken.user_id == user_id).delete()
    
    # Delete user
    db.delete(user)
    db.commit()
    return True


def get_all_users(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None, 
                  active_only: bool = False) -> tuple[List[models.User], int]:
    """Get all users with pagination and filtering"""
    query = db.query(models.User)
    
    if active_only:
        query = query.filter(models.User.is_active == True)
    
    if search:
        query = query.filter(
            (models.User.name.ilike(f"%{search}%")) | 
            (models.User.email.ilike(f"%{search}%"))
        )
    
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    return users, total


# ==================== IMAGE SEARCH OPERATIONS ====================

def create_image_search(db: Session, search: schemas.ImageSearchCreate) -> models.ImageSearch:
    """Create an image search record"""
    db_search = models.ImageSearch(
        user_id=search.user_id,
        image_data=search.image_data,
        predicted_product=search.predicted_product
    )
    db.add(db_search)
    db.commit()
    db.refresh(db_search)
    return db_search


def update_image_search_prices(db: Session, search_id: int, user_id: int, 
                               deals: Dict[str, Any]) -> Optional[models.ImageSearch]:
    """Update image search with price data"""
    db_search = db.query(models.ImageSearch).filter(
        models.ImageSearch.id == search_id,
        models.ImageSearch.user_id == user_id
    ).first()

    if not db_search:
        return None

    db_search.amazon_price = deals.get("amazon_price")
    db_search.flipkart_price = deals.get("flipkart_price")
    db_search.snapdeal_price = deals.get("snapdeal_price")
    db_search.croma_price = deals.get("croma_price")
    db_search.reliance_price = deals.get("reliance_price")
    db_search.ajio_price = deals.get("ajio_price")
    
    db.commit()
    db.refresh(db_search)
    return db_search


def get_image_searches_by_user(db: Session, user_id: int, limit: int = 50) -> List[models.ImageSearch]:
    """Get all image searches for a user"""
    return db.query(models.ImageSearch).filter(
        models.ImageSearch.user_id == user_id
    ).order_by(models.ImageSearch.created_at.desc()).limit(limit).all()


def get_all_image_searches(db: Session, skip: int = 0, limit: int = 100, 
                           user_id: Optional[int] = None, 
                           start_date: Optional[datetime] = None,
                           end_date: Optional[datetime] = None) -> tuple[List[models.ImageSearch], int]:
    """Get all image searches with filtering"""
    query = db.query(models.ImageSearch)
    
    if user_id:
        query = query.filter(models.ImageSearch.user_id == user_id)
    
    if start_date:
        query = query.filter(models.ImageSearch.created_at >= start_date)
    
    if end_date:
        query = query.filter(models.ImageSearch.created_at <= end_date)
    
    total = query.count()
    searches = query.offset(skip).limit(limit).all()
    
    return searches, total


# ==================== MANUAL SEARCH OPERATIONS ====================

def create_manual_search(db: Session, search: schemas.ManualSearchCreate) -> models.ManualSearch:
    """Create a manual search record"""
    db_search = models.ManualSearch(
        user_id=search.user_id,
        query=search.query,
        amazon_price=search.amazon_price,
        flipkart_price=search.flipkart_price,
        snapdeal_price=search.snapdeal_price,
        croma_price=search.croma_price,
        reliance_price=search.reliance_price,
        ajio_price=search.ajio_price
    )
    db.add(db_search)
    db.commit()
    db.refresh(db_search)
    return db_search


def update_manual_search_prices(db: Session, search_id: int, user_id: int, 
                                deals: Dict[str, Any]) -> Optional[models.ManualSearch]:
    """Update manual search with price data"""
    db_search = db.query(models.ManualSearch).filter(
        models.ManualSearch.id == search_id,
        models.ManualSearch.user_id == user_id
    ).first()
    
    if not db_search:
        return None
    
    price_fields = [
        "amazon_price", "flipkart_price", "snapdeal_price",
        "croma_price", "reliance_price", "ajio_price"
    ]
    
    for field in price_fields:
        if deals.get(field) is not None:
            setattr(db_search, field, deals[field])
    
    db.commit()
    db.refresh(db_search)
    return db_search


def get_manual_searches_by_user(db: Session, user_id: int, limit: int = 50) -> List[models.ManualSearch]:
    """Get all manual searches for a user"""
    return db.query(models.ManualSearch).filter(
        models.ManualSearch.user_id == user_id
    ).order_by(models.ManualSearch.created_at.desc()).limit(limit).all()


def get_all_manual_searches(db: Session, skip: int = 0, limit: int = 100,
                           user_id: Optional[int] = None,
                           start_date: Optional[datetime] = None,
                           end_date: Optional[datetime] = None) -> tuple[List[models.ManualSearch], int]:
    """Get all manual searches with filtering"""
    query = db.query(models.ManualSearch)
    
    if user_id:
        query = query.filter(models.ManualSearch.user_id == user_id)
    
    if start_date:
        query = query.filter(models.ManualSearch.created_at >= start_date)
    
    if end_date:
        query = query.filter(models.ManualSearch.created_at <= end_date)
    
    total = query.count()
    searches = query.offset(skip).limit(limit).all()
    
    return searches, total


# ==================== PASSWORD RESET OPERATIONS ====================

def create_password_reset_token(db: Session, email: str) -> Optional[models.PasswordResetToken]:
    """Create a password reset token"""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    
    # Delete existing tokens
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id
    ).delete()
    
    # Create 6-digit OTP
    token = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    db_token = models.PasswordResetToken(
        user_id=user.id,
        email=email,
        token=token,
        expires_at=expires_at
    )
    
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token


def get_password_reset_token(db: Session, email: str, token: str) -> Optional[models.PasswordResetToken]:
    """Validate and retrieve password reset token"""
    return db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.email == email,
        models.PasswordResetToken.token == token,
        models.PasswordResetToken.expires_at > datetime.utcnow(),
        models.PasswordResetToken.used == False
    ).first()


def mark_token_as_used(db: Session, token_id: int):
    """Mark password reset token as used"""
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.id == token_id
    ).update({"used": True})
    db.commit()


def update_user_password(db: Session, email: str, new_password: str) -> Optional[models.User]:
    """Update user password"""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    
    user.hashed_password = auth.get_password_hash(new_password)
    db.commit()
    return user


# ==================== EMAIL OPERATIONS ====================

def send_reset_email(email: str, token: str) -> bool:
    """Send password reset email with OTP"""
    try:
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        
        if not smtp_username or not smtp_password:
            print("⚠️ SMTP credentials not set")
            return False
        
        subject = "Password Reset Request - ShopThrone"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>You have requested to reset your password for your ShopThrone account.</p>
                
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                    <h3 style="color: #6b2d3d; margin: 0;">Your 6-Digit OTP Code:</h3>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #6b2d3d; margin: 10px 0;">
                        {token}
                    </div>
                    <p style="font-size: 14px; color: #666; margin: 5px 0;">(Valid for 15 minutes)</p>
                </div>
                
                <p style="color: #666;">If you didn't request this password reset, please ignore this email.</p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
                    Best regards,<br>
                    The ShopThrone Team
                </p>
            </div>
        </body>
        </html>
        """
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_username
        msg['To'] = email
        msg.attach(MIMEText(body, 'html'))
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        print(f"✅ Password reset email sent to {email}")
        return True
        
    except Exception as e:
        print(f"❌ Error sending email to {email}: {e}")
        return False


def send_email_notification(subject: str, html_content: str, text_content: str, 
                           recipient: Optional[str] = None) -> bool:
    """Send generic email notification"""
    try:
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        
        if not smtp_username or not smtp_password:
            print("⚠️ SMTP credentials not set")
            return False
            
        if not recipient:
            recipient = smtp_username
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_username
        msg['To'] = recipient
        
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        print(f"✅ Email sent successfully to {recipient}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        return False


# ==================== FEEDBACK OPERATIONS ====================

def create_feedback(db: Session, feedback: schemas.FeedbackCreate, 
                   user_id: Optional[int] = None) -> models.FeedbackModel:
    """Create a feedback record"""
    db_feedback = models.FeedbackModel(
        name=feedback.name,
        email=feedback.email,
        rating=feedback.rating,
        message=feedback.message,
        type=feedback.type,
        user_id=user_id
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


def get_feedbacks(db: Session, skip: int = 0, limit: int = 100) -> List[models.FeedbackModel]:
    """Get all feedbacks with pagination"""
    return db.query(models.FeedbackModel).offset(skip).limit(limit).all()


# ==================== CONTACT MESSAGE OPERATIONS ====================

def create_contact_message(db: Session, contact: schemas.ContactMessage, 
                          ip_address: Optional[str] = None) -> models.ContactMessageModel:
    """Create a contact message record"""
    db_contact = models.ContactMessageModel(
        name=contact.name,
        email=contact.userEmail,
        message=contact.message,
        user_email=contact.userEmail,
        ip_address=ip_address
    )
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact


def get_contact_messages(db: Session, skip: int = 0, limit: int = 100) -> List[models.ContactMessageModel]:
    """Get all contact messages with pagination"""
    return db.query(models.ContactMessageModel).offset(skip).limit(limit).all()


# ==================== ANALYTICS OPERATIONS ====================

def get_user_analytics(db: Session, start_date: Optional[datetime] = None, 
                      end_date: Optional[datetime] = None) -> Dict[str, Any]:
    """Get user analytics for date range"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=7)
    if not end_date:
        end_date = datetime.utcnow()
    
    query = db.query(models.User)
    
    if start_date:
        query = query.filter(models.User.created_at >= start_date)
    if end_date:
        query = query.filter(models.User.created_at <= end_date)
    
    total_users = query.count()
    active_users = query.filter(models.User.is_active == True).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users
    }


def get_search_analytics(db: Session, start_date: Optional[datetime] = None, 
                        end_date: Optional[datetime] = None) -> Dict[str, Any]:
    """Get search analytics for date range"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=7)
    if not end_date:
        end_date = datetime.utcnow()
    
    image_query = db.query(models.ImageSearch)
    if start_date:
        image_query = image_query.filter(models.ImageSearch.created_at >= start_date)
    if end_date:
        image_query = image_query.filter(models.ImageSearch.created_at <= end_date)
    
    manual_query = db.query(models.ManualSearch)
    if start_date:
        manual_query = manual_query.filter(models.ManualSearch.created_at >= start_date)
    if end_date:
        manual_query = manual_query.filter(models.ManualSearch.created_at <= end_date)
    
    return {
        "total_image_searches": image_query.count(),
        "total_manual_searches": manual_query.count(),
        "total_searches": image_query.count() + manual_query.count()
    }


# Add this to your crud.py file if it doesn't exist

def get_platform_usage_stats(db: Session) -> Dict[str, int]:
    """Get usage statistics for each platform"""
    return {
        "amazon": db.query(models.ImageSearch).filter(models.ImageSearch.amazon_price.isnot(None)).count() + 
                  db.query(models.ManualSearch).filter(models.ManualSearch.amazon_price.isnot(None)).count(),
        "flipkart": db.query(models.ImageSearch).filter(models.ImageSearch.flipkart_price.isnot(None)).count() + 
                    db.query(models.ManualSearch).filter(models.ManualSearch.flipkart_price.isnot(None)).count(),
        "snapdeal": db.query(models.ImageSearch).filter(models.ImageSearch.snapdeal_price.isnot(None)).count() + 
                    db.query(models.ManualSearch).filter(models.ManualSearch.snapdeal_price.isnot(None)).count(),
        "croma": db.query(models.ImageSearch).filter(models.ImageSearch.croma_price.isnot(None)).count() + 
                 db.query(models.ManualSearch).filter(models.ManualSearch.croma_price.isnot(None)).count(),
        "reliance": db.query(models.ImageSearch).filter(models.ImageSearch.reliance_price.isnot(None)).count() + 
                    db.query(models.ManualSearch).filter(models.ManualSearch.reliance_price.isnot(None)).count(),
        "ajio": db.query(models.ImageSearch).filter(models.ImageSearch.ajio_price.isnot(None)).count() + 
                db.query(models.ManualSearch).filter(models.ManualSearch.ajio_price.isnot(None)).count(),
    }


def get_user_search_counts(db: Session, user_id: int) -> Dict[str, int]:
    """Get search counts for a user"""
    image_searches = db.query(models.ImageSearch).filter(
        models.ImageSearch.user_id == user_id
    ).count()
    
    manual_searches = db.query(models.ManualSearch).filter(
        models.ManualSearch.user_id == user_id
    ).count()
    
    return {
        "image_searches": image_searches,
        "manual_searches": manual_searches,
        "total_searches": image_searches + manual_searches
    }


# ==================== SYSTEM SETTINGS OPERATIONS ====================

def get_system_setting(db: Session, key: str) -> Optional[models.SystemSetting]:
    """Get a system setting by key"""
    return db.query(models.SystemSetting).filter(
        models.SystemSetting.key == key
    ).first()


def update_system_setting(db: Session, key: str, value: str, 
                         updated_by: Optional[int] = None) -> models.SystemSetting:
    """Update or create a system setting"""
    setting = get_system_setting(db, key)
    
    if setting:
        setting.value = value
        setting.updated_by = updated_by
        setting.updated_at = datetime.utcnow()
    else:
        setting = models.SystemSetting(
            key=key,
            value=value,
            updated_by=updated_by
        )
        db.add(setting)
    
    db.commit()
    db.refresh(setting)
    return setting


def get_all_settings(db: Session) -> Dict[str, str]:
    """Get all system settings as dictionary"""
    settings = db.query(models.SystemSetting).all()
    return {setting.key: setting.value for setting in settings}


# ==================== ADMIN LOG OPERATIONS ====================

def create_admin_log(db: Session, admin_id: Optional[int], action: str, 
                    details: Optional[str] = None, ip_address: Optional[str] = None) -> models.AdminLog:
    """Create an admin activity log"""
    log = models.AdminLog(
        admin_id=admin_id,
        action=action,
        details=details,
        ip_address=ip_address
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_admin_logs(db: Session, skip: int = 0, limit: int = 100) -> List[models.AdminLog]:
    """Get admin logs with pagination"""
    return db.query(models.AdminLog).order_by(
        models.AdminLog.created_at.desc()
    ).offset(skip).limit(limit).all()