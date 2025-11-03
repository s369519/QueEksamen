import { LoginDto, RegisterDto } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL;

export const login = async (credentials: LoginDto): Promise<{ token: string }> => {
    const response = await fetch(`${API_URL}/api/Auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        throw new Error('Login failed');
    }
    console.log(response);
    return response.json();
};

export const register = async (userData: RegisterDto): Promise<any> => {
    const response = await fetch(`${API_URL}/api/Auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMessages = errorData.map((err: { description: string }) => err.description).join(', ');
        throw new Error(errorMessages || 'Registration failed');
    }
    return response.json();
};