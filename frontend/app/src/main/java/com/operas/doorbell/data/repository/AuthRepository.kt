import retrofit2.Response

class AuthRepository {
    private val authService = RetrofitInstance.authService

    suspend fun login(email: String, password: String): Resource<AuthResponse> {
        return try {
            val response = authService.login(LoginRequest(email, password))
            handleResponse(response)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun register(email: String, password: String, username: String): Resource<AuthResponse> {
        return try {
            val response = authService.register(RegisterRequest(email, password, username))
            handleResponse(response)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Unknown error")
        }
    }

    private fun handleResponse(response: Response<AuthResponse>): Resource<AuthResponse> {
        if (response.isSuccessful) {
            response.body()?.let {
                return Resource.Success(it)
            }
        }
        return Resource.Error(response.message() ?: "Unknown error")
    }
}

sealed class Resource<T>(val data: T? = null, val message: String? = null) {
    class Success<T>(data: T) : Resource<T>(data)
    class Error<T>(message: String, data: T? = null) : Resource<T>(data, message)
    class Loading<T> : Resource<T>()
}