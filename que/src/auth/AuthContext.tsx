import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { LoginDto } from '../types/auth';
import * as authService from './AuthService';

 // Authentication context type definition
 // Provides user state, token management, and authentication methods
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

 // Decodes a JWT token without external libraries
 // Extracts the payload from a JWT token and parses it as JSON
const decodeJwt = (token: string): any | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    
    // Convert base64url to base64
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Pad base64 string to correct length
    const pad = b64.length % 4;
    const padded = b64 + (pad ? '='.repeat(4 - pad) : '');
    
    // Decode base64 to binary string
    const binary = atob(padded);
    
    // Convert binary string to UTF-8 JSON string
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

 // Authentication Provider Component
 // Manages authentication state, token storage, and user session
 // Automatically restores session from localStorage on mount
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Effect to restore user session from stored token on component mount
  // Validates token expiry and decodes user information
  useEffect(() => {
    console.log('[AuthContext] init - token from localStorage:', token);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const decoded = decodeJwt(token);
    console.log('[AuthContext] decoded token on init:', decoded);

    // If token is invalid, clear everything
    if (!decoded) {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    // Check if token has expired (exp claim is in seconds)
    if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    // Token is valid, set user from decoded payload
    setUser(decoded as User);
    setIsLoading(false);
  }, [token]);

  // Logs in a user with provided credentials
  // Stores token in localStorage and updates user state
  const login = async (credentials: LoginDto) => {
    console.log('[AuthContext] login called with', credentials);
    const result = await authService.login(credentials);
    console.log('[AuthContext] login result from service:', result);

    // Extract token from various possible response formats
    const newToken =
      typeof result === 'string'
        ? result
        : (result && (result.token || (result as any).accessToken)) || null;

    console.log('[AuthContext] extracted token:', newToken);
    if (!newToken) throw new Error('Login did not return a token');

    // Store token and update state
    localStorage.setItem('token', newToken);
    setToken(newToken);
    console.log('[AuthContext] token saved to localStorage');

    // Decode token to get user information
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

  // Logs out the current user
  // Clears token from localStorage and resets user state
  const logout = () => {
    console.log('[AuthContext] logout - clearing token and user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  // Checks if the current token is still valid
  // Logs out user if token is expired or expiring soon (30 second buffer)
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

// Custom hook to access authentication context
// Must be used within an AuthProvider
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};