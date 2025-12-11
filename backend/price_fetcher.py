import concurrent.futures
import re
from typing import Dict, Any, Callable, List

# --- IMPORT SCRAPERS ---
from scraper.amazon_scraper import scrape_amazon_lowest_price
from scraper.flipkart_scraper import scrape_flipkart
from scraper.snapdeal_scraper import scrape_snapdeal
from scraper.reliancedigital_scraper import scrape_reliance_digital_playwright
from scraper.croma_scraper import scrape_croma
from scraper.ajio_scraper import scrape_ajio

# --- CATEGORY DEFINITIONS ---

ELECTRONICS_KEYWORDS = {
    'laptop', 'computer', 'pc', 'monitor', 'tv', 'television', 'led', 'oled',
    'mobile', 'phone', 'smartphone', 'tablet', 'ipad', 'iphone', 'samsung galaxy',
    'watch', 'smartwatch', 'band', 'fitbit',
    'headphone', 'earphone', 'earbud', 'airpod', 'speaker', 'soundbar', 'bluetooth',
    'camera', 'dslr', 'lens', 'tripod', 'gopro', 'drone',
    'console', 'playstation', 'ps4', 'ps5', 'xbox', 'nintendo', 'gamepad',
    'processor', 'gpu', 'graphic', 'cpu', 'motherboard', 'ram', 'memory',
    'ssd', 'hdd', 'hard drive', 'pendrive', 'usb', 'sd card',
    'cable', 'charger', 'power bank', 'adapter', 'hub',
    'fridge', 'refrigerator', 'washing machine', 'washer', 'dryer',
    'ac', 'air conditioner', 'cooler', 'fan', 'heater', 'geyser',
    'iron', 'vacuum', 'purifier', 'water purifier',
    'mixer', 'grinder', 'blender', 'juicer', 'microwave', 'oven', 'toaster', 'kettle','lights','light'
    'keyboard', 'mouse', 'printer', 'scanner', 'router', 'wifi', 'modem','Smartphones','headphones'
}

FASHION_KEYWORDS = {
    'shirt', 't-shirt', 'top', 'tee', 'polo', 'tunic',
    'jeans', 'pant', 'trouser', 'chinos', 'jogger', 'trackpant', 'short', 'skirt','denim','women','men'
    'dress', 'gown', 'frock', 'jumpsuit', 'bodysuit',
    'saree', 'sari', 'kurta', 'kurti', 'lehenga', 'choli', 'dupatta', 'salwar',
    'jacket', 'coat', 'blazer', 'suit', 'vest', 'waistcoat',
    'hoodie', 'sweatshirt', 'sweater', 'cardigan', 'pullover',
    'shoe', 'sneaker', 'boot', 'sandal', 'slipper', 'flip flop', 'heel', 'wedge',
    'flat', 'loafer', 'moccasin', 'oxford', 'derby', 'brogue',
    'bag', 'backpack', 'handbag', 'purse', 'clutch', 'tote', 'wallet',
    'belt', 'tie', 'bow', 'scarf', 'stole', 'shawl',
    'cap', 'hat', 'beanie',
    'sunglass', 'spectacle', 'frame',
    'jewellery', 'necklace', 'earring', 'ring', 'bracelet', 'bangle', 'chain', 'pendant',"perfume","lipstick","blush","gloss ","eyeliner","lashes ","mascara","powder ","highlighter","concealer","foundation","bronzer","moisturizet",'sunscreen'
}

def determine_category(query: str) -> str:
    """
    Analyzes the query string to determine if it is Electronics, Fashion, or General.
    """
    q = query.lower()
    tokens = set(re.findall(r'\w+', q))

    def check_keywords(keywords_set):
        for k in keywords_set:
            k_lower = k.lower()
            if ' ' in k_lower:
                if k_lower in q:
                    return True
            else:
                if k_lower in tokens:
                    return True
        return False

    if check_keywords(ELECTRONICS_KEYWORDS):
        return "electronics"
    
    if check_keywords(FASHION_KEYWORDS):
        return "fashion"
        
    return "general"

def get_scrapers_for_query(query: str) -> Dict[str, Callable]:
    """
    Returns a dictionary of {site_name: scraper_function} based on the query category.
    """
    category = determine_category(query)
    scrapers = {}

    print(f"🧠 Category detected for '{query}': {category.upper()}")

    # 1. ALWAYS include the giants (Amazon & Flipkart)
    scrapers['amazon'] = scrape_amazon_lowest_price
    scrapers['flipkart'] = scrape_flipkart

    # 2. Add category specific scrapers
    if category == "electronics":
        scrapers['croma'] = scrape_croma
        scrapers['reliance'] = scrape_reliance_digital_playwright
        # Electronics: exclude Snapdeal
        if 'snapdeal' in scrapers:
            del scrapers['snapdeal']
        
    elif category == "fashion":
        scrapers['ajio'] = scrape_ajio
        scrapers['snapdeal'] = scrape_snapdeal
        # Fashion: exclude Croma and Reliance
        if 'croma' in scrapers:
            del scrapers['croma']
        if 'reliance' in scrapers:
            del scrapers['reliance']
        
    else:
        # General/Other category
        scrapers['snapdeal'] = scrape_snapdeal

    return scrapers

