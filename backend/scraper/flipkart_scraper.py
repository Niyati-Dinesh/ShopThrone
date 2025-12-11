"""
Flipkart Scraper - FIXED VERSION (2025)
Updated with correct CSS selectors for current Flipkart layout
"""
import re
import time
from typing import Optional, Dict, Any, List
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# --- CONSTANTS ---
PLACEHOLDER_IMAGE = "https://placehold.co/300x400/EEE/31343C?text=No+Image"

def clean_price_text(price_text: str) -> int:
    """Extracts integer price from text like '₹23,990'."""
    if not price_text:
        return 0
    s = re.sub(r'[^\d,]', '', str(price_text))
    if not s:
        return 0
    return int(s.replace(',', ''))

def setup_driver(headless: bool = True):
    chrome_options = Options()
    if headless:
        chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--disable-gpu')
    
    ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    chrome_options.add_argument(f'--user-agent={ua}')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    return driver

def handle_popups(driver):
    """Closes login popups."""
    try:
        selectors = ["button._2KpZ6l._2doB4z", "span._30XB9F", "button[class*='close']"]
        for sel in selectors:
            try:
                driver.find_element(By.CSS_SELECTOR, sel).click()
                time.sleep(0.5)
                return
            except:
                pass
    except:
        pass

def set_pincode(driver, pincode: str):
    """Sets the pincode for delivery information."""
    if not pincode:
        return
    try:
        # Find the pincode input field
        inp = WebDriverWait(driver, 3).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input.qeqGor, input#pincodeInputId"))
        )
        
        # Clear and enter new pincode
        inp.click()
        inp.send_keys(Keys.CONTROL + "a")
        inp.send_keys(Keys.DELETE)
        time.sleep(0.2)
        inp.send_keys(pincode)
        time.sleep(0.3)
        
        # Click Check button
        try:
            check_btn = driver.find_element(By.XPATH, "//span[contains(text(),'Check')]")
            check_btn.click()
            time.sleep(1.5)
        except:
            inp.send_keys(Keys.ENTER)
            time.sleep(1.5)
    except Exception as e:
        pass

