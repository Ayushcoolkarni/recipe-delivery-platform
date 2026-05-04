package Ecom.order_service.dto.response;

import lombok.*;
import java.util.List;

/**
 * GAP 10 FIX — CartItemResponse must include cartItemId, pricePerKit,
 * servings, and scaledIngredients so Cart.jsx can render correctly.
 *
 * Cart.jsx reads:
 *   item.cartItemId  → maps to id
 *   item.pricePerKit → price for chosen servings
 *   item.servings    → shows "👥 N servings" badge
 *   item.scaledIngredients → passed through to order payload
 *   item.recipeName  → display name
 *   item.cuisine     → shown in cart card
 *   item.quantity    → number of kits
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {

    // GAP 10: field name MUST be "cartItemId" — Cart.jsx reads item.cartItemId || item.id
    private Long   cartItemId;

    // Legacy (keep)
    private Long   productId;
    private String ingredientName;
    private Double pricePerUnit;
    private Double lineTotal;

    // Recipe-level (new)
    private Long    recipeId;
    private String  recipeName;
    private String  cuisine;
    private Integer servings;
    private Double  pricePerKit;
    private Integer quantity;
    private List<ScaledIngredient> scaledIngredients;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScaledIngredient {
        private String ingredientName;
        private Double quantity;
        private String unit;
    }
}
