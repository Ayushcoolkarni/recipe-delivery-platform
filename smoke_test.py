"""
smoke_test.py — Recipe Delivery Platform
Tests every endpoint across all 8 microservices via the API Gateway.
All IDs discovered at runtime from API responses — zero hardcoded IDs.
Run AFTER seed_data.py has populated the databases.

Run:   python smoke_test.py
Needs: pip install requests
"""

import requests, sys

BASE = "http://localhost:8080"
H    = {"Content-Type": "application/json"}

G = "\033[92m"; R = "\033[91m"; Y = "\033[93m"; C = "\033[96m"; B = "\033[1m"; X = "\033[0m"

passed = failed = skipped = 0

def field(obj, *keys):
    for k in keys:
        if obj and isinstance(obj, dict) and k in obj:
            return obj[k]
    return None

def section(title):
    print(f"\n{C}{B}━━  {title}  ━━{X}")

def skip(label):
    global skipped
    print(f"  {Y}⊘  SKIP  {label}{X}")
    skipped += 1

def call(method, path, label, expected=200, body=None, params=None):
    global passed, failed
    try:
        fn = getattr(requests, method)
        r  = fn(f"{BASE}{path}", json=body, params=params, headers=H, timeout=10)
        ok = r.status_code == expected
        sym = f"{G}✔{X}" if ok else f"{R}✗{X}"
        print(f"  {sym}  [{r.status_code}]  {method.upper():6}  {path}  {'' if ok else f'← expected {expected}'}")
        if not ok:
            print(f"       {Y}{r.text[:160]}{X}")
            failed += 1
            return None
        passed += 1
        if r.status_code == 204 or not r.content:
            return {}
        return r.json()
    except Exception as e:
        print(f"  {R}✗{X}  {method.upper():6}  {path}  ← {e}")
        failed += 1
        return None

# =============================================================================
# STEP 0 — GATEWAY HEALTH
# =============================================================================
section("API Gateway")
call("get", "/actuator/health", "Gateway health")

# =============================================================================
# STEP 1 — AUTH SERVICE
# =============================================================================
section("Auth Service  [/auth]")

TEST_USER = {"name": "Smoke User", "email": "smoke@test.dev", "password": "Pass@1234", "phone": "9000099000"}

reg = call("post", "/auth/register", "Register test user", body=TEST_USER)
if not reg:
    reg = call("post", "/auth/login", "Login test user (fallback)",
               body={"email": TEST_USER["email"], "password": TEST_USER["password"]})

token   = field(reg, "accessToken", "token")
user_id = field(reg, "userId", "id")

login = call("post", "/auth/login", "Login",
             body={"email": TEST_USER["email"], "password": TEST_USER["password"]})
if login and not token:
    token   = field(login, "accessToken", "token")
    user_id = field(login, "userId", "id")

if token:
    print(f"  {G}  Token acquired  userId={user_id}{X}")
    AH = {**H, "Authorization": f"Bearer {token}"}
else:
    AH = H
    print(f"  {Y}  No token — protected endpoints may return 401{X}")

refresh_token = field(reg or login, "refreshToken")
if refresh_token:
    call("post", "/auth/refresh", "Refresh token", body={"refreshToken": refresh_token})
else:
    skip("Token refresh — no refreshToken in response")

# =============================================================================
# STEP 2 — USER SERVICE
# =============================================================================
section("User Service  [/users]")

users = call("get", "/users", "List all users")
uid   = user_id or (field(users[0], "id") if users and isinstance(users, list) and users else None)

if uid:
    call("get",  f"/users/{uid}",              "Get user by ID")
    call("get",  f"/users/email/{TEST_USER['email']}", "Get user by email")
    addr = call("post", f"/users/{uid}/addresses", "Add address",
                body={"street": "1 Smoke Lane", "city": "Testville", "state": "TS",
                      "pincode": "000001", "country": "India", "isDefault": True})
    address_id = field(addr, "id", "addressId")
else:
    skip("User detail/address tests — no userId")
    address_id = None

# =============================================================================
# STEP 3 — INVENTORY SERVICE
# =============================================================================
section("Inventory Service  [/products]")

prod = call("post", "/products", "Create product",
            body={"name": "Smoke Tomato", "description": "Test tomato", "unit": "kg",
                  "pricePerUnit": 40.0, "stockQuantity": 50, "category": "VEGETABLE"})
pid = field(prod, "id", "productId")

call("get", "/products",           "List all products")
call("get", "/products/available", "List available products")

