package Ecom.user_service.service;

import Ecom.user_service.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Full JWT implementation:
 *  - Uses configured jwt.secret (not random — survives restarts)
 *  - Embeds userId, email, role into every token
 *  - Validates against UserDetails for extra security
 *  - Separate access (1h) and refresh (7d) tokens
 */
@Slf4j
@Service
public class JwtServiceImpl implements JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshTokenExpiration;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        log.info("JWT secret key initialised");
    }

    // ── Token generation ──────────────────────────────────────────

    @Override
    public String generateToken(User user) {
        return buildToken(user, accessTokenExpiration);
    }

    @Override
    public String generateRefreshToken(User user) {
        return buildToken(user, refreshTokenExpiration);
    }

    // ── Claim extraction ──────────────────────────────────────────

    @Override
    public String extractEmail(String token) {
        return getClaims(token).get("email", String.class);
    }

    @Override
    public String extractUserId(String token) {
        return getClaims(token).getSubject();
    }

    @Override
    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    // ── Validation ────────────────────────────────────────────────

    /**
     * Full validation — checks signature, expiry AND that the token
     * email matches the UserDetails username (loaded from DB).
     * Use this in JwtAuthFilter for maximum security.
     */
    @Override
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String email = extractEmail(token);
            return email.equals(userDetails.getUsername()) && !isExpired(token);
        } catch (Exception e) {
            log.debug("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Lightweight validation — checks signature + expiry only.
     * Used by api-gateway which has no DB access.
     */
    @Override
    public boolean isTokenValid(String token) {
        try {
            getClaims(token);
            return !isExpired(token);
        } catch (Exception e) {
            log.debug("Token invalid: {}", e.getMessage());
            return false;
        }
    }

    // ── private helpers ───────────────────────────────────────────

    private String buildToken(User user, long expiration) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        claims.put("role",  user.getRole().name());
        claims.put("name",  user.getName());

        return Jwts.builder()
                .claims(claims)
                .subject(String.valueOf(user.getId()))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(secretKey)
                .compact();
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean isExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }
}
