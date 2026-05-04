package Ecom.user_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * GAP 6 FIX:
 * The frontend Cart.jsx reads: user.userId || user.id
 * JwtServiceImpl.buildToken() uses subject = String.valueOf(user.getId())
 * AuthResponse MUST expose the field as "userId" (not "id") so the frontend
 * can find it. The builder already sets .userId(user.getId()) in UserServiceImpl
 * — this DTO makes sure the JSON key serialises as "userId".
 *
 * Replace your existing AuthResponse.java with this file.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;       // always "Bearer"

    // GAP 6: field name MUST be "userId" — frontend reads response.userId
    private Long   userId;
    private String email;
    private String name;
    private String role;
}
