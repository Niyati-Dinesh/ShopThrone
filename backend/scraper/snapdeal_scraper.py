"""
Perfect Snapdeal Scraper 2025 - Enhanced with complete details extraction
Returns comprehensive product information with accurate pricing and delivery
"""
import re
import time
import tempfile
import os
import shutil
from typing import Optional, Dict, Any, List
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
    m = re.search(r'[\d,]+', str(price_text).replace('₹', '').replace('Rs', '').replace(' ', ''))
    if m:
        return int(m.group(0).replace(',', ''))
    return 0

def setup_driver(headless=True):
    """Setup Chrome driver with unique user data directory."""
    chrome_options = Options()
    
    temp_dir = tempfile.mkdtemp(prefix="chrome_snapdeal_")
    chrome_options.add_argument(f"--user-data-dir={temp_dir}")
    
    if headless:
        chrome_options.add_argument('--headless=new')
    
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
    
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_experimental_option("prefs", {
        "profile.default_content_setting_values.notifications": 2
    })
    
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()), 
        options=chrome_options
    )
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    driver.temp_dir = temp_dir
    
    return driver

def enter_pincode_snapdeal(driver, pincode: str):
    """Enter pincode on Snapdeal product page with multiple strategies."""
    print(f"   📍 Setting pincode to {pincode}...")
    time.sleep(2)
    
    # Strategy 1: Direct input field
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
    
    # Strategy 2: JavaScript injection
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
    
    # Strategy 3: Click delivery section first
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
    """Extract delivery information with better formatting."""
    delivery_info = {
        'delivery_date': None,
        'delivery_text': None
    }
    
    time.sleep(2)
    
    try:
        page_text = driver.find_element(By.TAG_NAME, "body").text
        
        # Pattern 1: "Delivery by DD Month" or "Delivered by DD Month"
        match = re.search(r'Deliver(?:ed|y) by\s+(\d{1,2}\s+\w{3,}(?:\s+\d{4})?)', page_text, re.IGNORECASE)
        if match:
            delivery_info['delivery_date'] = match.group(1)
            delivery_info['delivery_text'] = f"Delivery by {match.group(1)}"
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
            delivery_info['delivery_text'] = f"Get it by {match.group(1)}"
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
                delivery_info['delivery_date'] = "Available"
                delivery_info['delivery_text'] = "Available for delivery to your pincode"
                return delivery_info
        
    except Exception as e:
        print(f"   ⚠️  Error extracting delivery: {e}")
    
    return delivery_info

