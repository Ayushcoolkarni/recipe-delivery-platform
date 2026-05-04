package Ecom.order_service.service;

import Ecom.order_service.client.InventoryClient;
import Ecom.order_service.dto.request.CartItemRequest;
import Ecom.order_service.dto.request.RecipeCartItemRequest;
import Ecom.order_service.dto.request.OrderItemRequest;
import Ecom.order_service.dto.request.OrderRequest;
import Ecom.order_service.dto.response.CartItemResponse;
import Ecom.order_service.dto.response.CartResponse;
import Ecom.order_service.dto.response.OrderResponse;
import Ecom.order_service.entity.Cart;
import Ecom.order_service.entity.CartItem;
import Ecom.order_service.exception.ResourceNotFoundException;
import Ecom.order_service.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private static final double TAX_RATE = 0.08;

    private final CartRepository  cartRepository;
    private final OrderService    orderService;
    private final InventoryClient inventoryClient;

    // ── GET ──────────────────────────────────────────────────────────────────
    @Override
    public CartResponse getCart(Long userId) {
        return toResponse(getOrCreate(userId));
    }

    // ── ADD ingredient-level item (legacy) ───────────────────────────────────
    @Override
    @Transactional
    public CartResponse addItem(Long userId, CartItemRequest request) {
        Cart cart = getOrCreate(userId);
        cart.getCartItems().stream()
                .filter(i -> request.getProductId() != null
                          && request.getProductId().equals(i.getProductId()))
                .findFirst()
                .ifPresentOrElse(
                        ex -> ex.setQuantity(ex.getQuantity() + request.getQuantity()),
                        () -> cart.getCartItems().add(
                                CartItem.builder()
                                        .cart(cart)
                                        .productId(request.getProductId())
                                        .ingredientName(request.getIngredientName())
                                        .quantity(request.getQuantity())
                                        .pricePerUnit(request.getPricePerUnit())
                                        .build()
                        )
                );
        return toResponse(cartRepository.save(cart));
    }

    // ── ADD recipe-level item (GAP 8 FIX) ────────────────────────────────────
    @Override
    @Transactional
    public CartResponse addRecipeItem(Long userId, RecipeCartItemRequest request) {
        Cart cart = getOrCreate(userId);

        // If same recipe + same servings already in cart, increment quantity
        cart.getCartItems().stream()
                .filter(i -> request.getRecipeId() != null
                          && request.getRecipeId().equals(i.getRecipeId())
                          && request.getServings() != null
                          && request.getServings().equals(i.getServings()))
                .findFirst()
                .ifPresentOrElse(
                        ex -> ex.setQuantity(ex.getQuantity() + (request.getQuantity() == null ? 1 : request.getQuantity())),
                        () -> {
                            // Map scaledIngredients from request DTO to entity inner class
                            List<CartItem.ScaledIngredientData> scaledData = null;
                            if (request.getScaledIngredients() != null) {
                                scaledData = request.getScaledIngredients().stream()
                                        .map(s -> CartItem.ScaledIngredientData.builder()
                                                .ingredientName(s.getIngredientName())
                                                .quantity(s.getQuantity())
                                                .unit(s.getUnit())
                                                .build())
                                        .collect(Collectors.toList());
                            }
                            cart.getCartItems().add(
                                    CartItem.builder()
                                            .cart(cart)
                                            .recipeId(request.getRecipeId())
                                            .recipeName(request.getRecipeName())
                                            .cuisine(request.getCuisine())
                                            .servings(request.getServings())
                                            .pricePerKit(request.getPricePerKit())
                                            .quantity(request.getQuantity() == null ? 1 : request.getQuantity())
                                            .scaledIngredients(scaledData)
                                            .build()
                            );
                        }
                );
        log.info("Recipe item added to cart userId={} recipeId={} servings={}",
                userId, request.getRecipeId(), request.getServings());
        return toResponse(cartRepository.save(cart));
    }

    // ── UPDATE qty ────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public CartResponse updateItem(Long userId, Long itemId, Integer quantity) {
        Cart cart = getOrThrow(userId);
        CartItem item = cart.getCartItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + itemId));
        if (quantity <= 0) {
            cart.getCartItems().remove(item);
        } else {
            item.setQuantity(quantity);
        }
        return toResponse(cartRepository.save(cart));
    }

    // ── REMOVE ────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public CartResponse removeItem(Long userId, Long itemId) {
        Cart cart = getOrThrow(userId);
        boolean removed = cart.getCartItems().removeIf(i -> i.getId().equals(itemId));
        if (!removed) throw new ResourceNotFoundException("Cart item not found: " + itemId);
        return toResponse(cartRepository.save(cart));
    }

    // ── CLEAR ─────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getOrThrow(userId);
        cart.getCartItems().clear();
        cartRepository.save(cart);
    }

    // ── CHECKOUT ──────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public OrderResponse checkout(Long userId, Long addressId) {
        Cart cart = getOrThrow(userId);
        if (cart.getCartItems().isEmpty()) {
            throw new RuntimeException("Cannot checkout with an empty cart");
        }

        // Stock-check only for ingredient-level items (productId based)
        for (CartItem item : cart.getCartItems()) {
            if (item.getProductId() != null && !inventoryClient.isInStock(item.getProductId())) {
                throw new RuntimeException("Product out of stock: " + item.getProductId());
            }
        }

        List<OrderItemRequest> orderItems = cart.getCartItems().stream()
                .map(i -> {
                    OrderItemRequest oi = new OrderItemRequest();
                    oi.setProductId(i.getProductId());
                    oi.setIngredientName(
                            i.getRecipeName() != null
                                    ? i.getRecipeName() + " (" + (i.getServings() != null ? i.getServings() : 4) + " servings)"
                                    : i.getIngredientName()
                    );
                    oi.setQuantity(i.getQuantity() != null ? i.getQuantity() : 1);
                    oi.setPricePerUnit(i.getPricePerKit() != null ? i.getPricePerKit() : (i.getPricePerUnit() != null ? i.getPricePerUnit() : 0.0));
                    return oi;
                })
                .collect(Collectors.toList());

        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setUserId(userId);
        orderRequest.setAddressId(addressId);
        orderRequest.setItems(orderItems);

        OrderResponse placed = orderService.placeOrder(orderRequest);
        cart.getCartItems().clear();
        cartRepository.save(cart);
        log.info("Checkout complete — userId={} orderId={}", userId, placed.getOrderId());
        return placed;
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private Cart getOrCreate(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(
                        Cart.builder().userId(userId).cartItems(new ArrayList<>()).build()));
    }

    private Cart getOrThrow(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for userId: " + userId));
    }

    /**
     * GAP 10 FIX: toResponse now maps cartItemId (not id), pricePerKit,
     * servings, recipeName, cuisine, and scaledIngredients — all fields
     * Cart.jsx expects.
     */
    private CartResponse toResponse(Cart cart) {
        List<CartItemResponse> itemResponses = cart.getCartItems().stream()
                .map(i -> {
                    // Map scaledIngredients from entity to response DTO
                    List<CartItemResponse.ScaledIngredient> scaled = null;
                    if (i.getScaledIngredients() != null) {
                        scaled = i.getScaledIngredients().stream()
                                .map(s -> CartItemResponse.ScaledIngredient.builder()
                                        .ingredientName(s.getIngredientName())
                                        .quantity(s.getQuantity())
                                        .unit(s.getUnit())
                                        .build())
                                .collect(Collectors.toList());
                    }

                    double unitPrice = i.getPricePerKit() != null ? i.getPricePerKit()
                            : (i.getPricePerUnit() != null ? i.getPricePerUnit() : 0.0);
                    int qty = i.getQuantity() != null ? i.getQuantity() : 1;

                    return CartItemResponse.builder()
                            .cartItemId(i.getId())          // ← GAP 10: "cartItemId" not "id"
                            .productId(i.getProductId())
                            .ingredientName(i.getIngredientName())
                            .pricePerUnit(i.getPricePerUnit())
                            .recipeId(i.getRecipeId())
                            .recipeName(i.getRecipeName())
                            .cuisine(i.getCuisine())
                            .servings(i.getServings())
                            .pricePerKit(i.getPricePerKit())
                            .quantity(qty)
                            .scaledIngredients(scaled)
                            .lineTotal(round(unitPrice * qty))
                            .build();
                })
                .collect(Collectors.toList());

        double subtotal = itemResponses.stream().mapToDouble(CartItemResponse::getLineTotal).sum();
        double tax      = round(subtotal * TAX_RATE);
        double total    = round(subtotal + tax);

        return CartResponse.builder()
                .cartId(cart.getId())
                .userId(cart.getUserId())
                .items(itemResponses)
                .subtotal(round(subtotal))
                .estimatedTax(tax)
                .total(total)
                .createdAt(cart.getCreatedAt())
                .build();
    }

    private double round(double v) { return Math.round(v * 100.0) / 100.0; }
}
