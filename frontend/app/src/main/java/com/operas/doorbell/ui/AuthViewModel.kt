package com.operas.doorbell.ui

import AuthRepository
import AuthResponse
import Resource
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch

class AuthViewModel : ViewModel() {
    private val repository = AuthRepository()
    
    val authResult = MutableLiveData<Resource<AuthResponse>>()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            authResult.value = Resource.Loading()
            authResult.value = repository.login(email, password)
        }
    }

    fun register(email: String, password: String, username: String) {
        viewModelScope.launch {
            authResult.value = Resource.Loading()
            authResult.value = repository.register(email, password, username)
        }
    }
}
