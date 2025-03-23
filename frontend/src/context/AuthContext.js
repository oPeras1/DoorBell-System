import React, { createContext, useState, useEffect } from 'react';
import { checkAuthStatus } from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await checkAuthStatus();
      setUserToken(token);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const authContext = {
    login: async (credentials) => {
      // Implementar lógica real de login
      setUserToken('dummy_token');
    },
    logout: () => {
      setUserToken(null);
    },
    userToken,
    isLoading
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};