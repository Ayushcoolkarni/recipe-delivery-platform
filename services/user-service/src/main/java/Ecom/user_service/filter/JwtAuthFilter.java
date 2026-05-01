package Ecom.user_service.filter;

import Ecom.user_service.service.CustomUserDetailsService;
import Ecom.user_service.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT Authentication Filter — runs once per request.
 *
 * Flow:
 *  1. Extract Bearer token from Authorization header
 *  2. Extract email from token
 *  3. Load UserDetails from DB (via CustomUserDetailsService)
 *  4. Validate token against UserDetails (signature + expiry + email match)
 *  5. Extract actual role from token (CUSTOMER or ADMIN)
 *  6. Set authentication in SecurityContext
 *
 * Bug fixed: previously hardcoded "ROLE_USER" — now extracts real role from JWT.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // Skip filter if no Bearer token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            String email = jwtService.extractEmail(token);

            // Only authenticate if not already authenticated
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Load user from DB via JPA
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // Full validation: signature + expiry + email match
                if (jwtService.isTokenValid(token, userDetails)) {

                    // Extract actual role from token (not hardcoded)
                    String role = jwtService.extractRole(token);
                    String authority = "ROLE_" + (role != null ? role.toUpperCase() : "CUSTOMER");

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    List.of(new SimpleGrantedAuthority(authority))
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.debug("Authenticated user: {} role: {}", email, authority);
                }
            }

        } catch (Exception e) {
            log.error("JWT authentication failed: {}", e.getMessage());
            // Don't block the request — let SecurityConfig handle 401
        }

        filterChain.doFilter(request, response);
    }
}
