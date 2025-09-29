import streamlit as st
import utils
from PIL import Image
from io import BytesIO
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

st.session_state.name = utils.get_user_info(st.session_state.email)

# --- Navigation Bar ---
st.markdown(f"""
<div class="nav-container">
    <div class="nav-header">
        <h1 class="nav-title">👤Profile</h1>
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

info=utils.get_user_info(cookies.get('compario_session'))
name,email,phone,address,age,gender=info
st.markdown(f"""
<div class="profile-card">
    <div class="profile-header">
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="profile-avatar" />
        <h2>{name}</h2>
        <p>{email}</p>
    </div>
    <div class="profile-info">
        <p><strong>📞 Phone:</strong> {phone}</p>
        <p><strong>🏠 Address:</strong> {address}</p>
        <p><strong>👤 Gender:</strong> {gender}</p>
        <p><strong>🔢 Age:</strong> {age}</p>
    </div>
</div>
""", unsafe_allow_html=True)

st.markdown("### 🖼️ Your Upload History")

history = utils.get_user_images(email)  # Fetch last 5 images

if history:
    cols = st.columns(5)
    for idx, img_bytes in enumerate(history):
        with cols[idx % 5]:
            try:
                if img_bytes and len(img_bytes) > 0:
                    # Convert bytes -> PIL Image
                    img = Image.open(BytesIO(img_bytes))
                    st.image(img, width=100, caption=f"{idx+1}")
                else:
                    st.warning(f"Image {idx+1}: Empty data")
            except Exception as e:
                st.error(f"Image {idx+1}: Cannot load ({str(e)[:50]})")
else:
    st.info("No images uploaded yet.")

