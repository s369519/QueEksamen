import { LoginDto, RegisterDto } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL;

const parseError = async (res: Response) => {
  try {
    // LEGG TIL DENNE LINJEN - klon response før lesing
    const clonedRes = res.clone();
    const text = await clonedRes.text();
    
    try {
      const json = JSON.parse(text);
      return json.message || json.error || 'An error occurred';
    } catch {
      return text || `Error: ${res.status}`;
    }
  } catch {
    return `Error: ${res.status}`;
  }
};

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
      // If backend returns array of errors
      if (errorData.errors && Array.isArray(errorData.errors)) {
        throw new Error(errorData.errors.join(' '));
      }
      // Fallback
      throw new Error(JSON.stringify(errorData));
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error('Registration failed');
    }
  }

  return response.json();
};