def get_snapdeal_product_details(driver, product_url: str, pincode: str = None):
    """Fetch comprehensive product details from Snapdeal product page."""
    try:
        driver.get(product_url)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        time.sleep(3)
        
        details = {
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
            "in_stock": False,
            "highlights": [],
            "offers": []
        }
        
        # Enter pincode if provided
        pincode_entered = False
        if pincode:
            pincode_entered = enter_pincode_snapdeal(driver, pincode)
            time.sleep(2)
        
        # ==================== TITLE ====================
        title_selectors = [
            "h1.pdp-e-i-head",
            "h1[itemprop='name']",
            "h1.product-title",
            "h1.pdpTitle",
            "h1"
        ]
        for selector in title_selectors:
            try:
                elem = driver.find_element(By.CSS_SELECTOR, selector)
                title = elem.text.strip()
                if title and len(title) > 10:
                    details['title'] = title
                    break
            except:
                continue
        
        # ==================== IMAGES ====================
        try:
            # Main image
            image_selectors = [
                "img.cloudzoom",
                "img[itemprop='image']",
                "img.product-image",
                "img.pdpCarouselImg"
            ]
            for selector in image_selectors:
                try:
                    img = driver.find_element(By.CSS_SELECTOR, selector)
                    src = img.get_attribute('src')
                    if src:
                        details['image'] = src
                        break
                except:
                    continue
            
            # Additional images
            img_elements = driver.find_elements(By.CSS_SELECTOR, 
                "img.pdpCarouselImg, div.bx-viewport img, ul.bx-list img")
            collected = []
            for img in img_elements:
                src = img.get_attribute('src') or img.get_attribute('data-src') or ""
                if src and src.startswith('http') and src not in collected:
                    collected.append(src)
                if len(collected) >= 8:
                    break
            
            if collected:
                details['images'] = collected
                if not details['image'] or details['image'] == PLACEHOLDER_IMAGE:
                    details['image'] = collected[0]
        except:
            pass
        
        # ==================== PRICE ====================
        price_selectors = [
            "span.pdp-final-price",
            "span.payBlkBig",
            "span[itemprop='price']",
            "span.lfloat.product-price",
            "span.selling-price"
        ]
        for selector in price_selectors:
            try:
                elem = driver.find_element(By.CSS_SELECTOR, selector)
                price_text = elem.text.strip()
                price = clean_price_text(price_text)
                if price > 0:
                    details['price'] = price
                    break
            except:
                continue
        
        # ==================== ORIGINAL PRICE ====================
        mrp_selectors = [
            "span.pdp-mrp",
            "span.lfloat.markedPrice",
            "span.strikedPriceText",
            "span.list-price"
        ]
        for selector in mrp_selectors:
            try:
                elem = driver.find_element(By.CSS_SELECTOR, selector)
                mrp_text = elem.text.strip()
                original = clean_price_text(mrp_text)
                if original > details['price']:
                    details['original_price'] = original
                    break
            except:
                continue
        
        # ==================== DISCOUNT ====================
        discount_selectors = [
            "span.percent-desc",
            "div.percent-desc",
            "span.pdp-discount",
            "div.discount-badge"
        ]
        for selector in discount_selectors:
            try:
                elem = driver.find_element(By.CSS_SELECTOR, selector)
                discount = elem.text.strip()
                if discount and '%' in discount:
                    details['discount'] = discount
                    break
            except:
                continue
        
        # ==================== RATING ====================
        rating_selectors = [
            "span[itemprop='ratingValue']",
            "span.avrg-rating",
            "div.rating-value",
            "span.filled-stars"
        ]
        for selector in rating_selectors:
            try:
                elem = driver.find_element(By.CSS_SELECTOR, selector)
                rating_text = elem.text.strip()
                match = re.search(r'(\d+\.?\d*)', rating_text)
                if match:
                    rating_val = float(match.group(1))
                    if 0 <= rating_val <= 5:
                        details['rating'] = rating_val
                        break
            except:
                continue
        
        # ==================== REVIEW COUNT ====================
        review_selectors = [
            "span[itemprop='ratingCount']",
            "span.total-rating",
            "span.review-count",
            "p.rating-count"
        ]
        for selector in review_selectors:
            try:
                elem = driver.find_element(By.CSS_SELECTOR, selector)
                review_text = elem.text.strip()
                match = re.search(r'(\d+)', review_text.replace(',', ''))
                if match:
                    details['review_count'] = int(match.group(1))
                    break
            except:
                continue
        
        # ==================== DELIVERY INFO ====================
        delivery_info = extract_delivery_info(driver, pincode_entered)
        if delivery_info['delivery_date']:
            details['delivery_date'] = delivery_info['delivery_date']
            details['delivery_info'] = delivery_info['delivery_text']
        else:
            details['delivery_date'] = "Check on website"
            details['delivery_info'] = "Enter pincode on website for delivery details"
        
        # ==================== STOCK STATUS ====================
        try:
            add_to_cart = driver.find_element(By.CSS_SELECTOR, 
                "div#add-cart-button-id, button.buy-button, div.cart-button")
            details['in_stock'] = add_to_cart.is_displayed() and add_to_cart.is_enabled()
            details['availability'] = "In stock" if details['in_stock'] else "Out of stock"
        except:
            # Check for out of stock indicators
            try:
                oos = driver.find_elements(By.XPATH, 
                    "//*[contains(text(), 'Out of Stock') or contains(text(), 'Sold Out')]")
                details['in_stock'] = len(oos) == 0
                details['availability'] = "In stock" if details['in_stock'] else "Out of stock"
            except:
                details['in_stock'] = False
                details['availability'] = "Check website"
        
        # ==================== SELLER ====================
        seller_selectors = [
            "div.seller-name",
            "a.seller-link",
            "span[itemprop='seller']",
            "div.sold-by"
        ]
        for selector in seller_selectors:
            try:
                elem = driver.find_element(By.CSS_SELECTOR, selector)
                seller = elem.text.strip()
                if seller and len(seller) < 100:
                    details['seller'] = seller
                    break
            except:
                continue
        
        # ==================== BRAND ====================
        try:
            brand_patterns = [
                "//tr//td[contains(text(),'Brand')]/following-sibling::td",
                "//div[contains(@class, 'spec')]//td[contains(text(),'Brand')]/following-sibling::td",
                "//span[@itemprop='brand']",
            ]
            for xpath in brand_patterns:
                try:
                    elem = driver.find_element(By.XPATH, xpath)
                    brand = elem.text.strip()
                    if brand and len(brand) < 50:
                        details['brand'] = brand
                        break
                except:
                    continue
        except:
            pass
        
        # ==================== HIGHLIGHTS/FEATURES ====================
        try:
            highlight_elements = driver.find_elements(By.XPATH, 
                "//div[contains(@class, 'key-features')]//li | " +
                "//div[contains(@class, 'highlights')]//li | " +
                "//ul[contains(@class, 'features')]//li"
            )
            
            highlights = []
            for elem in highlight_elements[:10]:
                text = elem.text.strip()
                if text and len(text) > 5 and len(text) < 300:
                    highlights.append(text)
            
            if highlights:
                details['highlights'] = highlights
                details['features'] = highlights
        except:
            pass
        
        # ==================== SPECIFICATIONS ====================
        try:
            spec_dict = {}
            spec_rows = driver.find_elements(By.XPATH, 
                "//table[contains(@class, 'spec')]//tr | " +
                "//div[contains(@class, 'specification')]//tr"
            )
            
            for row in spec_rows[:20]:
                try:
                    cells = row.find_elements(By.TAG_NAME, "td")
                    if len(cells) >= 2:
                        key = cells[0].text.strip()
                        val = cells[1].text.strip()
                        if key and val:
                            spec_dict[key] = val
                except:
                    continue
            
            if spec_dict:
                details['specifications'] = spec_dict
        except:
            pass
        
        # ==================== DESCRIPTION ====================
        try:
            desc_selectors = [
                "div.product-desc-content",
                "div[itemprop='description']",
                "div.description-text",
                "div.product-description p"
            ]
            
            for selector in desc_selectors:
                try:
                    elem = driver.find_element(By.CSS_SELECTOR, selector)
                    desc = elem.text.strip()
                    if desc and len(desc) > 50:
                        details['description'] = desc
                        break
                except:
                    continue
        except:
            pass
        
        # ==================== OFFERS ====================
        try:
            offer_elements = driver.find_elements(By.XPATH, 
                "//div[contains(@class, 'offer')]//li | " +
                "//div[contains(@class, 'bank-offer')]"
            )
            
            offers = []
            for elem in offer_elements[:5]:
                text = elem.text.strip()
                if text and len(text) > 10 and len(text) < 200:
                    offers.append(text)
            
            if offers:
                details['offers'] = offers
        except:
            pass
        
        return details
        
    except Exception as e:
        print(f"   ❌ Error fetching details: {e}")
        return None

