import { Quiz } from "../types/quiz";
import axios from "axios";
import { parseJwt } from "../utils/jwt";
import { jwtDecode } from "jwt-decode";
const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response: Response) => {
    if (response.ok) {
        if (response.status === 204) {
            return null;
        }
        return response.json();
    } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Network response was not ok');
    }
};

const handleLogin = async (username: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) throw new Error("Login failed");

    const data = await response.json();
    localStorage.setItem("token", data.token);
};

export const fetchQuizes = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated.");
  
    const headers: HeadersInit = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/quizapi/quizlist`, {
      method: "GET",
      headers: headers
    });
  
    if (!response.ok) {
      throw new Error("Failed to fetch quizzes");
    }
  
    return response.json();
};

export const fetchQuizById = async (quizId: string) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/api/quizapi/${quizId}`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return handleResponse(response);
};

/* export const createQuiz = async (quiz: Quiz) => {
    const token = localStorage.getItem("token");
    console.log("Token being sent:", token);
    if (!token) throw new Error("User not authenticated.");
  
    const response = await fetch(`${API_URL}/api/quizapi/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(quiz),
    });
  
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to create quiz: ${text}`);
    }
    return response.json();
}; */

export const updateQuiz = async (quiz: Quiz) => {
    if (!quiz.quizId) throw new Error("quizId is undefined");
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/api/quizapi/update/${quiz.quizId}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(quiz),
    });
    return handleResponse(response);
};

export const deleteQuiz = async (quizId: number) => {
    const response = await fetch(`${API_URL}/api/quizapi/delete/${quizId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
};

function logDecodedToken(token: string | null) {
    if (!token || typeof token !== "string") {
      console.error("No valid token string found to decode:", token);
      return;
    }
  
    try {
      const decoded = jwtDecode(token);
      console.log("Decoded JWT:", decoded);
    } catch (error) {
      console.error("Failed to decode JWT:", error);
    }
}

export async function createQuiz(quizData: any) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated.");

    logDecodedToken(token);
    
    // Ensure required fields are present
    const quiz = {
        ...quizData,
        timeLimit: quizData.timeLimit || 10, // Default to 10 if not provided
        questions: quizData.questions || [],
        isPublic: quizData.isPublic || false,
    };

    // Log the quiz data being sent
    console.log("Sending quiz data:", quiz);

    try {
        const response = await fetch(`${API_URL}/api/quizapi/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(quiz),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Server response:", text);
            if (response.status === 400) {
                throw new Error(`Validation error: ${text}`);
            }
            throw new Error(`Failed to create quiz: ${text}`);
        }

        const result = await response.json();
        console.log("Server response success:", result);
        return result;
    } catch (error) {
        console.error("Error creating quiz:", error);
        throw error;
    }
    //return response.json();
}

