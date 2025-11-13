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
    const errorMessage = await parseError(response);
    throw new Error(errorMessage);
  }

  return response.json();
};

/* const API_URL = import.meta.env.VITE_API_URL;

const parseError = async (res: Response) => {

  try {
    const data = await res.json();
    return data?.message ?? data?.error ?? JSON.stringify(data);
  } catch {
    return await res.text();
  }
};

export const login = async (credentials: LoginDto): Promise<{ token: string }> => {
  const res = await fetch(`${API_URL}/api/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const err = await parseError(res);
    throw new Error(`Login failed: ${err}`);
  }

  const data = await res.json();
  const token = (data && (data.token ?? data.accessToken)) ?? (typeof data === "string" ? data : null);

  if (!token || typeof token !== "string") {
    throw new Error("Login did not return a token");
  }

  return { token };
};

export const register = async (userData: RegisterDto): Promise<any> => {
  const res = await fetch(`${API_URL}/api/Auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    const err = await parseError(res);
    throw new Error(`Registration failed: ${err}`);
  }

  return res.json();
}; */