"""
seed_data.py — Recipe Delivery Platform
Populates every service via real backend APIs. Zero hardcoded IDs.
All IDs are discovered from API responses and threaded through downstream calls.

Run:   python seed_data.py
Needs: pip install requests
"""

import requests, sys

BASE = "http://localhost:8080"
H    = {"Content-Type": "application/json"}

G = "\033[92m"; R = "\033[91m"; Y = "\033[93m"; C = "\033[96m"; X = "\033[0m"
errors = []

def ok(msg):   print(f"  {G}✔  {msg}{X}")
def fail(msg): print(f"  {R}✗  {msg}{X}"); errors.append(msg)
def info(msg): print(f"\n{C}━━  {msg}  ━━{X}")
def warn(msg): print(f"  {Y}⚠  {msg}{X}")

def field(obj, *keys):
    for k in keys:
        if obj and isinstance(obj, dict) and k in obj:
            return obj[k]
    return None

def post(path, body, label):
    try:
        r = requests.post(f"{BASE}{path}", json=body, headers=H, timeout=10)
        if r.status_code in (200, 201):
            ok(label)
            return r.json()
        fail(f"{label} → HTTP {r.status_code}: {r.text[:200]}")
        return None
    except Exception as e:
        fail(f"{label} → {e}"); return None

# ─────────────────────────────────────────────────────────────────────────────
# 1. REGISTER USERS
# ─────────────────────────────────────────────────────────────────────────────
info("1. Registering users  [POST /auth/register]")

USERS = [
    {"name": "Ayush Kulkarni", "email": "ayush@ecom.dev",  "password": "Pass@1234", "phone": "9876543210"},
    {"name": "Priya Sharma",   "email": "priya@ecom.dev",  "password": "Pass@1234", "phone": "9123456780"},
    {"name": "Rahul Verma",    "email": "rahul@ecom.dev",  "password": "Pass@1234", "phone": "9988776650"},
    {"name": "Admin User",     "email": "admin@ecom.dev",  "password": "Pass@1234", "phone": "9000000001"},
]

user_ids, tokens = [], []
for u in USERS:
    res = post("/auth/register", u, f"Register {u['name']}")
    if not res:
        res = post("/auth/login", {"email": u["email"], "password": u["password"]}, f"Login {u['name']} (fallback)")
    uid   = field(res, "userId", "id")
    token = field(res, "accessToken", "token")
    user_ids.append(uid)
    tokens.append(token)
    ok(f"  → userId={uid}") if uid else warn(f"  No userId for {u['email']}")

# ─────────────────────────────────────────────────────────────────────────────
# 2. ADD ADDRESSES
# ─────────────────────────────────────────────────────────────────────────────
info("2. Adding delivery addresses  [POST /users/{id}/addresses]")

ADDRESSES = [
    {"street": "123 MG Road",       "city": "Bangalore", "state": "Karnataka",   "pincode": "560001", "country": "India", "isDefault": True},
    {"street": "45 Andheri West",   "city": "Mumbai",    "state": "Maharashtra", "pincode": "400053", "country": "India", "isDefault": True},
    {"street": "7 Connaught Place", "city": "Delhi",     "state": "Delhi",       "pincode": "110001", "country": "India", "isDefault": True},
    {"street": "1 Admin Colony",    "city": "Pune",      "state": "Maharashtra", "pincode": "411001", "country": "India", "isDefault": True},
]

address_ids = []
for i, uid in enumerate(user_ids):
    if uid is None:
        address_ids.append(None); warn(f"Skipping address — userId[{i}] is None"); continue
    res = post(f"/users/{uid}/addresses", ADDRESSES[i], f"Address for userId={uid}")
    address_ids.append(field(res, "id", "addressId"))

# ─────────────────────────────────────────────────────────────────────────────
# 3. CREATE INVENTORY PRODUCTS
# ─────────────────────────────────────────────────────────────────────────────
info("3. Creating inventory products  [POST /products]")

