import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { LoginDto } from '../types/auth';
import * as authService from './AuthService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkTokenExpiry: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple base64url -> JSON decoder for JWT payload (no external lib)
const decodeJwt = (token: string): any | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // base64url -> base64
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // pad base64 string
    const pad = b64.length % 4;
    const padded = b64 + (pad ? '='.repeat(4 - pad) : '');
    // atob -> decode utf-8 safely
    const binary = atob(padded);
    const json = decodeURIComponent(
      Array.prototype.map
        .call(binary, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch (err) {
    console.warn('decodeJwt failed', err);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('[AuthContext] init - token from localStorage:', token);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const decoded = decodeJwt(token);
    console.log('[AuthContext] decoded token on init:', decoded);

    if (!decoded) {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    // if token has exp (seconds) check expiry
    if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    setUser(decoded as User);
    setIsLoading(false);
  }, [token]);

  const login = async (credentials: LoginDto) => {
    console.log('[AuthContext] login called with', credentials);
    const result = await authService.login(credentials);
    console.log('[AuthContext] login result from service:', result);

    const newToken =
      typeof result === 'string'
        ? result
        : (result && (result.token || (result as any).accessToken)) || null;

    console.log('[AuthContext] extracted token:', newToken);
    if (!newToken) throw new Error('Login did not return a token');

    localStorage.setItem('token', newToken);
    setToken(newToken);
    console.log('[AuthContext] token saved to localStorage');

    const decoded = decodeJwt(newToken);
    console.log('[AuthContext] decoded token after login:', decoded);
    if (decoded) {
      setUser(decoded as User);
      console.log('[AuthContext] user set after login:', decoded);
    } else {
      setUser(null);
      console.log('[AuthContext] decoded token invalid, user set to null');
    }
  };

  const logout = () => {
    console.log('[AuthContext] logout - clearing token and user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const checkTokenExpiry = (): boolean => {
    if (!token) return false;
    
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) return false;
    
    // Check if token is expired (with 30 second buffer)
    if (decoded.exp * 1000 <= Date.now() + 30000) {
      console.log('[AuthContext] Token expired or expiring soon, logging out');
      logout();
      return false;
    }
    
    return true;
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isAuthenticated, checkTokenExpiry }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};