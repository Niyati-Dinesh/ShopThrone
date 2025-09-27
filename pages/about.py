import streamlit as st
import utils
from PIL import Image

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

st.session_state.name = utils.get_user_name(st.session_state.email)

# --- Navigation Bar ---
st.markdown(f"""
<div class="nav-container">
    <div class="nav-header">
        <h1 class="nav-title">ℹ️About</h1>
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
