import re
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
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
    """Setup Chrome driver."""
    chrome_options = Options()
    
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
    
    return driver

def set_pincode(driver, pincode):
    """Set delivery pincode on Flipkart."""
    try:
        print(f"📍 Setting pincode to {pincode}...")
    
        pincode_selectors = [
            "div._2P_LDn input",
            "input[placeholder*='pincode']",
            "input[placeholder*='Pincode']",
            "input[type='text'][maxlength='6']"
        ]
        
        for selector in pincode_selectors:
            try:
                pincode_input = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                pincode_input.clear()
                pincode_input.send_keys(pincode)
                time.sleep(1)
                
                # Try to find and click submit/check button
                try:
                    check_btn = driver.find_element(By.XPATH, "//span[contains(text(), 'Check')] | //button[contains(text(), 'Change')]")
                    check_btn.click()
                    time.sleep(2)
                    print(f"   ✓ Pincode {pincode} set successfully")
                    return True
                except:
                    pass
            except:
                continue
        
        print(f"   ⚠️  Could not set pincode automatically")
        return False
    except Exception as e:
        print(f"   ⚠️  Pincode setting error: {e}")
        return False

def is_accessory_or_related(title: str, original_query: str) -> bool:
    """Check if a product is an accessory."""
    title_lower = title.lower()
    query_lower = original_query.lower()
    
    accessory_keywords = [
        'pad', 'mat', 'case', 'cover', 'cable', 'wire', 'adapter', 'charger',
        'stand', 'holder', 'mount', 'dock', 'pouch', 'bag', 'sleeve', 'skin',
        'protector', 'guard', 'film', 'glass', 'screen guard', 'tempered glass',
        'strap', 'band', 'hook', 'clip', 'bracket', 'arm', 'extension',
        'converter', 'splitter', 'hub', 'dongle', 'receiver only', 'transmitter',
        'battery only', 'power bank', 'cleaning', 'cleaner', 'kit only', 'tool',
        'spare', 'replacement part', 'accessory', 'combo pack', 'bundle pack',
        'sticker', 'decal', 'organizer', 'container', 'box only', 'insole'
    ]
    
    for keyword in accessory_keywords:
        if keyword in title_lower:
            return True
    
    return False

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

