import time
import random
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
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

def random_delay(a=1.0, b=2.5):
    time.sleep(random.uniform(a, b))

def get_browser(headless=True):
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("start-maximized")
    opts.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

    service = Service(ChromeDriverManager().install())
    browser = webdriver.Chrome(service=service, options=opts)
    return browser

def scrape_amazon(query: str, browser):
    """
    Uses Selenium to scrape Amazon.
    Returns list of dicts: [{'price': int, 'url': str, 'image': str}, …]
    """
    url = f"https://www.amazon.in/s?k={query.replace(' ', '+')}"
    browser.get(url)
    random_delay(3, 5)
    soup = BeautifulSoup(browser.page_source, "html.parser")

    results = []
    for div in soup.select("div[data-component-type='s-search-result']"):
        try:
            link = div.select_one("a.a-link-normal.s-no-outline")
            if not link:
                continue
            href = link.get("href")
            product_url = "https://www.amazon.in" + href
            price_el = div.select_one("span.a-price-whole")
            price = clean_price_text(price_el.text if price_el else "")
            img = div.select_one("img.s-image")
            image_url = img.get("src") if img else PLACEHOLDER_IMAGE
            if price > 0:
                results.append({"price": price, "url": product_url, "image": image_url})
        except Exception:
            continue
    return results


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

def scrape_snapdeal(query: str):
    """
    Uses Requests and BeautifulSoup to scrape Snapdeal.
    Returns list of dicts: [{'price': int, 'url': str, 'image': str}, …]
    """
    search_url = f"https://www.snapdeal.com/search?keyword={query.replace(' ', '%20')}"
    try:
        resp = requests.get(search_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        
        results = []
        
        # Find product containers
        products = soup.select("div.product-tuple-listing")
        
        for product in products:
            link_tag = product.select_one("a.dp-widget-link")
            price_tag = product.select_one("span.product-price")
            img_tag = product.select_one("img.product-image")

            if link_tag and price_tag:
                product_url = link_tag.get("href")
                price = clean_price_text(price_tag.text)
                
                # Snapdeal often lazy-loads images
                image_url = img_tag.get('src') or img_tag.get('data-src') or PLACEHOLDER_IMAGE
                
                if price > 0 and product_url:
                    results.append({
                        "price": price,
                        "url": product_url,
                        "image": image_url
                    })
        
        return results

    except Exception as e:
        print(f"Snapdeal extraction error: {e}")
        return []
    
    
in the amazon scraper code , right now its currently fetching the prices , but make it correctly fetch the lowest priced product among all the other product , and for that particular product return its title image review starts delivery date using pincode passed through frontend and other possible details ad 

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

def scrape_flipkart(query: str):
    """
    Uses Requests and BeautifulSoup to scrape Flipkart.
    Returns list of dicts: [{'price': int, 'url': str, 'image': str}, …]
    """
    search_url = f"https://www.flipkart.com/search?q={query.replace(' ', '%20')}"
    try:
        resp = requests.get(search_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        results = []
        
        product_containers = soup.find_all("div", {"class": "_1AtVbE"})
        for container in product_containers:
            product_link = container.find("a", {"class": "_1fQZEK"})
            if product_link and product_link.get("href"):
                product_url = "https://www.flipkart.com" + product_link["href"]
                price_tag = container.find("div", {"class": "_30jeqj"})
                if price_tag and price_tag.text:
                    price = clean_price_text(price_tag.text)
                    image_tag = container.find('img', class_='_396cs4')
                    image_url = image_tag.get('src') if image_tag and image_tag.get('src') else PLACEHOLDER_IMAGE
                    
                    if price > 0:
                        results.append({
                            "price": price,
                            "url": product_url,
                            "image": image_url
                        })
        if results:
            return results

        product_links = soup.find_all('a', href=re.compile(r'/p/'))
        for link in product_links:
            if link.get('href'):
                product_url = "https://www.flipkart.com" + link['href']
                parent = link.find_parent('div')
                if parent:
                    price_elements = parent.find_all(text=re.compile(r'₹'))
                    for price_element in price_elements:
                        price_value = clean_price_text(price_element)
                        if price_value > 100:
                            results.append({
                                "price": price_value,
                                "url": product_url,
                                "image": PLACEHOLDER_IMAGE
                            })
                            return results
        return results

    except Exception as e:
        print(f"Flipkart extraction error: {e}")
        return []