def get_product_details(driver, product_url: str, pincode: str = None, debug: bool = False) -> Dict[str, Any]:
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
        "in_stock": False
    }

    try:
        driver.get(product_url)
        try:
            WebDriverWait(driver, 8).until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'₹')]")))
        except:
            pass
        time.sleep(1.5)
        handle_popups(driver)

        # --- SET LOCATION ---
        if pincode:
            set_pincode(driver, pincode)

        # --- A. TITLE (RG5slk) ---
        try:
            title_el = driver.find_element(By.CSS_SELECTOR, "span.RG5slk, h1.yhB1nd, span.VU-ZEz")
            details['title'] = title_el.text.strip()
        except:
            try:
                details['title'] = driver.title.split('|')[0].strip()
            except:
                pass

        # --- B. RATING (MKiFS6 contains stars, PvbNMB contains the rating container) ---
        try:
            # Rating value (in span inside PvbNMB)
            rating_el = driver.find_element(By.CSS_SELECTOR, "div.PvbNMB span")
            details['rating'] = float(rating_el.text.strip())
        except:
            try:
                rating_el = driver.find_element(By.CSS_SELECTOR, "div.XQDdHH")
                details['rating'] = float(rating_el.text.strip())
            except:
                pass

        # --- C. REVIEW COUNT (o2SIOJ) ---
        try:
            review_el = driver.find_element(By.CSS_SELECTOR, "span.o2SIOJ")
            review_text = review_el.text.strip()
            # Extract number from text like "1,234 Ratings & 567 Reviews"
            matches = re.findall(r'([\d,]+)', review_text)
            if matches:
                # Usually first number is ratings, second is reviews
                if len(matches) >= 2:
                    details['review_count'] = int(matches[1].replace(',', ''))
                else:
                    details['review_count'] = int(matches[0].replace(',', ''))
        except:
            pass

        # --- D. PRICE (hZ3P6w, DeU9vF) ---
        try:
            price_el = driver.find_element(By.CSS_SELECTOR, "div.hZ3P6w, div.DeU9vF, div.Nx9bqj")
            details['price'] = clean_price_text(price_el.text)
        except:
            # Fallback
            try:
                body_txt = driver.find_element(By.TAG_NAME, "body").get_attribute("innerText")
                matches = re.findall(r'₹\s?([\d,]{3,})', body_txt)
                candidates = [int(m.replace(',', '')) for m in matches if int(m.replace(',', '')) > 400]
                if candidates:
                    details['price'] = candidates[0]
            except:
                pass

        # --- E. ORIGINAL PRICE (kRYCnD, gxR4EY) ---
        try:
            orig_el = driver.find_element(By.CSS_SELECTOR, "div.kRYCnD, div.gxR4EY, div.yRaY8j")
            details['original_price'] = clean_price_text(orig_el.text)
        except:
            pass

        # --- F. DISCOUNT (HQe8jr) ---
        try:
            disc_el = driver.find_element(By.CSS_SELECTOR, "div.HQe8jr, div.UkUFwK")
            details['discount'] = disc_el.text.strip()
        except:
            pass

        # --- G. DESCRIPTION (DTBslk Li's inside ul.HwRTzP) ---
        try:
            desc_list = driver.find_elements(By.CSS_SELECTOR, "ul.HwRTzP li.DTBslk, li._21Ahn-")
            details['features'] = [li.text.strip() for li in desc_list if li.text.strip()]
            details['description'] = "\n".join(details['features']) if details['features'] else details['title']
        except:
            try:
                # Fallback to older selectors
                desc_list = driver.find_elements(By.CSS_SELECTOR, "li._21Ahn-")
                details['features'] = [li.text.strip() for li in desc_list if li.text.strip()]
                details['description'] = "\n".join(details['features']) if details['features'] else details['title']
            except:
                pass

        # --- H. IMAGE (img.UCc1lI or similar) ---
        try:
            # Primary image
            img_el = driver.find_element(By.CSS_SELECTOR, "img.UCc1lI, img._0DkuPH, img[loading='eager']")
            src = img_el.get_attribute('src')
            if src:
                details['image'] = src
                details['images'].append(src)
        except:
            pass

        # Collect all product images
        try:
            imgs = driver.find_elements(By.TAG_NAME, "img")
            collected = []
            for img in imgs:
                src = img.get_attribute('src') or ""
                if src and ('rukminim' in src or 'flixcart' in src) and src not in collected:
                    collected.append(src)
            if collected:
                details['images'] = list(dict.fromkeys(collected + details['images']))
                if details['image'] == PLACEHOLDER_IMAGE and collected:
                    details['image'] = collected[0]
        except:
            pass

        # --- I. BRAND ---
        if not details['brand'] and details['title']:
            title_words = details['title'].split()
            if title_words:
                details['brand'] = title_words[0]

        # --- J. SELLER ---
        try:
            seller_node = driver.find_element(By.XPATH, "//*[contains(text(), 'Sold by')]/following-sibling::*")
            details['seller'] = seller_node.text.strip()
        except:
            try:
                seller_node = driver.find_element(By.ID, "sellerName")
                details['seller'] = seller_node.text.strip()
            except:
                pass

        # --- K. SPECIFICATIONS ---
        try:
            rows = driver.find_elements(By.CSS_SELECTOR, "tr.WJdYP6, div.row")
            for row in rows:
                cols = row.find_elements(By.TAG_NAME, "td")
                if len(cols) < 2:
                    cols = row.find_elements(By.CSS_SELECTOR, "div.col")
                if len(cols) >= 2:
                    k = cols[0].text.strip()
                    v = cols[1].text.strip()
                    if k and v and "Question" not in k:
                        details['specifications'][k] = v
                        if k.lower() == "brand":
                            details['brand'] = v
        except:
            pass

        # --- L. STOCK STATUS ---
        try:
            oos = driver.find_elements(By.XPATH, "//*[contains(text(),'Out of stock') or contains(text(),'Sold Out') or contains(text(),'Currently unavailable')]")
            if oos:
                details['in_stock'] = False
                details['availability'] = "Out of Stock"
            else:
                details['in_stock'] = True
                details['availability'] = "In Stock"
        except:
            # Default to in stock if we can't determine
            details['in_stock'] = True
            details['availability'] = "In Stock"

        # --- M. DELIVERY INFO ---
        try:
            del_el = driver.find_element(By.XPATH, "//*[contains(text(),'Delivery by') or contains(text(),'Get it by')]")
            details['delivery_info'] = del_el.text.strip()
            details['delivery_date'] = details['delivery_info']
        except:
            try:
                # Alternative delivery info location
                del_el = driver.find_element(By.CSS_SELECTOR, "div[class*='delivery'], span[class*='delivery']")
                details['delivery_info'] = del_el.text.strip()
                details['delivery_date'] = details['delivery_info']
            except:
                pass

        if debug:
            print(f"✅ Scraped: {details['title'][:40]}...")
            print(f"   Price: ₹{details['price']:,} | Rating: {details['rating']}⭐ | Reviews: {details['review_count']}")

        return details

    except Exception as e:
        if debug:
            print(f"❌ Scrape Error: {e}")
        return details

