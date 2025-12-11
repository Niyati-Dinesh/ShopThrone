"""
Reliance Digital scraper (Playwright version) - Fixed try/except issues

Usage:
    - Install: pip install playwright
      then: playwright install
    - Run: python reliance_digital_playwright.py

This file is the corrected, self-contained Playwright scraper. All `try:` blocks
in this module have matching `except` (and/or `finally`) clauses to satisfy
Python linters (Pylance / pylint / pyflakes).
"""

import re
import time
import json
from typing import Dict, Any, List, Optional
from urllib.parse import quote_plus, urljoin

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

# ---------- Config ----------
PLACEHOLDER_IMAGE = "https://placehold.co/300x400/EEE/31343C?text=No+Image"
DEFAULT_TIMEOUT = 15000  # milliseconds
MAX_SCROLLS = 12
VALID_PRICE_MIN = 1000
VALID_PRICE_MAX = 10_000_000

# ---------- Helpers ----------
def clean_price_text(price_text: str) -> int:
    """Extract integer rupee value from text like '₹1,29,900' -> 129900."""
    try:
        if not price_text:
            return 0
        s = str(price_text)
        # Normalize non-breaking spaces
        s = s.replace('\xa0', ' ')
        # Remove common currency tokens then find numeric group
        m = re.search(r'([\d,]+(?:\.\d+)?)', s.replace('₹', '').replace('Rs', '').replace('INR', ''), re.I)
        if not m:
            return 0
        num = m.group(1).replace(',', '')
        if '.' in num:
            num = num.split('.')[0]
        return int(num)
    except Exception:
        return 0


def make_empty_details(product_url: str) -> Dict[str, Any]:
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
        "seller": "Reliance Digital",
        "in_stock": False,
        "warranty": "",
        "emi_available": False
    }


# ---------- Page utilities ----------
def safe_wait_for_selector(page, selector: str, timeout: int = DEFAULT_TIMEOUT) -> Optional[bool]:
    try:
        page.wait_for_selector(selector, timeout=timeout)
        return True
    except PlaywrightTimeoutError:
        return False
    except Exception:
        return False


def scroll_to_load(page, max_scrolls: int = MAX_SCROLLS, pause: float = 0.9):
    """Scroll to bottom repeatedly to trigger lazy loading."""
    for _ in range(max_scrolls):
        try:
            page.evaluate("window.scrollBy(0, document.body.scrollHeight);")
            time.sleep(pause)
            # small upward nudge to trigger frameworks which lazy-load on up-scroll
            page.evaluate("window.scrollBy(0, -50);")
        except Exception:
            # swallow per-iteration errors and continue
            time.sleep(0.5)


