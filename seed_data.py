"""
Recipe Delivery Platform — Test Data Seeder (v3 - final)
=========================================================
Schema-matched to your exact JPA-generated tables.

Seeding order:
  1. userDB        → users
  2. recipeDB      → ingredients, recipes, recipe_ingredients, recipe_suggestions
  3. inventoryDB   → products, stock_movements
  4. orderServiceDB→ orders, order_items
  5. paymentDB     → payments
  6. adminDB       → audit_logs, suggestion_reviews

Requirements:  pip install faker psycopg2-binary
Usage:         python seed_data.py
"""

import random
import string
from datetime import datetime, timedelta

try:
    import psycopg2
    from psycopg2.extras import execute_batch
except ImportError:
    print("Run: pip install faker psycopg2-binary"); exit(1)

try:
    from faker import Faker
    fake    = Faker("en_IN")
    fake_en = Faker("en_US")
except ImportError:
    print("Run: pip install faker psycopg2-binary"); exit(1)

# ─────────────────────────────────────────────
#  CONFIG
# ─────────────────────────────────────────────
DB_BASE = dict(host="localhost", port=5432, user="postgres", password="Ayush@0943")
DBS = {
    "user":    "userDB",
    "recipe":  "recipeDB",
    "inv":     "inventoryDB",
    "order":   "orderServiceDB",
    "payment": "paymentDB",
    "admin":   "adminDB",
}

def conn(key):
    return psycopg2.connect(dbname=DBS[key], **DB_BASE)

def rand_past(days=90):
    return datetime.now() - timedelta(
        days=random.randint(0, days),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59)
    )

def txn_id():
    return "TXN" + "".join(random.choices(string.digits, k=12))

# ─────────────────────────────────────────────
#  SHARED ID POOLS  (populated as we insert)
# ─────────────────────────────────────────────
user_ids        = []   # bigint
recipe_ids      = []   # bigint
ingredient_ids  = []   # bigint
product_ids     = []   # bigint
order_ids       = []   # bigint
suggestion_ids  = []   # bigint (recipe_suggestions)

# ─────────────────────────────────────────────
#  REFERENCE DATA
# ─────────────────────────────────────────────
CATEGORIES = ["BREAKFAST","LUNCH","DINNER","SNACK","DESSERT",
              "BEVERAGE","SNACK","LUNCH","DINNER","SNACK"]

RECIPE_DATA = [
    # (name, category, prep_mins, description)
    ("Masala Dosa",        "BREAKFAST",  20, "Crispy rice crepe with spiced potato filling"),
    ("Idli Sambar",        "BREAKFAST",  30, "Steamed rice cakes served with lentil soup"),
    ("Butter Chicken",     "DINNER",     40, "Tender chicken in creamy tomato-butter gravy"),
    ("Dal Makhani",        "DINNER",     60, "Slow-cooked black lentils in rich buttery sauce"),
    ("Paneer Tikka",       "SNACK",   25, "Marinated cottage cheese grilled to perfection"),
    ("Chole Bhature",      "LUNCH",      45, "Spiced chickpeas with deep-fried fluffy bread"),
    ("Chicken Biryani",    "LUNCH",    60, "Fragrant basmati rice layered with spiced chicken"),
    ("Mutton Biryani",     "LUNCH",    90, "Slow-cooked mutton with aromatic basmati rice"),
    ("Hakka Noodles",      "SNACK",20, "Stir-fried noodles with vegetables and sauces"),
    ("Chilli Chicken",     "SNACK",   30, "Crispy chicken tossed in spicy Indo-Chinese sauce"),
    ("Veg Burger",         "SNACK",15, "Crispy veggie patty with fresh veggies in a bun"),
    ("Chicken Burger",     "SNACK",15, "Juicy grilled chicken patty with house sauce"),
    ("Gulab Jamun",        "DESSERT",   30, "Soft milk-solid balls soaked in rose sugar syrup"),
    ("Mango Lassi",        "BEVERAGE",   5, "Chilled yoghurt drink blended with Alphonso mango"),
    ("Masala Chai",        "BEVERAGE",  10, "Spiced Indian tea brewed with ginger and cardamom"),
    ("Aloo Paratha",       "BREAKFAST",  25, "Whole wheat flatbread stuffed with spiced potato"),
    ("Palak Paneer",       "DINNER",     35, "Cottage cheese cubes in smooth spinach gravy"),
    ("Rajma Chawal",       "LUNCH",      50, "Red kidney beans curry served with steamed rice"),
    ("Margherita Pizza",   "DINNER",     25, "Classic pizza with tomato sauce and mozzarella"),
    ("Caesar Salad",       "DINNER",    10, "Romaine lettuce with caesar dressing and croutons"),
    ("Grilled Chicken",    "DINNER",    30, "Herb-marinated chicken breast grilled to perfection"),
    ("Mushroom Soup",      "SNACK",   20, "Creamy mushroom soup with garlic and thyme"),
    ("Pad Thai",           "DINNER",     25, "Thai stir-fried rice noodles with tamarind sauce"),
    ("Green Curry",        "DINNER",     35, "Thai green curry with coconut milk and vegetables"),
    ("Rasgulla",           "DESSERT",   40, "Soft spongy cottage cheese balls in light sugar syrup"),
    ("Cold Coffee",        "BEVERAGE",   5, "Chilled coffee blended with milk and ice cream"),
    ("Vada",               "SNACK",     20, "Crispy fried lentil donuts with coconut chutney"),
    ("Spring Rolls",       "SNACK",   20, "Crispy rolls stuffed with vegetables and noodles"),
    ("French Fries",       "SNACK",     15, "Golden crispy potato fries with seasoning"),
    ("Kheer",              "DESSERT",   40, "Creamy rice pudding with cardamom and dry fruits"),
]

