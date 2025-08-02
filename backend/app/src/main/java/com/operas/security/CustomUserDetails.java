package com.operas.security;

import com.operas.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class CustomUserDetails implements UserDetails {

    private final User user;
    
    public CustomUserDetails(User user){
        this.user = user;
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Use user's type as role (e.g., ROLE_USER)
        return Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getType()));
    }
    
    @Override
    public String getPassword(){
        return user.getPassword();
    }
    
    @Override
    public String getUsername(){
        return user.getUsername();
    }

    public User getUser() {
        return user;
    }
    
    @Override
    public boolean isAccountNonExpired(){
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked(){
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired(){
        return true;
    }
    
    @Override
    public boolean isEnabled(){
        return true;
    }
}
