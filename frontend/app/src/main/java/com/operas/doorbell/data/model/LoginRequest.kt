// LoginRequest.kt
data class LoginRequest(
    val email: String,
    val password: String
)

// RegisterRequest.kt
data class RegisterRequest(
    val email: String,
    val password: String,
    val username: String // Add other fields as needed
)

// AuthResponse.kt
data class AuthResponse(
    val token: String,
    val userId: String,
    val message: String?
)