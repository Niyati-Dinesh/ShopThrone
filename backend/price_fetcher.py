import concurrent.futures
import re
from amazon_scraper import scrape_amazon_lowest_price
from flipkart_scraper import scrape_flipkart
from snapdeal_scraper import scrape_snapdeal

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
        """Amazon scraper wrapper"""
        try:
            print(f"🔍 Scraping Amazon for: {product}")
            data = scrape_amazon_lowest_price(query=product, pincode=pincode, headless=True)
            if data and not data.get('error') and data.get('price'):
                print(f"✅ Amazon: Found product at ₹{data.get('price', 0):,}")
                return ("amazon", data)
            
            error_msg = data.get('error') if data else 'No results'
            print(f"⚠️ Amazon: {error_msg}")
            return ("amazon", None)
        except Exception as e:
            print(f"❌ Amazon error: {str(e)}")
            import traceback
            traceback.print_exc()
            return ("amazon", None)
    
    def scrape_flipkart_wrapper():
        """Flipkart scraper wrapper"""
        try:
            print(f"🔍 Scraping Flipkart for: {product}")
            data = scrape_flipkart(query=product, pincode=pincode, headless=True)
            
            # Check for valid data
            if data and isinstance(data, dict) and data.get('price'):
                print(f"✅ Flipkart: Found product at ₹{data.get('price', 0):,}")
                return ("flipkart", data)
            
            print(f"⚠️ Flipkart: No results found")
            return ("flipkart", None)
        except Exception as e:
            print(f"❌ Flipkart error: {str(e)}")
            import traceback
            traceback.print_exc()
            return ("flipkart", None)
    
    def scrape_snapdeal_wrapper():
        """Snapdeal scraper wrapper"""
        try:
            print(f"🔍 Scraping Snapdeal for: {product}")
            data = scrape_snapdeal(query=product, pincode=pincode, headless=True)
            
            # Check for valid data
            if data and isinstance(data, dict) and data.get('price'):
                print(f"✅ Snapdeal: Found product at ₹{data.get('price', 0):,}")
                return ("snapdeal", data)
            
            print(f"⚠️ Snapdeal: No results found")
            return ("snapdeal", None)
        except Exception as e:
            print(f"❌ Snapdeal error: {str(e)}")
            import traceback
            traceback.print_exc()
            return ("snapdeal", None)
    
    # Run all scrapers in parallel
    print(f"\n{'='*60}")
    print(f"🚀 Starting parallel scraping for: {product}")
    if pincode:
        print(f"📍 Using pincode: {pincode}")
    print(f"{'='*60}\n")
    
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
    
    # Summary
    successful_sites = sum(1 for v in results.values() if v is not None)
    print(f"\n{'='*60}")
    print(f"🎯 Scraping complete. Results: {successful_sites}/3 sites found products")
    print(f"{'='*60}\n")
    
    return results


def get_best_deal(product: str, pincode: str = None):
    """
    Get the best deal across all platforms.
    Returns: tuple of (site_name, product_data)
    """
    results = get_top_deals_from_each_site(product, pincode)
    
    # Filter out None results and find minimum price
    valid_results = [(site, data) for site, data in results.items() if data is not None]
    
    if not valid_results:
        return None, None
    
    # Find the site with lowest price
    best_site, best_data = min(valid_results, key=lambda x: x[1].get('price', float('inf')))
    
    return best_site, best_data


def print_comparison_table(results: dict):
    """Pretty print comparison table of all results"""
    print("\n" + "="*100)
    print("📊 PRICE COMPARISON TABLE")
    print("="*100)
    
    # Header
    print(f"{'Platform':<15} {'Price':<12} {'Rating':<10} {'Delivery':<20} {'Status':<15}")
    print("-"*100)
    
    # Data rows
    for site, data in results.items():
        site_name = site.upper()
        
        if data:
            price = f"₹{data.get('price', 0):,}"
            
            # Handle rating display
            rating = data.get('rating', 'N/A')
            if rating == 'No rating':
                rating = 'N/A'
            
            reviews = data.get('reviews', data.get('review_count', '0'))
            if reviews and reviews != 'N/A' and reviews != '0' and reviews != 'No rating':
                rating += f" ({reviews})"
            
            delivery = data.get('delivery_date', data.get('delivery_info', 'N/A'))
            if delivery:
                delivery = str(delivery)[:18]
            status = "✅ Found"
        else:
            price = "-"
            rating = "-"
            delivery = "-"
            status = "❌ No results"
        
        print(f"{site_name:<15} {price:<12} {rating:<10} {delivery:<20} {status:<15}")
    
    print("="*100)
    
    # Find and highlight best deal
    valid_results = [(site, data) for site, data in results.items() if data is not None]
    if valid_results:
        best_site, best_data = min(valid_results, key=lambda x: x[1].get('price', float('inf')))
        print(f"\n🏆 BEST DEAL: {best_site.upper()} at ₹{best_data.get('price', 0):,}")
        
        # Calculate savings
        prices = [data.get('price', 0) for site, data in valid_results]
        max_price = max(prices)
        min_price = min(prices)
        if max_price > min_price:
            savings = max_price - min_price
            savings_percent = (savings / max_price) * 100
            print(f"💰 SAVE: ₹{savings:,} ({savings_percent:.1f}% off)")
        
        print(f"🔗 URL: {best_data.get('url', 'N/A')}")
    
    print("="*100 + "\n")


