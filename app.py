import streamlit as st
import utils # Import our new utils file
import time

# --- Page Configuration ---
st.set_page_config(
    page_title="Compario - Home",
    page_icon="logo.jpg",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# --- Load CSS and Initialize Database ---
utils.load_css()
utils.init_db()

# --- Initialize Cookie Manager and Session State ---
cookies = utils.get_cookie_manager()
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
if not cookies.ready():
    st.stop()

# --- Check for existing cookie ---
user_session = cookies.get('compario_session')
if user_session and not st.session_state.logged_in:
    st.session_state.logged_in = True
    st.session_state.email = user_session
    st.switch_page("pages/dashboard.py")

# --- Page Content ---

# --- Hero Section ---
st.markdown("""
<div class="hero-section">
    <h1 class="hero-title">Compario</h1>
    <p class="hero-subtitle">Find the best deals across all e-commerce platforms with intelligent price comparison.</p>
</div>
""", unsafe_allow_html=True)

# --- Features Section ---
st.markdown("""
<div class="features-section">
    <div style="max-width: 1200px; margin: 0 auto; padding: 0 2rem;">
        <h2 style="text-align: center; color: #2c3e50; margin-bottom: 3rem; font-size: 2.5rem;">Why Choose Compario?</h2>
    </div>
</div>
""", unsafe_allow_html=True)

col1, col2, col3 = st.columns(3)
with col1:
    st.markdown("""
    <div class="feature-card">
        <h3 class="feature-title">Lightning Fast</h3>
        <p class="feature-description">Get instant price comparisons in seconds.</p>
    </div>
    """, unsafe_allow_html=True)
with col2:
    st.markdown("""
    <div class="feature-card">
        <h3 class="feature-title">AI-Powered</h3>
        <p class="feature-description">Accurate product matching and real-time pricing.</p>
    </div>
    """, unsafe_allow_html=True)
with col3:
    st.markdown("""
    <div class="feature-card">
        <h3 class="feature-title">Maximum Savings</h3>
        <p class="feature-description">Save on every purchase with our intelligent deal finder.</p>
    </div>
    """, unsafe_allow_html=True)

# --- Call to Action Buttons ---
st.markdown("<br><br>", unsafe_allow_html=True)
_, mid_col, _ = st.columns([2, 1, 2])
with mid_col:
    if st.button("Get Started (Sign Up)", use_container_width=True, type="primary"):
        st.switch_page("pages/signup.py")
    
    if st.button("Sign In", use_container_width=True):
        st.switch_page("pages/signin.py")