def is_accessory(title: str) -> bool:
    """Check if product is an accessory."""
    title_lower = (title or "").lower()
    accessory_keywords = [
        'case', 'cover', 'cable', 'charger', 'adapter', 'stand',
        'holder', 'mount', 'protector', 'glass', 'strap', 'band',
        'bag', 'pouch', 'sleeve', 'clip', 'replacement'
    ]
    return any(k in title_lower for k in accessory_keywords)

def scrape_snapdeal(query: str, pincode: str = None, headless: bool = True, 
                    max_products: int = 40) -> Optional[Dict[str, Any]]:
    """Scrape Snapdeal for best (lowest priced) product with complete details."""
    driver = None
    try:
        print("\n" + "="*70)
        print("🛍️  PERFECT SNAPDEAL SCRAPER 2025")
        print("="*70)
        print(f"🔍 Search: {query}")
        if pincode:
            print(f"📍 Pincode: {pincode}")
        print()
        
        driver = setup_driver(headless=headless)
        
        search_url = f"https://www.snapdeal.com/search?keyword={query.replace(' ', '+')}"
        print(f"🔍 Searching Snapdeal...\n")
        
        driver.get(search_url)
        
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        time.sleep(4)
        
        # Scroll to load products
        for _ in range(3):
            driver.execute_script("window.scrollBy(0, window.innerHeight * 0.7);")
            time.sleep(1.5)
        
        products = []
        seen_urls = set()
        
        # Find product containers
        product_containers = driver.find_elements(By.XPATH, 
            "//div[contains(@class, 'col') and .//a[contains(@href, '/product/')]] | " +
            "//div[contains(@class, 'product-tuple-listing') and .//a[contains(@href, '/product/')]]"
        )
        
        print(f"📦 Found {len(product_containers)} product containers\n")
        
        for container in product_containers[:max_products]:
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
                    if not title or len(title) < 5:
                        text_elems = container.find_elements(By.XPATH, 
                            ".//p[@class='product-title'] | .//div[@class='product-desc-rating']//p")
                        for elem in text_elems:
                            text = elem.text.strip()
                            if text and '₹' not in text and len(text) > 10:
                                title = text
                                break
                except:
                    pass
                
                # Get price
                price = 0
                try:
                    price_elements = container.find_elements(By.XPATH, 
                        ".//*[contains(@class, 'product-price') or contains(text(), '₹') or contains(text(), 'Rs')]")
                    for price_elem in price_elements:
                        price_text = price_elem.text.strip()
                        temp_price = clean_price_text(price_text)
                        if 50 < temp_price < 10000000:  # Valid price
                            price = temp_price
                            break
                except:
                    pass
                
                if price > 50:  # Valid product found
                    if not title:
                        title = f"Product at ₹{price}"
                    
                    products.append({
                        "price": price,
                        "url": href,
                        "preview_title": title
                    })
                    print(f"   [{len(products)}] ₹{price:,} - {title[:55]}...")
                    
            except Exception:
                continue
        
        if not products:
            print("\n❌ No products found")
            return None
        
        print(f"\n✓ Total products found: {len(products)}")
        print(f"📊 Sorting by price...\n")
        
        # Remove duplicates and sort by price
        unique_products = {p['url']: p for p in products}.values()
        sorted_products = sorted(unique_products, key=lambda x: x['price'])
        
        # Filter out accessories
        filtered = [p for p in sorted_products if not is_accessory(p['preview_title'])]
        candidates = filtered if filtered else sorted_products
        
        print(f"🔍 Checking top products for best match...\n")
        
        # Get details of best products
        for i, product in enumerate(candidates[:10]):
            print(f"[{i+1}] Checking: ₹{product['price']:,} - {product['preview_title'][:55]}...")
            
            details = get_snapdeal_product_details(driver, product['url'], pincode)
            
            if details and details.get('price', 0) > 0:
                print(f"   ✅ BEST MATCH FOUND!\n")
                return details
            else:
                print(f"   ⚠️  Could not extract details\n")
                time.sleep(0.5)
        
        # Fallback: return first product with basic info
        print("⚠️  Using fallback data from search results\n")
        first = candidates[0]
        return {
            "url": first['url'],
            "title": first['preview_title'],
            "price": first['price'],
            "original_price": 0,
            "discount": "",
            "rating": 0.0,
            "review_count": 0,
            "image": PLACEHOLDER_IMAGE,
            "images": [],
            "delivery_date": "Check website",
            "delivery_info": "Check website for delivery details",
            "availability": "Check website",
            "brand": "",
            "description": "",
            "features": [],
            "specifications": {},
            "seller": "",
            "in_stock": True,
            "highlights": [],
            "offers": []
        }
        
    except TimeoutException:
        print("❌ Timeout: Page took too long to load")
        return None
    except Exception as e:
        print(f"❌ Scraping error: {e}")
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

