import streamlit as st
import utils
from PIL import Image
import recogonition 
# --- Page Configuration ---
st.set_page_config(
    page_title="Compario - Dashboard",
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

st.session_state.name = utils.get_user_info(cookies.get("compario_session"))[0]

# --- Navigation Bar ---
st.markdown(f"""
<div class="nav-container">
    <div class="nav-header">
        <h1 class="nav-title">Compario</h1>
    </div>
</div>
""", unsafe_allow_html=True)

# Create navigation buttons
col1, col2, col3, col4 = st.columns([1, 1, 1, 1])

with col1:
    if st.button("Dashboard", use_container_width=True):
        st.rerun()

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

# --- Welcome Section ---
st.markdown(f"""
<div class="welcome-section">
    <h1 class="welcome-title">Welcome {st.session_state['name']}! </h1>
    <p class="welcome-subtitle">Your next great deal is just a picture away. Upload an image and discover the best prices across the web.</p>
</div>
""", unsafe_allow_html=True)

# --- Quick Stats ---
st.markdown("""
<div class="stats-container">
    <div class="stat-card">
        <div class="stat-number">1,247</div>
        <div class="stat-label">Products Analyzed Today</div>
    </div>
    <div class="stat-card">
        <div class="stat-number">$47.50</div>
        <div class="stat-label">Average Savings</div>
    </div>
    <div class="stat-card">
        <div class="stat-number">97.8%</div>
        <div class="stat-label">Success Rate</div>
    </div>
    <div class="stat-card">
        <div class="stat-number">2.3s</div>
        <div class="stat-label">Avg Response Time</div>
    </div>
</div>
""", unsafe_allow_html=True)

# --- Main Content Area ---
col1, col2 = st.columns([2, 1])

with col1:
    # --- Image Upload Section ---
    uploaded_file = st.file_uploader(
        "",
        type=["jpg", "jpeg", "png", "webp"],
        help="Supported formats: JPG, JPEG, PNG, WEBP (Max size: 10MB)"
    )

    if uploaded_file is not None:
   
        st.image(uploaded_file, caption="Your uploaded image.", width=250)
        if st.button("Analyze Image", type="primary", use_container_width=True):
            try:
                if utils.save_image(uploaded_file, cookies.get('compario_session')):
                    st.success("🎉 Image saved to your history.")
                with st.spinner("🤖 Analyzing image..."):
                   
                    prediction = utils.analyze_image(uploaded_file)
                    st.write("### Analysis Results:")
                    for pred in prediction:
                        st.success(f"✅ Detected: {pred['label']} with confidence {round(pred['score']*100,2)}%")

            except Exception as e:
                st.error(f"❌ Error processing image: {e}")

