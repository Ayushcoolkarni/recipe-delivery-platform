package Ecom.user_service.service;

import Ecom.user_service.entity.User;
import org.springframework.security.core.userdetails.UserDetails;

public interface JwtService {

    /** Generate short-lived access token (1 hour) */
    String generateToken(User user);

    /** Generate long-lived refresh token (7 days) */
    String generateRefreshToken(User user);

    /** Extract email claim from token */
    String extractEmail(String token);

    /** Extract userId (subject) from token */
    String extractUserId(String token);

    /** Extract role claim from token */
    String extractRole(String token);

    /** Check token signature + expiry. Also validates against UserDetails email. */
    boolean isTokenValid(String token, UserDetails userDetails);

    /** Check token signature + expiry only (no UserDetails needed) */
    boolean isTokenValid(String token);
}
