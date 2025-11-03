import re
import time
import tempfile
import os
import shutil
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager

PLACEHOLDER_IMAGE = "https://placehold.co/300x400/EEE/31343C?text=No+Image"

def clean_price_text(price_text: str) -> int:
    """Extracts integer rupee value from text."""
    if not price_text:
        return 0
    m = re.search(r'[\d,]+', str(price_text).replace('₹','').replace('Rs','').replace(' ',''))
    if m:
        return int(m.group(0).replace(',', ''))
    return 0

def setup_driver(headless=True):
    """Setup Chrome driver with UNIQUE user data directory"""
    chrome_options = Options()
    
    temp_dir = tempfile.mkdtemp(prefix="chrome_snapdeal_")
    chrome_options.add_argument(f"--user-data-dir={temp_dir}")
    
    if headless:
        chrome_options.add_argument('--headless=new')
    
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_experimental_option("prefs", {"profile.default_content_setting_values.notifications": 2})
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    driver.temp_dir = temp_dir  
    
    return driver

def get_element_text(driver, selectors, default="N/A"):
    """Try multiple selectors and return text of first found element."""
    for selector in selectors:
        try:
            element = driver.find_element(By.CSS_SELECTOR, selector)
            text = element.text.strip()
            if text:
                return text
        except:
            continue
    return default

def get_element_attribute(driver, selectors, attribute, default=""):
    """Try multiple selectors and return attribute of first found element."""
    for selector in selectors:
        try:
            element = driver.find_element(By.CSS_SELECTOR, selector)
            attr = element.get_attribute(attribute)
            if attr:
                return attr
        except:
            continue
    return default

def enter_pincode_snapdeal(driver, pincode: str):
    """Enter pincode on Snapdeal product page."""
    print(f"📍 Setting pincode to {pincode}...")
    time.sleep(2)
    
   
    try:
        pincode_input = WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.ID, "pincode"))
        )
        if pincode_input.is_displayed():
            pincode_input.clear()
            pincode_input.send_keys(pincode)
            time.sleep(1)
            
            try:
                check_btn = driver.find_element(By.ID, "checkServiceability")
                check_btn.click()
                print(f"   ✓ Pincode set successfully")
                time.sleep(3)
                return True
            except:
                pass
    except:
        pass
    
    try:
        driver.execute_script(f"""
            var input = document.getElementById('pincode');
            if(input) {{
                input.value = '{pincode}';
                input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                input.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }}
        """)
        time.sleep(1)
        driver.execute_script("""
            var btn = document.getElementById('checkServiceability');
            if(btn) btn.click();
        """)
        print(f"   ✓ Pincode set via JavaScript")
        time.sleep(4)
        return True
    except:
        pass
    
    try:
        delivery_elements = driver.find_elements(By.XPATH, 
            "//*[contains(text(), 'Delivery') or contains(text(), 'Check') or contains(text(), 'Pincode')]")
        for elem in delivery_elements[:3]:
            try:
                if elem.is_displayed():
                    driver.execute_script("arguments[0].scrollIntoView(true);", elem)
                    time.sleep(1)
                    elem.click()
                    time.sleep(2)
                    
                    pincode_input = driver.find_element(By.ID, "pincode")
                    pincode_input.clear()
                    pincode_input.send_keys(pincode)
                    time.sleep(1)
                    
                    check_btn = driver.find_element(By.ID, "checkServiceability")
                    check_btn.click()
                    print(f"   ✓ Pincode set after clicking delivery section")
                    time.sleep(4)
                    return True
            except:
                continue
    except:
        pass
    
    print("   ⚠️  Could not set pincode")
    return False

