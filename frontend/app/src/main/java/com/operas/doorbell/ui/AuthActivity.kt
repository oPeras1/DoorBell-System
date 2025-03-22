package com.operas.doorbell.ui

import AuthResponse
import Resource
import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.snackbar.Snackbar
import com.operas.doorbell.MainActivity
import com.operas.doorbell.databinding.ActivityAuthBinding

class AuthActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAuthBinding
    private val viewModel: AuthViewModel by viewModels() // Proper initialization

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAuthBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupLoginButton()
        observeViewModel()
    }

    private fun setupLoginButton() {
        binding.btnLogin.setOnClickListener {
            val email = "test@example.com" // For testing, replace with real input
            val password = "password123"
            
            // Show loading
            binding.progressBar.visibility = View.VISIBLE
            binding.btnLogin.isEnabled = false
            
            viewModel.login(email, password)
        }
    }

    private fun observeViewModel() {
        viewModel.authResult.observe(this) { resource ->
            when (resource) {
                is Resource.Success -> {
                    // Navigate to MainActivity
                    startActivity(Intent(this, MainActivity::class.java))
                    finish()
                }
                is Resource.Error -> {
                    // Show error
                    binding.progressBar.visibility = View.GONE
                    binding.btnLogin.isEnabled = true
                    Snackbar.make(binding.root, "Login failed: ${resource.message}", Snackbar.LENGTH_LONG).show()
                }
                is Resource.Loading -> {
                    // Already handled by button disable
                }

                else -> {}
            }
        }
    }
        
    private fun handleSuccess(data: AuthResponse?) {
        // Handle successful login/registration
        // Save token using SharedPreferences or SecureStorage
    }
    
    private fun handleError(message: String?) {
        // Show error message to user
    }
    
    private fun showLoading() {
        // Show loading indicator
    }
}