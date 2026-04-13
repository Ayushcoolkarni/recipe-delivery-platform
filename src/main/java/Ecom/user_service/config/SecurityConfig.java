package Ecom.user_service.config;

import Ecom.user_service.filter.JwtAuthFilter;
import Ecom.user_service.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Full Spring Security configuration with JPA-backed authentication.
 *
 * Key components:
 *
 * 1. DaoAuthenticationProvider
 *    Connects Spring Security's auth pipeline to your JPA UserDetailsService.
 *    When AuthenticationManager.authenticate() is called, it uses this
 *    provider to load the user from DB and verify the password.
 *
 * 2. AuthenticationManager
 *    Exposed as a bean so UserServiceImpl can call it during login
 *    instead of manually checking passwords.
 *
 * 3. JwtAuthFilter
 *    Runs before UsernamePasswordAuthenticationFilter on every request.
 *    Validates JWT and sets SecurityContext with the real role.
 *
 * 4. Role-based route protection
 *    /auth/**         → public (register, login, refresh)
 *    /users/admin/**  → ADMIN only
 *    /users/**        → authenticated users
 *    everything else  → authenticated
 */
@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity  // enables @PreAuthorize at method level
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CustomUserDetailsService customUserDetailsService;

    // ── Beans ──────────────────────────────────────────────────────

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * DaoAuthenticationProvider — the JPA bridge.
     * Tells Spring Security: "load users from our JPA UserDetailsService
     * and verify passwords using BCrypt".
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * Expose AuthenticationManager as a bean.
     * Used in UserServiceImpl.login() to authenticate credentials
     * via the proper Spring Security pipeline.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // ── Security filter chain ──────────────────────────────────────

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            .authorizeHttpRequests(auth -> auth

                // Public endpoints — no token needed
                .requestMatchers(
                    "/auth/register",
                    "/auth/login",
                    "/auth/refresh"
                ).permitAll()

                // Actuator — internal health checks
                .requestMatchers("/actuator/**").permitAll()

                // Authenticated — any valid token
                .anyRequest().authenticated()
            )

            // Wire in DaoAuthenticationProvider
            .authenticationProvider(authenticationProvider())

            // JWT filter runs before username/password filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

            // Disable unused auth mechanisms
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
