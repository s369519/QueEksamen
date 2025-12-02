import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Alert, Button } from "react-bootstrap";
import QuizForm from "./QuizForm";
import { Quiz } from "../types/quiz";
import * as QuizService from './QuizService';
import { useAuth } from '../auth/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

// Quiz Creation Page Component
// Handles authentication validation and error handling during quiz creation
const QuizCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { checkTokenExpiry, logout } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handles quiz creation submission
    // Validates user session, submits quiz to backend, and handles errors
    const handleQuizCreated = async (quiz: Quiz) => {
        // Check token expiry before submission
        if (!checkTokenExpiry()) {
            setError('Your session has expired. Please log in again.');
            setTimeout(() => {
                logout();
                navigate('/login');
            }, 2000);
            return;
        }

        setIsSubmitting(true);
        setError(null);
        
        try {
            const data = await QuizService.createQuiz(quiz);
            console.log('Quiz created successfully:', data);
            // Navigate to quiz list on success
            navigate('/quizes');
        } catch (error: any) {
            console.error('There was a problem with the fetch operation: ', error);
            const errorMessage = error.message || 'Failed to create quiz';
            
            // Check for specific error types and provide appropriate feedback
            if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('authenticated')) {
                // Authentication error - redirect to login
                setError('Your session has expired. Please log in again.');
                setTimeout(() => {
                    logout();
                    navigate('/login');
                }, 2000);
            } else if (errorMessage.includes('400') || errorMessage.includes('validation')) {
                // Validation error - show validation message
                setError(`Validation error: ${errorMessage}`);
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                // Network error - suggest connection check
                setError('Network error. Please check your connection and try again.');
            } else {
                // Generic error - show error message
                setError(`Failed to create quiz: ${errorMessage}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div style={{ 
            background: 'linear-gradient(180deg, #ffffff 0%, #f8f5ff 50%, #f0e6ff 100%)',
            minHeight: 'calc(100vh - 56px)',
            width: '100%'
        }}>
            <Container className="py-5">
                {/* Back to Profile Button */}
                <Row className="mb-4">
                    <Col>
                        <Button 
                            variant="outline-secondary"
                            onClick={() => navigate('/profile')}
                            className="d-flex align-items-center"
                        >
                            <i className="bi bi-arrow-left me-2"></i>
                            Back to My Profile
                        </Button>
                    </Col>
                </Row>

                {/* Error Alert - Displayed when quiz creation fails */}
                {error && (
                    <Row className="mb-4">
                        <Col lg={10} xl={8} className="mx-auto">
                            <Alert variant="danger" dismissible onClose={() => setError(null)}>
                                <Alert.Heading><i className="bi bi-exclamation-triangle me-2"></i>Error</Alert.Heading>
                                <p>{error}</p>
                            </Alert>
                        </Col>
                    </Row>
                )}
                
                {/* Page Header */}
                <Row className="mb-5">
                    <Col className="text-center">
                        <h1 
                            className="mb-2 fw-bold d-inline-block" 
                            style={{ 
                                background: 'linear-gradient(135deg, #6f42c1 0%, #5b3a9e 25%, #4a5b9e 50%, #3d7bb8 75%, #2d6ba8 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontSize: '3.5rem',
                                fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                            }}
                        >
                            Create Quiz
                        </h1>
                        <p className="text-muted fs-5">
                            Design your own quiz for the ¿Qué? community
                        </p>
                    </Col>
                </Row>
                
                {/* Quiz Form - Handles quiz data input and validation */}
                <Row>
                    <Col lg={10} xl={8} className="mx-auto">
                        <QuizForm onQuizChanged={handleQuizCreated} isSubmitting={isSubmitting} />
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default QuizCreatePage;