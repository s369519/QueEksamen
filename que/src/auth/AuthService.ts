import { LoginDto, RegisterDto } from "../types/auth";

// API base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL;


// Parses error responses from the API
// Attempts to extract error message from JSON response or falls back to status text
const parseError = async (res: Response) => {
  try {
    const clonedRes = res.clone();
    const text = await clonedRes.text();
    
    try {
      const json = JSON.parse(text);
      // Extract message from various possible error response formats
      return json.message || json.error || 'An error occurred';
    } catch {
      // If JSON parsing fails, return raw text or status code
      return text || `Error: ${res.status}`;
    }
  } catch {
    return `Error: ${res.status}`;
  }
};

// Authenticates a user with username and password
// Sends login credentials to the backend and receives a JWT token
export const login = async (credentials: LoginDto): Promise<{ token: string }> => {
  const response = await fetch(`${API_URL}/api/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    const errorMessage = await parseError(response);
    throw new Error(errorMessage);
  }

  return response.json();
};

// Registers a new user account
// Sends registration data to the backend
export const register = async (userData: RegisterDto): Promise<any> => {
  const response = await fetch(`${API_URL}/api/Auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      
      // If backend returns structured error with message field
      if (errorData.message) {
        throw new Error(errorData.message);
      }
      
      // If backend returns array of errors (validation errors)
      if (errorData.errors && Array.isArray(errorData.errors)) {
        throw new Error(errorData.errors.join(' '));
      }
      
      // Fallback for other error formats
      throw new Error(JSON.stringify(errorData));
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error('Registration failed');
    }
  }

  return response.json();
};