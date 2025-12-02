import { Quiz } from "../types/quiz";
import axios from "axios";
import { parseJwt } from "../utils/jwt";
import { jwtDecode } from "jwt-decode";
const API_URL = import.meta.env.VITE_API_URL;

// Constructs HTTP headers with JWT authentication token
// Retrieves the JWT token from localStorage and adds it to the
// Authorization header if available. Always includes Content-Type header.
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

// Handles API response parsing and error handling
// 
// Processes fetch API responses and extracts JSON data or handles errors.
// Returns null for 204 No Content responses.
const handleResponse = async (response: Response) => {
    if (response.ok) {
        // 204 No Content - return null
        if (response.status === 204) {
            return null;
        }
        return response.json();
    } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Network response was not ok');
    }
};

// Authenticates user and stores JWT token
// Sends login credentials to the authentication endpoint.
// On success, stores the JWT token in localStorage for subsequent requests.
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

// Fetches all available quizzes from the API
// Retrieves the complete list of quizzes. Includes authentication token
// if user is logged in (for accessing private quizzes).
export const fetchQuizes = async () => {
    const token = localStorage.getItem("token");
  
    const headers: HeadersInit = {
        "Content-Type": "application/json"
    };

    // Add token if available (for private quiz access)
    if (token) {
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

// Fetches a single quiz by its ID with complete details
// Retrieves full quiz details including questions, options, and correct answers.
// Supports both authenticated and anonymous access for public quizzes.
export const fetchQuizById = async (quizId: string) => {
    const token = localStorage.getItem("token");
    
    const headers: HeadersInit = {
        "Content-Type": "application/json"
    };

    // Add token if available, but allow anonymous access for public quizzes
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/quizapi/${quizId}`, {
        headers: headers
    });
    return handleResponse(response);
};

// Updates an existing quiz with new data
// Sends a PUT request to update quiz details. Requires authentication.
// Only the quiz owner can update their quiz.
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

// Deletes a quiz by ID
// Sends a DELETE request to remove a quiz. Requires authentication.
// Only the quiz owner can delete their quiz.
export const deleteQuiz = async (quizId: number) => {
    const response = await fetch(`${API_URL}/api/quizapi/delete/${quizId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
};

// Utility function to decode and log JWT token for debugging
// Decodes JWT token and logs its payload to console.
// Used for debugging authentication issues.
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

// Creates a new quiz with questions and options
// Sends a POST request to create a new quiz. Requires authentication.
// The authenticated user becomes the owner of the created quiz.
export async function createQuiz(quizData: any) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated.");

    // Debug: Log decoded token payload
    logDecodedToken(token);
    
    // Ensure required fields are present with default values
    const quiz = {
        ...quizData,
        timeLimit: quizData.timeLimit || 10, // Default to 10 minutes
        questions: quizData.questions || [],
        isPublic: quizData.isPublic || false,
    };

    // Debug: Log outgoing request data
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
            // Provide specific error for validation failures
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
}
// Fetches quiz for taking mode (without revealing correct answers)
// Retrieves quiz with questions and options, but correct answers are hidden.
// This is used when a user is actively taking a quiz.
// Supports both authenticated users and anonymous access for public quizzes.
export const fetchQuizForTaking = async (quizId: string) => {
    const token = localStorage.getItem("token");
    
    const headers: HeadersInit = {
        "Content-Type": "application/json"
    };

    // Add token if available (required for private quizzes)
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/quizapi/take/${quizId}`, {
        headers: headers
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to fetch quiz for taking");
    }

    return response.json();
};

// Submits user's answer(s) for a quiz question
// Sends selected option IDs to the server for validation.
// Supports both single-answer and multiple-answer questions.
// Server calculates if answer is correct and returns feedback.
export const submitAnswer = async (quizId: number, questionId: number, selectedOptionIds: number[]) => {
    const token = localStorage.getItem("token");
    
    const headers: HeadersInit = {
        "Content-Type": "application/json"
    };

    // Add token if available (for tracking user attempts)
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/quizapi/take/answer`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            quizId,
            questionId,
            selectedOptionIds
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to submit answer");
    }

    return response.json();
};

// Fetches quiz results with correct answers for review
// Retrieves complete quiz results
export const fetchQuizResults = async (quizId: string) => {
    const token = localStorage.getItem("token");
    
    const headers: HeadersInit = {
        "Content-Type": "application/json"
    };

    // Add token if available (for private quiz results)
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/quizapi/results/${quizId}`, {
        headers: headers
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to fetch quiz results");
    }

    return response.json();
};

// Fetches the authenticated user's profile information
// Retrieves user details from JWT token claims
export const getUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return handleResponse(response);
};

// Fetches all quizzes created by the authenticated user
// Retrieves list of user's own quizzes with metadata
export const getUserQuizzes = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_URL}/api/QuizAPI/user/quizzes`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    const data = await handleResponse(response);
    
    // Map API response fields to Quiz interface
    return data.map((quiz: any) => ({
        quizId: parseInt(quiz.quizId),
        name: quiz.title,
        description: quiz.description || '',
        category: quiz.category || 'General',
        difficulty: quiz.difficulty || 'Medium',
        timeLimit: quiz.timeLimit || 10,
        isPublic: quiz.isPublic || false,
        ownerId: quiz.ownerId,
        questionCount: quiz.questionCount || 0
    }));
};

// Fetches all quizzes attempted by the authenticated user
// Retrieves user's quiz history
export const getUserAttemptedQuizzes = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_URL}/api/QuizAPI/user/attempts`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return handleResponse(response);
};

// Submits a completed quiz attempt with final score
// Records the user's quiz attempt in the database for tracking purposes.
// Stores quiz ID, user ID (from JWT), and final score.
export const submitQuizAttempt = async (quizId: number, score: number) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/QuizAPI/submit-attempt`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quizId, score })
    });
    
    return handleResponse(response);
};
