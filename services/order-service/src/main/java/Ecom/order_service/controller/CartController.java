package Ecom.order_service.controller;

import Ecom.order_service.dto.request.CartItemRequest;
import Ecom.order_service.dto.request.RecipeCartItemRequest;
import Ecom.order_service.dto.response.CartResponse;
import Ecom.order_service.dto.response.OrderResponse;
import Ecom.order_service.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * GAP 8 FIX: Added POST /cart/{userId}/items/recipe endpoint that accepts
 *            RecipeCartItemRequest (recipeId, servings, pricePerKit, scaledIngredients).
 *            The old /items endpoint (productId based) is kept for backward compat.
 *
 * GAP 9 FIX: updateItem uses @RequestParam Integer quantity (query param),
 *            matching api.js: PATCH /cart/{uid}/items/{id}?quantity=N
 *
 * GAP 11 FIX: checkout passes addressId as @RequestParam (query param),
 *             matching api.js: POST /cart/{uid}/checkout?addressId=N
 */
@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    // ── GET cart ─────────────────────────────────────────────────────────────
    @GetMapping("/{userId}")
    public ResponseEntity<CartResponse> getCart(@PathVariable Long userId) {
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    // ── ADD ingredient-level item (legacy, keep for now) ─────────────────────
    @PostMapping("/{userId}/items")
    public ResponseEntity<CartResponse> addItem(
            @PathVariable Long userId,
            @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(cartService.addItem(userId, request));
    }

    // ── ADD recipe-level item (GAP 8 FIX — new endpoint) ─────────────────────
    @PostMapping("/{userId}/items/recipe")
    public ResponseEntity<CartResponse> addRecipeItem(
            @PathVariable Long userId,
            @RequestBody RecipeCartItemRequest request) {
        return ResponseEntity.ok(cartService.addRecipeItem(userId, request));
    }

    // ── UPDATE qty — GAP 9 FIX: quantity as @RequestParam not @RequestBody ────
    @PatchMapping("/{userId}/items/{itemId}")
    public ResponseEntity<CartResponse> updateItem(
            @PathVariable Long userId,
            @PathVariable Long itemId,
            @RequestParam Integer quantity) {           // ← @RequestParam matches api.js ?quantity=N
        return ResponseEntity.ok(cartService.updateItem(userId, itemId, quantity));
    }

    // ── REMOVE single item ────────────────────────────────────────────────────
    @DeleteMapping("/{userId}/items/{itemId}")
    public ResponseEntity<CartResponse> removeItem(
            @PathVariable Long userId,
            @PathVariable Long itemId) {
        return ResponseEntity.ok(cartService.removeItem(userId, itemId));
    }

    // ── CLEAR entire cart ─────────────────────────────────────────────────────
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> clearCart(@PathVariable Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }

    // ── CHECKOUT — GAP 11 FIX: single authoritative checkout path ────────────
    // Validates stock → places order → clears cart atomically
    @PostMapping("/{userId}/checkout")
    public ResponseEntity<OrderResponse> checkout(
            @PathVariable Long userId,
            @RequestParam Long addressId) {             // ← @RequestParam matches api.js ?addressId=N
        return ResponseEntity.ok(cartService.checkout(userId, addressId));
    }
}