INGREDIENTS = [
    ("Rice","kg"), ("Wheat Flour","kg"), ("Chicken","kg"), ("Mutton","kg"),
    ("Paneer","kg"), ("Milk","litre"), ("Butter","kg"), ("Oil","litre"),
    ("Tomatoes","kg"), ("Onions","kg"), ("Garlic","kg"), ("Ginger","kg"),
    ("Cumin Seeds","kg"), ("Mustard Seeds","kg"), ("Turmeric Powder","kg"),
    ("Red Chilli Powder","kg"), ("Garam Masala","kg"), ("Coriander Powder","kg"),
    ("Salt","kg"), ("Sugar","kg"), ("Basmati Rice","kg"), ("Black Lentils","kg"),
    ("Chickpeas","kg"), ("Potato","kg"), ("Spinach","kg"), ("Coconut Milk","litre"),
    ("Eggs","dozen"), ("Cheese","kg"), ("Cream","litre"), ("Yoghurt","kg"),
]

PRODUCTS = [
    # (name, category, unit, price, stock)
    ("Basmati Rice Premium",  "Grains",      "kg",     89.0,  500),
    ("Whole Wheat Flour",     "Grains",      "kg",     45.0,  300),
    ("Fresh Chicken Breast",  "Meat",        "kg",    280.0,  150),
    ("Mutton Curry Cut",      "Meat",        "kg",    520.0,   80),
    ("Fresh Paneer",          "Dairy",       "kg",    340.0,  120),
    ("Full Cream Milk",       "Dairy",       "litre",  62.0,  400),
    ("Amul Butter",           "Dairy",       "kg",    450.0,  200),
    ("Refined Sunflower Oil", "Oils",        "litre",  145.0, 250),
    ("Tomatoes",              "Vegetables",  "kg",     40.0,  600),
    ("Onions",                "Vegetables",  "kg",     35.0,  700),
    ("Garlic",                "Vegetables",  "kg",    120.0,  300),
    ("Ginger",                "Vegetables",  "kg",    100.0,  250),
    ("Turmeric Powder",       "Spices",      "kg",    180.0,  150),
    ("Red Chilli Powder",     "Spices",      "kg",    200.0,  140),
    ("Garam Masala",          "Spices",      "kg",    350.0,  100),
    ("Coriander Powder",      "Spices",      "kg",    160.0,  130),
    ("Cumin Seeds",           "Spices",      "kg",    220.0,  120),
    ("Salt",                  "Condiments",  "kg",     20.0,  800),
    ("Sugar",                 "Condiments",  "kg",     42.0,  500),
    ("Basmati Rice Economy",  "Grains",      "kg",     65.0,  400),
    ("Greek Yoghurt",         "Dairy",       "kg",    180.0,  100),
    ("Heavy Cream",           "Dairy",       "litre", 220.0,   80),
    ("Mozzarella Cheese",     "Dairy",       "kg",    480.0,   60),
    ("Black Lentils",         "Pulses",      "kg",    110.0,  300),
    ("Chickpeas",             "Pulses",      "kg",     95.0,  280),
    ("Potato",                "Vegetables",  "kg",     30.0,  900),
    ("Spinach",               "Vegetables",  "kg",     50.0,  200),
    ("Coconut Milk",          "Canned",      "litre", 120.0,  150),
    ("Eggs",                  "Poultry",     "dozen",  72.0,  400),
    ("Mustard Seeds",         "Spices",      "kg",    140.0,  120),
    # low stock items (for testing)
    ("Saffron",               "Spices",      "gm",    800.0,    8),
    ("Truffle Oil",           "Oils",        "ml",    950.0,    5),
    ("Burrata Cheese",        "Dairy",       "kg",    650.0,    3),
    # out of stock
    ("Wagyu Beef",            "Meat",        "kg",   2200.0,    0),
    ("Black Truffle",         "Speciality",  "gm",   3500.0,    0),
]

