import streamlit as st
import utils
import time

# --- Page Configuration ---
st.set_page_config(
    page_title="Compario - Sign In",
    page_icon="logo.jpg",
    layout="wide",
)


# --- Load CSS ---
utils.load_css()


cookies = utils.get_cookie_manager()
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False

# This is a key change for the component to initialize.
if not cookies.ready():
    st.stop()

# --- Check for existing cookie ---
user_session = cookies.get('compario_session')
if user_session and not st.session_state.logged_in:
    st.session_state.logged_in = True
    # CORRECTED: The cookie now directly stores the email string
    st.session_state.email = user_session
    st.switch_page("pages/dashboard.py")


# --- Page Content ---
st.markdown('<div class="auth-container">', unsafe_allow_html=True)
st.markdown("""
<div class="auth-header">
    <h2 class="auth-title">Sign In</h2>
    <p class="auth-subtitle">Welcome back! Please sign in to your account.</p>
</div>
""", unsafe_allow_html=True)

with st.form("signin_form"):
    email = st.text_input("Email Address", placeholder="Enter your email")
    password = st.text_input("Password", type="password", placeholder="Enter your password")
    
    submitted = st.form_submit_button("Sign In", use_container_width=True, type="primary")

    if submitted:
        if not email or not password:
            st.markdown('<p class="error-message">Please fill in all fields.</p>', unsafe_allow_html=True)
        elif not utils.validate_email(email):
            st.markdown('<p class="error-message">Please enter a valid email address.</p>', unsafe_allow_html=True)
        else:
            if utils.check_user_data(email, password):
                st.session_state.logged_in = True
                st.session_state.email = email
                st.session_state.name = utils.get_user_name(email)
                # CORRECTED WAY TO SET THE COOKIE
                # The library doesn't support expiration dates directly in this call,
                # but it will set a session cookie.
                cookies['compario_session'] = email
                
                st.markdown('<p class="success-message">Sign in successful! Redirecting to dashboard...</p>', unsafe_allow_html=True)
                time.sleep(1)
                st.switch_page("pages/dashboard.py")
            else:
                st.markdown('<p class="error-message">Invalid email or password.</p>', unsafe_allow_html=True)


st.markdown("<hr>", unsafe_allow_html=True)
st.write("Don't have an account?")
if st.button("Create Account", use_container_width=True):
    st.switch_page("pages/signup.py")

st.page_link("app.py", label="← Back to Home")
st.markdown('</div>', unsafe_allow_html=True)