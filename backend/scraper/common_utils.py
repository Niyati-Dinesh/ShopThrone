# common_utils.py
import re
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

PLACEHOLDER_IMAGE = "https://placehold.co/300x400/EEE/31343C?text=No+Image"

def clean_price_text(price_text: str) -> int:
    if not price_text:
        return 0
    s = str(price_text)
    m = re.search(r'([\d,]+\.?\d*)', s)
    if not m:
        return 0
    try:
        return int(float(m.group(1).replace(',', '')))
    except:
        try:
            return int(m.group(1).replace(',', ''))
        except:
            return 0

def setup_driver(headless=True, user_agent=None):
    chrome_options = Options()
    if headless:
        chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--disable-gpu')
    ua = user_agent or ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
    chrome_options.add_argument(f'--user-agent={ua}')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_experimental_option("prefs", {"profile.default_content_setting_values.notifications": 2})
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    try:
        driver.execute_cdp_cmd('Network.setUserAgentOverride', {"userAgent": ua})
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    except Exception:
        pass
    return driver

def make_empty_details(product_url: str):
    return {
        "url": product_url,
        "title": "",
        "price": 0,
        "original_price": 0,
        "discount": "",
        "rating": 0.0,
        "review_count": 0,
        "image": PLACEHOLDER_IMAGE,
        "images": [],
        "delivery_date": "",
        "delivery_info": "",
        "availability": "",
        "brand": "",
        "description": "",
        "features": [],
        "specifications": {},
        "seller": "",
        "in_stock": False
    }