PRODUCTS = [
    # idx  name              description                                unit   price   stock  category
    {"name": "Tomato",       "description": "Fresh red tomatoes",      "unit": "kg",  "pricePerUnit": 40.0,  "stockQuantity": 200, "category": "VEGETABLE"},   # 0
    {"name": "Onion",        "description": "White onions",            "unit": "kg",  "pricePerUnit": 30.0,  "stockQuantity": 200, "category": "VEGETABLE"},   # 1
    {"name": "Garlic",       "description": "Fresh garlic cloves",     "unit": "pcs", "pricePerUnit": 5.0,   "stockQuantity": 300, "category": "SPICE"},        # 2
    {"name": "Olive Oil",    "description": "Extra virgin olive oil",  "unit": "ml",  "pricePerUnit": 0.50,  "stockQuantity": 100, "category": "OIL"},          # 3
    {"name": "Spaghetti",    "description": "Durum wheat spaghetti",   "unit": "g",   "pricePerUnit": 0.12,  "stockQuantity": 150, "category": "GRAIN"},        # 4
    {"name": "Chicken",      "description": "Boneless chicken breast", "unit": "kg",  "pricePerUnit": 280.0, "stockQuantity": 80,  "category": "PROTEIN"},      # 5
    {"name": "Basmati Rice", "description": "Aged long grain basmati", "unit": "kg",  "pricePerUnit": 90.0,  "stockQuantity": 150, "category": "GRAIN"},        # 6
    {"name": "Paneer",       "description": "Fresh cottage cheese",    "unit": "g",   "pricePerUnit": 0.35,  "stockQuantity": 100, "category": "DAIRY"},        # 7
    {"name": "Butter",       "description": "Unsalted white butter",   "unit": "g",   "pricePerUnit": 0.55,  "stockQuantity": 80,  "category": "DAIRY"},        # 8
    {"name": "Heavy Cream",  "description": "Fresh heavy cream",       "unit": "ml",  "pricePerUnit": 0.45,  "stockQuantity": 80,  "category": "DAIRY"},        # 9
    {"name": "Eggs",         "description": "Farm fresh eggs",         "unit": "pcs", "pricePerUnit": 8.0,   "stockQuantity": 300, "category": "PROTEIN"},      # 10
    {"name": "Flour",        "description": "All purpose flour",       "unit": "g",   "pricePerUnit": 0.05,  "stockQuantity": 200, "category": "GRAIN"},        # 11
    {"name": "Cumin Seeds",  "description": "Whole cumin (jeera)",     "unit": "g",   "pricePerUnit": 0.80,  "stockQuantity": 100, "category": "SPICE"},        # 12
    {"name": "Garam Masala", "description": "Aromatic spice blend",    "unit": "g",   "pricePerUnit": 1.20,  "stockQuantity": 100, "category": "SPICE"},        # 13
    {"name": "Coconut Milk", "description": "Canned coconut milk",     "unit": "ml",  "pricePerUnit": 0.30,  "stockQuantity": 80,  "category": "DAIRY"},        # 14
    {"name": "Green Chilli", "description": "Fresh green chillies",    "unit": "pcs", "pricePerUnit": 2.0,   "stockQuantity": 200, "category": "SPICE"},        # 15
    {"name": "Coriander",    "description": "Fresh coriander leaves",  "unit": "g",   "pricePerUnit": 0.20,  "stockQuantity": 150, "category": "HERB"},         # 16
    {"name": "Yogurt",       "description": "Full fat plain yogurt",   "unit": "g",   "pricePerUnit": 0.18,  "stockQuantity": 120, "category": "DAIRY"},        # 17
]

product_ids = []
for p in PRODUCTS:
    res = post("/products", p, f"Product: {p['name']}")
    product_ids.append(field(res, "id", "productId"))

def pid(i): return product_ids[i]

# ─────────────────────────────────────────────────────────────────────────────
# 4. CREATE INGREDIENTS  (linked to product IDs from step 3)
# ─────────────────────────────────────────────────────────────────────────────
info("4. Creating ingredients  [POST /ingredients]")

# (name, unit, product_index)
ING_DEF = [
    ("Tomato",       "kg",  0),   # 0
    ("Onion",        "kg",  1),   # 1
    ("Garlic",       "pcs", 2),   # 2
    ("Olive Oil",    "ml",  3),   # 3
    ("Spaghetti",    "g",   4),   # 4
    ("Chicken",      "kg",  5),   # 5
    ("Basmati Rice", "kg",  6),   # 6
    ("Paneer",       "g",   7),   # 7
    ("Butter",       "g",   8),   # 8
    ("Heavy Cream",  "ml",  9),   # 9
    ("Eggs",         "pcs", 10),  # 10
    ("Flour",        "g",   11),  # 11
    ("Cumin Seeds",  "g",   12),  # 12
    ("Garam Masala", "g",   13),  # 13
    ("Coconut Milk", "ml",  14),  # 14
    ("Green Chilli", "pcs", 15),  # 15
    ("Coriander",    "g",   16),  # 16
    ("Yogurt",       "g",   17),  # 17
]

