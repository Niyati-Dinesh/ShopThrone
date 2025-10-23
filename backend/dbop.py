from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

# Use correct relative imports
import models
import schema as schemas
import auth

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
    Finds an existing search record by its ID and the user who owns it.
    Updates the price fields.
    """
    # Find the search ensuring it belongs to the current user for security
    db_search = db.query(models.ImageSearch).filter(
        models.ImageSearch.id == search_id,
        models.ImageSearch.user_id == user_id
    ).first()

    if not db_search:
        return None # Not found or doesn't belong to this user

    # Update prices
    db_search.amazon_price = deals.get("amazon_price")
    db_search.flipkart_price = deals.get("flipkart_price")
    db_search.snapdeal_price = deals.get("snapdeal_price")
    
    db.commit()
    db.refresh(db_search)
    return db_search