package Ecom.user_service.controller;

import Ecom.user_service.dto.request.*;
import Ecom.user_service.dto.response.AuthResponse;
import Ecom.user_service.service.OtpService;
import Ecom.user_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Full AuthController including OTP endpoints.
 *
 * OTP flow:
 *   POST /auth/otp/send    { email }          → sends 6-digit code to email
 *   POST /auth/otp/verify  { email, otp }     → verifies code, returns JWT
 *                                               (auto-registers user if new)
 *
 * Password flow (unchanged):
 *   POST /auth/register    { name, email, password, phone }
 *   POST /auth/login       { email, password }
 *   POST /auth/refresh     { refreshToken }
 *
 * All routes are PUBLIC — no JWT filter applied by the gateway for /api/auth/**
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final OtpService  otpService;

    // ── Password auth ─────────────────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userService.refreshToken(body.get("refreshToken")));
    }

    // ── OTP auth ──────────────────────────────────────────────────────────────

    /**
     * Step 1: Send OTP.
     * Body: { "email": "user@example.com" }
     * Response: 200 { "message": "OTP sent" }
     */
    @PostMapping("/otp/send")
    public ResponseEntity<Map<String, String>> sendOtp(
            @Valid @RequestBody OtpSendRequest request) {
        otpService.sendOtp(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "OTP sent to " + request.getEmail()));
    }

    /**
     * Step 2: Verify OTP and return JWT.
     * Body: { "email": "user@example.com", "otp": "123456" }
     * Response: AuthResponse (same shape as /auth/login)
     *
     * If the email is not registered yet, the user is auto-registered with a
     * random password (they can set a password later via /users/{id}).
     */
    @PostMapping("/otp/verify")
    public ResponseEntity<AuthResponse> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest request) {
        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtp());
        if (!valid) {
            return ResponseEntity.badRequest()
                    .body(AuthResponse.builder()
                            .accessToken(null)
                            .build());
        }
        // Auto-register if first-time OTP login
        AuthResponse auth = userService.loginOrRegisterByEmail(request.getEmail());
        return ResponseEntity.ok(auth);
    }
}
