"""
Croma scraper that handles the site's Shadow DOM product tiles and returns
a single best (lowest-priced) product in a structured details dict.

Usage:
    python croma_scraper.py
"""
import re
import time
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
    """Extract integer rupee value from text like '₹1,29,900' -> 129900."""
    try:
        if not price_text:
            return 0
        s = str(price_text)
        # find first sequence of digits and commas and optional decimal
        m = re.search(r'([\d,]+(?:\.\d+)?)', s.replace('\xa0', ' '))
        if not m:
            return 0
        num = m.group(1).replace(',', '')
        # drop decimals if present
        if '.' in num:
            num = num.split('.')[0]
        return int(num)
    except Exception:
        return 0

def make_empty_details(product_url: str) -> Dict[str, Any]:
    """Return the requested details skeleton."""
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

def setup_driver(headless: bool = True, window_size: str = "1366,768"):
    """Setup Chrome driver with common anti-detection arguments."""
    chrome_options = Options()
    if headless:
        # new headless (works for recent Chrome)
        chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument(f"--window-size={window_size}")
    ua = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
          "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
    chrome_options.add_argument(f"--user-agent={ua}")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)
    chrome_options.add_experimental_option("prefs", {"profile.default_content_setting_values.notifications": 2})
    # instantiate
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    # try some runtime stealth
    try:
        driver.execute_cdp_cmd('Network.setUserAgentOverride', {"userAgent": ua})
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    except Exception:
        pass
    return driver

# ---------- Shadow DOM product extraction ----------
def extract_products_from_shadow_dom(driver) -> List[Dict[str, Any]]:
    """
    Run JS inside the page to extract product tiles that are inside shadow roots.
    Returns a list of dicts: {link, title, price_text, image}
    """
    script = """
    // Collect cc-product-tile shadow-root data
    const tiles = Array.from(document.querySelectorAll('cc-product-tile, product-tile, croma-product-tile'));
    const out = [];
    for (const t of tiles) {
        try {
            const root = t.shadowRoot || t;
            // Try multiple selectors inside the root for robustness
            const linkEl = root.querySelector('a[href]') || root.querySelector('a.product__link') || root.querySelector('a.product-title') || root.querySelector('a');
            const titleEl = root.querySelector('.product__title, .product-title, .prd-title, .title') || root.querySelector('h3') || root.querySelector('h2');
            const priceEl = root.querySelector('.product__price, .price, .prd-price, .product-price') || root.querySelector('[data-test="product-price"]') || root.querySelector('span');
            const imgEl = root.querySelector('img') || root.querySelector('picture img');
            const link = linkEl ? (linkEl.href || (linkEl.getAttribute && linkEl.getAttribute('href')) || '') : '';
            const title = titleEl ? (titleEl.innerText || '') : '';
            const price_text = priceEl ? (priceEl.innerText || '') : '';
            const img = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || '') : '';
            out.push({link, title, price_text, image: img});
        } catch(e) {
            // ignore
        }
    }
    return out;
    """
    try:
        items = driver.execute_script(script)
        # items might be None or an array of objects
        if not items:
            return []
        # filter valid link entries
        cleaned = []
        for it in items:
            if not isinstance(it, dict):
                continue
            link = it.get("link") or ""
            if link and (link.startswith("http") or link.startswith("/")):
                # canonicalize relative links if necessary by leaving them - main code will driver.get().
                cleaned.append({
                    "url": link,
                    "title": it.get("title", "").strip(),
                    "price_text": it.get("price_text", "").strip(),
                    "image": it.get("image", "") or PLACEHOLDER_IMAGE
                })
        return cleaned
    except Exception:
        return []