def scrape_flipkart(query: str, pincode: str = None, headless: bool = True, max_products: int = 5, debug: bool = False):
    print("\n" + "="*60)
    print(f"🛒 FLIPKART SCRAPER: {query}")
    if pincode:
        print(f"📍 Location: {pincode}")
    print("="*60)
    
    driver = setup_driver(headless)
    try:
        url = f"https://www.flipkart.com/search?q={query.replace(' ', '%20')}&sort=relevance"
        driver.get(url)
        time.sleep(2)
        handle_popups(driver)
        driver.execute_script("window.scrollBy(0, 800);")
        time.sleep(1)

        anchors = driver.find_elements(By.XPATH, "//a[contains(@href, '/p/')]")
        seen_urls = set()
        candidates = []

        for a in anchors:
            href = a.get_attribute('href').split('?')[0]
            if href in seen_urls:
                continue
            
            raw_title = a.get_attribute('title') or a.text
            clean_title = raw_title.replace("Add to Compare", "").strip()
            
            if len(clean_title) > 10:
                seen_urls.add(href)
                candidates.append({'url': href, 'title': clean_title})
            
            if len(candidates) >= max_products:
                break

        if not candidates:
            print("❌ No products found.")
            return None

        for i, item in enumerate(candidates):
            if debug:
                print(f"\n[{i+1}/{len(candidates)}] Checking: {item['title'][:50]}...")
            
            # Skip accessories
            if any(x in item['title'].lower() for x in ['case', 'cover', 'screen guard', 'protector']):
                if debug:
                    print(f"   ⚠️ Skipped (Accessory)")
                continue

            details = get_product_details(driver, item['url'], pincode=pincode, debug=debug)
            
            if details['price'] > 100:
                return details
            elif debug:
                print(f"   ⚠️ Skipped (Invalid Price: {details['price']})")

        return None

    finally:
        driver.quit()

def print_result(data):
    if not data:
        print("\n❌ No valid product found.")
        return
    
    print("\n" + "="*60)
    print("✅ FINAL RESULT")
    print("="*60)
    print(f"📦 Title:       {data['title']}")
    print(f"💰 Price:       ₹{data['price']:,}")
    if data['original_price']:
        print(f"🏷️  Original:    ₹{data['original_price']:,} ({data['discount']} off)")
    print(f"⭐ Rating:      {data['rating']} stars ({data['review_count']:,} reviews)")
    print(f"🏭 Brand:       {data['brand']}")
    print(f"🤝 Seller:      {data['seller']}")
    print(f"🖼️  Image URL:   {data['image']}")
    print(f"🚚 Delivery:    {data['delivery_info']}")
    print(f"📦 Availability: {data['availability']}")
    print("-" * 60)
    print(f"📝 Description Preview:")
    if data['features']:
        for feat in data['features'][:5]:
            print(f"   • {feat}")
    else:
        print(f"   {data['description'][:100]}...")
    
    if data['specifications']:
        print("-" * 60)
        print(f"🛠️  Specs ({len(data['specifications'])} items):")
        keys = list(data['specifications'].keys())[:5]
        for k in keys:
            print(f"   • {k}: {data['specifications'][k]}")
    
    print("-" * 60)
    print(f"🔗 URL: {data['url']}")
    print("="*60)

if __name__ == "__main__":
    # Example usage with Pincode
    res = scrape_flipkart("laptop", pincode="688524", headless=True, max_products=5, debug=True)
    print_result(res)