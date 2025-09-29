import streamlit as st
import utils
from PIL import Image

# --- Page Configuration ---
st.set_page_config(
    page_title="Compario - About",
    page_icon="logo.jpg",
    layout="wide",
)

# --- Load CSS and Get Cookies ---
utils.load_css()
cookies = utils.get_cookie_manager()
utils.init_session_state()

# --- Authentication Check ---
if not utils.is_logged_in(cookies):
    st.error("You must be logged in to view this page.")
    st.page_link("pages/signin.py", label="Go to Sign In")
    st.stop()



# --- Navigation Bar ---
st.markdown(f"""
<div class="nav-container">
    <div class="nav-header">
        <h1 class="nav-title">ℹ️ About</h1>
    </div>
</div>
""", unsafe_allow_html=True)

# Create navigation buttons
col1, col2, col3, col4 = st.columns([1, 1, 1, 1])

with col1:
    if st.button("Dashboard", use_container_width=True):
        st.switch_page("pages/dashboard.py")

with col2:
    if st.button("About", use_container_width=True):
        st.switch_page("pages/about.py")

with col3:
    if st.button("Profile", use_container_width=True):
        st.switch_page("pages/profile.py")

with col4:
    if st.button("Logout", use_container_width=True):
        utils.logout(cookies)
        st.rerun()

# --- Main Content ---
st.markdown("""
<div style="text-align: center; padding: 2rem 0;">
    <h1 style="color: #6366f1; font-size: 3rem; margin-bottom: 1rem;">🛍️ Compario</h1>
    <h3 style="color: #64748b; font-weight: 400;">AI-Powered Smart Shopping Assistant</h3>
</div>
""", unsafe_allow_html=True)

# Hero section with features
col1, col2, col3 = st.columns([1, 2, 1])

with col2:
    st.markdown("""
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                border-radius: 20px; padding: 2rem; text-align: center; color: white; margin: 2rem 0;">
        <h2>📸 Snap. Identify. Compare. Save.</h2>
        <p style="font-size: 1.2rem; margin-top: 1rem;">
            Upload any product image and let our AI find the best deals across the web
        </p>
    </div>
    """, unsafe_allow_html=True)

# How it works section
st.markdown("## How Compario Works:")

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown("""
    <div style="text-align: center; padding: 1rem;">
        <div style="background: #f0f9ff; border-radius: 50%; width: 80px; height: 80px; 
                    display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
            <span style="font-size: 2rem;">📱</span>
        </div>
        <h4>1. Upload Image</h4>
        <p style="color: #64748b;">Take or upload a photo of any product you want to buy</p>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div style="text-align: center; padding: 1rem;">
        <div style="background: #f0fdf4; border-radius: 50%; width: 80px; height: 80px; 
                    display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
            <span style="font-size: 2rem;">💻</span>
        </div>
        <h4>2. AI Analysis</h4>
        <p style="color: #64748b;">Our AI identifies the product and extracts key details</p>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown("""
    <div style="text-align: center; padding: 1rem;">
        <div style="background: #fef7ff; border-radius: 50%; width: 80px; height: 80px; 
                    display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
            <span style="font-size: 2rem;">🔍</span>
        </div>
        <h4>3. Smart Search</h4>
        <p style="color: #64748b;">We search across multiple e-commerce platforms</p>
    </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown("""
    <div style="text-align: center; padding: 1rem;">
        <div style="background: #fffbeb; border-radius: 50%; width: 80px; height: 80px; 
                    display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
            <span style="font-size: 2rem;">💰</span>
        </div>
        <h4>4. Best Deals</h4>
        <p style="color: #64748b;">Get the best prices and deals delivered to you</p>
    </div>
    """, unsafe_allow_html=True)

st.markdown("---")

# Footer
st.markdown("""
<div style="text-align: center; padding: 2rem 0; color: #64748b;">
    <h3>Ready to start saving money? 🎉</h3>
    <p>Upload your first product image and discover amazing deals!</p>
</div>
""", unsafe_allow_html=True)

# Call to action
col1, col2, col3 = st.columns([1, 1, 1])
with col2:
    if st.button("🚀 Start Shopping Smart", use_container_width=True, type="primary"):
        st.switch_page("pages/dashboard.py")