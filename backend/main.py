"""
ShopThrone - Main Application
FastAPI backend for multi-platform price comparison system
"""

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Form, Header, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import base64
import os
from dotenv import load_dotenv

# Local imports
import dbop as crud
import models
import schema as schemas
import auth
import transformer as ai_model
from db import engine, get_db
from price_fetcher import get_top_deals_from_each_site

load_dotenv()

# ==================== CONFIGURATION ====================

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@shopthrone.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "supersecret123")

# ==================== HELPER FUNCTIONS ====================

def determine_category(product_name: str) -> str:
    """Categorize products based on name"""
    product_name = product_name.lower()
    if any(x in product_name for x in ['phone', 'laptop', 'tv', 'watch', 'camera', 'earbud', 'headphone']):
        return "electronics"
    elif any(x in product_name for x in ['shirt', 'pant', 'shoe', 'dress', 'jeans', 'top', 'kurta']):
        return "fashion"
    else:
        return "general"


def init_db_schema():
    """Initialize database schema with tables and default settings"""
    schema_sql = """
    -- Create analytics_cache table
    CREATE TABLE IF NOT EXISTS analytics_cache (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        data JSONB NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(key);
    CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at);

    -- Add price columns if they don't exist
    DO $$
    BEGIN
        -- Image searches
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'image_searches' AND column_name = 'croma_price') THEN
            ALTER TABLE image_searches ADD COLUMN croma_price FLOAT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'image_searches' AND column_name = 'reliance_price') THEN
            ALTER TABLE image_searches ADD COLUMN reliance_price FLOAT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'image_searches' AND column_name = 'ajio_price') THEN
            ALTER TABLE image_searches ADD COLUMN ajio_price FLOAT;
        END IF;
        
        -- Manual searches
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'manual_searches' AND column_name = 'croma_price') THEN
            ALTER TABLE manual_searches ADD COLUMN croma_price FLOAT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'manual_searches' AND column_name = 'reliance_price') THEN
            ALTER TABLE manual_searches ADD COLUMN reliance_price FLOAT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'manual_searches' AND column_name = 'ajio_price') THEN
            ALTER TABLE manual_searches ADD COLUMN ajio_price FLOAT;
        END IF;
    END $$;

    -- Create admin_logs table
    CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create system_settings table
    CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER
    );

    -- Fix password_reset_tokens table - add email column
    DO $$
    BEGIN
        -- Add email column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'password_reset_tokens' AND column_name = 'email') THEN
            ALTER TABLE password_reset_tokens ADD COLUMN email VARCHAR(255);
        END IF;
    END $$;

    -- Insert default settings
    INSERT INTO system_settings (key, value) VALUES
        ('registration_enabled', 'true'),
        ('max_upload_size', '10'),
        ('enable_rate_limiting', 'true'),
        ('api_rate_limit', '100'),
        ('max_users_per_ip', '5'),
        ('auto_backup', 'true'),
        ('backup_frequency', 'daily'),
        ('maintenance_mode', 'false'),
        ('scraper_timeout', '30'),
        ('email_notifications', 'true'),
        ('low_price_threshold', '0.1'),
        ('high_price_threshold', '0.2')
    ON CONFLICT (key) DO NOTHING;
    """
    
    try:
        with engine.connect() as connection:
            connection.execute(text(schema_sql))
            connection.commit()
            print("✅ Database schema initialized successfully")
    except Exception as e:
        print(f"❌ Error initializing database schema: {e}")

def get_admin_payload(authorization: str = Header(None)) -> dict:
    """Extract and verify admin token from authorization header"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
        
        payload = auth.verify_admin_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        return payload
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )


def check_admin_access(payload: dict) -> bool:
    """Verify admin access from token payload"""
    return payload.get("is_admin", False)


def user_to_dict(user: models.User) -> Dict[str, Any]:
    """Convert User model to dictionary"""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "address": user.address,
        "pin": user.pin,
        "age": user.age,
        "gender": user.gender,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None
    }


def search_to_dict(search: Any, search_type: str) -> Dict[str, Any]:
    """Convert search model to dictionary"""
    if search_type == "image":
        return {
            "id": search.id,
            "user_id": search.user_id,
            "predicted_product": search.predicted_product,
            "amazon_price": search.amazon_price,
            "flipkart_price": search.flipkart_price,
            "snapdeal_price": search.snapdeal_price,
            "croma_price": search.croma_price,
            "reliance_price": search.reliance_price,
            "ajio_price": search.ajio_price,
            "created_at": search.created_at
        }
    else:  # manual
        return {
            "id": search.id,
            "user_id": search.user_id,
            "query": search.query,
            "amazon_price": search.amazon_price,
            "flipkart_price": search.flipkart_price,
            "snapdeal_price": search.snapdeal_price,
            "croma_price": search.croma_price,
            "reliance_price": search.reliance_price,
            "ajio_price": search.ajio_price,
            "created_at": search.created_at
        }


# ==================== EMAIL FUNCTIONS ====================

async def send_contact_email(contact: schemas.ContactMessage) -> bool:
    """Send contact email to admin"""
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ background: white; border-radius: 16px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); margin: 20px auto; max-width: 600px; }}
            .header {{ text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; }}
            .header h1 {{ color: #4F46E5; margin: 0; font-size: 28px; }}
            .field {{ margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb; }}
            .label {{ font-weight: 600; color: #4b5563; font-size: 14px; text-transform: uppercase; }}
            .value {{ color: #111827; font-size: 16px; font-weight: 500; }}
            .message-box {{ background: white; border-radius: 8px; padding: 20px; border-left: 4px solid #4F46E5; margin-top: 10px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📨 New Contact Message</h1>
                <p>ShopThrone Website</p>
            </div>
            <div class="field"><span class="label">Name:</span> <span class="value">{contact.name or 'Anonymous'}</span></div>
            <div class="field"><span class="label">Email:</span> <span class="value">{contact.userEmail or 'Not provided'}</span></div>
            <div class="field">
                <span class="label">Message:</span>
                <div class="message-box">{contact.message}</div>
            </div>
            <p style="text-align: center; color: #666; font-size: 12px;">Received at: {current_time}</p>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    NEW CONTACT MESSAGE - SHOPTHRONE
    
    Name: {contact.name or 'Anonymous'}
    Email: {contact.userEmail or 'Not provided'}
    
    Message:
    {contact.message}
    
    Received at: {current_time}
    """
    
    return crud.send_email_notification(
        subject=f"Contact Message from {contact.name or contact.userEmail or 'Anonymous'}",
        html_content=html_content,
        text_content=text_content,
        recipient="niyati2dinesh@gmail.com"
    )