ingredient_ids = []
for name, unit, pi in ING_DEF:
    p = pid(pi)
    if p is None:
        ingredient_ids.append(None); warn(f"Skipping ingredient {name} — product not created"); continue
    res = post("/ingredients", {"name": name, "unit": unit, "productId": p},
               f"Ingredient: {name} → productId={p}")
    ingredient_ids.append(field(res, "id", "ingredientId"))

def iid(i): return ingredient_ids[i]

# ─────────────────────────────────────────────────────────────────────────────
# 5. CREATE RECIPES
# ─────────────────────────────────────────────────────────────────────────────
info("5. Creating recipes  [POST /recipes]")

def make_recipe(name, desc, instructions, image, prep, servings, category, pairs):
    valid = [(i, q) for i, q in pairs if i is not None]
    return {
        "name": name, "description": desc, "instructions": instructions,
        "imageUrl": image, "prepTimeMinutes": prep, "defaultServings": servings,
        "category": category,
        "ingredientIds": [i for i, _ in valid],
        "quantities":    [q for _, q in valid],
    }

RECIPES = [
    make_recipe(
        "Classic Pasta Arrabbiata",
        "Fiery Italian pasta with tomato, garlic and chilli. A fast weeknight dinner.",
        "1. Cook spaghetti al dente.\n2. Sauté garlic and chilli in olive oil.\n3. Add crushed tomatoes, simmer 10 min.\n4. Toss pasta through sauce.",
        "https://images.unsplash.com/photo-1551183053-bf91798d2c36?w=800",
        25, 2, "DINNER",
        [(iid(0),0.3),(iid(1),0.15),(iid(2),3.0),(iid(3),30.0),(iid(4),200.0),(iid(15),2.0)],
    ),
    make_recipe(
        "Butter Chicken",
        "Creamy mildly spiced North Indian chicken curry. Best with naan or rice.",
        "1. Marinate chicken in yogurt and spices 1 hr.\n2. Grill until golden.\n3. Sauté onion, garlic, tomato.\n4. Add butter, cream, garam masala.\n5. Add chicken, simmer 15 min.",
        "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800",
        45, 4, "DINNER",
        [(iid(5),0.5),(iid(0),0.3),(iid(1),0.2),(iid(2),4.0),(iid(8),50.0),(iid(9),100.0),(iid(13),10.0),(iid(17),100.0)],
    ),
    make_recipe(
        "Paneer Tikka Masala",
        "Chargrilled paneer in a rich spiced tomato-cream gravy.",
        "1. Marinate paneer in yogurt and spices.\n2. Grill until charred.\n3. Make gravy: sauté onion, garlic, tomato.\n4. Add cream, garam masala.\n5. Add paneer, simmer 10 min.",
        "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",
        35, 3, "DINNER",
        [(iid(7),300.0),(iid(0),0.25),(iid(1),0.15),(iid(2),3.0),(iid(9),80.0),(iid(13),8.0),(iid(17),80.0)],
    ),
    make_recipe(
        "Vegetable Biryani",
        "Fragrant basmati rice layered with vegetables and whole spices.",
        "1. Soak rice 30 min, parboil.\n2. Fry onions golden.\n3. Add vegetables and spices 5 min.\n4. Layer rice over vegetables.\n5. Dum cook 20 min.",
        "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
        50, 4, "LUNCH",
        [(iid(6),0.5),(iid(1),0.3),(iid(2),4.0),(iid(12),5.0),(iid(13),8.0),(iid(3),20.0),(iid(16),15.0)],
    ),
    make_recipe(
        "Masala Omelette",
        "Spiced Indian omelette with onion, tomato and chilli. Perfect power breakfast.",
        "1. Beat eggs with salt and pepper.\n2. Mix in onion, tomato, chilli.\n3. Heat butter in pan.\n4. Pour mixture, cook until set.\n5. Fold and serve hot.",
        "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800",
        10, 1, "BREAKFAST",
        [(iid(10),2.0),(iid(0),0.1),(iid(1),0.05),(iid(8),10.0),(iid(15),1.0)],
    ),
    make_recipe(
        "Chicken Coconut Curry",
        "South Indian style chicken curry with coconut milk and aromatic spices.",
        "1. Fry onions and garlic until golden.\n2. Brown chicken all sides.\n3. Add spices, cook 2 min.\n4. Pour coconut milk, simmer 20 min.\n5. Garnish with coriander.",
        "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800",
        40, 4, "DINNER",
        [(iid(5),0.6),(iid(1),0.25),(iid(2),4.0),(iid(14),400.0),(iid(13),10.0),(iid(12),5.0),(iid(16),10.0)],
    ),
    make_recipe(
        "Garlic Butter Pasta",
        "Simple indulgent pasta tossed in garlic butter and cream. Ready in 20 minutes.",
        "1. Cook pasta al dente.\n2. Melt butter, sauté garlic 1 min.\n3. Add cream, reduce slightly.\n4. Toss pasta through sauce.\n5. Season and serve.",
        "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
        20, 2, "LUNCH",
        [(iid(4),200.0),(iid(2),5.0),(iid(8),40.0),(iid(9),60.0),(iid(3),15.0)],
    ),
    make_recipe(
        "Fluffy Buttermilk Pancakes",
        "Light golden breakfast pancakes. Crisp edges, pillowy centre.",
        "1. Whisk flour, eggs, cream into smooth batter. Rest 10 min.\n2. Heat buttered pan.\n3. Pour ladles of batter.\n4. Flip when bubbles appear.\n5. Serve with butter and syrup.",
        "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
        20, 2, "BREAKFAST",
        [(iid(11),150.0),(iid(10),2.0),(iid(9),100.0),(iid(8),20.0)],
    ),
    make_recipe(
        "Dal Tadka",
        "Comforting yellow lentil curry tempered with cumin, garlic and ghee.",
        "1. Boil lentils until soft.\n2. Make tadka: heat oil, splutter cumin seeds.\n3. Add garlic, chilli, onion, tomato.\n4. Pour tadka over lentils.\n5. Simmer 5 min. Garnish coriander.",
        "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800",
        30, 4, "LUNCH",
        [(iid(1),0.2),(iid(2),3.0),(iid(0),0.2),(iid(12),5.0),(iid(15),2.0),(iid(16),10.0),(iid(3),20.0)],
    ),
    make_recipe(
        "Chicken Fried Rice",
        "Restaurant-style fried rice with chicken, egg and vegetables.",
        "1. Use day-old cooked rice.\n2. Scramble eggs in hot wok, set aside.\n3. Stir-fry chicken until done.\n4. Add garlic, onion, rice — toss on high heat.\n5. Add eggs, season with soy sauce.",
        "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800",
        25, 3, "LUNCH",
        [(iid(6),0.4),(iid(5),0.3),(iid(10),2.0),(iid(2),3.0),(iid(1),0.15),(iid(3),20.0)],
    ),
]