def extract_delivery_info(driver, pincode_entered=False):
    """Extract delivery information from product page."""
    delivery_info = {
        'delivery_date': None,
        'delivery_text': None
    }
    
    time.sleep(2)
    
    try:
        # Get page text for regex matching
        page_text = driver.find_element(By.TAG_NAME, "body").text
        
        # Pattern 1: "Delivery by DD Month" or "Delivered by DD Month"
        match = re.search(r'Deliver(?:ed|y) by\s+(\d{1,2}\s+\w{3,}(?:\s+\d{4})?)', page_text, re.IGNORECASE)
        if match:
            delivery_info['delivery_date'] = match.group(1)
            delivery_info['delivery_text'] = match.group(0)
            return delivery_info
        
        # Pattern 2: "Generally delivered in X - Y days"
        match = re.search(r'Generally delivered in\s+(\d+\s*-\s*\d+\s+days?)', page_text, re.IGNORECASE)
        if match:
            delivery_info['delivery_date'] = match.group(1)
            delivery_info['delivery_text'] = f"Generally delivered in {match.group(1)}"
            return delivery_info
        
        # Pattern 3: "Get it by [date]"
        match = re.search(r'Get it by\s+(\d{1,2}\s+\w{3,}(?:\s+\d{4})?)', page_text, re.IGNORECASE)
        if match:
            delivery_info['delivery_date'] = match.group(1)
            delivery_info['delivery_text'] = match.group(0)
            return delivery_info
        
        # Pattern 4: Look for dates in delivery context
        match = re.search(r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{0,4})', 
                         page_text, re.IGNORECASE)
        if match:
            context_start = max(0, match.start() - 40)
            context_end = min(len(page_text), match.end() + 40)
            context = page_text[context_start:context_end].lower()
            
            if any(word in context for word in ['deliver', 'dispatch', 'ship', 'get it', 'expected']):
                delivery_info['delivery_date'] = match.group(1)
                delivery_info['delivery_text'] = f"Expected by {match.group(1)}"
                return delivery_info
        
        # If pincode was entered but no specific date found
        if pincode_entered:
            match = re.search(r'(available for delivery|can be delivered|delivery available)', 
                            page_text, re.IGNORECASE)
            if match:
                delivery_info['delivery_date'] = "Delivery available"
                delivery_info['delivery_text'] = "Product available for delivery to your pincode"
                return delivery_info
        
    except Exception as e:
        print(f"   ⚠️  Error extracting delivery: {e}")
    
    return delivery_info

def get_snapdeal_product_details(driver, product_url: str, pincode: str = None):
    """Fetches detailed information from Snapdeal product page."""
    try:
        driver.get(product_url)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        time.sleep(3)
        
        details = {}
        
        # Enter pincode if provided
        pincode_entered = False
        if pincode:
            pincode_entered = enter_pincode_snapdeal(driver, pincode)
            time.sleep(2)
        
        # Title
        title_selectors = ["h1.pdp-e-i-head", "h1[itemprop='name']", "h1.product-title", "h1"]
        details['title'] = get_element_text(driver, title_selectors, "No title found")
        
        # Image
        image_selectors = ["img.cloudzoom", "img[itemprop='image']", "img.product-image", "img.pdpCarouselImg"]
        details['image'] = get_element_attribute(driver, image_selectors, 'src', PLACEHOLDER_IMAGE)
        
        # Rating
        rating_selectors = ["span[itemprop='ratingValue']", "span.avrg-rating", "div.rating-value"]
        details['rating'] = get_element_text(driver, rating_selectors, "No rating")
        
        # Reviews
        review_selectors = ["span[itemprop='ratingCount']", "span.total-rating", "span.review-count"]
        review_text = get_element_text(driver, review_selectors, "0")
        match = re.search(r'(\d+)', review_text.replace(',', ''))
        details['reviews'] = match.group(1) if match else "0"
        
        # Delivery information
        delivery_info = extract_delivery_info(driver, pincode_entered)
        if delivery_info['delivery_date']:
            details['delivery_date'] = delivery_info['delivery_date']
            details['delivery_text'] = delivery_info['delivery_text']
        else:
            details['delivery_date'] = "Check on website"
            details['delivery_text'] = "Enter pincode on website for delivery info"
        
        # Price
        price_selectors = ["span.pdp-final-price", "span.payBlkBig", "span[itemprop='price']", "span.lfloat.product-price"]
        price_text = get_element_text(driver, price_selectors, "0")
        details['price'] = clean_price_text(price_text)
        
        # Original price
        mrp_selectors = ["span.pdp-mrp", "span.lfloat.markedPrice", "span.strikedPriceText"]
        mrp_text = get_element_text(driver, mrp_selectors, "0")
        details['original_price'] = clean_price_text(mrp_text)
        
        # Discount
        discount_selectors = ["span.percent-desc", "div.percent-desc", "span.pdp-discount"]
        details['discount'] = get_element_text(driver, discount_selectors, "No discount")
        
        # Seller
        seller_selectors = ["div.seller-name", "a.seller-link", "span[itemprop='seller']"]
        details['seller'] = get_element_text(driver, seller_selectors, "N/A")
        
        # Stock status
        try:
            add_to_cart = driver.find_element(By.CSS_SELECTOR, "div#add-cart-button-id, button.buy-button")
            details['in_stock'] = add_to_cart.is_displayed() and add_to_cart.is_enabled()
        except:
            details['in_stock'] = False
        
        return details
        
    except Exception as e:
        print(f"   ❌ Error fetching details: {e}")
        return None