def is_result_relevant(query: str, title: str) -> bool:
    """
    Basic check to warn if the found product title seems irrelevant.
    """
    if not title:
        return False
        
    q_tokens = set(re.findall(r'\w+', query.lower()))
    t_tokens = set(re.findall(r'\w+', title.lower()))
    
    stop_words = {'buy', 'online', 'best', 'price', 'in', 'india', 'mens', 'womens', 'cheap', 'product'}
    q_tokens = q_tokens - stop_words
    
    if not q_tokens:
        return True 
        
    overlap = q_tokens.intersection(t_tokens)
    return len(overlap) > 0

# --- MAIN FETCHING LOGIC ---

def get_top_deals_from_each_site(product: str, pincode: str = None):
    """
    Fetches the lowest price deal WITH FULL DETAILS from relevant platforms only.
    Returns a dictionary with ALL scrapers that were attempted.
    """
    results = {}
    
    # 1. Get the list of relevant scrapers based on category
    selected_scrapers = get_scrapers_for_query(product)
    print(f"🚀 Activating scrapers: {', '.join(selected_scrapers.keys()).upper()}")
    
    # 2. Initialize results dict with all possible scrapers
    all_possible_sites = ['amazon', 'flipkart', 'snapdeal', 'croma', 'reliance', 'ajio']
    for site in all_possible_sites:
        results[site] = None  # Initialize all to None

    # 3. Define the wrapper function for threading
    def run_scraper(site_name, scraper_func):
        try:
            print(f"🔍 Scraping {site_name.capitalize()} for: {product}")
            
            # Call scraper
            data = scraper_func(query=product, pincode=pincode, headless=True)
            
            # Validate Result
            if data and not data.get('error') and data.get('price'):
                if not is_result_relevant(product, data.get('title', '')):
                     print(f"⚠️ {site_name.capitalize()}: Found result '{data.get('title')[:30]}...' but might be irrelevant.")
                
                print(f"✅ {site_name.capitalize()}: Found product at ₹{data.get('price', 0):,}")
                return (site_name, data)
            
            # Handle empty results
            err = data.get('error') if data else 'No results found'
            print(f"⚠️ {site_name.capitalize()}: {err}")
            return (site_name, None)
            
        except Exception as e:
            print(f"❌ {site_name.capitalize()} error: {str(e)}")
            return (site_name, None)

    # 4. Run in parallel only for selected scrapers
    print(f"\n{'='*60}")
    print(f"🚀 Starting parallel scraping for: {product}")
    if pincode:
        print(f"📍 Using pincode: {pincode}")
    print(f"{'='*60}\n")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(selected_scrapers)) as executor:
        futures = []
        for site, func in selected_scrapers.items():
            futures.append(executor.submit(run_scraper, site, func))
        
        for future in concurrent.futures.as_completed(futures):
            try:
                site, data = future.result()
                results[site] = data
            except Exception as e:
                print(f"❌ Error in thread execution: {str(e)}")
    
    # Summary
    successful_sites = sum(1 for v in results.values() if v is not None)
    print(f"\n{'='*60}")
    print(f"🎯 Scraping complete. Results: {successful_sites}/{len(selected_scrapers)} sites found products")
    print(f"{'='*60}\n")
    
    return results

def get_best_deal(product: str, pincode: str = None):
    """
    Get the best deal across all platforms.
    """
    results = get_top_deals_from_each_site(product, pincode)
    
    # Filter out None values
    valid_results = [(site, data) for site, data in results.items() if data is not None]
    
    if not valid_results:
        return None, None
    
    # Find the site with lowest price
    best_site, best_data = min(valid_results, key=lambda x: x[1].get('price', float('inf')))
    
    return best_site, best_data

def get_all_deals_structured(product: str, pincode: str = None):
    """
    Get all deals in a structured format for API/UI consumption.
    """
    results = get_top_deals_from_each_site(product, pincode)
    
    # Filter out None values
    valid_results = [(site, data) for site, data in results.items() if data is not None]
    best_site, best_data = None, None
    
    if valid_results:
        best_site, best_data = min(valid_results, key=lambda x: x[1].get('price', float('inf')))
    
    # Calculate price range from valid results only
    prices = [data.get('price', 0) for site, data in valid_results]
    
    return {
        "product": product,
        "pincode": pincode,
        "category_detected": determine_category(product),
        "best_deal": {
            "site": best_site,
            "data": best_data
        },
        "all_deals": results,
        "summary": {
            "total_sites_searched": len(results),
            "sites_with_results": len(valid_results),
            "price_range": {
                "min": min(prices) if prices else 0,
                "max": max(prices) if prices else 0
            }
        }
    }