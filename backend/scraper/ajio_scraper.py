
import re
import time
import json
from typing import Dict, Any, List, Optional
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# ---------- Config ----------
PLACEHOLDER_IMAGE = "https://placehold.co/300x400/EEE/31343C?text=No+Image"

# ---------- Helpers ----------
def clean_price_text(price_text: str) -> int:
    try:
        if not price_text: return 0
        s = str(price_text)
        m = re.search(r'([\d,]+(?:\.\d+)?)', s.replace('\xa0', ' '))
        if not m: return 0
        num = m.group(1).replace(',', '')
        if '.' in num: num = num.split('.')[0]
        return int(num)
    except Exception:
        return 0

def make_empty_details(product_url: str) -> Dict[str, Any]:
    return {
        "url": product_url, "title": "", "price": 0, "original_price": 0, 
        "discount": "", "rating": 0.0, "review_count": 0, "image": PLACEHOLDER_IMAGE, 
        "images": [], "delivery_date": "", "delivery_info": "", "availability": "", 
        "brand": "", "description": "", "features": [], "specifications": {}, 
        "seller": "", "in_stock": False, "sizes": [], "colors": []
    }

def setup_driver(headless: bool = True, window_size: str = "1920,1080"):
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument(f"--window-size={window_size}")
    ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    chrome_options.add_argument(f"--user-agent={ua}")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    return driver

# ---------- Product extraction ----------
def extract_products_from_search(driver) -> List[Dict[str, Any]]:
    products = []
    try:
        # Improved JS to specifically target product cards and ignore sidebars
        script = """
        const tiles = Array.from(document.querySelectorAll('.item, .rilrtl-product, .product-base'));
        const out = [];
        
        for (const tile of tiles) {
            try {
                // Ignore sidebar items
                if(tile.closest('.filters') || tile.closest('.facets')) continue;

                const linkEl = tile.querySelector('a[href*="/p/"]');
                if (!linkEl) continue;
                
                const link = linkEl.href;
                
                // Strict Title Search
                const titleEl = tile.querySelector('.nameCls, .name');
                const title = titleEl ? titleEl.innerText : '';
                
                // Ignore "Refine By" or empty titles
                if (!title || title.toLowerCase().includes('refine by')) continue;

                const priceEl = tile.querySelector('.price, .orginal-price');
                const price_text = priceEl ? priceEl.innerText : '';
                
                const imgEl = tile.querySelector('img');
                const image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src')) : '';
                
                out.push({
                    url: link,
                    title: title.trim(),
                    price_text: price_text.trim(),
                    image: image
                });
            } catch(e) {}
        }
        return out;
        """
        items = driver.execute_script(script)
        
        if items:
            for item in items:
                # Double check python side to filter bad titles
                title_lower = item.get("title", "").lower()
                if "refine" in title_lower or "filter" in title_lower:
                    continue

                products.append({
                    "url": item["url"],
                    "title": item.get("title", "").strip(),
                    "price_text": item.get("price_text", "").strip(),
                    "image": item.get("image", "") or PLACEHOLDER_IMAGE
                })
        
    except Exception as e:
        print(f"Extraction error: {e}")
    
    return products

def get_product_details(driver, product_url: str, pincode: Optional[str] = None) -> Optional[Dict[str, Any]]:
    details = make_empty_details(product_url)
    try:
        driver.get(product_url)
        # Wait specifically for the PRICE element, ensuring page load
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "prod-sp"))
            )
        except:
            time.sleep(3) # Fallback wait

        # Title
        try:
            details["title"] = driver.find_element(By.CSS_SELECTOR, "h1.prod-title").text.strip()
        except: pass

        # Price
        try:
            price_el = driver.find_element(By.CLASS_NAME, "prod-sp")
            details["price"] = clean_price_text(price_el.text)
        except: pass
        
        # Image
        try:
            img = driver.find_element(By.CSS_SELECTOR, "img.rilrtl-lazy-img")
            details["image"] = img.get_attribute("src")
        except: pass

        # In Stock
        details["in_stock"] = True # Assume true if we got this far
        details["seller"] = "AJIO"
        details["url"] = product_url

        return details

    except Exception:
        return None

# ---------- Main scraper ----------
def scrape_ajio(query: str, pincode: Optional[str] = None, headless: bool = True, max_scrolls: int = 8) -> Optional[Dict[str, Any]]:
    driver = None
    try:
        driver = setup_driver(headless=headless)
        search_q = query.replace(" ", "%20")
        search_url = f"https://www.ajio.com/search/?text={search_q}"
        
        print(f"Searching AJIO: {search_url}")
        driver.get(search_url)
        
        # FIX 1: Wait for specific product container, not just body
        try:
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".item, .rilrtl-product"))
            )
        except:
            print("⚠️ Timeout waiting for products grid")
        
        # Scroll logic
        for _ in range(max_scrolls):
            driver.execute_script("window.scrollBy(0, 1000);")
            time.sleep(0.5)
        
        raw_products = extract_products_from_search(driver)
        
        if not raw_products:
            return None
            
        # Clean and Sort
        valid_products = []
        for p in raw_products:
            price = clean_price_text(p['price_text'])
            # FIX 2: Filter out 0 price items (Sidebar elements often have no price)
            if price > 50: 
                p['price_val'] = price
                valid_products.append(p)

        # Sort by price in ascending order to find the lowest price
        sorted_products = sorted(valid_products, key=lambda x: x['price_val'])

        # Check candidates
        for candidate in sorted_products[:10]:
            print(f"Checking: {candidate['title']} @ {candidate['price_val']}")
            details = get_product_details(driver, candidate['url'], pincode)
            if details and details['price'] > 0:
                # Ensure we have an image
                if not details['image'] or "placeholder" in details['image']:
                    details['image'] = candidate['image']
                return details

        return None

    except Exception as e:
        print(f"Error: {e}")
        return None
    finally:
        if driver: driver.quit()

# ... (Keep your print_result and main block) ...
if __name__ == "__main__":
    res = scrape_ajio("kurti", "688524")
    if res:
        print(f"Found: {res['title']} - {res['price']}")
    else:
        print("No results")
