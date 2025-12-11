"""
Smart Product Scoring System - Quality over Price
Evaluates products based on ratings, reviews, price, discount, and availability
Returns the BEST product, not just the cheapest
"""
import math
import re

def calculate_product_score(product: dict, budget: float = None, max_price: float = None) -> float:
    """
    Calculate a weighted quality score for a product.
    
    Scoring breakdown:
    - Rating (30%): Product quality indicator
    - Review count (25%): Reliability of rating
    - Price value (20%): Lower is better, but not primary
    - Discount (15%): Market value indicator
    - Availability (5%): Stock and delivery
    - Brand trust (5%): Optional reliability factor
    
    Returns: Score between 0-100 (higher is better)
    """
    score = 0.0
    
    # 1. RATING SCORE (30 points max)
    rating = product.get('rating', 0.0)
    if rating > 0:
        # Normalize rating to 0-30 scale (5 stars = 30 points)
        rating_score = (rating / 5.0) * 30
        # Bonus for excellent ratings (4.5+)
        if rating >= 4.5:
            rating_score += 3
        elif rating >= 4.0:
            rating_score += 1
        score += rating_score
    
    # 2. REVIEW COUNT SCORE (25 points max)
    review_count = product.get('review_count', 0)
    if review_count > 0:
        # Logarithmic scale - more reviews = more reliable
        # 10 reviews = 5 pts, 100 = 12.5 pts, 1000 = 17.5 pts, 10000+ = 25 pts
        if review_count >= 10000:
            review_score = 25
        elif review_count >= 1000:
            review_score = 17.5 + ((review_count - 1000) / 9000) * 7.5
        elif review_count >= 100:
            review_score = 12.5 + ((review_count - 100) / 900) * 5
        elif review_count >= 10:
            review_score = 5 + ((review_count - 10) / 90) * 7.5
        else:
            review_score = (review_count / 10) * 5
        score += review_score
    
    # 3. PRICE VALUE SCORE (20 points max)
    price = product.get('price', 0)
    if price > 0 and max_price:
        # Price relative to highest price in results
        price_ratio = 1 - (price / max_price)  # Lower price = higher ratio
        price_score = price_ratio * 20
        
        # Budget considerations
        if budget:
            if price <= budget:
                price_score += 5  # Bonus for within budget
            elif price <= budget * 1.1:  # 10% over budget
                price_score += 2  # Small bonus
            elif price > budget * 1.3:  # 30% over budget
                price_score -= 5  # Penalty
        
        score += max(0, price_score)
    elif price > 0:
        # If no max_price reference, give moderate score
        score += 10
    
    # 4. DISCOUNT SCORE (15 points max)
    discount = product.get('discount', '')
    original_price = product.get('original_price', 0)
    
    if original_price > price > 0:
        # Calculate actual discount percentage
        discount_pct = ((original_price - price) / original_price) * 100
    elif discount and '%' in str(discount):
        # Extract discount percentage from text
        match = re.search(r'(\d+)', str(discount))
        discount_pct = int(match.group(1)) if match else 0
    else:
        discount_pct = 0
    
    if discount_pct > 0:
        # 50% discount = 15 points, 25% = 7.5 points, etc.
        discount_score = min(15, (discount_pct / 50) * 15)
        score += discount_score
    
    # 5. AVAILABILITY SCORE (5 points max)
    in_stock = product.get('in_stock', False)
    delivery_info = product.get('delivery_info', '')
    
    if in_stock:
        score += 3
        # Bonus for fast delivery
        if delivery_info:
            delivery_lower = delivery_info.lower()
            if any(word in delivery_lower for word in ['today', 'tomorrow', '1 day', 'same day']):
                score += 2
            elif any(word in delivery_lower for word in ['2 days', '3 days', 'this week']):
                score += 1
    
    # 6. BRAND TRUST SCORE (5 points max)
    brand = product.get('brand', '').lower()
    seller = product.get('seller', '').lower()
    
    # Known trusted brands (expand this list)
    trusted_brands = ['apple', 'samsung', 'sony', 'lg', 'dell', 'hp', 'lenovo', 
                     'asus', 'acer', 'nike', 'adidas', 'puma', 'boat', 'jbl']
    
    if any(tb in brand for tb in trusted_brands):
        score += 3
    
    # Verified/trusted seller indicators
    if any(word in seller for word in ['assured', 'verified', 'official', 'authorized']):
        score += 2
    
    # PENALTY: Accessories should score lower
    title = product.get('title', '').lower()
    accessory_keywords = ['case', 'cover', 'cable', 'charger', 'adapter', 'protector']
    if any(kw in title for kw in accessory_keywords):
        score *= 0.7  # 30% penalty for accessories
    
    return round(score, 2)