def scrape_snapdeal(query: str, pincode: str = None, headless: bool = True):
    """Scrape Snapdeal for lowest priced product."""
    driver = None
    try:
        print("\n" + "="*60)
        print("🔍 SNAPDEAL SCRAPER")
        print("="*60)
        print(f"Search: {query}")
        if pincode:
            print(f"Pincode: {pincode}")
        print()
        
        driver = setup_driver(headless=headless)
        
        search_url = f"https://www.snapdeal.com/search?keyword={query.replace(' ', '+')}"
        print(f"🔍 Searching Snapdeal...")
        
        driver.get(search_url)
        
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        time.sleep(4)
        
        # Scroll to load products
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight/3);")
        time.sleep(2)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
        time.sleep(2)
        
        products = []
        seen_urls = set()
        
        # Find product containers
        product_containers = driver.find_elements(By.XPATH, 
            "//div[contains(@class, 'col') and .//a[contains(@href, '/product/')]]")
        
        print(f"📦 Found {len(product_containers)} product containers\n")
        
        for container in product_containers[:50]:
            try:
                # Get product link
                link = container.find_element(By.XPATH, ".//a[contains(@href, '/product/')]")
                href = link.get_attribute('href')
                
                if not href or href in seen_urls:
                    continue
                
                seen_urls.add(href)
                
                # Get title
                title = ""
                try:
                    title = link.text.strip()
                    if not title:
                        text_elems = container.find_elements(By.XPATH, ".//p | .//div[string-length(text()) > 10]")
                        for elem in text_elems:
                            text = elem.text.strip()
                            if text and '₹' not in text and len(text) > 10:
                                title = text
                                break
                except:
                    pass
                
                # Get price - Look for ₹ symbol
                price = 0
                try:
                    price_elements = container.find_elements(By.XPATH, ".//*[contains(text(), '₹') or contains(text(), 'Rs')]")
                    for price_elem in price_elements:
                        price_text = price_elem.text.strip()
                        temp_price = clean_price_text(price_text)
                        if temp_price > 100:  # Valid price
                            price = temp_price
                            break
                except:
                    pass
                
                if price > 100:  # Valid product found
                    if not title:
                        title = f"Product at ₹{price}"
                    
                    products.append({
                        "price": price,
                        "url": href,
                        "preview_title": title
                    })
                    print(f"   ✓ Found: ₹{price:,} - {title[:50]}...")
                    
            except Exception as e:
                continue
        
        if not products:
            print("❌ No products found")
            return None
        
        print(f"\n📊 Total products found: {len(products)}")
        print(f"📦 Finding lowest price...\n")
        
        # Remove duplicates and sort by price
        unique_products = {p['url']: p for p in products}.values()
        sorted_products = sorted(unique_products, key=lambda x: x['price'])
        
        # Get details of lowest priced product
        lowest = sorted_products[0]
        print(f"💰 Lowest price: ₹{lowest['price']:,}")
        print(f"🔗 URL: {lowest['url'][:60]}...\n")
        
        details = get_snapdeal_product_details(driver, lowest['url'], pincode)
        
        if details:
            details['url'] = lowest['url']
            return details
        
        return None
        
    except TimeoutException:
        print("❌ Timeout: Page took too long to load")
        return None
    except Exception as e:
        print(f"❌ Scraping error: {e}")
        import traceback
        traceback.print_exc()
        return None
    
    finally:
        if driver:
            try:
                temp_dir = getattr(driver, 'temp_dir', None)
                driver.quit()
                if temp_dir and os.path.exists(temp_dir):
                    time.sleep(0.5)
                    shutil.rmtree(temp_dir, ignore_errors=True)
            except:
                pass

if __name__ == "__main__":
    import json
    result = scrape_snapdeal(query="wireless mouse", pincode="688524", headless=True)
    print(json.dumps(result, indent=4, ensure_ascii=False))