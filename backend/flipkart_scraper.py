import re
import requests
from bs4 import BeautifulSoup

PLACEHOLDER_IMAGE = "https://placehold.co/300x400/EEE/31343C?text=No+Image"

def clean_price_text(price_text: str) -> int:
    """Extracts integer rupee value from text."""
    if not price_text:
        return 0
    m = re.search(r'[\d,]+', str(price_text).replace('₹','').replace('Rs',''))
    if m:
        return int(m.group(0).replace(',', ''))
    return 0

def get_product_details(product_url: str, pincode: str = None):
    """
    Fetches detailed information from the product page.
    Returns dict with title, image, rating, stars, delivery_date, etc.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        # Add pincode cookie if provided
        cookies = {}
        if pincode:
            cookies['pincode'] = pincode
        
        resp = requests.get(product_url, headers=headers, cookies=cookies)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        
        details = {}
        
        # Extract title
        title_tag = soup.find("span", {"class": "VU-ZEz"}) or soup.find("h1", {"class": "yhB1nd"})
        details['title'] = title_tag.text.strip() if title_tag else "No title found"
        
        # Extract image
        image_tag = soup.find("img", {"class": "_0DkuPH"}) or soup.find("img", {"class": "_396cs4"})
        details['image'] = image_tag.get('src') if image_tag and image_tag.get('src') else PLACEHOLDER_IMAGE
        
        # Extract rating and review count
        rating_tag = soup.find("div", {"class": "XQDdHH"})
        details['rating'] = rating_tag.text.strip() if rating_tag else "No rating"
        
        review_tag = soup.find("span", {"class": "Wphh3N"})
        if review_tag:
            review_text = review_tag.text.strip()
            details['reviews'] = review_text.split()[0] if review_text else "0"
        else:
            details['reviews'] = "0"
        
        # Extract star rating
        star_tag = soup.find("div", {"class": "XQDdHH"})
        details['stars'] = star_tag.text.strip() if star_tag else "N/A"
        
        # Extract delivery date - FIXED: Changed text= to string=
        delivery_tag = soup.find("span", string=re.compile(r'Delivery by', re.IGNORECASE))
        if not delivery_tag:
            delivery_tag = soup.find("div", {"class": "_2P_LDn"})
        
        if delivery_tag:
            delivery_text = delivery_tag.text.strip()
            details['delivery_date'] = delivery_text
        else:
            details['delivery_date'] = "Delivery information not available"
        
        # Extract price
        price_tag = soup.find("div", {"class": "Nx9bqj"}) or soup.find("div", {"class": "_30jeqj"})
        details['price'] = clean_price_text(price_tag.text) if price_tag else 0
        
        # Extract discount if available
        discount_tag = soup.find("div", {"class": "UkUFwK"})
        details['discount'] = discount_tag.text.strip() if discount_tag else "No discount"
        
        # Extract highlights/features
        highlights = []
        highlight_section = soup.find_all("li", {"class": "_7eSDEY"})
        for hl in highlight_section[:5]:  # Get first 5 highlights
            highlights.append(hl.text.strip())
        details['highlights'] = highlights if highlights else ["No highlights available"]
        
        # Extract seller information
        seller_tag = soup.find("div", {"id": "sellerName"})
        details['seller'] = seller_tag.text.strip() if seller_tag else "Seller information not available"
        
        return details
        
    except Exception as e:
        print(f"Error fetching product details: {e}")
        return {
            'title': 'Error fetching details',
            'image': PLACEHOLDER_IMAGE,
            'rating': 'N/A',
            'reviews': '0',
            'stars': 'N/A',
            'delivery_date': 'N/A',
            'price': 0,
            'discount': 'N/A',
            'highlights': [],
            'seller': 'N/A'
        }

def scrape_flipkart(query: str, pincode: str = None):
    """
    Uses Requests and BeautifulSoup to scrape Flipkart.
    Returns dict with lowest priced product details.
    """
    search_url = f"https://www.flipkart.com/search?q={query.replace(' ', '%20')}"
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        resp = requests.get(search_url, headers=headers)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        products = []
        
        # Method 1: Try primary product containers
        product_containers = soup.find_all("div", {"class": "_1AtVbE"})
        for container in product_containers:
            product_link = container.find("a", {"class": "_1fQZEK"})
            if product_link and product_link.get("href"):
                product_url = "https://www.flipkart.com" + product_link["href"]
                price_tag = container.find("div", {"class": "_30jeqj"})
                if price_tag and price_tag.text:
                    price = clean_price_text(price_tag.text)
                    if price > 0:
                        products.append({
                            "price": price,
                            "url": product_url
                        })
        
        # Method 2: Fallback - find all product links
        if not products:
            product_links = soup.find_all('a', href=re.compile(r'/p/'))
            for link in product_links:
                if link.get('href'):
                    product_url = "https://www.flipkart.com" + link['href']
                    parent = link.find_parent('div')
                    if parent:
                        # FIXED: Changed text= to string=
                        price_elements = parent.find_all(string=re.compile(r'₹'))
                        for price_element in price_elements:
                            price_value = clean_price_text(price_element)
                            if price_value > 100:
                                products.append({
                                    "price": price_value,
                                    "url": product_url
                                })
                                break
        
        # Find the lowest priced product
        if products:
            lowest_product = min(products, key=lambda x: x['price'])
            
            # Get detailed information for the lowest priced product
            details = get_product_details(lowest_product['url'], pincode)
            details['url'] = lowest_product['url']
            
            return details
        
        return None

    except Exception as e:
        print(f"Flipkart extraction error: {e}")
        return None


'''# Test the scraper
if __name__ == "__main__":
    result = scrape_flipkart("runningshoes", pincode="688524")
    if result:
        print(f"Title: {result['title']}")
        print(f"Price: ₹{result['price']}")
        print(f"Rating: {result['rating']} ({result['reviews']} reviews)")
        print(f"Delivery: {result['delivery_date']}")
        print(f"Discount: {result['discount']}")
        print(f"Seller: {result['seller']}")
        print(f"Image: {result['image']}")
        print(f"URL: {result['url']}")
        print(f"Highlights: {', '.join(result['highlights'])}")'''