def rank_products(products: list, budget: float = None) -> dict:
    """
    Rank products by quality score and return best + alternatives.
    
    Args:
        products: List of product dictionaries
        budget: Optional user budget
    
    Returns:
        {
            'best': Best product,
            'alternatives': Top 4 alternatives,
            'total_evaluated': Count,
            'score_range': (min, max) scores
        }
    """
    if not products:
        return {
            'best': None,
            'alternatives': [],
            'total_evaluated': 0,
            'score_range': (0, 0)
        }
    
    # Filter out invalid products
    valid_products = [p for p in products if p.get('price', 0) > 0]
    
    if not valid_products:
        return {
            'best': None,
            'alternatives': [],
            'total_evaluated': 0,
            'score_range': (0, 0)
        }
    
    # Find max price for normalization
    max_price = max(p.get('price', 0) for p in valid_products)
    
    # Calculate scores for all products
    scored_products = []
    for product in valid_products:
        score = calculate_product_score(product, budget=budget, max_price=max_price)
        product['quality_score'] = score
        scored_products.append(product)
    
    # Sort by score (highest first)
    scored_products.sort(key=lambda x: x['quality_score'], reverse=True)
    
    # Extract best and alternatives
    best = scored_products[0] if scored_products else None
    alternatives = scored_products[1:5] if len(scored_products) > 1 else []
    
    scores = [p['quality_score'] for p in scored_products]
    
    return {
        'best': best,
        'alternatives': alternatives,
        'total_evaluated': len(scored_products),
        'score_range': (min(scores), max(scores)) if scores else (0, 0)
    }


def print_scoring_report(ranked_results: dict):
    """Pretty print the scoring results."""
    print("\n" + "="*80)
    print("🏆 PRODUCT QUALITY RANKING REPORT")
    print("="*80)
    
    best = ranked_results.get('best')
    if not best:
        print("❌ No valid products found")
        return
    
    print(f"\n🥇 BEST PRODUCT (Score: {best.get('quality_score', 0):.1f}/100)")
    print("-" * 80)
    print(f"📦 {best.get('title', 'N/A')[:70]}")
    print(f"💰 Price: ₹{best.get('price', 0):,}")
    print(f"⭐ Rating: {best.get('rating', 0)}/5 ({best.get('review_count', 0):,} reviews)")
    
    if best.get('discount'):
        print(f"💳 Discount: {best.get('discount')}")
    if best.get('brand'):
        print(f"🏷️  Brand: {best.get('brand')}")
    if best.get('delivery_info'):
        print(f"🚚 Delivery: {best.get('delivery_info')}")
    if best.get('platform'):
        print(f"🛒 Platform: {best.get('platform')}")
    
    print(f"\n🔗 {best.get('url', '')}")
    
    alternatives = ranked_results.get('alternatives', [])
    if alternatives:
        print(f"\n\n📊 TOP ALTERNATIVES")
        print("-" * 80)
        for i, alt in enumerate(alternatives, 2):
            print(f"\n#{i} - Score: {alt.get('quality_score', 0):.1f}/100")
            print(f"   {alt.get('title', 'N/A')[:65]}")
            print(f"   ₹{alt.get('price', 0):,} | ⭐{alt.get('rating', 0)} | {alt.get('review_count', 0):,} reviews")
            if alt.get('platform'):
                print(f"   🛒 {alt.get('platform')}")
    
    print(f"\n\n📈 EVALUATION SUMMARY")
    print("-" * 80)
    print(f"Products Evaluated: {ranked_results.get('total_evaluated', 0)}")
    score_range = ranked_results.get('score_range', (0, 0))
    print(f"Score Range: {score_range[0]:.1f} - {score_range[1]:.1f}")
    print("\n" + "="*80)


# Example usage
def example_integration():
    """
    Example showing how to use the scoring system.
    """
    # Simulated products
    products = [
        {
            'title': 'Premium Laptop XYZ',
            'price': 45000,
            'original_price': 55000,
            'discount': '18% off',
            'rating': 4.5,
            'review_count': 2340,
            'brand': 'Dell',
            'in_stock': True,
            'delivery_info': 'Delivery by tomorrow',
            'url': 'https://example.com/product1'
        },
        {
            'title': 'Budget Laptop ABC',
            'price': 35000,
            'original_price': 40000,
            'discount': '12% off',
            'rating': 3.8,
            'review_count': 450,
            'brand': 'Unknown',
            'in_stock': True,
            'delivery_info': 'Delivery in 5 days',
            'url': 'https://example.com/product2'
        }
    ]
    
    # Rank with budget of 50000
    results = rank_products(products, budget=50000)
    print_scoring_report(results)
    
    return results


if __name__ == "__main__":
    # Run example
    example_integration()