ORDER_STATUSES  = ["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"]
PAYMENT_METHODS = ["UPI","CREDIT_CARD","DEBIT_CARD","NET_BANKING","CASH_ON_DELIVERY","WALLET"]
GATEWAYS        = ["RAZORPAY","PAYTM","PHONEPE","STRIPE","CASHFREE"]
CURRENCIES      = ["INR"]

STATUS_FLOW = {
    "PLACED":           ["PLACED"],
    "CONFIRMED":        ["PLACED","CONFIRMED"],
    "PREPARING":        ["PLACED","CONFIRMED","PREPARING"],
    "OUT_FOR_DELIVERY": ["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY"],
    "DELIVERED":        ["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY","DELIVERED"],
    "CANCELLED":        ["PLACED","CANCELLED"],
}

STATUS_POOL = (
    ["DELIVERED"]  * 450 +
    ["CANCELLED"]  * 120 +
    ["SHIPPED"]    * 100 +
    ["PROCESSING"] *  80 +
    ["CONFIRMED"]  *  80 +
    ["PENDING"]    *  70
)
random.shuffle(STATUS_POOL)

# ─────────────────────────────────────────────
#  1. USERS
# ─────────────────────────────────────────────
def seed_users():
    print("\n[1/6] Seeding userDB → users...")
    c = conn("user"); cur = c.cursor()

    emails = set()
    rows   = []
    for i in range(500):
        email = fake.email()
        while email in emails:
            email = fake.email()
        emails.add(email)
        rows.append((
            rand_past(365),
            email,
            False,
            fake.name(),
            "hashed_" + fake_en.sha256()[:20],
            f"+91{random.randint(7000000000,9999999999)}",
            "ADMIN" if i < 5 else "CUSTOMER",
        ))

    for row in rows:
        cur.execute("""
            INSERT INTO users (created_at, email, is_verified, name, password_hash, phone, role)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
        """, row)
        result = cur.fetchone()
        if result:
            user_ids.append(result[0])

    c.commit(); cur.close(); c.close()
    print(f"    ✓ {len(user_ids)} users")

