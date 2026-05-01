package Ecom.user_service.service;

import Ecom.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * JPA-backed UserDetailsService.
 *
 * Spring Security calls loadUserByUsername() during authentication.
 * We load the User from PostgreSQL via JPA and wrap it in a
 * Spring Security UserDetails object with the correct role.
 *
 * This is the bridge between JPA (your User entity) and
 * Spring Security (its UserDetails contract).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        return userRepository.findByEmail(email)
                .map(user -> {
                    log.debug("Loaded user from DB: {} role={}", email, user.getRole());

                    // Spring Security expects "ROLE_" prefix
                    String authority = "ROLE_" + user.getRole().name();

                    return org.springframework.security.core.userdetails.User
                            .withUsername(user.getEmail())
                            .password(user.getPasswordHash())
                            .authorities(List.of(new SimpleGrantedAuthority(authority)))
                            .accountExpired(false)
                            .accountLocked(false)
                            .credentialsExpired(false)
                            .disabled(!user.isVerified() && false) // allow unverified for now
                            .build();
                })
                .orElseThrow(() -> {
                    log.warn("User not found for email: {}", email);
                    return new UsernameNotFoundException("User not found: " + email);
                });
    }
}