# ---------- Product extraction from search results ----------
def extract_products_from_search_page(page) -> List[Dict[str, Any]]:
    """
    Given a Playwright page positioned on a search or collection page,
    extract product cards and return list of dicts: {url, title, price_text, image}.
    """
    products: List[Dict[str, Any]] = []
    try:
        # Run a robust JS snippet in the page context to collect candidate product anchors/cards.
        script = r"""
        (() => {
            const out = [];
            const seen = new Set();
            const candidates = Array.from(document.querySelectorAll(
                'a[href*="/pd/"], a[href*="/p/"], a[href*="/product/"], [data-testid*="product"], .product-card, .sp__product, .product__item, [class*="ProductCard"]'
            ));
            for (const el of candidates) {
                try {
                    const linkEl = el.tagName === 'A' ? el : (el.querySelector('a[href*="/pd/"]') || el.querySelector('a[href*="/p/"]') || el.querySelector('a'));
                    if (!linkEl) continue;
                    let href = linkEl.href || linkEl.getAttribute('href') || '';
                    if (!href) continue;
                    if (href.startsWith('/')) href = window.location.origin + href;
                    if (!href.includes('reliancedigital.in')) continue;
                    if (seen.has(href)) continue;
                    seen.add(href);

                    let title = '';
                    const titleEl = el.querySelector('.sp__name, .product__title, .product-title, [class*="ProductTitle"], h3, h2, strong, .product-name, .pname, .productName') || linkEl;
                    if (titleEl) title = (titleEl.innerText || titleEl.textContent || '').trim();

                    let price_text = '';
                    const priceEl = el.querySelector('.sp__price, .price, [class*="Price"], [class*="offer"], .product__price, .price-number, .final-price, .productPrice');
                    if (priceEl) price_text = (priceEl.innerText || priceEl.textContent || '').trim();
                    if (!price_text) {
                        const txt = el.innerText || '';
                        const m = txt.match(/₹[\d,\. ]+/);
                        if (m) price_text = m[0];
                    }

                    let image = '';
                    const img = el.querySelector('img') || linkEl.querySelector('img');
                    if (img) image = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-srcset') || '';
                    if (image && image.startsWith('//')) image = window.location.protocol + image;

                    out.push({url: href, title: title, price_text: price_text, image: image});
                } catch(e) {
                    // ignore per-card errors
                }
            }
            return out;
        })();
        """
        try:
            items = page.evaluate(script)
        except Exception:
            items = []

        if isinstance(items, list):
            for it in items:
                try:
                    url = it.get("url", "")
                    if not url or "reliancedigital.in" not in url:
                        continue
                    products.append({
                        "url": url,
                        "title": (it.get("title") or "").strip(),
                        "price_text": (it.get("price_text") or "").strip(),
                        "image": it.get("image") or PLACEHOLDER_IMAGE
                    })
                except Exception:
                    # skip malformed item
                    continue

        # If nothing found, try simpler anchor-based fallback
        if not products:
            try:
                anchors = page.query_selector_all("a[href*='/pd/'], a[href*='/p/'], a[href*='/product/']")
            except Exception:
                anchors = []

            seen_anchors = set()
            for a in anchors[:200]:
                try:
                    href = a.get_attribute("href") or ""
                    if not href:
                        continue
                    if href.startswith('/'):
                        href = urljoin(page.url, href)
                    if href in seen_anchors or "reliancedigital.in" not in href:
                        continue
                    seen_anchors.add(href)

                    # try nearest price
                    price_text = ""
                    try:
                        parent = a.evaluate_handle("node => node.closest('div') || node.parentElement")
                        if parent:
                            # parent's innerText may include a price
                            p_txt = parent.evaluate("node => node.innerText || ''")
                            if p_txt and '₹' in p_txt:
                                m = re.search(r'₹[\d,\,\.\s]+', p_txt)
                                price_text = m.group(0) if m else ""
                    except Exception:
                        price_text = ""

                    # try image
                    img_src = ""
                    try:
                        img = a.query_selector("img")
                        if img:
                            img_src = img.get_attribute("src") or img.get_attribute("data-src") or ""
                    except Exception:
                        img_src = ""

                    title_text = ""
                    try:
                        title_text = (a.inner_text() or "").strip()
                    except Exception:
                        title_text = ""

                    products.append({
                        "url": href,
                        "title": title_text,
                        "price_text": price_text,
                        "image": img_src or PLACEHOLDER_IMAGE
                    })
                except Exception:
                    continue

    except Exception as e:
        # top-level extraction error: return whatever we have
        # printing is optional; keep quiet in library mode
        # print("extract_products_from_search_page error:", e)
        pass

    return products


