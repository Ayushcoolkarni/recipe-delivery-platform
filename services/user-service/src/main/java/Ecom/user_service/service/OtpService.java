package Ecom.user_service.service;

public interface OtpService {
    /** Generate a 6-digit OTP, store it in Redis with 5-min TTL, send via email. */
    void sendOtp(String email);

    /** Returns true and deletes the OTP if it matches; false otherwise. */
    boolean verifyOtp(String email, String otp);
}
