import re
import requests
from bs4 import BeautifulSoup
from difflib import SequenceMatcher

PLACEHOLDER_IMAGE = "https://placehold.co/300x400/EEE/31343C?text=No+Image"

# Common accessory/related product keywords to filter out
ACCESSORY_KEYWORDS = [
    'case', 'cover', 'stand', 'holder', 'mount', 'adapter', 'cable', 'charger',
    'screen protector', 'tempered glass', 'earphone', 'headphone', 'bag', 'pouch','covers',
    'stylus', 'pen', 'accessory', 'combo', 'kit', 'set of', 'pack of', 'bundle',
    'replacement', 'spare', 'belt', 'strap', 'band', 'clip', 'sleeve', 'skin',
    'decal', 'sticker', 'cleaner', 'wipe', 'protector', 'guard', 'film','pads'
]

def clean_price_text(price_text: str) -> int:
    """Extracts integer rupee value from text."""
    if not price_text:
        return 0
    m = re.search(r'[\d,]+', str(price_text).replace('₹','').replace('Rs',''))
    if m:
        return int(m.group(0).replace(',', ''))
    return 0

def calculate_similarity(str1: str, str2: str) -> float:
    """Calculate similarity ratio between two strings."""
    return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()

def is_accessory(title: str, query: str) -> bool:
    """
    Check if product is an accessory or related product.
    Returns True if it's an accessory, False if it's the main product.
    """
    title_lower = title.lower()
    query_lower = query.lower()
    
    # Check for accessory keywords
    for keyword in ACCESSORY_KEYWORDS:
        if keyword in title_lower:
            return True
    
    # Check if title contains query terms (main product should match well)
    # Extract main product terms from query (remove brand names in some cases)
    query_words = set(query_lower.split())
    title_words = set(title_lower.split())
    
    # Calculate overlap - main products should have good overlap
    common_words = query_words.intersection(title_words)
    
   
    if len(common_words) < len(query_words) * 0.3:  # Less than 30% overlap
        return True
    
   
    if ' for ' in title_lower:
       
        for_index = title_lower.find(' for ')
        after_for = title_lower[for_index:]
        if any(word in after_for for word in query_words):
            return True
    
    return False

def is_exact_product_match(title: str, query: str, min_similarity: float = 0.4) -> bool:
    """
    Check if product title matches the query intent.
    Returns True if it's a good match for the searched product.
    """
    # First check if it's an accessory
    if is_accessory(title, query):
        return False
    
    # Calculate similarity
    similarity = calculate_similarity(title, query)
    
    # Check if main query words are present
    query_words = query.lower().split()
    title_lower = title.lower()
    
    matches = sum(1 for word in query_words if word in title_lower)
    match_ratio = matches / len(query_words) if query_words else 0
    
    # Product should match at least 40% similarity or have good word overlap
    return similarity >= min_similarity or match_ratio >= 0.5