if pid:
    call("get",   f"/products/{pid}",          "Get product by ID")
    call("get",   f"/products/{pid}/in-stock",  "Check in-stock")
    call("patch", f"/products/{pid}/stock",     "Update stock",   params={"quantity": 99})
    call("put",   f"/products/{pid}",           "Update product",
         body={"name": "Smoke Tomato Updated", "description": "Updated",
               "unit": "kg", "pricePerUnit": 45.0, "stockQuantity": 99, "category": "VEGETABLE"})
else:
    skip("Product detail/stock/update — no productId")

# =============================================================================
# STEP 4 — RECIPE SERVICE: INGREDIENTS
# =============================================================================
section("Recipe Service  [/ingredients]")

ing = call("post", "/ingredients", "Create ingredient",
           body={"name": "Smoke Ingredient", "unit": "kg", "productId": pid})
ing_id = field(ing, "id", "ingredientId")

call("get", "/ingredients", "List all ingredients")

if ing_id:
    call("get", f"/ingredients/{ing_id}", "Get ingredient by ID")
    call("put", f"/ingredients/{ing_id}", "Update ingredient",
         body={"name": "Smoke Ingredient Updated", "unit": "kg", "productId": pid})
else:
    skip("Ingredient detail/update — no ingredientId")

# =============================================================================
# STEP 5 — RECIPE SERVICE: RECIPES
# =============================================================================
section("Recipe Service  [/recipes]")

# Collect up to 3 real ingredient IDs from the database for a well-formed recipe
all_ings = call("get", "/ingredients", "Fetch ingredients for recipe creation")
real_ing_ids  = []
real_ing_qtys = []
if all_ings and isinstance(all_ings, list):
    for i in all_ings[:3]:
        iid = field(i, "id")
        if iid:
            real_ing_ids.append(iid)
            real_ing_qtys.append(0.2)

recipe_body = {
    "name": "Smoke Test Pasta", "description": "Smoke test recipe",
    "instructions": "1. Boil water.\n2. Cook pasta.\n3. Serve.",
    "imageUrl": "https://images.unsplash.com/photo-1551183053-bf91798d2c36?w=400",
    "prepTimeMinutes": 15, "defaultServings": 2, "category": "DINNER",
    "ingredientIds": real_ing_ids, "quantities": real_ing_qtys,
}

rec = call("post", "/recipes", "Create recipe", body=recipe_body)
r_id = field(rec, "id", "recipeId")

call("get", "/recipes",                          "List all recipes")
call("get", "/recipes", "Filter by category",    params={"category": "DINNER"})
call("get", "/recipes/search", "Search recipes", params={"name": "pasta"})

if r_id:
    call("get", f"/recipes/{r_id}",         "Get recipe by ID")
    call("get", f"/recipes/{r_id}/scaled",  "Get scaled recipe (4 servings)", params={"servings": 4})
    call("put", f"/recipes/{r_id}", "Update recipe",
         body={**recipe_body, "name": "Smoke Test Pasta Updated", "category": "LUNCH"})
else:
    skip("Recipe detail/scaled/update — no recipeId")

# =============================================================================
# STEP 6 — SUGGESTIONS
# =============================================================================
section("Suggestion Service  [/suggestions]")

sug = call("post", "/suggestions", "Submit suggestion",
           body={"userId": uid, "recipeName": "Smoke Biryani",
                 "ingredients": "Rice, spices, vegetables",
                 "description": "A test suggestion from smoke test"})
sug_id = field(sug, "id", "suggestionId")

call("get", "/suggestions", "List all suggestions")
if uid:
    call("get", f"/suggestions/user/{uid}", "Get suggestions by user")
if sug_id:
    call("patch", f"/suggestions/{sug_id}/status", "Update suggestion status",
         params={"status": "APPROVED"})
else:
    skip("Suggestion status update — no suggestionId")

# =============================================================================
# STEP 7 — CART SERVICE
# =============================================================================
section("Cart Service  [/cart]")

if uid:
    call("get", f"/cart/{uid}", "Get cart (initially empty or existing)")

    if pid:
        # CartItemRequest needs: productId, ingredientName, quantity, pricePerUnit
        cart = call("post", f"/cart/{uid}/items", "Add item to cart",
                    body={"productId": pid, "ingredientName": "Smoke Tomato",
                          "quantity": 2, "pricePerUnit": 40.0})
        cart_item_id = None
        if cart and isinstance(cart.get("items"), list) and cart["items"]:
            cart_item_id = field(cart["items"][0], "id", "cartItemId")

        if cart_item_id:
            call("patch",  f"/cart/{uid}/items/{cart_item_id}", "Update cart item quantity",
                 params={"quantity": 3})
            call("delete", f"/cart/{uid}/items/{cart_item_id}", "Remove cart item", expected=200)
        else:
            skip("Cart item update/remove — no cartItemId")

    if r_id:
        call("post", f"/cart/{uid}/items/recipe", "Add recipe kit to cart",
             body={"recipeId": r_id, "servings": 2})
    else:
        skip("Add recipe to cart — no recipeId")

    call("delete", f"/cart/{uid}", "Clear cart", expected=204)