async def send_feedback_email(feedback: schemas.FeedbackCreate) -> bool:
    """Send feedback email to admin"""
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ background: white; border-radius: 16px; padding: 40px; max-width: 600px; margin: 20px auto; }}
            .header {{ text-align: center; margin-bottom: 30px; }}
            .header h1 {{ color: #4F46E5; font-size: 28px; }}
            .stars {{ color: #fbbf24; font-size: 20px; }}
            .type-badge {{ display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }}
            .{feedback.type} {{ background: #dbeafe; color: #1e40af; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📝 New Feedback</h1>
                <p>ShopThrone Dashboard</p>
            </div>
            <p><strong>Type:</strong> <span class="type-badge {feedback.type}">{feedback.type.upper()}</span></p>
            <p><strong>Rating:</strong> <span class="stars">{"★" * feedback.rating}{"☆" * (5 - feedback.rating)}</span> ({feedback.rating}/5)</p>
            <p><strong>Name:</strong> {feedback.name or 'Anonymous'}</p>
            <p><strong>Email:</strong> {feedback.email or 'Not provided'}</p>
            <p><strong>Message:</strong><br>{feedback.message}</p>
            <p style="text-align: center; color: #666; font-size: 12px;">Received at: {current_time}</p>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    NEW FEEDBACK - SHOPTHRONE
    
    Type: {feedback.type.upper()}
    Rating: {"★" * feedback.rating}{"☆" * (5 - feedback.rating)} ({feedback.rating}/5)
    Name: {feedback.name or 'Anonymous'}
    Email: {feedback.email or 'Not provided'}
    
    Message:
    {feedback.message}
    
    Received at: {current_time}
    """
    
    return crud.send_email_notification(
        subject=f"Feedback: {feedback.type.title()} from {feedback.name or 'Anonymous'}",
        html_content=html_content,
        text_content=text_content,
        recipient="niyati2dinesh@gmail.com"
    )


# ==================== APPLICATION INITIALIZATION ====================

# Create tables from models
models.Base.metadata.create_all(bind=engine)

# Initialize database schema
init_db_schema()

# Create FastAPI app
app = FastAPI(
    title="ShopThrone API",
    version="2.5.1",
    description="Multi-platform price comparison API"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ==================== GENERAL ENDPOINTS ====================

@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to ShopThrone API",
        "version": "2.5.1",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat(),
        "admin_api": "enabled"
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.5.1",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "database": "connected",
        "admin_api": "enabled"
    }


# ==================== USER AUTHENTICATION ENDPOINTS ====================

@app.post("/api/users/signup", response_model=schemas.UserInDB)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)


@app.post("/api/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """User login endpoint"""
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/auth/reset-request")
async def request_password_reset(
    request: schemas.ResetRequest,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    user = crud.get_user_by_email(db, email=request.email)
    if not user:
        return {"message": "If the email exists, a reset link has been sent"}
    
    reset_token = crud.create_password_reset_token(db, email=request.email)
    email_sent = crud.send_reset_email(request.email, reset_token.token)
    
    if email_sent:
        return {
            "message": "Password reset OTP has been sent to your email",
            "expires_in": "15 minutes"
        }
    else:
        return {
            "message": "Email sending failed (development mode). Use this OTP:",
            "debug_token": reset_token.token,
            "expires_in": "15 minutes",
            "note": "Enable SMTP for production use"
        }


@app.post("/api/auth/reset-password")
async def reset_password(
    request: schemas.ResetPassword,
    db: Session = Depends(get_db)
):
    """Reset password with OTP"""
    reset_token = crud.get_password_reset_token(db, email=request.email, token=request.otp)
    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    updated_user = crud.update_user_password(db, email=request.email, new_password=request.new_password)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    
    crud.mark_token_as_used(db, reset_token.id)
    return {"message": "Password reset successful"}

# ==================== SEARCH ENDPOINTS ====================

@app.post("/api/search/image", response_model=schemas.ImageSearchCreateResponse)
async def search_by_image(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Search for products by uploading an image"""
    try:
        image_bytes = await file.read()
        predictions = ai_model.analyze_image_from_bytes(image_bytes)
        
        if not predictions:
            raise HTTPException(status_code=500, detail="Could not analyze image")
        
        main_prediction = predictions[0]['label'].split(',')[0].strip()

        search_data = schemas.ImageSearchCreate(
            user_id=current_user.id,
            image_data=image_bytes,
            predicted_product=main_prediction
        )
        db_search = crud.create_image_search(db=db, search=search_data)
        
        return {
            "predicted_item": main_prediction,
            "search_id": db_search.id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.post("/api/search/manual")
async def save_manual_search(
    query: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Save a manual text search"""
    try:
        search_data = schemas.ManualSearchCreate(
            user_id=current_user.id,
            query=query
        )
        db_search = crud.create_manual_search(db=db, search=search_data)
        
        return {
            "message": "Manual search saved successfully",
            "search_id": db_search.id,
            "query": query
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving manual search: {str(e)}")


@app.post("/api/search/manual-with-prices")
async def save_manual_search_with_prices(
    manual_search: schemas.ManualSearchWithPrices,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Save manual search with price data"""
    try:
        search_data = schemas.ManualSearchCreate(
            user_id=current_user.id,
            query=manual_search.query,
            amazon_price=manual_search.amazon_price,
            flipkart_price=manual_search.flipkart_price,
            snapdeal_price=manual_search.snapdeal_price,
            croma_price=manual_search.croma_price,
            reliance_price=manual_search.reliance_price,
            ajio_price=manual_search.ajio_price
        )
        db_search = crud.create_manual_search(db=db, search=search_data)
        
        return {
            "message": "Manual search with prices saved successfully",
            "search_id": db_search.id,
            "query": manual_search.query
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving manual search: {str(e)}")


@app.get("/api/search/deals")
async def get_deals(
    product: str,
    search_id: int = 0,
    pincode: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get price deals from multiple platforms"""
    user_pincode = current_user.pin if current_user else None
    pincode_to_use = pincode or user_pincode

    if not product.strip():
        raise HTTPException(status_code=400, detail="Product name cannot be empty")

    try:
        # Fetch deals from scraper
        deals = get_top_deals_from_each_site(product, pincode=pincode_to_use)

        # Prepare price data for saving
        deals_to_save = {
            "amazon_price": deals.get("amazon", {}).get('price') if deals.get("amazon") else None,
            "flipkart_price": deals.get("flipkart", {}).get('price') if deals.get("flipkart") else None,
            "snapdeal_price": deals.get("snapdeal", {}).get('price') if deals.get("snapdeal") else None,
            "croma_price": deals.get("croma", {}).get('price') if deals.get("croma") else None,
            "reliance_price": deals.get("reliance", {}).get('price') if deals.get("reliance") else None,
            "ajio_price": deals.get("ajio", {}).get('price') if deals.get("ajio") else None,
        }

        # Update existing image search or create new manual search
        if search_id > 0:
            updated_search = crud.update_image_search_prices(
                db=db,
                search_id=search_id,
                user_id=current_user.id,
                deals=deals_to_save
            )
            if not updated_search:
                print(f"Warning: Could not update image search record {search_id}")
        else:
            manual_search_data = schemas.ManualSearchCreate(
                user_id=current_user.id,
                query=product,
                **deals_to_save
            )
            crud.create_manual_search(db=db, search=manual_search_data)

        return deals

    except Exception as e:
        print(f"Error in get_deals: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching deals: {str(e)}")


# ==================== USER PROFILE ENDPOINTS ====================

@app.get("/api/users/me", response_model=schemas.UserInDB)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    """Get current user profile"""
    return current_user


@app.get("/api/users/my-searches", response_model=List[schemas.ImageSearch])
def get_my_searches(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get current user's image searches"""
    searches = crud.get_image_searches_by_user(db, user_id=current_user.id)
    
    result = []
    for search in searches:
        result.append(schemas.ImageSearch(
            id=search.id,
            user_id=search.user_id,
            predicted_product=search.predicted_product,
            amazon_price=search.amazon_price,
            flipkart_price=search.flipkart_price,
            snapdeal_price=search.snapdeal_price,
            croma_price=search.croma_price,
            reliance_price=search.reliance_price,
            ajio_price=search.ajio_price,
            created_at=search.created_at,
            image_data=base64.b64encode(search.image_data).decode('utf-8') if search.image_data else None
        ))
    
    return result


@app.get("/api/users/my-manual-searches", response_model=List[schemas.ManualSearch])
def get_my_manual_searches(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get current user's manual searches"""
    return crud.get_manual_searches_by_user(db, user_id=current_user.id)


# ==================== FEEDBACK & CONTACT ENDPOINTS ====================

@app.post("/api/feedback", response_model=schemas.FeedbackResponse)
async def submit_feedback(
    feedback: schemas.FeedbackCreate,
    background_tasks: BackgroundTasks
):
    """Submit user feedback"""
    try:
        email_sent = await send_feedback_email(feedback)
        
        if email_sent:
            return schemas.FeedbackResponse(
                success=True,
                message="Thank you for your feedback! Email sent successfully.",
                email_sent=True
            )
        else:
            return schemas.FeedbackResponse(
                success=True,
                message="Thank you for your feedback! (Note: Email notification failed)",
                email_sent=False
            )
            
    except Exception as e:
        print(f"Error processing feedback: {str(e)}")
        return schemas.FeedbackResponse(
            success=False,
            message=f"Failed to submit feedback: {str(e)}",
            email_sent=False
        )


@app.post("/api/send-feedback-email", response_model=schemas.ContactResponse)
async def send_feedback_email_endpoint(
    contact: schemas.ContactMessage,
    background_tasks: BackgroundTasks
):
    """Send contact message from website footer"""
    try:
        background_tasks.add_task(send_contact_email, contact)
        
        return schemas.ContactResponse(
            success=True,
            message="Your message has been sent successfully!",
            email_sent=True
        )
            
    except Exception as e:
        print(f"Error processing contact message: {str(e)}")
        return schemas.ContactResponse(
            success=False,
            message=f"Failed to send message: {str(e)}",
            email_sent=False
        )


# ==================== ADMIN AUTHENTICATION ENDPOINTS ====================

@app.post("/api/admin/login")
async def admin_login(login_data: schemas.AdminLogin):
    """Admin login endpoint"""
    email_match = login_data.email == ADMIN_EMAIL
    password_match = login_data.password == ADMIN_PASSWORD
    key_match = login_data.admin_key == ADMIN_SECRET_KEY
    
    if not (email_match and password_match and key_match):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )
    
    access_token = auth.create_access_token(
        data={"sub": login_data.email, "is_admin": True},
        expires_delta=timedelta(hours=24)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "name": "System Administrator",
        "email": login_data.email,
        "role": "admin",
        "timestamp": datetime.utcnow().isoformat(),
        "expires_in": 86400
    }


@app.get("/api/admin/validate", response_model=schemas.AdminSession)
async def validate_admin_session(payload: dict = Depends(get_admin_payload)):
    """Validate admin session"""
    return {
        "valid": True,
        "admin_name": "System Administrator",
        "email": payload.get("sub"),
        "last_login": datetime.utcnow()
    }


@app.post("/api/admin/logout")
async def admin_logout(payload: dict = Depends(get_admin_payload)):
    """Admin logout endpoint"""
    return {
        "message": "Logged out successfully",
        "timestamp": datetime.utcnow().isoformat()
    }


# ==================== ADMIN USER MANAGEMENT ENDPOINTS ====================

@app.get("/api/admin/users", response_model=schemas.AdminUsersResponse)
async def get_all_users(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Get all users with pagination"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    offset = (page - 1) * limit
    users, total = crud.get_all_users(db, skip=offset, limit=limit, search=search, active_only=active_only)
    
    user_dicts = [user_to_dict(user) for user in users]
    
    return {
        "users": user_dicts,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": (total + limit - 1) // limit,
        "filters": {"search": search, "active_only": active_only}
    }


@app.get("/api/admin/users/{user_id}")
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Get user by ID with search counts"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    search_counts = crud.get_user_search_counts(db, user_id)
    
    user_data = user_to_dict(user)
    user_data.update({
        "image_searches_count": search_counts["image_searches"],
        "manual_searches_count": search_counts["manual_searches"],
        "total_searches": search_counts["total_searches"],
        "last_seen": user.updated_at
    })
    
    return user_data


@app.put("/api/admin/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Update user information"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    updated_user = crud.update_user(db, user_id, user_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "message": "User updated successfully",
        "user": user_to_dict(updated_user)
    }


@app.delete("/api/admin/users/{user_id}")
async def delete_user_permanently(
    user_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Delete user permanently"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "message": "User deleted permanently",
        "user_id": user_id
    }
# ==================== ADMIN SEARCH MANAGEMENT ENDPOINTS ====================

@app.get("/api/admin/searches", response_model=schemas.AdminSearchesResponse)
async def get_all_searches(
    page: int = 1,
    limit: int = 20,
    search_type: Optional[str] = None,
    user_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Get all searches with filtering"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    offset = (page - 1) * limit
    
    # Parse dates
    start_dt = None
    end_dt = None
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    # Get searches based on type
    if search_type == "image":
        image_searches, total_image = crud.get_all_image_searches(
            db, skip=offset, limit=limit, user_id=user_id, start_date=start_dt, end_date=end_dt
        )
        return {
            "image_searches": [search_to_dict(s, "image") for s in image_searches],
            "manual_searches": [],
            "total_image": total_image,
            "total_manual": 0,
            "total": total_image,
            "filters": {"search_type": search_type, "user_id": user_id, "start_date": start_date, "end_date": end_date}
        }
    elif search_type == "manual":
        manual_searches, total_manual = crud.get_all_manual_searches(
            db, skip=offset, limit=limit, user_id=user_id, start_date=start_dt, end_date=end_dt
        )
        return {
            "image_searches": [],
            "manual_searches": [search_to_dict(s, "manual") for s in manual_searches],
            "total_image": 0,
            "total_manual": total_manual,
            "total": total_manual,
            "filters": {"search_type": search_type, "user_id": user_id, "start_date": start_date, "end_date": end_date}
        }
    else:
        # Get both types
        image_searches, total_image = crud.get_all_image_searches(
            db, skip=offset, limit=limit // 2, user_id=user_id, start_date=start_dt, end_date=end_dt
        )
        manual_searches, total_manual = crud.get_all_manual_searches(
            db, skip=offset, limit=limit // 2, user_id=user_id, start_date=start_dt, end_date=end_dt
        )
        
        return {
            "image_searches": [search_to_dict(s, "image") for s in image_searches],
            "manual_searches": [search_to_dict(s, "manual") for s in manual_searches],
            "total_image": total_image,
            "total_manual": total_manual,
            "total": total_image + total_manual,
            "filters": {"search_type": search_type, "user_id": user_id, "start_date": start_date, "end_date": end_date}
        }


# ==================== ADMIN SYSTEM STATS ENDPOINTS ====================

@app.get("/api/admin/system/stats", response_model=schemas.SystemStats)
async def get_system_stats(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Get system statistics"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.is_active == True).count()
    total_searches = db.query(models.ImageSearch).count() + db.query(models.ManualSearch).count()
    
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    searches_today = db.query(models.ImageSearch).filter(
        models.ImageSearch.created_at.between(today_start, today_end)
    ).count()
    searches_today += db.query(models.ManualSearch).filter(
        models.ManualSearch.created_at.between(today_start, today_end)
    ).count()
    
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_users = db.query(models.User).filter(models.User.created_at >= week_ago).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_searches": total_searches,
        "searches_today": searches_today,
        "api_uptime": 99.9,
        "active_scrapers": 6,
        "server_time": datetime.utcnow(),
        "database_size": "1.2 GB",
        "memory_usage": "65%",
        "recent_users_7d": recent_users
    }


# ==================== ADMIN ANALYTICS ENDPOINTS ====================

@app.get("/api/admin/analytics/dashboard")
async def get_dashboard_analytics(
    timeframe: str = "7d",
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Get comprehensive dashboard analytics"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    today = datetime.utcnow()
    
    # Determine start date
    if timeframe == "30d":
        start_date = today - timedelta(days=30)
    elif timeframe == "90d":
        start_date = today - timedelta(days=90)
    elif timeframe == "1y":
        start_date = today - timedelta(days=365)
    else:
        start_date = today - timedelta(days=7)
    
    # Get basic stats
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.is_active == True).count()
    new_users_today = db.query(models.User).filter(
        models.User.created_at >= today.replace(hour=0, minute=0, second=0)
    ).count()
    
    # User growth data
    user_growth = []
    search_trends = []
    
    for i in range(7, -1, -1):
        day = today - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0)
        day_end = day.replace(hour=23, minute=59, second=59)
        
        day_count = db.query(models.User).filter(
            models.User.created_at.between(day_start, day_end)
        ).count()
        user_growth.append({
            "date": day.strftime("%Y-%m-%d"),
            "day": day.strftime("%a"),
            "count": day_count
        })
        
        img_count = db.query(models.ImageSearch).filter(
            models.ImageSearch.created_at.between(day_start, day_end)
        ).count()
        man_count = db.query(models.ManualSearch).filter(
            models.ManualSearch.created_at.between(day_start, day_end)
        ).count()
        
        search_trends.append({
            "date": day.strftime("%Y-%m-%d"),
            "day": day.strftime("%a"),
            "image_searches": img_count,
            "manual_searches": man_count,
            "total": img_count + man_count
        })
    
    # Category distribution
    image_searches = db.query(models.ImageSearch).filter(
        models.ImageSearch.created_at >= start_date
    ).all()
    
    category_distribution = {"electronics": 0, "fashion": 0, "general": 0}
    for search in image_searches:
        category = determine_category(search.predicted_product)
        category_distribution[category] += 1
    
    # Platform stats
    platform_stats = crud.get_platform_usage_stats(db)
    
    # Demographics
    users = db.query(models.User).all()
    gender_dist = {}
    age_groups = {"18-25": 0, "26-35": 0, "36-45": 0, "46+": 0, "unknown": 0}
    
    for user in users:
        gender = user.gender.lower() if user.gender else "unknown"
        if gender in ["male", "m"]:
            gender = "Male"
        elif gender in ["female", "f"]:
            gender = "Female"
        else:
            gender = "Other"
        gender_dist[gender] = gender_dist.get(gender, 0) + 1
        
        if user.age:
            if 18 <= user.age <= 25:
                age_groups["18-25"] += 1
            elif 26 <= user.age <= 35:
                age_groups["26-35"] += 1
            elif 36 <= user.age <= 45:
                age_groups["36-45"] += 1
            elif user.age > 45:
                age_groups["46+"] += 1
        else:
            age_groups["unknown"] += 1

    return {
        "summary": {
            "total_users": total_users,
            "active_users": active_users,
            "new_users_today": new_users_today,
            "total_searches": db.query(models.ImageSearch).count() + db.query(models.ManualSearch).count(),
            "image_searches": db.query(models.ImageSearch).count(),
            "manual_searches": db.query(models.ManualSearch).count(),
            "timeframe": timeframe
        },
        "user_growth": user_growth,
        "search_trends": search_trends,
        "category_distribution": category_distribution,
        "platform_stats": platform_stats,
        "demographics": {"gender_distribution": gender_dist, "age_groups": age_groups},
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/admin/analytics/top-products")
async def get_top_products_analytics(
    limit: int = 10,
    timeframe: str = "7d",
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Get top searched products"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    today = datetime.utcnow()
    start_date = today - timedelta(days=7)
    
    # Get all searches
    image_searches = db.query(models.ImageSearch).filter(
        models.ImageSearch.created_at >= start_date
    ).all()
    manual_searches = db.query(models.ManualSearch).filter(
        models.ManualSearch.created_at >= start_date
    ).all()
    
    # Count products
    product_counts = {}
    for search in image_searches:
        if search.predicted_product:
            product_counts[search.predicted_product] = product_counts.get(search.predicted_product, 0) + 1
    
    for search in manual_searches:
        if search.query:
            product_counts[search.query] = product_counts.get(search.query, 0) + 1
    
    # Get top products
    top_products = sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    formatted_products = []
    for product, count in top_products:
        # Get price data
        product_searches = db.query(models.ImageSearch).filter(
            models.ImageSearch.predicted_product.ilike(f"%{product}%")
        ).limit(5).all()
        
        if not product_searches:
            product_searches = db.query(models.ManualSearch).filter(
                models.ManualSearch.query.ilike(f"%{product}%")
            ).limit(5).all()
        
        prices = []
        for ps in product_searches:
            for field in ['amazon_price', 'flipkart_price', 'snapdeal_price', 'croma_price', 'reliance_price', 'ajio_price']:
                price = getattr(ps, field, None)
                if price:
                    prices.append(price)
        
        price_range = {
            "min": min(prices) if prices else None,
            "max": max(prices) if prices else None,
            "avg": sum(prices) / len(prices) if prices else None
        }
        
        formatted_products.append({
            "product": product,
            "search_count": count,
            "price_range": price_range,
            "category": determine_category(product)
        })
    
    return {
        "top_products": formatted_products,
        "timeframe": timeframe,
        "total_products_tracked": len(product_counts)
    }


@app.get("/api/admin/analytics/user-regions")
async def get_user_regions(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Get user distribution by regions"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    users = db.query(models.User).filter(
        models.User.pin.isnot(None),
        models.User.pin != ""
    ).all()
    
    region_data = {}
    for user in users:
        pin = user.pin
        if pin:
            region_code = pin[:3] if len(pin) >= 3 else "000"
            if region_code not in region_data:
                region_data[region_code] = {
                    "region_code": region_code,
                    "user_count": 0,
                    "users": [],
                    "active_users": 0
                }
            
            region_data[region_code]["user_count"] += 1
            region_data[region_code]["users"].append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "pin": user.pin,
                "is_active": user.is_active
            })
            
            if user.is_active:
                region_data[region_code]["active_users"] += 1
    
    regions_list = list(region_data.values())
    regions_list.sort(key=lambda x: x["user_count"], reverse=True)
    
    return {
        "regions": regions_list[:50],
        "total_regions": len(region_data),
        "timestamp": datetime.utcnow().isoformat()
    }


# ==================== ADMIN MONITORING ENDPOINTS ====================

@app.get("/api/admin/monitoring/live")
async def get_live_monitoring(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Get real-time system monitoring"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        import psutil
        
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Database connections
        try:
            db_connections = db.execute(
                text("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
            ).scalar()
        except:
            db_connections = 0
        
        # Recent activity
        five_min_ago = datetime.utcnow() - timedelta(minutes=5)
        recent_searches = db.query(models.ImageSearch).filter(
            models.ImageSearch.created_at >= five_min_ago
        ).count() + db.query(models.ManualSearch).filter(
            models.ManualSearch.created_at >= five_min_ago
        ).count()
        
        fifteen_min_ago = datetime.utcnow() - timedelta(minutes=15)
        active_users = db.query(models.User).filter(
            models.User.updated_at >= fifteen_min_ago
        ).count()
        
        return {
            "system": {
                "cpu_usage": cpu_percent,
                "memory_usage": memory.percent,
                "memory_used_gb": round(memory.used / (1024**3), 2),
                "memory_total_gb": round(memory.total / (1024**3), 2),
                "disk_usage": disk.percent,
                "disk_free_gb": round(disk.free / (1024**3), 2),
                "timestamp": datetime.utcnow().isoformat()
            },
            "database": {
                "active_connections": db_connections,
                "total_users": db.query(models.User).count(),
                "total_searches": db.query(models.ImageSearch).count() + db.query(models.ManualSearch).count()
            },
            "application": {
                "active_scrapers": 6,
                "recent_searches_5min": recent_searches,
                "active_users_15min": active_users,
                "api_uptime": "99.9%",
                "response_time_ms": 150
            }
        }
        
    except ImportError:
        return {
            "system": {
                "cpu_usage": 0,
                "memory_usage": 0,
                "disk_usage": 0,
                "timestamp": datetime.utcnow().isoformat()
            },
            "database": {
                "total_users": db.query(models.User).count(),
                "total_searches": db.query(models.ImageSearch).count() + db.query(models.ManualSearch).count()
            },
            "application": {
                "active_scrapers": 6,
                "api_uptime": "99.9%",
                "note": "Install psutil for detailed system metrics"
            }
        }


@app.get("/api/admin/scrapers/status")
async def get_scraper_status(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Get scraper status"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    scrapers = [
        {"name": "Amazon", "key": "amazon", "enabled": True, "success_rate": 95, "avg_response_time": 2.5, "category": "all"},
        {"name": "Flipkart", "key": "flipkart", "enabled": True, "success_rate": 92, "avg_response_time": 2.8, "category": "all"},
        {"name": "Snapdeal", "key": "snapdeal", "enabled": True, "success_rate": 85, "avg_response_time": 3.2, "category": "fashion,general"},
        {"name": "Croma", "key": "croma", "enabled": True, "success_rate": 88, "avg_response_time": 2.9, "category": "electronics"},
        {"name": "Reliance Digital", "key": "reliance", "enabled": True, "success_rate": 86, "avg_response_time": 3.1, "category": "electronics"},
        {"name": "Ajio", "key": "ajio", "enabled": True, "success_rate": 90, "avg_response_time": 2.7, "category": "fashion"}
    ]
    
    return {
        "scrapers": scrapers,
        "total_enabled": len([s for s in scrapers if s["enabled"]]),
        "overall_success_rate": round(sum(s["success_rate"] for s in scrapers) / len(scrapers), 1),
        "timestamp": datetime.utcnow().isoformat()
    }


# ==================== ADMIN SETTINGS ENDPOINTS ====================

@app.get("/api/admin/settings")
async def get_admin_settings(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Get admin settings"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    settings = crud.get_all_settings(db)
    
    # Default settings if none exist
    if not settings:
        settings = {
            "registration_enabled": "true",
            "max_upload_size": "10",
            "enable_rate_limiting": "true",
            "api_rate_limit": "100",
            "max_users_per_ip": "5",
            "auto_backup": "true",
            "backup_frequency": "daily",
            "maintenance_mode": "false",
            "scraper_timeout": "30",
            "email_notifications": "true",
            "low_price_threshold": "0.1",
            "high_price_threshold": "0.2"
        }
    
    return {"settings": settings}


@app.put("/api/admin/settings/bulk")
async def update_settings_bulk(
    settings_update: Dict[str, Any],
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Update multiple settings"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    updated_settings = {}
    for key, value in settings_update.items():
        setting = crud.update_system_setting(db, key, str(value))
        updated_settings[key] = setting.value
    
    return {
        "message": "Settings updated successfully",
        "settings": updated_settings,
        "updated_at": datetime.utcnow().isoformat()
    }


# ==================== EXPORT ENDPOINTS ====================

@app.get("/api/admin/export/searches")
async def export_searches(
    format: str = "csv",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """Export search data"""
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Parse dates
    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00')) if start_date else None
    end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00')) if end_date else None
    
    # Get searches
    image_searches, _ = crud.get_all_image_searches(db, start_date=start_dt, end_date=end_dt)
    manual_searches, _ = crud.get_all_manual_searches(db, start_date=start_dt, end_date=end_dt)
    
    if format == "json":
        return {
            "image_searches": [search_to_dict(s, "image") for s in image_searches],
            "manual_searches": [search_to_dict(s, "manual") for s in manual_searches],
            "export_date": datetime.utcnow().isoformat(),
            "total_records": len(image_searches) + len(manual_searches)
        }
    elif format == "csv":
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Type", "ID", "User ID", "Product/Query",
            "Amazon", "Flipkart", "Snapdeal", "Croma", "Reliance", "Ajio", "Created At"
        ])
        
        for s in image_searches:
            writer.writerow([
                "IMAGE", s.id, s.user_id, s.predicted_product,
                s.amazon_price, s.flipkart_price, s.snapdeal_price,
                s.croma_price, s.reliance_price, s.ajio_price, s.created_at
            ])
        
        for s in manual_searches:
            writer.writerow([
                "MANUAL", s.id, s.user_id, s.query,
                s.amazon_price, s.flipkart_price, s.snapdeal_price,
                s.croma_price, s.reliance_price, s.ajio_price, s.created_at
            ])
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=searches_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'csv' or 'json'")
# ==================== ADDITIONAL ADMIN ANALYTICS ENDPOINTS ====================

@app.get("/api/admin/analytics/search-insights")
async def get_search_insights(
    timeframe: str = "7d",
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """
    Get insights about searches - top users, success rates, etc.
    """
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Calculate time range
    today = datetime.utcnow()
    if timeframe == "30d":
        start_date = today - timedelta(days=30)
    elif timeframe == "90d":
        start_date = today - timedelta(days=90)
    else:  # 7d default
        start_date = today - timedelta(days=7)
    
    # Top users by search count
    top_users = []
    users = db.query(models.User).all()
    for user in users:
        image_searches = db.query(models.ImageSearch).filter(
            models.ImageSearch.user_id == user.id,
            models.ImageSearch.created_at >= start_date
        ).count()
        manual_searches = db.query(models.ManualSearch).filter(
            models.ManualSearch.user_id == user.id,
            models.ManualSearch.created_at >= start_date
        ).count()
        
        if image_searches + manual_searches > 0:
            top_users.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "image_searches": image_searches,
                "manual_searches": manual_searches,
                "total_searches": image_searches + manual_searches
            })
    
    top_users.sort(key=lambda x: x["total_searches"], reverse=True)
    
    # Search success rates (searches with prices found)
    all_searches = db.query(models.ImageSearch).filter(
        models.ImageSearch.created_at >= start_date
    ).all()
    
    successful_searches = 0
    for search in all_searches:
        if any([
            search.amazon_price, search.flipkart_price, search.snapdeal_price,
            search.croma_price, search.reliance_price, search.ajio_price
        ]):
            successful_searches += 1
    
    success_rate = (successful_searches / len(all_searches) * 100) if all_searches else 0
    
    return {
        "timeframe": timeframe,
        "top_users": top_users[:10],  # Top 10 users
        "success_rate": round(success_rate, 1),
        "total_searches_period": len(all_searches),
        "successful_searches": successful_searches,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/admin/analytics/realtime")
async def get_realtime_analytics(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """
    Get real-time analytics data for dashboard.
    """
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    now = datetime.utcnow()
    
    # Last hour stats
    last_hour = now - timedelta(hours=1)
    searches_last_hour = db.query(models.ImageSearch).filter(
        models.ImageSearch.created_at >= last_hour
    ).count() + db.query(models.ManualSearch).filter(
        models.ManualSearch.created_at >= last_hour
    ).count()
    
    # New users today
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    new_users_today = db.query(models.User).filter(
        models.User.created_at >= today_start
    ).count()
    
    # Active users (users with searches in last 24 hours)
    last_24h = now - timedelta(hours=24)
    recent_searchers = set()
    
    image_searchers = db.query(models.ImageSearch.user_id).filter(
        models.ImageSearch.created_at >= last_24h
    ).distinct().all()
    manual_searchers = db.query(models.ManualSearch.user_id).filter(
        models.ManualSearch.created_at >= last_24h
    ).distinct().all()
    
    for user_id in image_searchers + manual_searchers:
        if user_id[0]:
            recent_searchers.add(user_id[0])
    
    return {
        "realtime": {
            "searches_last_hour": searches_last_hour,
            "new_users_today": new_users_today,
            "active_users_24h": len(recent_searchers),
            "current_time": now.isoformat(),
            "server_load": "normal"
        },
        "timestamp": now.isoformat()
    }


@app.get("/api/admin/notifications")
async def get_admin_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """
    Get admin notifications.
    """
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Example notifications - in production, fetch from database
    notifications = [
        {
            "id": 1,
            "type": "system",
            "title": "System Update Available",
            "message": "New system update v2.6.0 is ready for installation",
            "priority": "medium",
            "read": False,
            "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
            "action_url": "/admin/settings"
        },
        {
            "id": 2,
            "type": "user",
            "title": "New User Registration",
            "message": f"User registered at {datetime.utcnow().strftime('%H:%M')}",
            "priority": "low",
            "read": True,
            "created_at": (datetime.utcnow() - timedelta(hours=5)).isoformat(),
            "action_url": "/admin/users"
        },
        {
            "id": 3,
            "type": "warning",
            "title": "High Server Load",
            "message": "Server CPU usage above 80% for the last 15 minutes",
            "priority": "high",
            "read": False,
            "created_at": (datetime.utcnow() - timedelta(minutes=30)).isoformat(),
            "action_url": "/admin/monitoring"
        }
    ]
    
    if unread_only:
        notifications = [n for n in notifications if not n["read"]]
    
    return {
        "notifications": notifications[:limit],
        "total": len(notifications),
        "unread_count": len([n for n in notifications if not n["read"]])
    }


@app.get("/api/admin/analytics/user-locations")
async def get_user_locations(
    limit: int = 50,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """
    Get user locations by address.
    """
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    users = db.query(models.User).filter(
        models.User.address.isnot(None),
        models.User.address != "",
        models.User.address != "-"
    ).limit(limit).all()
    
    locations = []
    for user in users:
        locations.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "address": user.address,
            "pin_code": user.pin,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    
    return {
        "locations": locations,
        "total_locations": len(locations),
        "timestamp": datetime.utcnow().isoformat()
    }


# ==================== ADMIN CACHE CLEAR ENDPOINT ====================

@app.post("/api/admin/system/cache/clear")
async def clear_cache(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """
    Clear system cache.
    Admin access required.
    """
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # In a real system, you would clear cache here
    return {
        "message": "Cache cleared successfully",
        "timestamp": datetime.utcnow().isoformat(),
        "cleared_items": ["user_sessions", "search_results", "scraper_cache"]
    }


# ==================== ADMIN SINGLE SETTINGS ENDPOINT ====================

@app.put("/api/admin/settings")
async def update_admin_settings(
    settings: Dict[str, Any],
    db: Session = Depends(get_db),
    payload: dict = Depends(get_admin_payload)
):
    """
    Update admin settings (single endpoint).
    """
    if not check_admin_access(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    updated_settings = {}
    for key, value in settings.items():
        setting = crud.update_system_setting(db, key, str(value))
        updated_settings[key] = setting.value
    
    return {
        "message": "Settings updated successfully",
        "settings": updated_settings,
        "updated_at": datetime.utcnow().isoformat()
    }

# ==================== ERROR HANDLERS ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "code": exc.status_code,
            "message": exc.detail,
            "path": str(request.url.path),
            "timestamp": datetime.utcnow().isoformat()
        },
        headers=exc.headers or {}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    import traceback
    traceback.print_exc()
    
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "code": 500,
            "message": "Internal server error",
            "detail": str(exc),
            "path": str(request.url.path),
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# ==================== APPLICATION STARTUP ====================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5555))
    print(f"🚀 ShopThrone API Starting on port {port}...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=os.getenv("ENVIRONMENT", "development") == "development"
    )