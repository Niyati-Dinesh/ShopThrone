import concurrent.futures
from amazon_scraper import scrape_amazon_lowest_price
from flipkart_scraper import scrape_flipkart
from snapdeal_scraper import scrape_snapdeal_lowest_price
import re

def clean_price(price_text):
    """Extract numeric price from text"""
    if not price_text:
        return 0
    
    # Remove currency symbols and commas, extract numbers
    price_match = re.search(r'[\d,]+\.?\d*', str(price_text))
    if price_match:
        price_str = price_match.group().replace(',', '')
        try:
            return float(price_str)
        except ValueError:
            return 0
    return 0

def get_top_deals_from_each_site(product: str, pincode: str = None):
    """
    Fetches the lowest price deal WITH FULL DETAILS from each platform.
    Returns: dict with detailed product info from each site
    """
    results = {
        "amazon": None,
        "flipkart": None,
        "snapdeal": None
    }
    
    def scrape_amazon_wrapper():
        try:
            print(f"🔍 Scraping Amazon for: {product}")
            data = scrape_amazon_lowest_price(query=product, pincode=pincode, headless=True)
            if data and not data.get('error'):
                print(f"✅ Amazon: Found product at ₹{data.get('price', 0)}")
                return ("amazon", data)
            print(f"⚠️ Amazon: No results")
            return ("amazon", None)
        except Exception as e:
            print(f"❌ Amazon error: {str(e)}")
            return ("amazon", None)
    
    def scrape_flipkart_wrapper():
        try:
            print(f"🔍 Scraping Flipkart for: {product}")
            data = scrape_flipkart(query=product, pincode=pincode)
            if data:
                print(f"✅ Flipkart: Found product at ₹{data.get('price', 0)}")
                return ("flipkart", data)
            print(f"⚠️ Flipkart: No results")
            return ("flipkart", None)
        except Exception as e:
            print(f"❌ Flipkart error: {str(e)}")
            return ("flipkart", None)
    
    def scrape_snapdeal_wrapper():
        try:
            print(f"🔍 Scraping Snapdeal for: {product}")
            data = scrape_snapdeal_lowest_price(query=product, pincode=pincode, filter_accessories=True)
            if data and not data.get('error'):
                print(f"✅ Snapdeal: Found product at ₹{data.get('price', 0)}")
                return ("snapdeal", data)
            print(f"⚠️ Snapdeal: No results")
            return ("snapdeal", None)
        except Exception as e:
            print(f"❌ Snapdeal error: {str(e)}")
            return ("snapdeal", None)
    
    # Run all scrapers in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = [
            executor.submit(scrape_amazon_wrapper),
            executor.submit(scrape_flipkart_wrapper),
            executor.submit(scrape_snapdeal_wrapper)
        ]
        
        for future in concurrent.futures.as_completed(futures):
            try:
                site, data = future.result()
                results[site] = data
            except Exception as e:
                print(f"❌ Error in scraper: {str(e)}")
    
    print(f"🎯 Scraping complete. Results: {sum(1 for v in results.values() if v is not None)} sites")
    return results


# Example usage
"""if __name__ == "__main__":
    result = get_top_deals_from_each_site(
        product="wireless mouse",
        pincode="682030"
    )
    
    print("\n" + "="*60)
    print("RESULTS FROM ALL PLATFORMS")
    print("="*60)
    
    for site, data in result.items():
        print(f"\n{site.upper()}:")
        if data:
            print(f"  Title: {data.get('title', 'N/A')}")
            print(f"  Price: ₹{data.get('price', 0)}")
            print(f"  Rating: {data.get('rating', 'N/A')}")
            print(f"  URL: {data.get('url', 'N/A')}")
        else:
            print("  No data available")"""