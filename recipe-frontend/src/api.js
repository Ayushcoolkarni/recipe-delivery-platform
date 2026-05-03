const BASE = "http://localhost:8080";

async function req(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  // Auth
  register: (data) => req("POST", "/auth/register", data),
  login:    (data) => req("POST", "/auth/login", data),
  refresh:  (refreshToken) => req("POST", "/auth/refresh", { refreshToken }),

  // Recipes
  getRecipes:       (token) => req("GET", "/recipes", null, token),
  getRecipe:        (id, token) => req("GET", `/recipes/${id}`, null, token),
  searchRecipes:    (q, token) => req("GET", `/recipes/search?query=${encodeURIComponent(q)}`, null, token),
  getScaledRecipe:  (id, servings, token) => req("GET", `/recipes/${id}/scaled?servings=${servings}`, null, token),

  // Products / Inventory
  getProducts:      () => req("GET", "/products/available"),
  getProduct:       (id) => req("GET", `/products/${id}`),

  // Cart
  getCart:          (userId, token) => req("GET", `/cart/${userId}`, null, token),
  addToCart:        (userId, data, token) => req("POST", `/cart/${userId}/items`, data, token),
  updateCartItem:   (userId, itemId, data, token) => req("PATCH", `/cart/${userId}/items/${itemId}`, data, token),
  removeCartItem:   (userId, itemId, token) => req("DELETE", `/cart/${userId}/items/${itemId}`, null, token),
  clearCart:        (userId, token) => req("DELETE", `/cart/${userId}`, null, token),
  checkout:         (userId, data, token) => req("POST", `/cart/${userId}/checkout`, data, token),

  // Orders
  placeOrder:       (data, token) => req("POST", "/orders", data, token),
  getMyOrders:      (token) => req("GET", "/orders/mine", null, token),
  getOrder:         (id, token) => req("GET", `/orders/${id}`, null, token),
  trackOrder:       (id, token) => req("GET", `/orders/${id}/tracking`, null, token),
  cancelOrder:      (id, token) => req("DELETE", `/orders/${id}`, null, token),

  // Users
  addAddress:       (userId, data, token) => req("POST", `/users/${userId}/addresses`, data, token),
  updateUser:       (userId, data, token) => req("PUT", `/users/${userId}`, data, token),
};
