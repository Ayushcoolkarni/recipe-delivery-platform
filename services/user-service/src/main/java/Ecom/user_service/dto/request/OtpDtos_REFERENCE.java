// ── OtpSendRequest.java ─────────────────────────────────────────────────────
// Place in: Ecom/user_service/dto/request/OtpSendRequest.java

package Ecom.user_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OtpSendRequest {
    @NotBlank @Email
    private String email;
}


// ── OtpVerifyRequest.java ────────────────────────────────────────────────────
// Place in: Ecom/user_service/dto/request/OtpVerifyRequest.java

package Ecom.user_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OtpVerifyRequest {
    @NotBlank @Email
    private String email;

    @NotBlank @Size(min = 6, max = 6)
    private String otp;
}