# ---------- Product details extractor ----------
def get_product_details(page, product_url: str, pincode: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Visit the product URL and extract all details into the details dict.
    """
    details = make_empty_details(product_url)
    try:
        try:
            page.goto(product_url, timeout=DEFAULT_TIMEOUT)
        except PlaywrightTimeoutError:
            # proceed even if navigation timed out (partial content may exist)
            pass
        except Exception:
            pass

        # Wait for body
        safe_wait_for_selector(page, "body", timeout=8000)
        # Give SPA time to hydrate
        time.sleep(2.0)

        # Try JSON-LD structured data first
        try:
            json_ld_texts = []
            try:
                json_ld_texts = page.evaluate("""
                    () => {
                        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                        return scripts.map(s => s.textContent);
                    }
                """)
            except Exception:
                json_ld_texts = []

            if json_ld_texts:
                for txt in json_ld_texts:
                    if not txt:
                        continue
                    data = None
                    try:
                        data = json.loads(txt)
                    except Exception:
                        # Attempt to locate an object containing "@type":"Product" via regex
                        try:
                            m = re.search(r'(\{[\s\S]*?"@type"\s*:\s*"?Product"?[\s\S]*?\})', txt)
                            if m:
                                data = json.loads(m.group(1))
                        except Exception:
                            data = None

                    if not data:
                        continue

                    # If data is array, pick Product object
                    if isinstance(data, list):
                        for d in data:
                            if isinstance(d, dict) and d.get('@type', '').lower() == 'product':
                                data = d
                                break

                    if isinstance(data, dict) and data.get('@type', '').lower() == 'product':
                        try:
                            details["title"] = data.get("name") or details["title"]
                            brand = data.get("brand", "")
                            if isinstance(brand, dict):
                                details["brand"] = brand.get("name") or details["brand"]
                            elif isinstance(brand, str):
                                details["brand"] = brand or details["brand"]
                            details["description"] = data.get("description") or details["description"]
                            img = data.get("image")
                            if isinstance(img, list) and img:
                                details["images"] = [i for i in img if isinstance(i, str)]
                                details["image"] = details["images"][0] if details["images"] else details["image"]
                            elif isinstance(img, str) and img:
                                details["image"] = img

                            if "offers" in data:
                                offers = data["offers"]
                                if isinstance(offers, dict):
                                    price_str = offers.get("price", "") or offers.get("priceCurrency", "")
                                    try:
                                        details["price"] = int(float(price_str)) if str(price_str).strip() else details["price"]
                                    except Exception:
                                        pass
                                    avail = offers.get("availability", "")
                                    details["in_stock"] = "instock" in str(avail).lower()
                                    details["availability"] = "In stock" if details["in_stock"] else details["availability"]
                                elif isinstance(offers, list) and offers:
                                    try:
                                        price_str = offers[0].get("price", "")
                                        details["price"] = int(float(price_str)) if str(price_str).strip() else details["price"]
                                        avail = offers[0].get("availability", "")
                                        details["in_stock"] = "instock" in str(avail).lower()
                                        details["availability"] = "In stock" if details["in_stock"] else details["availability"]
                                    except Exception:
                                        pass

                            if "aggregateRating" in data:
                                try:
                                    rating_data = data["aggregateRating"]
                                    details["rating"] = float(rating_data.get("ratingValue", 0) or 0)
                                    details["review_count"] = int(rating_data.get("reviewCount", 0) or 0)
                                except Exception:
                                    pass
                        except Exception:
                            # continue trying DOM fallbacks
                            pass
                        # once JSON-LD product found, break
                        break
        except Exception:
            pass

        # Title fallback
        if not details["title"]:
            title_selectors = [
                "h1.pdp__title",
                "h1[class*='title']",
                "h1.product-title",
                ".pdp__product-name",
                "h1",
                ".product-name"
            ]
            for sel in title_selectors:
                try:
                    el = page.query_selector(sel)
                    if el:
                        txt = el.inner_text().strip()
                        if txt:
                            details["title"] = txt
                            break
                except Exception:
                    continue

        # Brand fallback
        if not details["brand"]:
            brand_selectors = [
                ".pdp__brand",
                "[class*='brand']",
                ".product-brand",
                "meta[itemprop='brand']"
            ]
            for sel in brand_selectors:
                try:
                    el = page.query_selector(sel)
                    if el:
                        if sel.startswith("meta"):
                            v = el.get_attribute("content") or ""
                        else:
                            v = el.inner_text().strip()
                        if v and len(v) < 100:
                            details["brand"] = v
                            break
                except Exception:
                    continue

        # Price extraction (smart)
        if not details["price"]:
            price_candidates: List[int] = []
            try:
                js_collect = r"""
                () => {
                    const out = [];
                    const nodes = Array.from(document.querySelectorAll('span, div, p, strong'));
                    for (const n of nodes) {
                        try {
                            const txt = n.innerText || '';
                            if (!txt || txt.indexOf('₹') === -1) continue;
                            if (txt.length > 120) continue;
                            out.push(txt.trim());
                        } catch(e){}
                    }
                    return out.slice(0, 80);
                }
                """
                price_texts = []
                try:
                    price_texts = page.evaluate(js_collect) or []
                except Exception:
                    price_texts = []

                for pt in price_texts:
                    try:
                        low = pt.lower()
                        if any(word in low for word in ['emi', '/mo', 'month', 'per month', 'mrp', 'was', 'save', 'exchange']):
                            continue
                        val = clean_price_text(pt)
                        if VALID_PRICE_MIN < val < VALID_PRICE_MAX:
                            price_candidates.append(val)
                    except Exception:
                        continue

                price_candidates = sorted(set(price_candidates))
                if price_candidates:
                    details["price"] = price_candidates[0]
            except Exception:
                pass

        # Original price / MRP
        try:
            mrp_texts = []
            try:
                mrp_texts = page.evaluate(r"""
                    () => {
                        const out = [];
                        const els = Array.from(document.querySelectorAll('*'));
                        for (const el of els) {
                            try {
                                const txt = el.innerText || '';
                                if (!txt) continue;
                                if (/(mrp|m.r.p|strikedown|strike)/i.test(txt) || (el.className || '').toString().toLowerCase().includes('old') || (el.className || '').toString().toLowerCase().includes('strike')) {
                                    if (txt.indexOf('₹') !== -1) out.push(txt.trim());
                                }
                            } catch(e){}
                        }
                        return out.slice(0,20);
                    }
                """)
            except Exception:
                mrp_texts = []

            if mrp_texts:
                for txt in mrp_texts:
                    try:
                        v = clean_price_text(txt)
                        if v and v > details.get("price", 0):
                            details["original_price"] = v
                            break
                    except Exception:
                        continue
        except Exception:
            pass

        # Discount detection via JS
        try:
            disc_txts = []
            try:
                disc_txts = page.evaluate(r"""
                    () => {
                        const out = [];
                        const nodes = Array.from(document.querySelectorAll('span, div, p, strong'));
                        for (const n of nodes) {
                            try {
                                const t = (n.innerText || '').trim();
                                if (!t) continue;
                                if (/%\s*off/i.test(t) || /\bSave\b/i.test(t) || /\bsave\b/.test(t)) {
                                    if (t.length < 120) out.push(t);
                                }
                            } catch(e){}
                        }
                        return out.slice(0, 20);
                    }
                """)
            except Exception:
                disc_txts = []

            if disc_txts:
                details["discount"] = disc_txts[0]
        except Exception:
            pass

        # Images (gallery)
        try:
            imgs = []
            try:
                imgs = page.evaluate(r"""
                    () => {
                        const out = [];
                        const gallery = Array.from(document.querySelectorAll('img'));
                        for (const img of gallery) {
                            try {
                                const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-srcset') || '';
                                if (!src) continue;
                                if (/thumb|icon|logo|50x50|100x100/i.test(src)) continue;
                                out.push(src.startsWith('//') ? window.location.protocol + src : src);
                            } catch(e){}
                        }
                        return Array.from(new Set(out)).slice(0, 20);
                    }
                """)
            except Exception:
                imgs = []

            if imgs:
                details["images"] = imgs
                if not details.get("image") or details["image"] == PLACEHOLDER_IMAGE:
                    details["image"] = imgs[0]
        except Exception:
            pass

        # Rating & Reviews
        try:
            rating_txts = []
            try:
                rating_txts = page.evaluate(r"""
                    () => {
                        const out = [];
                        const nodes = Array.from(document.querySelectorAll('*'));
                        for (const n of nodes) {
                            try {
                                const t = (n.innerText || '').trim();
                                if (!t) continue;
                                if (/\d+(\.\d+)?\s*\/\s*5/.test(t) || /\d+(\.\d+)?\s*out of\s*5/i.test(t) || (/rating/i.test(t) && /[0-5](\.\d)?/.test(t))) {
                                    out.push(t);
                                }
                            } catch(e){}
                        }
                        return out.slice(0, 20);
                    }
                """)
            except Exception:
                rating_txts = []

            if rating_txts:
                for rt in rating_txts:
                    try:
                        m = re.search(r'(\d+(?:\.\d+)?)', rt)
                        if m:
                            val = float(m.group(1))
                            if 0 < val <= 5:
                                details["rating"] = val
                                break
                    except Exception:
                        continue

            review_texts = []
            try:
                review_texts = page.evaluate(r"""
                    () => {
                        const out = [];
                        const nodes = Array.from(document.querySelectorAll('*'));
                        for (const n of nodes) {
                            try {
                                const t = (n.innerText || '').trim();
                                if (!t) continue;
                                if (/\d+\s+(?:reviews|review|ratings|rating)/i.test(t)) out.push(t);
                            } catch(e){}
                        }
                        return out.slice(0, 20);
                    }
                """)
            except Exception:
                review_texts = []

            if review_texts:
                for rt in review_texts:
                    try:
                        m = re.search(r'(\d+)\s*(?:reviews|review|ratings|rating)', rt, re.I)
                        if m:
                            details["review_count"] = int(m.group(1))
                            break
                    except Exception:
                        continue
        except Exception:
            pass

        # Stock status
        try:
            body_text = ""
            try:
                body_text = page.inner_text("body") or ""
            except Exception:
                body_text = ""

            if any(x in body_text.lower() for x in ["out of stock", "sold out", "currently unavailable", "not available"]):
                details["in_stock"] = False
                details["availability"] = "Out of stock"
            else:
                add_cart_selectors = [
                    "//button[contains(translate(., 'abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'ADD TO CART')]",
                    "//button[contains(translate(., 'abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'BUY NOW')]",
                    "button[class*='add-to-cart'], button[class*='buy-now'], button[id*='add'], button[id*='buy']"
                ]
                found = False
                for sel in add_cart_selectors:
                    try:
                        if sel.startswith("//"):
                            els = page.query_selector_all(f"xpath={sel}")
                            if els and len(els) > 0:
                                found = True
                                break
                        else:
                            els = page.query_selector_all(sel)
                            if els and len(els) > 0:
                                found = True
                                break
                    except Exception:
                        continue
                details["in_stock"] = found
                details["availability"] = "In stock" if found else details["availability"]
        except Exception:
            pass

        # Delivery info
        try:
            delivery_txts = []
            try:
                delivery_txts = page.evaluate(r"""
                    () => {
                        const out = [];
                        const nodes = Array.from(document.querySelectorAll('*'));
                        for (const n of nodes) {
                            try {
                                const t = (n.innerText || '').trim();
                                if (!t) continue;
                                if (/delivery|delivered by|get it by|arrive|dispatch/i.test(t) && t.length < 250) out.push(t);
                            } catch(e){}
                        }
                        return out.slice(0, 20);
                    }
                """)
            except Exception:
                delivery_txts = []

            if delivery_txts:
                details["delivery_info"] = delivery_txts[0]
                try:
                    m = re.search(r'\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b.*\d{4}?', delivery_txts[0], re.I)
                    if m:
                        details["delivery_date"] = m.group(0)
                except Exception:
                    pass
        except Exception:
            pass

        # EMI availability
        try:
            emi_text = ""
            try:
                emi_text = page.inner_text("body") or ""
            except Exception:
                emi_text = ""
            details["emi_available"] = 'emi' in emi_text.lower() or 'easy emi' in emi_text.lower()
        except Exception:
            pass

        # Warranty
        try:
            warranty_txts = []
            try:
                warranty_txts = page.evaluate(r"""
                    () => {
                        const out = [];
                        const nodes = Array.from(document.querySelectorAll('*'));
                        for (const n of nodes) {
                            try {
                                const t = (n.innerText || '').trim();
                                if (!t) continue;
                                if (/warranty/i.test(t) && t.length < 200) out.push(t);
                            } catch(e){}
                        }
                        return out.slice(0, 20);
                    }
                """)
            except Exception:
                warranty_txts = []

            if warranty_txts:
                details["warranty"] = warranty_txts[0]
        except Exception:
            pass

        # Description fallback
        if not details["description"]:
            try:
                desc_candidates = []
                try:
                    desc_candidates = page.query_selector_all("div[class*='description'], div[class*='product-desc'], #product-description, .productDetails, .pdp-description")
                except Exception:
                    desc_candidates = []
                for d in desc_candidates:
                    try:
                        txt = d.inner_text().strip()
                        if txt and len(txt) > 40:
                            details["description"] = txt
                            break
                    except Exception:
                        continue
            except Exception:
                pass

        # Features
        try:
            features = []
            try:
                feat_nodes = page.query_selector_all("ul[class*='features'] li, .highlights li, .feature-list li, .product-highlights li")
            except Exception:
                feat_nodes = []
            for f in feat_nodes[:20]:
                try:
                    txt = f.inner_text().strip()
                    if txt and len(txt) > 4:
                        features.append(txt)
                except Exception:
                    continue
            if features:
                details["features"] = features
        except Exception:
            pass

        # Specifications
        try:
            spec: Dict[str, str] = {}
            try:
                trs = page.query_selector_all("table.specs tr, table[class*='spec'] tr, .specification tr")
            except Exception:
                trs = []
            for tr in trs[:40]:
                try:
                    tds = tr.query_selector_all("td, th")
                    if len(tds) >= 2:
                        k = tds[0].inner_text().strip()
                        v = tds[1].inner_text().strip()
                        if k and v:
                            spec[k] = v
                except Exception:
                    continue

            if not spec:
                try:
                    items = page.query_selector_all(".specification li, .specs li, .product-specs li")
                except Exception:
                    items = []
                for it in items[:60]:
                    try:
                        txt = it.inner_text().strip()
                        if ':' in txt:
                            k, v = txt.split(':', 1)
                            spec[k.strip()] = v.strip()
                    except Exception:
                        continue

            if spec:
                details["specifications"] = spec
        except Exception:
            pass

        # Final adjustments
        details["url"] = product_url
        return details

    except Exception:
        # Return None on a page-level failure
        return None


# ---------- Main scraper (Playwright) ----------
def scrape_reliance_digital_playwright(query: str, pincode: Optional[str] = None, headless: bool = True, max_candidates: int = 30) -> Optional[Dict[str, Any]]:
    """
    Uses Playwright to search Reliance Digital and return the best (lowest-priced) product's details.
    """
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=headless)
            try:
                context = browser.new_context(
                    user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"),
                    locale="en-IN",
                    viewport={"width": 1920, "height": 1080},
                )
            except Exception:
                context = browser.new_context()

            page = context.new_page()

            query_clean = (query or "").strip()
            q_param = quote_plus(query_clean)
            search_url = f"https://www.reliancedigital.in/products?q={q_param}"

            try:
                page.goto(search_url, timeout=DEFAULT_TIMEOUT)
            except PlaywrightTimeoutError:
                # proceed even if navigation times out
                pass
            except Exception:
                pass

            safe_wait_for_selector(page, "body", timeout=6000)
            time.sleep(1.2)
            scroll_to_load(page, max_scrolls=MAX_SCROLLS, pause=0.8)

            try:
                body_text = page.inner_text("body") or ""
            except Exception:
                body_text = ""

            if len(body_text.strip()) < 200 or any(x in body_text.lower() for x in ["page was not found", "oops", "no results found"]):
                category = query_clean.lower().replace(' ', '-')
                collection_url = f"https://www.reliancedigital.in/collection/{category}"
                try:
                    page.goto(collection_url, timeout=DEFAULT_TIMEOUT)
                except PlaywrightTimeoutError:
                    pass
                except Exception:
                    pass
                safe_wait_for_selector(page, "body", timeout=6000)
                time.sleep(1.2)
                scroll_to_load(page, max_scrolls=MAX_SCROLLS, pause=0.8)

            raw_products = extract_products_from_search_page(page)
            if not raw_products:
                try:
                    browser.close()
                except Exception:
                    pass
                return None

            # Normalize and sort by price. Items without price become very large.
            normalized = []
            for prod in raw_products:
                try:
                    price_val = clean_price_text(prod.get("price_text", "") or "")
                except Exception:
                    price_val = 0
                normalized.append({
                    "url": prod.get("url", ""),
                    "title": prod.get("title", "") or "",
                    "price": price_val if price_val > 0 else 10**10,
                    "image": prod.get("image", PLACEHOLDER_IMAGE)
                })

            normalized = sorted(normalized, key=lambda x: x["price"])
            accessory_keywords = ['case', 'cover', 'charger', 'cable', 'adapter', 'screen guard', 'protector', 'stand']
            filtered = [it for it in normalized if not any(k in (it.get('title') or '').lower() for k in accessory_keywords)]
            candidates = filtered if filtered else normalized

            checks = 0
            for candidate in candidates:
                if checks >= max_candidates:
                    break
                checks += 1
                if candidate["price"] >= 10**10:
                    continue
                try:
                    details = get_product_details(page, candidate["url"], pincode)
                except Exception:
                    details = None
                if details and isinstance(details.get("price", 0), int) and details.get("price", 0) >= VALID_PRICE_MIN:
                    if not details.get("image") or details["image"] == PLACEHOLDER_IMAGE:
                        details["image"] = candidate.get("image", PLACEHOLDER_IMAGE)
                    try:
                        browser.close()
                    except Exception:
                        pass
                    return details
                time.sleep(0.4)

            # Fallback
            if normalized:
                first = normalized[0]
                fallback = make_empty_details(first["url"])
                fallback.update({
                    "title": first.get("title", "") or "",
                    "price": first.get("price", 0) if first.get("price", 0) < 10**10 else 0,
                    "image": first.get("image", PLACEHOLDER_IMAGE),
                    "in_stock": True
                })
                try:
                    browser.close()
                except Exception:
                    pass
                return fallback

            try:
                browser.close()
            except Exception:
                pass
            return None

    except Exception as e:
        # Top-level failure
        # print(f"scrape_reliance_digital_playwright error: {e}")
        return None


# ---------- CLI / Pretty print ----------
def print_result(product: Optional[Dict[str, Any]]):
    if not product:
        print("\n❌ No result found on Reliance Digital")
        return

    print("\n" + "=" * 70)
    print("🔌 BEST PRODUCT FOUND ON RELIANCE DIGITAL")
    print("=" * 70)
    print(f"📦 Title: {product.get('title', 'N/A')}")
    print(f"💰 Price: ₹{product.get('price', 0):,}")

    if product.get('original_price', 0) and product['original_price'] > product['price']:
        print(f"💸 Original Price: ₹{product['original_price']:,}")
        savings = product['original_price'] - product['price']
        perc = int((savings / product['original_price']) * 100) if product['original_price'] else 0
        print(f"💵 You Save: ₹{savings:,} ({perc}%)")

    if product.get('discount'):
        print(f"🏷️  Discount: {product['discount']}")

    print(f"⭐ Rating: {product.get('rating', 'N/A')} ({product.get('review_count', 0)} reviews)")

    if product.get('brand'):
        print(f"🏷️  Brand: {product['brand']}")

    print(f"📦 In Stock: {'✅ Yes' if product.get('in_stock') else '❌ No'}")

    if product.get('warranty'):
        print(f"🛡️  Warranty: {product['warranty']}")

    if product.get('emi_available'):
        print(f"💳 EMI: Available")

    if product.get('delivery_info'):
        print(f"🚚 Delivery: {product['delivery_info']}")

    if product.get('description'):
        desc = product['description'][:180]
        print(f"📝 Description: {desc}{'...' if len(product['description']) > 180 else ''}")

    print(f"🏪 Seller: {product.get('seller', 'Reliance Digital')}")
    print(f"🖼️  Image: {product.get('image', 'N/A')}")
    print(f"🔗 URL: {product.get('url')}")

    if product.get('features'):
        print(f"\n✨ Key Features:")
        for f in product['features'][:6]:
            print(f"   • {f}")

    if product.get('specifications'):
        print(f"\n📋 Specifications:")
        for key, val in list(product['specifications'].items())[:6]:
            print(f"   • {key}: {val}")

    print("=" * 70 + "\n")


# ---------- Main ----------
if __name__ == "__main__":
    query = "laptop"
    pincode = "400001"

    print("\n" + "=" * 70)
    print(f"🔍 Testing Reliance Digital Scraper (Playwright)")
    print(f"Query: {query}")
    print(f"Pincode: {pincode}")
    print("=" * 70)

    result = scrape_reliance_digital_playwright(query=query, pincode=pincode, headless=True)
    print_result(result)