else:
    skip("All cart tests — no userId")

# =============================================================================
# STEP 8 — ORDER SERVICE
# =============================================================================
section("Order Service  [/orders]")

order_id = None
if uid and address_id and pid:
    order = call("post", "/orders", "Place order",
                 body={"userId": uid, "addressId": address_id,
                       "items": [{"productId": pid, "ingredientName": "Smoke Tomato",
                                  "quantity": 1, "pricePerUnit": 40.0}]})
    order_id = field(order, "id", "orderId")
else:
    skip("Place order — missing userId, addressId or productId")

call("get", "/orders/all",           "List all orders (admin)")
if uid:
    call("get", f"/orders/user/{uid}", "Get orders by user")

if order_id:
    call("get",   f"/orders/{order_id}",          "Get order by ID")
    call("get",   f"/orders/{order_id}/tracking",  "Get order tracking")
    call("patch", f"/orders/{order_id}/status",    "Update status → CONFIRMED",
         params={"status": "CONFIRMED"})
    call("patch", f"/orders/{order_id}/status",    "Update status → SHIPPED",
         params={"status": "SHIPPED"})
else:
    skip("Order detail/tracking/status — no orderId")

# =============================================================================
# STEP 9 — PAYMENT SERVICE
# =============================================================================
section("Payment Service  [/payments]")

payment_id = None
if order_id and uid:
    pay = call("post", "/payments", "Initiate payment",
               body={"orderId": order_id, "userId": uid,
                     "amount": 40.0, "gateway": "SAGA", "currency": "INR"})
    payment_id = field(pay, "id", "paymentId")
    call("get", f"/payments/order/{order_id}", "Get payment by orderId")
    call("get", f"/payments/user/{uid}",       "Get payments by userId")
else:
    skip("Payment tests — no orderId or userId")

# =============================================================================
# STEP 10 — ADMIN SERVICE
# =============================================================================
section("Admin Service  [/admin]")

call("get",  "/admin/orders",      "Admin: list all orders")
call("get",  "/admin/products",    "Admin: list all products")
call("get",  "/admin/users",       "Admin: list all users")
call("get",  "/admin/suggestions", "Admin: list all suggestions")
call("get",  "/admin/stats",       "Admin: sales stats (daily)",  params={"period": "daily"})
call("get",  "/admin/stats",       "Admin: sales stats (weekly)", params={"period": "weekly"})
call("get",  "/admin/audit-logs",  "Admin: audit logs")

if uid:
    call("get", f"/admin/users/{uid}", "Admin: get user by ID")

if order_id and user_ids_from_seed := None:
    pass  # admin_id needed — use user_ids[3] if seeded, skip otherwise

if sug_id:
    admin_uid = uid  # use smoke user as admin for the review
    call("post", "/admin/suggestions/review", "Admin: review suggestion",
         body={"suggestionId": sug_id, "adminId": admin_uid,
               "decision": "APPROVED", "notes": "Looks great — approved via smoke test"})
else:
    skip("Admin suggestion review — no suggestionId")

if pid:
    call("patch", "/admin/products/stock", "Admin: update stock",
         body={"productId": pid, "quantity": 150, "adminId": uid})

if order_id:
    call("patch", "/admin/orders/status", "Admin: update order status",
         body={"orderId": order_id, "status": "DELIVERED", "adminId": uid})

# =============================================================================
# STEP 11 — CLEANUP (delete smoke test data)
# =============================================================================
section("Cleanup")

if r_id:   call("delete", f"/recipes/{r_id}",     "Delete smoke recipe",     expected=204)
if ing_id: call("delete", f"/ingredients/{ing_id}","Delete smoke ingredient", expected=204)
if pid:    call("delete", f"/products/{pid}",      "Delete smoke product",    expected=204)

# =============================================================================
# RESULTS
# =============================================================================
total = passed + failed
print(f"\n{C}{'━'*55}{X}")
print(f"{B}  SMOKE TEST RESULTS{X}")
print(f"{C}{'━'*55}{X}")
print(f"  {G}Passed : {passed}{X}")
print(f"  {R}Failed : {failed}{X}")
print(f"  {Y}Skipped: {skipped}{X}")
print(f"  Total  : {total}")
pct = int(passed / total * 100) if total else 0
bar = f"{G}{'█' * (pct // 5)}{R}{'░' * (20 - pct // 5)}{X}"
print(f"  Score  : [{bar}] {pct}%")
print(f"{C}{'━'*55}{X}\n")

sys.exit(1 if failed else 0)