recipe_ids = []
for r in RECIPES:
    res = post("/recipes", r, f"Recipe: {r['name']}")
    recipe_ids.append(field(res, "id", "recipeId"))

def rid(i): return recipe_ids[i]

# ─────────────────────────────────────────────────────────────────────────────
# 6. SAVE RECIPES FOR USERS
# ─────────────────────────────────────────────────────────────────────────────
info("6. Saving recipes to user wishlists  [POST /users/{id}/saved-recipes/{recipeId}]")

SAVES = [
    (0, 0), (0, 1), (0, 6),   # Ayush saves pasta, butter chicken, garlic pasta
    (1, 2), (1, 3), (1, 8),   # Priya saves paneer, biryani, dal tadka
    (2, 4), (2, 5), (2, 9),   # Rahul saves omelette, coconut curry, fried rice
]

for ui, ri in SAVES:
    uid  = user_ids[ui]
    r_id = rid(ri)
    if uid and r_id:
        resp = requests.post(f"{BASE}/users/{uid}/saved-recipes/{r_id}", headers=H, timeout=10)
        if resp.status_code in (200, 201, 204):
            ok(f"userId={uid} saved recipeId={r_id}")
        else:
            warn(f"Save recipe userId={uid} recipeId={r_id} → {resp.status_code}")

# ─────────────────────────────────────────────────────────────────────────────
# 7. SUBMIT RECIPE SUGGESTIONS
# ─────────────────────────────────────────────────────────────────────────────
info("7. Submitting recipe suggestions  [POST /suggestions]")

