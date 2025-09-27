import streamlit as st
import utils
import time

# --- Page Configuration ---
st.set_page_config(
    page_title="Compario - Sign Up",
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
    <h2 class="auth-title">Create Account</h2>
    <p class="auth-subtitle">Join thousands of smart shoppers today!</p>
</div>
""", unsafe_allow_html=True)

with st.form("signup_form"):
    name = st.text_input("Full Name", placeholder="Enter your full name")
    email = st.text_input("Email Address", placeholder="Enter your email")
    phone = st.text_input("Phone Number", placeholder="Enter 10-digit phone number")
    address = st.text_area("Shipping Address", placeholder="Enter your shipping address")
    password = st.text_input("Password", type="password", placeholder="Create a strong password")
    confirm_password = st.text_input("Confirm Password", type="password", placeholder="Confirm your password")

    # Display password requirements
    if password:
        reqs = utils.validate_password(password)
        req_html = "".join([
            f'<li><i class="fas fa-{"check" if met else "times"}" style="color: {"green" if met else "red"};"></i> {desc}</li>'
            for desc, met in [("At least 8 characters", reqs['length']), 
                               ("One uppercase letter", reqs['uppercase']),
                               ("One lowercase letter", reqs['lowercase']),
                               ("One number", reqs['digit']),
                               ("One special character", reqs['special'])]
        ])
        st.markdown(f'<div class="password-requirements"><ul>{req_html}</ul></div>', unsafe_allow_html=True)
        
    terms = st.checkbox("I agree to the Terms of Service and Privacy Policy")
    submitted = st.form_submit_button("Create Account", use_container_width=True, type="primary")

    if submitted:
        errors = []
        if not all([name, email, phone, address, password, confirm_password]):
            errors.append("Please fill in all fields.")
        if not utils.validate_name(name):
            errors.append("Please enter a valid name.")
        if not utils.validate_email(email):
            errors.append("Please enter a valid email address.")
        if not utils.validate_phone(phone):
            errors.append("Please enter a valid 10-digit phone number.")
        if password != confirm_password:
            errors.append("Passwords do not match.")
        if not utils.is_password_valid(password):
            errors.append("Password does not meet security requirements.")
        if not terms:
            errors.append("You must agree to the terms.")

        if errors:
            for error in errors:
                st.markdown(f'<p class="error-message">{error}</p>', unsafe_allow_html=True)
        else:
            user_data = {
                'name': name, 'email': email, 'phone': phone,
                'address': address, 'password': password
            }
            if utils.save_user_data(user_data):
                st.markdown('<p class="success-message">Account created successfully! Please sign in.</p>', unsafe_allow_html=True)
                time.sleep(2)
                st.switch_page("pages/signin.py")
            # Error for existing email is handled in save_user_data()

st.markdown("<hr>", unsafe_allow_html=True)
st.write("Already have an account?")
if st.button("Sign In", use_container_width=True):
    st.switch_page("pages/signin.py")

st.page_link("app.py", label="← Back to Home")
st.markdown('</div>', unsafe_allow_html=True)