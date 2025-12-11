from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

# Use correct relative imports
import models
from models import ManualSearch
import schema as schemas
import auth
import secrets
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import models
import auth
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_image_searches_by_user(db: Session, user_id: int):
    return db.query(models.ImageSearch).filter(models.ImageSearch.user_id == user_id).all()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        name=user.name,
        phone=user.phone,
        address=user.address,
        pin=user.pin,  # <-- FIXED: Added pin
        age=user.age,
        gender=user.gender
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- NEW FUNCTIONS ---

def create_image_search(db: Session, search: schemas.ImageSearchCreate) -> models.ImageSearch:
    """
    Creates an initial image search record with the image, user, and prediction.
    Prices are left null to be filled in by the next step.
    """
    db_search = models.ImageSearch(
        user_id=search.user_id,
        image_data=search.image_data,
        predicted_product=search.predicted_product
    )
    db.add(db_search)
    db.commit()
    db.refresh(db_search)
    return db_search

def update_image_search_prices(db: Session, search_id: int, user_id: int, deals: Dict[str, Any]) -> Optional[models.ImageSearch]:
    """
    Finds an existing search record and updates all price fields.
    """
    db_search = db.query(models.ImageSearch).filter(
        models.ImageSearch.id == search_id,
        models.ImageSearch.user_id == user_id
    ).first()

    if not db_search:
        return None

    # Update all price fields
    db_search.amazon_price = deals.get("amazon_price")
    db_search.flipkart_price = deals.get("flipkart_price")
    db_search.snapdeal_price = deals.get("snapdeal_price")
    # NEW FIELDS
    db_search.croma_price = deals.get("croma_price")
    db_search.reliance_price = deals.get("reliance_price")
    db_search.ajio_price = deals.get("ajio_price")
    
    db.commit()
    db.refresh(db_search)
    return db_search


# ... existing functions ...

def create_manual_search(db: Session, search: schemas.ManualSearchCreate):
    """
    Create a new manual search record with all price fields.
    """
    db_search = ManualSearch(
        user_id=search.user_id,
        query=search.query,
        amazon_price=search.amazon_price,
        flipkart_price=search.flipkart_price,
        snapdeal_price=search.snapdeal_price,
        # NEW FIELDS
        croma_price=search.croma_price,
        reliance_price=search.reliance_price,
        ajio_price=search.ajio_price
    )
    db.add(db_search)
    db.commit()
    db.refresh(db_search)
    return db_search

def update_manual_search_prices(db: Session, search_id: int, user_id: int, deals: dict):
    """
    Update manual search with all price data.
    """
    db_search = db.query(ManualSearch).filter(
        ManualSearch.id == search_id,
        ManualSearch.user_id == user_id
    ).first()
    
    if not db_search:
        return None
    
    # Update all prices if available
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

def get_manual_searches_by_user(db: Session, user_id: int, limit: int = 50):
    """
    Get all manual searches for a user, ordered by most recent.
    """
    return db.query(ManualSearch).filter(
        ManualSearch.user_id == user_id
    ).order_by(ManualSearch.created_at.desc()).limit(limit).all()
    
    
def create_password_reset_token(db: Session, email: str) -> models.PasswordResetToken:
    # First, get the user by email
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    
    # Delete any existing tokens for this user
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id
    ).delete()
    
    # Create new 6-digit numeric OTP
    token = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    db_token = models.PasswordResetToken(
        user_id=user.id,
        email=email,  # <-- Add email field
        token=token,
        expires_at=expires_at
    )
    
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def get_password_reset_token(db: Session, email: str, token: str) -> Optional[models.PasswordResetToken]:
    return db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.email == email,
        models.PasswordResetToken.token == token,
        models.PasswordResetToken.expires_at > datetime.utcnow(),
        models.PasswordResetToken.used == False
    ).first()

def mark_token_as_used(db: Session, token_id: int):
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.id == token_id
    ).update({"used": True})
    db.commit()

def update_user_password(db: Session, email: str, new_password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    
    user.hashed_password = auth.get_password_hash(new_password)
    db.commit()
    return user

def send_reset_email(email: str, token: str):
    import os
    from dotenv import load_dotenv
    load_dotenv()
    """Send password reset email with 6-digit OTP token using Gmail"""
    try:
        # Your Gmail SMTP settings
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        
        # Email content
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
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_username
        msg['To'] = email
        
        # Attach HTML body
        msg.attach(MIMEText(body, 'html'))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        print(f"✅ Password reset email sent to {email}")
        return True
    except Exception as e:
        print(f"❌ Error sending email to {email}: {e}")
        return False
    
# ==================== EMAIL FUNCTIONS ====================
def send_email_notification(subject: str, html_content: str, text_content: str, recipient: str = None) -> bool:
    """Send email notification using SMTP"""
    try:
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        
        if not smtp_username or not smtp_password:
            print("⚠️ SMTP credentials not set. Email won't be sent.")
            return False
            
        if not recipient:
            recipient = smtp_username  # Send to admin by default
        
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

# ==================== FEEDBACK FUNCTIONS ====================
def create_feedback(db: Session, feedback: schemas.FeedbackCreate, user_id: Optional[int] = None) -> models.FeedbackModel:
    """Create a new feedback record"""
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

# ==================== CONTACT FUNCTIONS ====================
def create_contact_message(db: Session, contact: schemas.ContactMessage, ip_address: Optional[str] = None) -> models.ContactMessageModel:
    """Create a new contact message record"""
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

# ==================== ANALYTICS FUNCTIONS ====================
def get_user_analytics(db: Session, start_date: datetime = None, end_date: datetime = None) -> Dict[str, Any]:
    """Get user analytics for a date range"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=7)
    if not end_date:
        end_date = datetime.utcnow()
    
    query = db.query(models.User)
    
    # Apply date filter if provided
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

def get_search_analytics(db: Session, start_date: datetime = None, end_date: datetime = None) -> Dict[str, Any]:
    """Get search analytics for a date range"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=7)
    if not end_date:
        end_date = datetime.utcnow()
    
    # Image searches
    image_query = db.query(models.ImageSearch)
    if start_date:
        image_query = image_query.filter(models.ImageSearch.created_at >= start_date)
    if end_date:
        image_query = image_query.filter(models.ImageSearch.created_at <= end_date)
    
    # Manual searches
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

def get_platform_usage_stats(db: Session) -> Dict[str, int]:
    """Get statistics for platform usage"""
    platforms = ["amazon", "flipkart", "snapdeal", "croma", "reliance", "ajio"]
    stats = {}
    
    for platform in platforms:
        # Count image searches with price for this platform
        image_count = db.query(models.ImageSearch).filter(
            getattr(models.ImageSearch, f"{platform}_price").isnot(None)
        ).count()
        
        # Count manual searches with price for this platform
        manual_count = db.query(models.ManualSearch).filter(
            getattr(models.ManualSearch, f"{platform}_price").isnot(None)
        ).count()
        
        stats[platform] = image_count + manual_count
    
    return stats

def get_category_distribution(db: Session, start_date: datetime = None) -> Dict[str, int]:
    """Get product category distribution"""
    from main import determine_category  # Import from main or define locally
    
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    
    image_searches = db.query(models.ImageSearch).filter(
        models.ImageSearch.created_at >= start_date
    ).all()
    
    distribution = {"electronics": 0, "fashion": 0, "general": 0}
    
    for search in image_searches:
        category = determine_category(search.predicted_product)
        distribution[category] = distribution.get(category, 0) + 1
    
    return distribution