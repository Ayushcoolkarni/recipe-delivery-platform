package Ecom.user_service.service;

import Ecom.user_service.dto.request.*;
import Ecom.user_service.dto.response.*;

public interface UserService {

    // Auth
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);

    // User profile
    UserResponse getUserById(Long id);
    UserResponse updateUser(Long id, RegisterRequest request);

    // Address
    AddressResponse addAddress(Long userId, AddressRequest request);

    // Saved recipes
    void saveRecipe(Long userId, Long recipeId);
    void removeSavedRecipe(Long userId, Long recipeId);
}