# ─────────────────────────────────────────────
#  2. RECIPES
# ─────────────────────────────────────────────
def seed_recipes():
    print("\n[2/6] Seeding recipeDB → ingredients, recipes, recipe_ingredients, recipe_suggestions...")
    c = conn("recipe"); cur = c.cursor()

    # ingredients
    for ing_name, ing_unit in INGREDIENTS:
        cur.execute("""
            INSERT INTO ingredients (name, unit)
            VALUES (%s,%s)
            ON CONFLICT DO NOTHING
            RETURNING id
        """, (ing_name, ing_unit))
        r = cur.fetchone()
        if r:
            ingredient_ids.append(r[0])

    c.commit()

    # re-fetch all ingredient ids in case some already existed
    cur.execute("SELECT id FROM ingredients ORDER BY id")
    ingredient_ids.clear()
    ingredient_ids.extend([r[0] for r in cur.fetchall()])

    # recipes
    for name, category, prep, desc in RECIPE_DATA:
        # insert 2-5 variants per recipe (different servings)
        for servings in random.sample([1,2,4,6,8], k=random.randint(2,4)):
            cur.execute("""
                INSERT INTO recipes (category, created_at, default_servings,
                    description, image_url, instructions, name, prep_time_minutes)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING id
            """, (
                category,
                rand_past(180),
                servings,
                desc,
                f"https://cdn.recipeapp.com/images/{name.lower().replace(' ','-')}.jpg",
                f"Step 1: Prepare ingredients. Step 2: Cook {name}. Step 3: Serve hot.",
                name,
                prep,
            ))
            r = cur.fetchone()
            if r:
                recipe_ids.append(r[0])

    c.commit()

    # recipe_ingredients — 3-6 ingredients per recipe
    ri_rows = []
    for rid in recipe_ids:
        for ing_id in random.sample(ingredient_ids, k=min(random.randint(3,6), len(ingredient_ids))):
            ri_rows.append((
                round(random.uniform(0.05, 2.0), 2),
                random.choice(["gm","kg","ml","litre","tsp","tbsp","cup"]),
                ing_id,
                rid,
            ))
    execute_batch(cur, """
        INSERT INTO recipe_ingredients (quantity_per_serving, unit, ingredient_id, recipe_id)
        VALUES (%s,%s,%s,%s)
    """, ri_rows)

    c.commit()

    # recipe_suggestions — user-submitted suggestions
    statuses = ["PENDING"]*50 + ["APPROVED"]*30 + ["REJECTED"]*20
    sug_rows = []
    for _ in range(200):
        uid = random.choice(user_ids) if user_ids else None
        cur.execute("""
            INSERT INTO recipe_suggestions
                (description, ingredients, recipe_name, status, submitted_at, user_id)
            VALUES (%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (
            fake_en.paragraph(nb_sentences=2),
            ", ".join(random.sample([i[0] for i in INGREDIENTS], k=random.randint(3,6))),
            f"{random.choice(['Spicy','Tangy','Sweet','Crispy','Creamy'])} "
            f"{random.choice(['Chicken','Paneer','Dal','Rice','Noodles'])} "
            f"{random.choice(['Delight','Special','Masala','Curry','Bowl'])}",
            random.choice(statuses),
            rand_past(60),
            uid,
        ))
        r = cur.fetchone()
        if r:
            suggestion_ids.append(r[0])

    c.commit(); cur.close(); c.close()
    print(f"    ✓ {len(ingredient_ids)} ingredients, {len(recipe_ids)} recipes, "
          f"{len(ri_rows)} recipe_ingredients, {len(suggestion_ids)} suggestions")

# ─────────────────────────────────────────────
#  3. INVENTORY
# ─────────────────────────────────────────────
def seed_inventory():
    print("\n[3/6] Seeding inventoryDB → products, stock_movements...")
    c = conn("inv"); cur = c.cursor()

    for p_name, p_cat, p_unit, p_price, p_stock in PRODUCTS:
        cur.execute("""
            INSERT INTO products
                (category, description, image_url, is_available, name,
                 price_per_unit, stock_quantity, unit)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (
            p_cat,
            f"Fresh high-quality {p_name.lower()} sourced directly from farms.",
            f"https://cdn.recipeapp.com/products/{p_name.lower().replace(' ','-')}.jpg",
            p_stock > 0,
            p_name,
            p_price,
            p_stock,
            p_unit,
        ))
        r = cur.fetchone()
        if r:
            product_ids.append(r[0])

    c.commit()

    # stock_movements — IN/OUT/ADJUSTMENT history per product
    mv_types  = ["IN","OUT","ADJUSTMENT"]
    mv_reasons = {
        "IN":         ["Supplier delivery","Restocking","Purchase order"],
        "OUT":        ["Order fulfillment","Kitchen use","Sales dispatch"],
        "ADJUSTMENT": ["Inventory audit","Correction","System sync"],
    }
    movements = []
    for pid in product_ids:
        for _ in range(random.randint(3, 10)):
            mv_type = random.choice(mv_types)
            movements.append((
                pid,
                random.randint(1, 100),
                random.choice(mv_reasons[mv_type]),
                rand_past(90),
                mv_type,
            ))

    execute_batch(cur, """
        INSERT INTO stock_movements (product_id, quantity, reason, timestamp, type)
        VALUES (%s,%s,%s,%s,%s)
    """, movements)

    c.commit(); cur.close(); c.close()
    print(f"    ✓ {len(product_ids)} products, {len(movements)} stock movements")

# ─────────────────────────────────────────────
#  4. ORDERS
# ─────────────────────────────────────────────

