package Ecom.notification_service.template;

/**
 * HTML email templates for all three order notification types.
 * Call the static build* methods to get a ready-to-send HTML string.
 */
public final class EmailTemplates {

    private EmailTemplates() {}

    // ── Order Confirmation ────────────────────────────────────────

    public static String buildOrderConfirmation(Long orderId, Double totalAmount) {
        return """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px;">
                  <div style="background: #f9f5f0; padding: 28px; border-radius: 10px;">
                    <h2 style="color: #4a3728; margin-top: 0;">Order Confirmed!</h2>
                    <p>Thank you for your order. We have received it and it is now being prepared.</p>
                    <div style="background: #fff; border-radius: 8px; padding: 16px; margin: 20px 0;">
                      <table style="width: 100%%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #888; font-size: 14px;">Order ID</td>
                          <td style="padding: 8px 0; font-weight: bold; text-align: right;">#%d</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #888; font-size: 14px;">Total Amount</td>
                          <td style="padding: 8px 0; font-weight: bold; text-align: right;">₹%.2f</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td>
                          <td style="padding: 8px 0; color: #2e7d32; font-weight: bold; text-align: right;">CONFIRMED</td>
                        </tr>
                      </table>
                    </div>
                    <p style="color: #888; font-size: 13px;">You will receive another email when your order is shipped.</p>
                    <hr style="border: none; border-top: 1px solid #e0d5c9; margin: 20px 0;">
                    <p style="font-size: 12px; color: #aaa; margin: 0;">RecipeEcom · Fresh ingredients, great recipes</p>
                  </div>
                </body>
                </html>
                """.formatted(orderId, totalAmount);
    }

    // ── Shipping Notification ─────────────────────────────────────

    public static String buildShippingNotification(Long orderId) {
        return """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px;">
                  <div style="background: #eaf4fb; padding: 28px; border-radius: 10px;">
                    <h2 style="color: #1565c0; margin-top: 0;">Your Order is on the Way!</h2>
                    <p>Great news — your order has been shipped and is heading your way.</p>
                    <div style="background: #fff; border-radius: 8px; padding: 16px; margin: 20px 0;">
                      <table style="width: 100%%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #888; font-size: 14px;">Order ID</td>
                          <td style="padding: 8px 0; font-weight: bold; text-align: right;">#%d</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td>
                          <td style="padding: 8px 0; color: #1565c0; font-weight: bold; text-align: right;">SHIPPED</td>
                        </tr>
                      </table>
                    </div>
                    <p>You can track your order status anytime in the app.</p>
                    <hr style="border: none; border-top: 1px solid #cde; margin: 20px 0;">
                    <p style="font-size: 12px; color: #aaa; margin: 0;">RecipeEcom · Fresh ingredients, great recipes</p>
                  </div>
                </body>
                </html>
                """.formatted(orderId);
    }

    // ── Delivery Notification ─────────────────────────────────────

    public static String buildDeliveryNotification(Long orderId) {
        return """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px;">
                  <div style="background: #e8f5e9; padding: 28px; border-radius: 10px;">
                    <h2 style="color: #2e7d32; margin-top: 0;">Order Delivered!</h2>
                    <p>Your ingredients have been delivered. Time to cook something amazing!</p>
                    <div style="background: #fff; border-radius: 8px; padding: 16px; margin: 20px 0;">
                      <table style="width: 100%%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #888; font-size: 14px;">Order ID</td>
                          <td style="padding: 8px 0; font-weight: bold; text-align: right;">#%d</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td>
                          <td style="padding: 8px 0; color: #2e7d32; font-weight: bold; text-align: right;">DELIVERED</td>
                        </tr>
                      </table>
                    </div>
                    <p>Enjoyed your experience? Share your feedback in the app!</p>
                    <hr style="border: none; border-top: 1px solid #c8e6c9; margin: 20px 0;">
                    <p style="font-size: 12px; color: #aaa; margin: 0;">RecipeEcom · Fresh ingredients, great recipes</p>
                  </div>
                </body>
                </html>
                """.formatted(orderId);
    }
}