def scrape_snapdeal_search(query: str, filter_accessories: bool = True):
    """
    Scrapes Snapdeal search results.
    Returns list of dicts: [{'price': int, 'url': str, 'image': str, 'title': str}, …]
    """
    search_url = f"https://www.snapdeal.com/search?keyword={query.replace(' ', '%20')}"
    try:
        resp = requests.get(search_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        
        results = []
        products = soup.select("div.product-tuple-listing")
        
        for product in products:
            link_tag = product.select_one("a.dp-widget-link")
            price_tag = product.select_one("span.product-price")
            img_tag = product.select_one("img.product-image")
            title_tag = product.select_one("p.product-title")

            if link_tag and price_tag:
                product_url = link_tag.get("href")
                price = clean_price_text(price_tag.text)
                title = title_tag.text.strip() if title_tag else ""
                
                # Filter accessories if enabled
                if filter_accessories and title:
                    if not is_exact_product_match(title, query):
                        continue
                
                image_url = img_tag.get('src') or img_tag.get('data-src') or PLACEHOLDER_IMAGE
                
                if price > 0 and product_url:
                    results.append({
                        "price": price,
                        "url": product_url,
                        "image": image_url,
                        "title": title
                    })
        
        return results

    except Exception as e:
        print(f"Snapdeal search error: {e}")
        return []

def scrape_product_details(product_url: str, pincode: str = None):
    """
    Scrapes detailed information from a Snapdeal product page.
    Returns dict with all available product details.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        
        cookies = {}
        if pincode:
            cookies['pincode'] = pincode
        
        resp = requests.get(product_url, headers=headers, cookies=cookies, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        
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
            "cod_available": False
        }
        
        # Title
        title_el = soup.select_one("h1.pdp-e-i-head")
        if not title_el:
            title_el = soup.select_one("h1[itemprop='name']")
        if title_el:
            details["title"] = title_el.text.strip()
        
        # Price
        price_el = soup.select_one("span.payBlkBig")
        if not price_el:
            price_el = soup.select_one("span.selling-price")
        if price_el:
            details["price"] = clean_price_text(price_el.text)
        
        # Original price (MRP)
        mrp_el = soup.select_one("span.pdp-strikthrough-price")
        if not mrp_el:
            mrp_el = soup.select_one("span.lfloat.product-price.strike")
        if mrp_el:
            details["original_price"] = clean_price_text(mrp_el.text)
        
        # Discount
        discount_el = soup.select_one("span.percent-desc")
        if discount_el:
            details["discount"] = discount_el.text.strip()
        
        # Rating
        rating_el = soup.select_one("span.avrg-rating")
        if not rating_el:
            rating_el = soup.select_one("span[itemprop='ratingValue']")
        if rating_el:
            try:
                details["rating"] = float(rating_el.text.strip())
            except:
                pass
        
        # Review count
        review_el = soup.select_one("span.ratings-count")
        if not review_el:
            review_el = soup.select_one("span[itemprop='reviewCount']")
        if review_el:
            review_text = review_el.text.strip()
            match = re.search(r'([\d,]+)', review_text)
            if match:
                details["review_count"] = int(match.group(1).replace(',', ''))
        
        # Main image
        img_el = soup.select_one("img.cloudzoom")
        if not img_el:
            img_el = soup.select_one("img[itemprop='image']")
        if img_el:
            details["image"] = img_el.get("src", PLACEHOLDER_IMAGE)
        
        # All images
        img_thumbs = soup.select("li.slider-cell img")
        for img in img_thumbs[:6]:
            img_url = img.get("src", "")
            if img_url and img_url not in details["images"]:
                # Get higher resolution image
                img_url = img_url.replace('_thumb', '_zoom')
                details["images"].append(img_url)
        
        # Delivery info
        delivery_el = soup.select_one("span.availDetailCol")
        if not delivery_el:
            delivery_el = soup.select_one("div.delivery-info")
        if delivery_el:
            details["delivery_info"] = delivery_el.text.strip()
            # Extract delivery date if present
            date_match = re.search(r'(\d{1,2}\s+\w+)', delivery_el.text)
            if date_match:
                details["delivery_date"] = date_match.group(1)
        
        # Availability
        avail_el = soup.select_one("div.available")
        if not avail_el:
            avail_el = soup.select_one("span.in-stock")
        if avail_el:
            avail_text = avail_el.text.strip()
            details["availability"] = avail_text
            details["in_stock"] = "in stock" in avail_text.lower() or "available" in avail_text.lower()
        else:
            # Default to in stock if no availability info
            details["in_stock"] = True
            details["availability"] = "Check availability"
        
        # COD availability
        cod_el = soup.select_one("div.cod-text")
        if cod_el and "cash on delivery" in cod_el.text.lower():
            details["cod_available"] = True
        
        # Brand
        brand_el = soup.select_one("a.dp-brand-title")
        if not brand_el:
            brand_el = soup.select_one("span[itemprop='brand']")
        if brand_el:
            details["brand"] = brand_el.text.strip()
        
        # Features/Description
        features_el = soup.select("div.h-content ul li")
        if features_el:
            for li in features_el:
                text = li.text.strip()
                if text:
                    details["features"].append(text)
        
        # If no features in list, try description
        if not details["features"]:
            desc_el = soup.select_one("div.detailssubbox p")
            if desc_el:
                details["description"] = desc_el.text.strip()
        
        # Specifications
        spec_rows = soup.select("div.spec-body tr")
        for row in spec_rows:
            cells = row.select("td")
            if len(cells) == 2:
                key = cells[0].text.strip()
                value = cells[1].text.strip()
                if key and value:
                    details["specifications"][key] = value
        
        # Alternative spec format
        if not details["specifications"]:
            spec_items = soup.select("div.detailssubbox")
            for item in spec_items:
                label = item.select_one("span.h-bold")
                value_el = item.select_one("span:not(.h-bold)")
                if label and value_el:
                    details["specifications"][label.text.strip()] = value_el.text.strip()
        
        # Seller info
        seller_el = soup.select_one("span.seller-name")
        if not seller_el:
            seller_el = soup.select_one("div.sold-by a")
        if seller_el:
            details["seller"] = seller_el.text.strip()
        
        return details
        
    except Exception as e:
        print(f"Snapdeal product details error: {e}")
        return {"error": str(e), "url": product_url}

def scrape_snapdeal_lowest_price(query: str, pincode: str = None, filter_accessories: bool = True):
   
    try:
        # Step 1: Get search results with filtering
        print(f"Searching Snapdeal for: {query}")
        products = scrape_snapdeal_search(query, filter_accessories=filter_accessories)
        
        if not products:
            return {"error": "No products found matching the criteria"}
        
        print(f"Found {len(products)} relevant products")
        
        # Step 2: Find lowest priced product
        lowest = min(products, key=lambda x: x['price'])
        print(f"Lowest price: ₹{lowest['price']}")
        print(f"Product: {lowest['title']}")
        print(f"URL: {lowest['url']}")
        
        # Step 3: Scrape full details of lowest priced product
        print("Fetching product details...")
        details = scrape_product_details(lowest['url'], pincode)
        
        return details
        
    except Exception as e:
        return {"error": str(e)}


# Example usage
"""if __name__ == "__main__":
    # Search for a product and get lowest priced item details
    result = scrape_snapdeal_lowest_price(
        query="wireless mouse",
        pincode="682001",  # Optional: Pass pincode from frontend
        filter_accessories=True  # Filter out cases, covers, etc.
    )
    
    # Print results
    print("\n" + "="*60)
    print("LOWEST PRICED PRODUCT DETAILS (SNAPDEAL)")
    print("="*60)
    
    if "error" in result:
        print(f"Error: {result['error']}")
    else:
        print(f"\nTitle: {result['title']}")
        print(f"Price: ₹{result['price']}")
        if result['original_price']:
            print(f"Original Price: ₹{result['original_price']}")
            savings = result['original_price'] - result['price']
            print(f"You Save: ₹{savings}")
        if result['discount']:
            print(f"Discount: {result['discount']}")
        print(f"Rating: {result['rating']} stars ({result['review_count']} reviews)")
        print(f"Brand: {result['brand']}")
        print(f"Availability: {result['availability']}")
        print(f"In Stock: {result['in_stock']}")
        print(f"COD Available: {result['cod_available']}")
        print(f"Delivery Info: {result['delivery_info']}")
        if result['delivery_date']:
            print(f"Delivery Date: {result['delivery_date']}")
        print(f"Seller: {result['seller']}")
        print(f"\nImage: {result['image']}")
        print(f"Product URL: {result['url']}")
        
        if result['features']:
            print(f"\nKey Features:")
            for feat in result['features'][:5]:
                print(f"  • {feat}")
        
        if result['specifications']:
            print(f"\nSpecifications:")
            for key, val in list(result['specifications'].items())[:5]:
                print(f"  • {key}: {val}")
        
        if result['images']:
            print(f"\nAdditional Images: {len(result['images'])} available")"""