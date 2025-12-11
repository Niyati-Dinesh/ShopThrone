import time
import random
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup


from langchain_core.runnables import RunnableMap, RunnableLambda,RunnableConfig,Runnable



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
    opts.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )

    service = Service(ChromeDriverManager().install())
    browser = webdriver.Chrome(service=service, options=opts)
    return browser


class AmazonSearchRunnable(Runnable):
    def __init__(self, query: str, pincode: str = None, headless: bool = True):
        self.query = query
        self.pincode = pincode
        self.headless = headless

    def invoke(self, *args, **kwargs):
        browser = get_browser(headless=self.headless)
        try:
            print(f"Searching for: {self.query}")
            products = self.scrape_amazon_search(self.query, browser)

            if not products:
                return {"error": "No products found"}

            print(f"Found {len(products)} products")
            lowest = min(products, key=lambda x: x['price'])
            print(f"Lowest price: ₹{lowest['price']} at {lowest['url']}")

            print("Fetching product details...")
            details = self.scrape_product_details(lowest['url'], browser, self.pincode)

            return details

        except Exception as e:
            return {"error": str(e)}

        finally:
            browser.quit()

    def scrape_amazon_search(self, query: str, browser):
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

    def change_pincode(self, browser, pincode: str):
        try:
            location_btn = WebDriverWait(browser, 10).until(
                EC.element_to_be_clickable((By.ID, "contextualIngressPtLabel"))
            )
            location_btn.click()
            random_delay(1, 2)

            pincode_input = WebDriverWait(browser, 10).until(
                EC.presence_of_element_located((By.ID, "GLUXZipUpdateInput"))
            )
            pincode_input.clear()
            pincode_input.send_keys(pincode)
            random_delay(0.5, 1)

            apply_btn = browser.find_element(
                By.CSS_SELECTOR, "input[aria-labelledby='GLUXZipUpdate-announce']"
            )
            apply_btn.click()
            random_delay(2, 3)

            try:
                done_btn = browser.find_element(By.CSS_SELECTOR, "button[name='glowDoneButton']")
                done_btn.click()
                random_delay(1, 2)
            except:
                pass

            return True
        except Exception as e:
            print(f"Could not change pincode: {e}")
            return False

    def scrape_product_details(self, product_url: str, browser, pincode: str = None):
        browser.get(product_url)
        random_delay(3, 5)
        if pincode:
            self.change_pincode(browser, pincode)
            random_delay(2, 3)

        soup = BeautifulSoup(browser.page_source, "html.parser")

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

        title_el = soup.select_one("#productTitle")
        if title_el:
            details["title"] = title_el.text.strip()

        price_el = soup.select_one("span.a-price.aok-align-center.reinventPricePriceToPayMargin.priceToPay span.a-price-whole")
        if not price_el:
            price_el = soup.select_one("span.a-price-whole")
        if price_el:
            details["price"] = clean_price_text(price_el.text)

        mrp_el = soup.select_one("span.a-price.a-text-price span.a-offscreen")
        if mrp_el:
            details["original_price"] = clean_price_text(mrp_el.text)

        discount_el = soup.select_one("span.savingsPercentage")
        if discount_el:
            details["discount"] = discount_el.text.strip()

        rating_el = soup.select_one("span.a-icon-alt")
        if rating_el:
            rating_text = rating_el.text.strip()
            match = re.search(r'([\d.]+)\s*out of', rating_text)
            if match:
                details["rating"] = float(match.group(1))

        review_el = soup.select_one("#acrCustomerReviewText")
        if review_el:
            review_text = review_el.text.strip()
            match = re.search(r'([\d,]+)', review_text)
            if match:
                details["review_count"] = int(match.group(1).replace(',', ''))

        img_el = soup.select_one("#landingImage")
        if not img_el:
            img_el = soup.select_one("#imgBlkFront")
        if img_el:
            details["image"] = img_el.get("src", PLACEHOLDER_IMAGE)

        img_thumbs = soup.select("img.a-dynamic-image")
        for img in img_thumbs[:6]:
            img_url = img.get("src", "")
            if img_url and img_url not in details["images"]:
                details["images"].append(img_url)

        delivery_el = soup.select_one("#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE b")
        if not delivery_el:
            delivery_el = soup.select_one("span[data-csa-c-delivery-time]")
        if delivery_el:
            details["delivery_date"] = delivery_el.text.strip()

        delivery_info_el = soup.select_one("#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE")
        if delivery_info_el:
            details["delivery_info"] = delivery_info_el.text.strip()

        avail_el = soup.select_one("#availability span")
        if avail_el:
            avail_text = avail_el.text.strip()
            details["availability"] = avail_text
            details["in_stock"] = "in stock" in avail_text.lower() or "available" in avail_text.lower()

        brand_el = soup.select_one("#bylineInfo")
        if brand_el:
            details["brand"] = brand_el.text.strip().replace("Visit the ", "").replace(" Store", "").replace("Brand: ", "")

        desc_el = soup.select_one("#feature-bullets ul")
        if desc_el:
            features = []
            for li in desc_el.select("li"):
                text = li.text.strip()
                if text:
                    features.append(text)
            details["features"] = features

        if not details["features"]:
            desc_el = soup.select_one("#productDescription p")
            if desc_el:
                details["description"] = desc_el.text.strip()

        spec_tables = soup.select("table.a-keyvalue")
        for table in spec_tables:
            rows = table.select("tr")
            for row in rows:
                cells = row.select("td")
                if len(cells) == 2:
                    key = cells[0].text.strip()
                    value = cells[1].text.strip()
                    if key and value:
                        details["specifications"][key] = value

        seller_el = soup.select_one("#sellerProfileTriggerId")
        if seller_el:
            details["seller"] = seller_el.text.strip()

        return details


def scrape_amazon_lowest_price(query: str, pincode: str = None, headless: bool = True):
    """
    Wrapper function to match the interface expected by price_fetcher.py.
    It instantiates and invokes the AmazonSearchRunnable.
    """
    try:
        runnable = AmazonSearchRunnable(query=query, pincode=pincode, headless=headless)
        result = runnable.invoke()
        return result
    except Exception as e:
        print(f"Error in Amazon wrapper: {e}")
        return {"error": str(e)}
# --- END OF FIX ---


# Usage
import json

if __name__ == "__main__":
    # Test the new wrapper function
    print("Testing scrape_amazon_lowest_price wrapper...")
    result = scrape_amazon_lowest_price(query="laptop", pincode="688524", headless=True)
    print(json.dumps(result, indent=4, ensure_ascii=False))