def get_product_details(driver, product_url: str, pincode: str = None):
    """Fetches detailed information from the product page."""
    try:
        driver.get(product_url)
        
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        time.sleep(3)
        
        # Set pincode if provided
        if pincode:
            set_pincode(driver, pincode)
            time.sleep(2)
        
        details = {}
        
        # Title - Updated selectors
        title_selectors = ["span.VU-ZEz", "h1.yhB1nd", "span.B_NuCI", "h1", "span._35KyD6"]
        details['title'] = get_element_text(driver, title_selectors, "No title found")
        
        # Image - Updated selectors
        image_selectors = ["img._0DkuPH", "img._396cs4", "img._2r_T1I", "img._53J4C-"]
        details['image'] = get_element_attribute(driver, image_selectors, 'src', PLACEHOLDER_IMAGE)
        
        # Price - Updated selectors for current Flipkart structure
        price_selectors = ["div.Nx9bqj", "div._30jeqj", "div._16Jk6d", "div._25b18c"]
        price_text = get_element_text(driver, price_selectors, "0")
        details['price'] = clean_price_text(price_text)
        
        # Rating - Updated selectors
        rating_selectors = ["div.XQDdHH", "div._3LWZlK", "span._1lRcqv"]
        details['rating'] = get_element_text(driver, rating_selectors, "No rating")
        
        # Reviews - Updated selectors
        review_selectors = ["span.Wphh3N", "span._2_R_DZ", "span._13vcmD", "span._2_R_DZ"]
        review_text = get_element_text(driver, review_selectors, "0")
        details['reviews'] = review_text.split()[0] if review_text else "0"
        
        # Delivery - Multiple strategies
        delivery_found = False
        
        # Strategy 1: Look for delivery date text
        try:
            delivery_elements = driver.find_elements(By.XPATH, 
                "//*[contains(text(), 'Delivery by') or contains(text(), 'Get it by') or contains(text(), 'delivery')]")
            for elem in delivery_elements:
                text = elem.text.strip()+" "
                if text and any(month in text for month in ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']):
                    details['delivery_date'] = text.replace('?', '').split('\n')[0]
                    delivery_found = True
                    break
        except:
            pass
        
        # Strategy 2: Look in delivery section
        if not delivery_found:
            try:
                delivery_section = driver.find_element(By.XPATH, "//div[contains(@class, 'delivery') or contains(@class, 'Delivery')]")
                delivery_text = delivery_section.text.strip()
                if delivery_text and len(delivery_text) > 5:
                    details['delivery_date'] = delivery_text.split('\n')[0].replace('?', '')
                    delivery_found = True
            except:
                pass
        
        # Strategy 3: Check near pincode input
        if not delivery_found:
            try:
                pincode_area = driver.find_element(By.XPATH, "//div[contains(@class, '_2P_LDn') or contains(@class, 'pincode')]")
                parent = pincode_area.find_element(By.XPATH, "./parent::*")
                delivery_text = parent.text.strip()
                lines = delivery_text.split('\n')
                for line in lines:
                    if any(month in line for month in ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']):
                        details['delivery_date'] = line.replace('?', '')
                        delivery_found = True
                        break
            except:
                pass
        
        if not delivery_found:
            details['delivery_date'] = "Check on website"
        
        # Discount - Updated selectors
        discount_selectors = ["div.UkUFwK", "div._3Ay6Sb", "div._3I9_wc", "div._2Nx2Xf"]
        details['discount'] = get_element_text(driver, discount_selectors, "No discount")
        
        # Seller
        try:
            seller_selectors = ["#sellerName", "div._2Mji8F", "span._2kiVk3"]
            details['seller'] = get_element_text(driver, seller_selectors, "N/A")
        except:
            details['seller'] = "N/A"
        
        return details
        
    except Exception as e:
        print(f"   ❌ Error fetching details: {e}")
        return None

def scrape_flipkart(query: str, pincode: str = None, headless: bool = True):
    """Uses Selenium to scrape Flipkart for lowest priced product."""
    driver = None
    try:
        print("\n" + "="*60)
        print("🔍 FLIPKART SCRAPER")
        print("="*60)
        print(f"Search: {query}")
        if pincode:
            print(f"Pincode: {pincode}")
        print()
        
        driver = setup_driver(headless=headless)
        
        search_url = f"https://www.flipkart.com/search?q={query.replace(' ', '+')}&sort=popularity"
        print(f"🔍 Searching Flipkart...")
        
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
        
        # Find product containers - FIXED APPROACH
        # Look for actual product cards, not filter elements
        product_containers = driver.find_elements(By.XPATH, 
            "//div[contains(@class, 'col') and .//a[contains(@href, '/p/')]]")
        
        print(f"📦 Found {len(product_containers)} product containers\n")
        
        for container in product_containers[:50]:
            try:
                # Get product link
                link = container.find_element(By.XPATH, ".//a[contains(@href, '/p/')]")
                href = link.get_attribute('href')
                
                if not href or href in seen_urls:
                    continue
                
                seen_urls.add(href)
                
                # Get title - try multiple approaches
                title = ""
                try:
                    # Try getting from link text first
                    title = link.text.strip()
                    if not title:
                        # Try finding any text element in container
                        text_elems = container.find_elements(By.XPATH, ".//div[string-length(text()) > 10]")
                        for elem in text_elems:
                            text = elem.text.strip()
                            if text and '₹' not in text and len(text) > 10:
                                title = text
                                break
                except:
                    pass
                
                # Get price - Look for ₹ symbol anywhere in container
                price = 0
                try:
                    # Find all elements with ₹ symbol
                    price_elements = container.find_elements(By.XPATH, ".//*[contains(text(), '₹')]")
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
        print(f"📦 Filtering accessories and finding lowest price...\n")
        
        # Sort by price
        products.sort(key=lambda x: x['price'])
        
        # Find first non-accessory product
        for idx, product in enumerate(products):
            print(f"[{idx+1}/{len(products)}] Checking: ₹{product['price']:,} - {product['preview_title'][:50]}...")
            
            # Quick filter
            if is_accessory_or_related(product['preview_title'], query):
                print(f"   ⊗ Accessory - Skipping\n")
                continue
            
            # Get full details
            details = get_product_details(driver, product['url'], pincode)
            
            if not details:
                print(f"   ❌ Failed to fetch details\n")
                continue
            
            # Final check
            if is_accessory_or_related(details['title'], query):
                print(f"   ⊗ Accessory detected - Skipping\n")
                continue
            
            # Valid product found!
            print(f"   ✅ LOWEST PRICE FOUND!\n")
            details['url'] = product['url']
            return details
        
        # Fallback
        print("\n⚠️  All products filtered as accessories. Returning lowest price.")
        if products:
            details = get_product_details(driver, products[0]['url'], pincode)
            if details:
                details['url'] = products[0]['url']
                return details
        
        return None
        
    except Exception as e:
        print(f"❌ Scraping error: {e}")
        import traceback
        traceback.print_exc()
        return None
    
    finally:
        if driver:
            driver.quit()

def print_result(product):
    """Pretty print the result."""
    if not product:
        print("\n❌ No result to display")
        return
    
    print("\n" + "="*60)
    print("🎯 LOWEST PRICED PRODUCT ON FLIPKART")
    print("="*60)
    print(f"\n📦 Title: {product['title']}")
    print(f"💰 Price: ₹{product['price']:,}")
    print(f"⭐ Rating: {product['rating']} ({product['reviews']} reviews)")
    print(f"🚚 Delivery: {product['delivery_date']}")
    print(f"💸 Discount: {product['discount']}")
    print(f"🏪 Seller: {product['seller']}")
    print(f"🖼️  Image: {product['image'][:60]}...")
    print(f"🔗 URL: {product['url']}")
    print("\n" + "="*60)


# RUN IT!
if __name__ == "__main__":
    result = scrape_flipkart(
        query="running shoes",
        pincode="688524",
        headless=True  # Set to False to see browser
    )
    
    print_result(result)