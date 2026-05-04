package Ecom.order_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;

/**
 * GAP 8 + 10 FIX — Extended CartItem entity.
 *
 * Added recipe-level fields:
 *   recipeId, recipeName, cuisine, servings, pricePerKit, scaledIngredients (JSON)
 *
 * The old fields (productId, ingredientName, pricePerUnit) are kept so the
 * existing CartServiceImpl continues to compile. New recipe-based additions
 * sit alongside them.
 *
 * scaledIngredients is stored as a JSONB column so no extra join table is needed.
 */
@Entity
@Table(name = "cart_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    // ── Legacy ingredient-level fields (keep for backward compat) ─────────
    private Long   productId;
    private String ingredientName;
    private Double pricePerUnit;

    // ── Recipe-level fields (new) ──────────────────────────────────────────
    @Column(name = "recipe_id")
    private Long recipeId;

    @Column(name = "recipe_name")
    private String recipeName;

    private String cuisine;

    /** Servings the user chose — drives ingredient quantities. */
    private Integer servings;

    /** Price for this servings count. */
    @Column(name = "price_per_kit")
    private Double pricePerKit;

    // ── Shared ────────────────────────────────────────────────────────────
    private Integer quantity;

    /**
     * Scaled ingredient list stored as JSON.
     * e.g. [{"ingredientName":"Milk","quantity":200.0,"unit":"ml"}, ...]
     *
     * GAP 10 FIX: this is what Cart.jsx expects back in the GET /cart response
     * as item.scaledIngredients.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "scaled_ingredients", columnDefinition = "jsonb")
    private List<ScaledIngredientData> scaledIngredients;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScaledIngredientData {
        private String ingredientName;
        private Double quantity;
        private String unit;
    }
}
