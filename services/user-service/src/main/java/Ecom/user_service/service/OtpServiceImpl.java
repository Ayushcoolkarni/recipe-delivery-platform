package Ecom.user_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

/**
 * OTP flow:
 *   1. sendOtp(email)   → generate 6-digit code, store in Redis key "otp:{email}"
 *                         with 5-minute TTL, send email.
 *   2. verifyOtp(email) → fetch from Redis, compare, delete on match.
 *
 * Redis is already in the user-service (it's used for token caching).
 * Spring Mail config is added to application.yml (see otp-application.yml).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private static final String OTP_PREFIX    = "otp:";
    private static final int    OTP_LENGTH    = 6;
    private static final long   OTP_TTL_MINS  = 5;
    private static final SecureRandom RANDOM  = new SecureRandom();

    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender      mailSender;

    @Override
    public void sendOtp(String email) {
        String otp = generateOtp();
        String key = OTP_PREFIX + email;

        // Store with 5-minute TTL — overwrites any existing OTP for this email
        redisTemplate.opsForValue().set(key, otp, Duration.ofMinutes(OTP_TTL_MINS));
        log.info("OTP stored in Redis for email={} (TTL={}m)", email, OTP_TTL_MINS);

        sendEmail(email, otp);
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        String key    = OTP_PREFIX + email;
        String stored = redisTemplate.opsForValue().get(key);

        if (stored == null) {
            log.warn("OTP not found or expired for email={}", email);
            return false;
        }
        if (!stored.equals(otp)) {
            log.warn("OTP mismatch for email={}", email);
            return false;
        }

        // Delete immediately after successful verification (one-time use)
        redisTemplate.delete(key);
        log.info("OTP verified and deleted for email={}", email);
        return true;
    }

    // ── private ──────────────────────────────────────────────────────────────

    private String generateOtp() {
        int bound = (int) Math.pow(10, OTP_LENGTH);
        int code  = RANDOM.nextInt(bound);
        return String.format("%0" + OTP_LENGTH + "d", code);   // zero-padded: "007342"
    }

    private void sendEmail(String to, String otp) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject("Your RasoiKit OTP");
            msg.setText(
                "Hi 👋\n\n" +
                "Your one-time password is: " + otp + "\n\n" +
                "It expires in " + OTP_TTL_MINS + " minutes.\n" +
                "Do not share this code with anyone.\n\n" +
                "— RasoiKit team"
            );
            mailSender.send(msg);
            log.info("OTP email sent to {}", to);
        } catch (Exception e) {
            // Don't throw — log and let the caller surface a generic error
            log.error("Failed to send OTP email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Could not send OTP email. Check mail config.");
        }
    }
}
