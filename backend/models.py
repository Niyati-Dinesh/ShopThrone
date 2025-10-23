from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base
from datetime import datetime

# --- User Model ---
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
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


    # relationship to ImageSearch
    searches = relationship("ImageSearch", back_populates="user", cascade="all, delete-orphan")


# --- ImageSearch Model ---
class ImageSearch(Base):
    __tablename__ = "image_searches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_data = Column(LargeBinary, nullable=True)
    predicted_product = Column(String, nullable=False)
    amazon_price = Column(Float, nullable=True)
    flipkart_price = Column(Float, nullable=True)
    snapdeal_price = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # back reference to User
    user = relationship("User", back_populates="searches")