SUGGESTIONS = [
    {"userId": user_ids[0], "recipeName": "Mango Lassi Smoothie Bowl",
     "ingredients": "Mango, yogurt, honey, granola, chia seeds",
     "description": "Thick chilled mango lassi served as a smoothie bowl with toppings."},
    {"userId": user_ids[1], "recipeName": "Palak Paneer",
     "ingredients": "Spinach, paneer, onion, garlic, cream, spices",
     "description": "Classic North Indian spinach and cottage cheese curry."},
    {"userId": user_ids[2], "recipeName": "Prawn Masala",
     "ingredients": "Prawns, onion, tomato, coconut milk, spices",
     "description": "Spicy coastal prawn curry with coconut milk base."},
]

suggestion_ids = []
for s in SUGGESTIONS:
    if s["userId"] is None:
        suggestion_ids.append(None); continue
    res = post("/suggestions", s, f"Suggestion: {s['recipeName']}")
    suggestion_ids.append(field(res, "id", "suggestionId"))

# ─────────────────────────────────────────────────────────────────────────────
# 8. PLACE ORDERS
# ─────────────────────────────────────────────────────────────────────────────
info("8. Placing orders  [POST /orders]")

def order_item(prod_idx, ing_name, qty):
    p = pid(prod_idx)
    price = PRODUCTS[prod_idx]["pricePerUnit"] if p else 0.0
    return {"productId": p, "ingredientName": ing_name, "quantity": qty, "pricePerUnit": price}

ORDERS = [
    {
        "userId": user_ids[0], "addressId": address_ids[0],
        "items": [order_item(0,"Tomato",2), order_item(1,"Onion",1), order_item(4,"Spaghetti",2)],
    },
    {
        "userId": user_ids[1], "addressId": address_ids[1],
        "items": [order_item(5,"Chicken",1), order_item(6,"Basmati Rice",2), order_item(13,"Garam Masala",1)],
    },
    {
        "userId": user_ids[2], "addressId": address_ids[2],
        "items": [order_item(7,"Paneer",2), order_item(9,"Heavy Cream",1), order_item(8,"Butter",1)],
    },
    {
        "userId": user_ids[0], "addressId": address_ids[0],
        "items": [order_item(10,"Eggs",3), order_item(11,"Flour",1), order_item(8,"Butter",1)],
    },
]

order_ids = []
for o in ORDERS:
    if None in [o["userId"], o["addressId"]]:
        order_ids.append(None); warn("Skipping order — missing userId or addressId"); continue
    o["items"] = [i for i in o["items"] if i["productId"] is not None]
    if not o["items"]:
        order_ids.append(None); warn("Skipping order — no valid items"); continue
    res = post("/orders", o, f"Order for userId={o['userId']}")
    order_ids.append(field(res, "id", "orderId"))

# ─────────────────────────────────────────────────────────────────────────────
# 9. INITIATE PAYMENTS
# ─────────────────────────────────────────────────────────────────────────────
info("9. Initiating payments  [POST /payments]")

payment_ids = []
for i, oid in enumerate(order_ids):
    if oid is None:
        payment_ids.append(None); continue
    uid = user_ids[i % len(user_ids)]
    res = post("/payments",
               {"orderId": oid, "userId": uid, "amount": 500.0, "gateway": "SAGA", "currency": "INR"},
               f"Payment for orderId={oid}")
    payment_ids.append(field(res, "id", "paymentId"))

# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{C}{'━'*55}{X}")
print(f"{G}  SEED COMPLETE{X}")
print(f"{C}{'━'*55}{X}")
print(f"  Users       : {[x for x in user_ids    if x]}")
print(f"  Addresses   : {[x for x in address_ids if x]}")
print(f"  Products    : {len([x for x in product_ids    if x])}/{len(PRODUCTS)}")
print(f"  Ingredients : {len([x for x in ingredient_ids if x])}/{len(ING_DEF)}")
print(f"  Recipes     : {len([x for x in recipe_ids     if x])}/{len(RECIPES)}")
print(f"  Suggestions : {len([x for x in suggestion_ids if x])}/{len(SUGGESTIONS)}")
print(f"  Orders      : {[x for x in order_ids   if x]}")
print(f"  Payments    : {[x for x in payment_ids if x]}")
if errors:
    print(f"\n{R}  ERRORS ({len(errors)}):{X}")
    for e in errors: print(f"    {R}• {e}{X}")
print(f"{C}{'━'*55}{X}\n")
sys.exit(1 if errors else 0)
