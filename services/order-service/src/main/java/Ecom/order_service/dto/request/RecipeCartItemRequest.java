package Ecom.order_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * GAP 8 FIX — New DTO for recipe-level cart items.
 *
 * The old CartItemRequest expected { productId, ingredientName, quantity, pricePerUnit }
 * (ingredient-level, Instamart model).
 *
 * RasoiKit's model is recipe-level: user picks a recipe for N servings → we store
 * the recipe + the scaled ingredient list. The ingredient list is stored as JSON
 * in the cart_items table so the order-service knows exactly what was ordered.
 *
 * Place this file alongside the existing CartItemRequest.java.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeCartItemRequest {

    private Long   recipeId;
    private String recipeName;
    private String cuisine;

    /** Servings the user chose on the RecipeDetail scaler (1–20). */
    private Integer servings;

    /** Price for this servings count: base_price * (servings / base_servings). */
    private Double pricePerKit;

    /** Number of kits (usually 1; user can increment in cart). */
    private Integer quantity;

    /** Scaled ingredient list stored so the order records exactly what was packed. */
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
