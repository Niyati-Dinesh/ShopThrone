from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import base64
from datetime import timedelta
from typing import List, Optional # <-- ADDED Optional
from fastapi.security import OAuth2PasswordRequestForm

# Use correct file names for imports
import dbop as crud
import models
import schema as schemas
import auth
import transformer as ai_model
from db import engine, get_db

# Import the *real* scraper function
from price_fetcher import get_top_deals_from_each_site # <-- This file is correct

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS Middleware
origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/api/users/signup", response_model=schemas.UserInDB)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/api/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Use form_data.username as the email
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(
        data={"sub": user.email}
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --- SEARCH & SCRAPING ENDPOINTS ---

@app.post("/api/search/image", response_model=schemas.ImageSearchCreateResponse)
async def search_by_image(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Step 1: Upload image, get AI prediction, and save the initial search.
    Returns the prediction and a search_id to be used in Step 2.
    """
    try:
        image_bytes = await file.read()
        predictions = ai_model.analyze_image_from_bytes(image_bytes)
        if not predictions:
             raise HTTPException(status_code=500, detail="Could not analyze image")
        
        main_prediction = predictions[0]['label'].split(',')[0].strip()

        # Create the initial search entry in the database
        search_data = schemas.ImageSearchCreate(
            user_id=current_user.id,
            image_data=image_bytes,
            predicted_product=main_prediction
            # Prices are left as NULL for now
        )
        db_search = crud.create_image_search(db=db, search=search_data)
        
        return {"predicted_item": main_prediction, "search_id": db_search.id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.get("/api/search/deals") # <-- FIX: Removed response_model
async def get_deals(
    product: str,    # Query parameter: ?product=...
    search_id: int,  # Query parameter: ?search_id=...
    pincode: Optional[str] = None, # <-- FIX 1: Accept the pincode
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Step 2: Take the product string, search_id, and optional pincode.
    Scrape prices, UPDATE the database record, and return the 
    complete scraper data dictionary.
    """
    # Use the user's pincode from their profile if not provided in the query
    user_pincode = current_user.pin if current_user else None
    pincode_to_use = pincode if pincode else user_pincode
    
    print(f"🔍 Received request - Product: {product}, Search ID: {search_id}, Pincode: {pincode_to_use}, User: {current_user.email}")
    
    if not product:
        raise HTTPException(status_code=400, detail="Product name cannot be empty")
    
    try:
        # --- THIS IS THE SLOW PART (SCRAPING) ---
        # 'deals' is a DICTIONARY: {"amazon": {...}, "flipkart": {...}, "snapdeal": {...}}
        deals = get_top_deals_from_each_site(product, pincode=pincode_to_use) # <-- FIX 2: Pass pincode

        # --- FIX 3: Correctly parse the dictionary ---
        # No loop needed. Access keys directly.
        deals_to_save = {
            "amazon_price": deals.get("amazon", {}).get('price') if deals.get("amazon") else None,
            "flipkart_price": deals.get("flipkart", {}).get('price') if deals.get("flipkart") else None,
            "snapdeal_price": deals.get("snapdeal", {}).get('price') if deals.get("snapdeal") else None,
        }
        
        # Update the DB entry with the new prices
        updated_search = crud.update_image_search_prices(
            db=db, 
            search_id=search_id, 
            user_id=current_user.id, 
            deals=deals_to_save
        )

        if not updated_search:
            raise HTTPException(status_code=404, detail="Search record not found or user mismatch")

        # --- FIX 4: Return the FULL deals dictionary ---
        # This is what the frontend Dashboard.js expects.
        return deals

    except Exception as e:
        print(f"💥 Unhandled Error in get_deals: {str(e)}") # Added better logging
        raise HTTPException(status_code=500, detail=f"Error fetching deals: {str(e)}")

    
@app.get("/api/users/me", response_model=schemas.UserInDB)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.get("/api/users/my-searches", response_model=List[schemas.ImageSearch])
def get_my_searches(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns all searches for the current user with image data encoded as base64.
    """
    searches = crud.get_image_searches_by_user(db, user_id=current_user.id)
    
    # Convert each search to include base64 encoded image
    result = []
    for search in searches:
        result.append(schemas.ImageSearch(
            id=search.id,
            user_id=search.user_id,
            predicted_product=search.predicted_product,
            amazon_price=search.amazon_price,
            flipkart_price=search.flipkart_price,
            snapdeal_price=search.snapdeal_price,
            created_at=search.created_at,
            image_data=base64.b64encode(search.image_data).decode('utf-8') if search.image_data else None
        ))
    
    return result


@app.get("/")
def read_root():
    return {"message": "Welcome to the Compario API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)