STATUS_FLOW = {
    "PENDING":   ["PENDING"],
    "CONFIRMED": ["PENDING","CONFIRMED"],
    "PROCESSING":["PENDING","CONFIRMED","PROCESSING"],
    "SHIPPED":   ["PENDING","CONFIRMED","PROCESSING","SHIPPED"],
    "DELIVERED": ["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED"],
    "CANCELLED": ["PENDING","CANCELLED"],
}

def seed_orders():
    print("\n[4/6] Seeding orderServiceDB → carts, cart_items, orders, order_items, order_status_history...")
    c = conn("order"); cur = c.cursor()

    # ── carts (one per user, ~60% of users) ──
    cart_ids = []
    cart_users = random.sample(user_ids, k=min(300, len(user_ids)))
    for uid in cart_users:
        cur.execute("""
            INSERT INTO carts (created_at, user_id)
            VALUES (%s,%s) RETURNING id
        """, (rand_past(7), uid))
        r = cur.fetchone()
        if r:
            cart_ids.append((r[0], uid))

    # ── cart_items (1-4 items per cart) ──
    cart_items_total = 0
    for cart_id, _ in cart_ids:
        for pid in random.sample(product_ids, k=min(random.randint(1,4), len(product_ids))):
            cur.execute("""
                INSERT INTO cart_items
                    (ingredient_name, price_per_unit, product_id, quantity, cart_id)
                VALUES (%s,%s,%s,%s,%s)
            """, (
                f"Product-{pid}",
                round(random.uniform(30, 800), 2),
                pid,
                random.randint(1, 5),
                cart_id,
            ))
            cart_items_total += 1

    c.commit()

    # ── orders ──
    items_total   = 0
    history_total = 0

    for status in STATUS_POOL:
        uid     = random.choice(user_ids) if user_ids else 1
        created = rand_past(90)
        total   = round(random.uniform(150, 2500), 2)

        cur.execute("""
            INSERT INTO orders
                (address_id, created_at, status, total_amount, updated_at, user_id)
            VALUES (%s,%s,%s,%s,%s,%s)
            RETURNING order_id
        """, (
            random.randint(1, 500),
            created,
            status,
            total,
            created + timedelta(minutes=random.randint(1, 60)),
            uid,
        ))
        r = cur.fetchone()
        if not r:
            continue
        oid = r[0]
        order_ids.append(oid)

        # order_items
        for pid in random.sample(product_ids, k=min(random.randint(1,4), len(product_ids))):
            cur.execute("""
                INSERT INTO order_items
                    (ingredient_name, price_per_unit, product_id, quantity, order_id)
                VALUES (%s,%s,%s,%s,%s)
            """, (f"Product-{pid}", round(random.uniform(30,800),2), pid, random.randint(1,5), oid))
            items_total += 1

        # order_status_history — full flow up to current status
        step_time = created
        for s in STATUS_FLOW.get(status, ["PENDING"]):
            cur.execute("""
                INSERT INTO order_status_history
                    (changed_at, note, order_id, status)
                VALUES (%s,%s,%s,%s)
            """, (
                step_time,
                f"Order {s.lower().replace('_',' ')}",
                oid,
                s,
            ))
            step_time += timedelta(minutes=random.randint(3, 20))
            history_total += 1

    c.commit(); cur.close(); c.close()
    print(f"    ✓ {len(cart_ids)} carts, {cart_items_total} cart_items")
    print(f"    ✓ {len(order_ids)} orders, {items_total} order_items, {history_total} status_history rows")

# ─────────────────────────────────────────────
#  5. PAYMENTS
# ─────────────────────────────────────────────
def seed_payments():
    print("\n[5/6] Seeding paymentDB → payments...")
    c = conn("payment"); cur = c.cursor()

    # status distribution
    p_statuses = (
        ["SUCCESS"] * 800 +
        ["FAILED"]  * 100 +
        ["PENDING"] *  50 +
        ["REFUNDED"]*  50
    )
    random.shuffle(p_statuses)

    inserted = 0
    for i, oid in enumerate(order_ids):
        uid    = random.choice(user_ids) if user_ids else 1
        status = p_statuses[i % len(p_statuses)]
        cur.execute("""
            INSERT INTO payments
                (amount, created_at, currency, gateway, order_id,
                 status, transaction_id, user_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING
        """, (
            round(random.uniform(150, 2500), 2),
            rand_past(90),
            "INR",
            random.choice(GATEWAYS),
            oid,
            status,
            txn_id() if status != "PENDING" else None,
            uid,
        ))
        inserted += 1

    c.commit(); cur.close(); c.close()
    s = p_statuses[:len(order_ids)]
    print(f"    ✓ {inserted} payments  "
          f"(SUCCESS:{s.count('SUCCESS')}  FAILED:{s.count('FAILED')}  "
          f"PENDING:{s.count('PENDING')}  REFUNDED:{s.count('REFUNDED')})")