def print_result(product: Optional[Dict[str, Any]]):
    """Pretty-print the comprehensive product result."""
    if not product:
        print("\n❌ No product found.")
        return
    
    print("\n" + "="*70)
    print("🎯 BEST PRODUCT FOUND ON SNAPDEAL")
    print("="*70)
    print(f"📦 Title: {product.get('title', 'N/A')}")
    print(f"💰 Price: ₹{product.get('price', 0):,}")
    
    if product.get('original_price', 0) and product['original_price'] > product['price']:
        print(f"💸 Original Price: ₹{product['original_price']:,}")
        savings = product['original_price'] - product['price']
        savings_pct = int((savings / product['original_price']) * 100)
        print(f"🎉 You Save: ₹{savings:,} ({savings_pct}% off)")
    
    if product.get('discount'):
        print(f"💳 Discount: {product['discount']}")
    
    print(f"⭐ Rating: {product.get('rating') or 'N/A'} ({product.get('review_count', 0):,} reviews)")
    
    if product.get('brand'):
        print(f"🏷️  Brand: {product['brand']}")
    
    print(f"📦 Stock: {'✅ In Stock' if product.get('in_stock') else '❌ Out of Stock'}")
    
    if product.get('delivery_info'):
        print(f"🚚 Delivery: {product['delivery_info']}")
    
    if product.get('seller'):
        print(f"🏪 Seller: {product['seller']}")
    
    if product.get('description'):
        desc = product['description'][:150]
        print(f"\n📝 Description:\n   {desc}{'...' if len(product['description']) > 150 else ''}")
    
    if product.get('highlights'):
        print(f"\n✨ Key Highlights:")
        for hl in product['highlights'][:5]:
            print(f"   • {hl}")
    
    if product.get('specifications'):
        print(f"\n📋 Specifications:")
        for key, val in list(product['specifications'].items())[:6]:
            print(f"   • {key}: {val}")
    
    if product.get('offers'):
        print(f"\n🎁 Available Offers:")
        for offer in product['offers'][:3]:
            print(f"   • {offer}")
    
    if product.get('images') and len(product['images']) > 1:
        print(f"\n🖼️  Images: {len(product['images'])} available")
    
    print(f"\n🔗 URL: {product.get('url')}")
    print("="*70 + "\n")

if __name__ == "__main__":
    result = scrape_snapdeal(
        query="Avant Pulse Black Men's Sports Running Shoes",
        pincode="688524",
        headless=True,
        max_products=40
    )
    print_result(result)