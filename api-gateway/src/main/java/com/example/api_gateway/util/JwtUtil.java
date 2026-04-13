package com.example.api_gateway.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;

/**
 * JWT validation utility for the API Gateway.
 *
 * Uses the same secret as user-service so tokens signed there
 * can be verified here without calling user-service.
 *
 * Secret format: Base64-encoded bytes
 * (the value 404E635266... is a hex string that gets Base64-decoded
 *  to a 48-byte key, which JJWT signs as HS384)
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(secret);
            this.secretKey = Keys.hmacShaKeyFor(keyBytes);
            log.info("Gateway JWT key initialised — {} bits", keyBytes.length * 8);
        } catch (Exception e) {
            log.error("Failed to initialise JWT key: {}", e.getMessage());
            throw new RuntimeException("Invalid JWT secret configuration", e);
        }
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = getClaims(token);
            // Check expiry explicitly
            return claims.getExpiration().after(new java.util.Date());
        } catch (Exception e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    public String extractUserId(String token) {
        return getClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public String extractEmail(String token) {
        return getClaims(token).get("email", String.class);
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