# ─────────────────────────────────────────────
#  6. ADMIN
# ─────────────────────────────────────────────
def seed_admin():
    print("\n[6/6] Seeding adminDB → audit_logs, suggestion_reviews...")
    c = conn("admin"); cur = c.cursor()

    admin_ids = user_ids[:5] if len(user_ids) >= 5 else user_ids

    ACTIONS = [
        "UPDATE_ORDER_STATUS",
        "APPROVE_SUGGESTION",
        "REJECT_SUGGESTION",
        "MANAGE_INVENTORY",
        "MANAGE_USER",
    ]
    TARGET_TYPES = ["USER","ORDER","PAYMENT","PRODUCT","RECIPE","SYSTEM"]

    logs = []
    for _ in range(2000):
        action      = random.choice(ACTIONS)
        is_admin_op = True  # all audit_log actions are admin actions
        actor_id    = random.choice(admin_ids) if is_admin_op and admin_ids else (
                      random.choice(user_ids) if user_ids else 1)
        target_type = random.choice(TARGET_TYPES)
        target_id   = None
        if target_type == "ORDER"   and order_ids:   target_id = random.choice(order_ids)
        elif target_type == "USER"  and user_ids:    target_id = random.choice(user_ids)
        elif target_type == "PRODUCT" and product_ids: target_id = random.choice(product_ids)

        logs.append((
            action,
            actor_id,
            f"Action '{action}' performed on {target_type} {target_id}",
            target_id,
            target_type,
            rand_past(90),
        ))

    execute_batch(cur, """
        INSERT INTO audit_logs
            (action, admin_id, details, target_id, target_type, timestamp)
        VALUES (%s,%s,%s,%s,%s,%s)
    """, logs)

    # suggestion_reviews — links to recipe_suggestions
    if suggestion_ids:
        DECISIONS = ["APPROVED"]*35 + ["REJECTED"]*25 + ["PENDING"]*40
        reviews = []
        for sid in random.sample(suggestion_ids,
                                 k=min(len(suggestion_ids), 150)):
            decision    = random.choice(DECISIONS)
            admin_id    = random.choice(admin_ids) if admin_ids else None
            reviewed_at = rand_past(30) if decision != "PENDING" else None
            notes_map   = {
                "APPROVED": "Looks great! Will be added to the menu next week.",
                "REJECTED": "Does not fit our current menu theme.",
                "PENDING":  None,
            }
            reviews.append((
                admin_id,
                decision,
                notes_map[decision],
                reviewed_at,
                sid,
            ))

        execute_batch(cur, """
            INSERT INTO suggestion_reviews
                (admin_id, decision, notes, reviewed_at, suggestion_id)
            VALUES (%s,%s,%s,%s,%s)
        """, reviews)

        print(f"    ✓ {len(logs)} audit_logs, {len(reviews)} suggestion_reviews")
    else:
        print(f"    ✓ {len(logs)} audit_logs, 0 suggestion_reviews (no suggestions found)")

    c.commit(); cur.close(); c.close()

# ─────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  Recipe Delivery Platform — Test Data Seeder v3")
    print("=" * 55)

    seed_users()
    seed_recipes()
    seed_inventory()
    seed_orders()
    seed_payments()
    seed_admin()

    print("\n" + "=" * 55)
    print(f"  Done!")
    print(f"  users:            {len(user_ids)}")
    print(f"  recipes:          {len(recipe_ids)}")
    print(f"  ingredients:      {len(ingredient_ids)}")
    print(f"  products:         {len(product_ids)}")
    print(f"  orders:           {len(order_ids)}")
    print("=" * 55)
    print("""
Verify:
  docker exec -it ecom-postgres psql -U postgres -d orderServiceDB
  SELECT status, COUNT(*) FROM orders GROUP BY status;
""")
