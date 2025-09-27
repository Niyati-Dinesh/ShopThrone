import streamlit as st
import re
import psycopg2 as sql
import hashlib
import datetime
from streamlit_cookies_manager import EncryptedCookieManager
from psycopg2 import Binary
from PIL import Image
from transformers import ViTForImageClassification, ViTImageProcessor
from datasets import load_dataset #pip
from transformers import pipeline
# --- DATABASE AND HASHING FUNCTIONS ---

def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    try:
        con = sql.connect(
            host="localhost",
            database="compario",
            user="postgres",
            password="hello", # NOTE: Use environment variables for credentials in production
            port=5432
        )
        return con
    except sql.OperationalError as e:
        st.error(f"Error connecting to database: {e}")
        return None

def init_db():
    """Initializes the database and creates the users table if it doesn't exist."""
    # Connect to default DB to create 'compario' if it doesn't exist
    try:
        con_default = sql.connect(host="localhost", database="postgres", user="postgres", password="hello", port=5432)
        con_default.autocommit = True
        cur_default = con_default.cursor()
        cur_default.execute("SELECT 1 FROM pg_database WHERE datname='compario'")
        if not cur_default.fetchone():
            cur_default.execute("CREATE DATABASE compario")
        cur_default.close()
        con_default.close()
    except Exception as e:
        # This might fail if user doesn't have CREATE DB permissions, but we can proceed
        print(f"Could not check/create database: {e}")


    con = get_db_connection()
    if con:
        cur = con.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users(
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(100) UNIQUE,
                phone VARCHAR(15),
                address TEXT,
                password TEXT,
                date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        con.commit()
        cur.close()
        con.close()

def hash_password(password):
    """Hashes the password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()

def save_user_data(data):
    """Saves new user data to the database."""
    con = get_db_connection()
    if not con: return False
    
    cur = con.cursor()
    hashed_password = hash_password(data['password'])
    try:
        cur.execute(
            "INSERT INTO users(name, email, phone, address, password) VALUES (%s, %s, %s, %s, %s)",
            (data['name'], data['email'], data['phone'], data['address'], hashed_password)
        )
        con.commit()
        return True
    except sql.IntegrityError: # This happens if the email is already registered (UNIQUE constraint)
        st.error("An account with this email already exists.")
        return False
    finally:
        cur.close()
        con.close()

def check_user_data(email, password):
    """Checks if a user exists with the given email and password."""
    con = get_db_connection()
    if not con: return False
    
    cur = con.cursor()
    hashed_password = hash_password(password)
    cur.execute("SELECT * FROM users WHERE email=%s AND password=%s", (email, hashed_password))
    result = cur.fetchone()
    cur.close()
    con.close()
    return result is not None

def get_user_name(email):
    con = get_db_connection()
    cursor = con.cursor()
    cursor.execute("SELECT name FROM users WHERE email = %s", (email,))
    result = cursor.fetchone()
    cursor.close()
    con.close()
    return result[0] if result else ''


# --- INPUT VALIDATION FUNCTIONS ---

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email)

def validate_password(password):
    """Returns a dictionary of password requirement statuses."""
    requirements = {
        'length': len(password) >= 8,
        'uppercase': bool(re.search(r'[A-Z]', password)),
        'lowercase': bool(re.search(r'[a-z]', password)),
        'digit': bool(re.search(r'\d', password)),
        'special': bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password)),
    }
    return requirements

def is_password_valid(password):
    """Checks if all password requirements are met."""
    return all(validate_password(password).values())

def validate_phone(phone):
    return len(phone) == 10 and phone.isdigit()

def validate_name(name):
    return len(name.strip()) >= 2 and all(c.isalpha() or c.isspace() for c in name)

# ------------ SESSION FUNCTIONS ---

def load_css():
    """Loads the CSS file for styling the app."""
    try:
        with open("style.css") as f:
            st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)
    except FileNotFoundError:
        st.error("style.css file not found. Please make sure it's in the same directory.")

def get_cookie_manager():
    """Initializes and returns the cookie manager."""
    cookies = EncryptedCookieManager(
        password="super_secret_password_for_cookies",
    )
    return cookies

def init_session_state():
    defaults = {
        "logged_in": False,
        "email": "",
        "name": "",
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def is_logged_in(cookies):
    session_cookie = cookies.get("compario_session")
    return st.session_state.get("logged_in", False) or (
        session_cookie is not None and session_cookie != "None"
    )


def logout(cookies):
    st.session_state.logged_in = False
    st.session_state.email = ""

    if "compario_session" in cookies:
        del cookies["compario_session"]   # properly delete cookie
        cookies.save()

    st.success("You have been logged out.")
    st.rerun()


#---------------------CLASSIFICATIONS---------------------
def save_image(image, email):
    """Saves the uploaded image to the database, linked to a user by email."""
    
    
    con = get_db_connection()
    cursor = con.cursor()

    # Create table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS images (
            id SERIAL PRIMARY KEY,
            uid INTEGER REFERENCES users(id),
            image BYTEA,
            date_uploaded TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Get user ID from email
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    if not user:
        cursor.close()
        con.close()
        return False  # No user found

    uid = user[0]

    # Read file as bytes
    image_bytes = image.read()

    # Insert into table
    cursor.execute(
        "INSERT INTO images (uid, image) VALUES (%s, %s)",
        (uid, Binary(image_bytes))
    )

    con.commit()
    cursor.close()
    con.close()
    return True


def analyze_image(image):
    clf=pipeline("image-classification", model="google/vit-base-patch16-224")
    if image is not None:
        image=Image.open(image)
        preds=clf(image)
        return preds
    