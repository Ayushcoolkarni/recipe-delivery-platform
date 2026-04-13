package Ecom.user_service.controller;

import Ecom.user_service.dto.request.*;
import Ecom.user_service.dto.response.AuthResponse;
import Ecom.user_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    /**
     * POST /auth/register
     * Register a new customer account.
     * Returns access + refresh tokens immediately.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    /**
     * POST /auth/login
     * Authenticate with email + password.
     * Uses AuthenticationManager → DaoAuthenticationProvider → JPA.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    /**
     * POST /auth/refresh
     * Exchange a valid refresh token for a new access + refresh token pair.
     *
     * Body: { "refreshToken": "eyJhbGci..." }
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(userService.refreshToken(request.getRefreshToken()));
    }
}