def print_detailed_results(results: dict):
    """Print detailed information for each platform"""
    print("\n" + "="*100)
    print("📋 DETAILED RESULTS FROM ALL PLATFORMS")
    print("="*100)
    
    for site, data in results.items():
        print(f"\n{'─'*100}")
        print(f"🏪 {site.upper()}")
        print(f"{'─'*100}")
        
        if data:
            print(f"📦 Title: {data.get('title', 'N/A')}")
            print(f"💰 Price: ₹{data.get('price', 0):,}")
            
            # Original price and discount
            original_price = data.get('original_price', 0)
            if original_price and original_price > data.get('price', 0):
                print(f"💸 Original Price: ₹{original_price:,}")
                
            discount = data.get('discount', '')
            if discount and discount != 'No discount':
                print(f"🎁 Discount: {discount}")
                
            # Rating and reviews
            rating = data.get('rating', 'N/A')
            if rating != 'No rating':
                print(f"⭐ Rating: {rating}")
            
            reviews = data.get('reviews', data.get('review_count', ''))
            if reviews and reviews != '0' and reviews != 'No rating':
                print(f"📝 Reviews: {reviews}")
            
            # Delivery information
            delivery_date = data.get('delivery_date', 'N/A')
            delivery_text = data.get('delivery_text', data.get('delivery_info', ''))
            print(f"🚚 Delivery: {delivery_date}")
            
            if delivery_text and delivery_text != delivery_date:
                print(f"   Details: {delivery_text}")
            
            # Seller information
            seller = data.get('seller', '')
            if seller and seller != 'N/A':
                print(f"🏪 Seller: {seller}")
            
            # Stock status
            in_stock = data.get('in_stock')
            if in_stock is not None:
                stock_status = "✅ In Stock" if in_stock else "❌ Out of Stock"
                print(f"📦 Stock: {stock_status}")
            
            # Additional details for Amazon
            if site == 'amazon':
                brand = data.get('brand', '')
                if brand:
                    print(f"🏷️  Brand: {brand}")
                
                features = data.get('features', [])
                if features:
                    print(f"✨ Features:")
                    for i, feature in enumerate(features[:3], 1):
                        print(f"   {i}. {feature[:80]}{'...' if len(feature) > 80 else ''}")
            
            print(f"🔗 URL: {data.get('url', 'N/A')}")
        else:
            print("❌ No data available")
    
    print(f"\n{'='*100}\n")


def get_all_deals_structured(product: str, pincode: str = None):
    """
    Get all deals in a structured format for API/UI consumption.
    Returns: dict with best deal and all deals
    """
    results = get_top_deals_from_each_site(product, pincode)
    
    # Find best deal
    valid_results = [(site, data) for site, data in results.items() if data is not None]
    best_site, best_data = None, None
    
    if valid_results:
        best_site, best_data = min(valid_results, key=lambda x: x[1].get('price', float('inf')))
    
    return {
        "product": product,
        "pincode": pincode,
        "best_deal": {
            "site": best_site,
            "data": best_data
        },
        "all_deals": results,
        "summary": {
            "total_sites_searched": 3,
            "sites_with_results": len(valid_results),
            "price_range": {
                "min": min([data.get('price', 0) for site, data in valid_results]) if valid_results else 0,
                "max": max([data.get('price', 0) for site, data in valid_results]) if valid_results else 0
            }
        }
    }


# Example usage
if __name__ == "__main__":
    # Test with a product search
    product = "wireless mouse"
    pincode = "688524"
    
    print(f"\n🔍 Searching for: {product}")
    print(f"📍 Delivery to: {pincode}\n")
    
    # Get results from all platforms
    results = get_top_deals_from_each_site(product=product, pincode=pincode)
    
    # Print comparison table
    print_comparison_table(results)
    
    # Print detailed results
    print_detailed_results(results)
    
    # Get best deal
    best_site, best_data = get_best_deal(product=product, pincode=pincode)
    if best_site:
        print(f"🎯 RECOMMENDATION: Buy from {best_site.upper()}")
        print(f"💰 Best Price: ₹{best_data.get('price', 0):,}")
        print(f"📦 Product: {best_data.get('title', 'N/A')}")
        print(f"🚚 Delivery: {best_data.get('delivery_date', 'N/A')}")
        print(f"🔗 Direct Link: {best_data.get('url', 'N/A')}\n")
    else:
        print("❌ No deals found on any platform\n")