# ---------- Product details extractor ----------
def get_product_details(driver, product_url: str, pincode: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Visit the product URL and extract details (title, price, images, brand, rating, stock, delivery).
    Returns the populated details dict or None on fatal failure.
    """
    details = make_empty_details(product_url)
    try:
        # navigate
        if not product_url.startswith("http"):
            # make absolute
            product_url = "https://www.croma.com" + product_url
        driver.get(product_url)
        WebDriverWait(driver, 12).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        time.sleep(1.5)

        # Title
        try:
            el = driver.find_element(By.XPATH, "//h1 | //h2[contains(@class,'title')] | //h3[contains(@class,'title')]")
            if el and el.text.strip():
                details["title"] = el.text.strip()
        except:
            pass

        # Price: Look for actual price elements, avoiding discount amounts
        try:
            # Strategy 1: Look for specific price classes/attributes
            price_candidates = []
            
            # Try to find the main price display
            price_xpath = [
                "//*[contains(@class, 'product-price') and not(contains(@class, 'old')) and not(contains(text(), 'Save')) and not(contains(text(), 'off'))]",
                "//*[contains(@class, 'ProductPrice') and not(contains(@class, 'old'))]",
                "//span[contains(@class, 'new-price')]",
                "//div[contains(@class, 'price-section')]//span[contains(text(), '₹') and string-length(text()) > 6]",
                "//*[contains(text(), '₹') and string-length(text()) > 8 and string-length(text()) < 20]"
            ]
            
            for xpath in price_xpath:
                try:
                    els = driver.find_elements(By.XPATH, xpath)
                    for el in els[:3]:
                        txt = el.text.strip()
                        # Skip if it's clearly a discount/savings message
                        if any(word in txt.lower() for word in ['save', 'off', 'discount', 'mrp']):
                            continue
                        val = clean_price_text(txt)
                        # Valid laptop/product price range
                        if 10000 < val < 10_000_000:
                            price_candidates.append(val)
                except:
                    continue
            
            # If we found candidates, use the highest (likely the actual price, not discount)
            if price_candidates:
                details["price"] = max(price_candidates)
            
            # Fallback: Search page source for price pattern
            if details["price"] == 0:
                try:
                    body_text = driver.find_element(By.TAG_NAME, "body").text
                    # Look for price patterns: ₹XX,XXX.00 or ₹X,XX,XXX
                    prices = re.findall(r'₹\s*([\d,]+(?:\.\d+)?)', body_text)
                    valid_prices = []
                    for p in prices:
                        val = clean_price_text(p)
                        if 10000 < val < 10_000_000:
                            valid_prices.append(val)
                    if valid_prices:
                        # Take the most common high price
                        from collections import Counter
                        price_counts = Counter(valid_prices)
                        details["price"] = price_counts.most_common(1)[0][0]
                except:
                    pass
                    
        except Exception as e:
            print(f"Price extraction error: {e}")

        # Original Price / MRP
        try:
            mrp_els = driver.find_elements(By.XPATH, "//*[contains(text(), 'MRP') or contains(@class, 'old-price') or contains(@class, 'original-price')]")
            for el in mrp_els[:3]:
                txt = el.text.strip()
                val = clean_price_text(txt)
                if val > details["price"]:
                    details["original_price"] = val
                    break
        except:
            pass

        # Discount
        try:
            disc_els = driver.find_elements(By.XPATH, "//*[contains(text(), 'Save') or contains(text(), 'off') or contains(@class, 'discount')]")
            for el in disc_els[:3]:
                txt = el.text.strip()
                if txt and len(txt) < 50:
                    details["discount"] = txt
                    break
        except:
            pass

        # Images - grab up to 8 unique images, filtering out logos/icons
        try:
            imgs = driver.find_elements(By.XPATH, "//img[@src] | //img[@data-src]")
            seen = []
            for img in imgs:
                try:
                    src = img.get_attribute("src") or img.get_attribute("data-src") or ""
                    # Filter out small images, logos, icons
                    if src and src.startswith("http") and src not in seen:
                        # Skip logos and very small images
                        if any(x in src.lower() for x in ['logo', 'icon', 'svg', 'croma_logo']):
                            continue
                        seen.append(src)
                    if len(seen) >= 8:
                        break
                except:
                    continue
            if seen:
                details["images"] = seen
                details["image"] = seen[0]
        except:
            pass

        # Brand - look in spec table or meta tags
        try:
            brand_el = None
            # Try multiple strategies
            brand_xpaths = [
                "//meta[@property='og:brand']/@content",
                "//meta[@itemprop='brand']/@content",
                "//*[contains(text(),'Brand')]/following-sibling::*[1]",
                "//*[contains(text(),'Brand')]/following::*[1]",
                "//*[contains(@class,'brand')]"
            ]
            for xpath in brand_xpaths:
                try:
                    els = driver.find_elements(By.XPATH, xpath)
                    for el in els[:2]:
                        text = (el.text if hasattr(el, 'text') else str(el)).strip()
                        if text and len(text) < 60 and not any(x in text.lower() for x in ['sky blue', 'midnight', 'silver', 'starlight']):
                            brand_el = text
                            break
                    if brand_el:
                        break
                except:
                    continue
            if brand_el:
                details["brand"] = brand_el
        except:
            pass

        # Rating & review_count
        try:
            rating_text = driver.execute_script("""
                let ratingEl = document.querySelector('[class*="rating"], [data-test*="rating"]');
                return ratingEl ? ratingEl.innerText : '';
            """)
            if rating_text:
                m = re.search(r'(\d+(?:\.\d+)?)', rating_text)
                if m:
                    rating_val = float(m.group(1))
                    if rating_val <= 5:
                        details["rating"] = rating_val
                
                m2 = re.search(r'(\d+)\s*(?:Rating|Review)', rating_text, re.IGNORECASE)
                if m2:
                    details["review_count"] = int(m2.group(1))
        except:
            pass

        # Delivery info - FIXED to capture actual delivery date
        try:
            delivery_text = ""
            
            # Strategy 1: Look for delivery component with JavaScript
            delivery_candidates = driver.execute_script("""
                let blocks = [];
                
                // Check for delivery info elements
                const selectors = [
                    '[class*="delivery"]',
                    '[data-test*="delivery"]',
                    'croma-delivery-info',
                    'cc-delivery-info'
                ];
                
                selectors.forEach(sel => {
                    let els = document.querySelectorAll(sel);
                    els.forEach(el => {
                        if (el.innerText && el.innerText.includes('deliver')) {
                            blocks.push(el.innerText);
                        }
                    });
                });
                
                return blocks;
            """)
            
            for txt in delivery_candidates:
                if txt and ("deliver" in txt.lower() or "december" in txt.lower()):
                    delivery_text = txt.strip()
                    break
            
            # Strategy 2: XPath search for delivery text
            if not delivery_text:
                try:
                    delivery_els = driver.find_elements(By.XPATH, 
                        "//*[contains(text(), 'Will be delivered') or contains(text(), 'Delivery at') or contains(text(), 'delivered by')]")
                    for el in delivery_els:
                        txt = el.text.strip()
                        if txt:
                            delivery_text = txt
                            break
                except:
                    pass
            
            # Store the delivery information
            if delivery_text:
                details['delivery_info'] = delivery_text
                details['delivery_date'] = delivery_text
                
        except Exception as e:
            print(f"Delivery extraction error: {e}")

        # Stock
        try:
            # Check for out of stock indicators
            oos = driver.find_elements(By.XPATH, "//*[contains(text(),'Out of Stock') or contains(text(),'Sold Out') or contains(text(),'Unavailable')]")
            # Check for add to cart / buy now buttons as stock indicator
            buy_buttons = driver.find_elements(By.XPATH, "//*[contains(text(),'Buy Now') or contains(text(),'Add to Cart')]")
            
            details["in_stock"] = len(buy_buttons) > 0 and len(oos) == 0
            details["availability"] = "In stock" if details["in_stock"] else "Out of stock"
        except:
            details["in_stock"] = True
            details["availability"] = "Check site"

        # Seller
        try:
            details["seller"] = "Croma"  # Default seller for Croma
        except:
            pass

        # Description - get from product overview
        try:
            desc_els = driver.find_elements(By.XPATH, 
                "//div[contains(@class,'description')]//p | //div[contains(@class,'overview')]//p | //section[contains(@class,'description')]//p")
            for el in desc_els[:2]:
                txt = el.text.strip()
                if txt and len(txt) > 30:
                    details["description"] = txt
                    break
        except:
            pass

        # Features - extract from Key Features section
        try:
            features = []
            feature_els = driver.find_elements(By.XPATH, 
                "//ul[contains(@class,'features')]//li | //*[contains(text(),'Key Features')]/following::li")
            for el in feature_els[:10]:
                txt = el.text.strip()
                if txt and len(txt) > 10 and len(txt) < 200:
                    features.append(txt)
            if features:
                details["features"] = features
        except:
            pass

        # Final validation
        details["url"] = product_url
        return details

    except Exception as e:
        print(f"Product details extraction error: {e}")
        return None

# ---------- Main scraper orchestration ----------
def scrape_croma(query: str, pincode: Optional[str] = None, headless: bool = True, max_scrolls: int = 8) -> Optional[Dict[str, Any]]:
    """
    Orchestrates the Croma search and returns best (lowest-priced) product details dict.
    """
    driver = None
    try:
        driver = setup_driver(headless=headless)
        # Croma search (using the searchB variant the site advertises in ld+json)
        search_q = query.replace(" ", "%20")
        search_url = f"https://www.croma.com/searchB?q={search_q}%3Arelevance&text={search_q}"
        # fallback to normal search if above fails
        driver.get(search_url)

        # Wait for React to hydrate. If initial data is present, product tiles might load after scrolls.
        WebDriverWait(driver, 12).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        time.sleep(1.2)

        # Scroll to trigger lazy loads & product render
        for _ in range(max_scrolls):
            driver.execute_script("window.scrollBy(0, window.innerHeight * 0.9);")
            time.sleep(0.6)

        # Try extracting shadow DOM tiles
        raw_products = extract_products_from_shadow_dom(driver)

        # If nothing found via shadow extraction, attempt to find normal anchors with /p/
        if not raw_products:
            # extra scroll + wait & try again
            for _ in range(3):
                driver.execute_script("window.scrollBy(0, 800);")
                time.sleep(0.6)
            anchors = driver.find_elements(By.XPATH, "//a[contains(@href,'/p/')]")
            raw_products = []
            seen = set()
            for a in anchors:
                try:
                    href = a.get_attribute("href") or ""
                    if not href or href in seen:
                        continue
                    seen.add(href)
                    title = (a.text or "").strip()
                    # attempt to locate price nearby
                    price = ""
                    try:
                        parent = a.find_element(By.XPATH, "./ancestor::div[1]")
                        price_el = parent.find_element(By.XPATH, ".//*[contains(text(),'₹')]")
                        price = price_el.text.strip()
                    except:
                        price = ""
                    raw_products.append({"url": href, "title": title, "price_text": price, "image": ""})
                except:
                    continue

        if not raw_products:
            # nothing found, return None
            return None

        # normalize & compute numeric prices; if price missing mark as large
        normalized = []
        for rp in raw_products:
            price_val = clean_price_text(rp.get("price_text", "") or "")
            normalized.append({
                "url": rp.get("url"),
                "title": rp.get("title") or "",
                "price": price_val if price_val > 0 else 10**10,
                "image": rp.get("image") or PLACEHOLDER_IMAGE
            })

        # sort by price asc
        normalized = sorted(normalized, key=lambda x: x["price"])

        # iterate candidates (lowest first) and attempt to fetch full details
        for candidate in normalized[:30]:  # limit to first 30 previews
            # accessory filter: skip obvious accessory titles
            title_l = (candidate.get("title") or "").lower()
            skip_keywords = ["case", "cover", "charger", "adapter", "battery", "screen protector", "keyboard cover", "bag", "sleeve"]
            if any(k in title_l for k in skip_keywords):
                continue

            details = get_product_details(driver, candidate["url"], pincode)
            if details and details.get("price", 0) > 10000:  # Reasonable product price
                # ensure url & image
                if not details.get("image") or 'logo' in details.get("image", "").lower():
                    details["image"] = candidate.get("image", PLACEHOLDER_IMAGE)
                return details

            # fallback: if details extraction failed but preview has a numeric price, return a minimal fallback
            if candidate["price"] and 10000 < candidate["price"] < 10**10:
                fallback = make_empty_details(candidate["url"])
                fallback.update({
                    "title": candidate.get("title", ""),
                    "price": candidate.get("price", 0),
                    "image": candidate.get("image", PLACEHOLDER_IMAGE),
                    "in_stock": True
                })
                return fallback

        # last resort: visit first candidate's page and return whatever we can
        first = normalized[0]
        details = get_product_details(driver, first["url"], pincode)
        if details:
            return details
        # final fallback
        fallback = make_empty_details(first["url"])
        fallback.update({
            "title": first.get("title", ""),
            "price": first.get("price", 0) if first.get("price", 0) < 10**10 else 0,
            "image": first.get("image", PLACEHOLDER_IMAGE),
            "in_stock": True
        })
        return fallback

    except Exception as e:
        print(f"Scraper error: {e}")
        return None
    finally:
        if driver:
            try:
                driver.quit()
            except:
                pass

# ---------- CLI / main ----------
def print_result(product: Optional[Dict[str, Any]]):
    if not product:
        print("\n❌ No result to display from Croma.")
        return
    print("\n" + "="*70)
    print("🎯 BEST PRODUCT FOUND ON CROMA")
    print("="*70)
    print(f"📦 Title: {product.get('title','')}")
    print(f"💰 Price: ₹{product.get('price',0):,}")
    if product.get('original_price', 0) and product['original_price'] > product['price']:
        print(f"💸 Original Price: ₹{product['original_price']:,}")
    print(f"⭐ Rating: {product.get('rating','N/A')} ({product.get('review_count',0)} reviews)")
    print(f"🚚 Delivery: {product.get('delivery_date') or product.get('delivery_info','Check site')}")
    print(f"💳 Discount: {product.get('discount','')}")
    print(f"📦 In Stock: {'Yes' if product.get('in_stock') else 'No'}")
    print(f"🏷 Brand: {product.get('brand','')}")
    print(f"🏪 Seller: {product.get('seller','')}")
    print(f"🖼 Image: {product.get('image','')}")
    print(f"🔗 URL: {product.get('url')}")
    if product.get('features'):
        print(f"\n✨ Key Features:")
        for f in product['features'][:5]:
            print(f"  • {f}")
    print("="*70 + "\n")

if __name__ == "__main__":
    # quick test
    query = "laptop"
    pincode = "688524"
    print("\n" + "="*70)
    print(f"🔍 Testing Croma Scraper for: {query} | Pincode: {pincode}")
    print("="*70)
    result = scrape_croma(query=query, pincode=pincode, headless=True)
    print_result(result)