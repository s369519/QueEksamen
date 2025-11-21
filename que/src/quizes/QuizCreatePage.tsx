import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Alert } from "react-bootstrap";
import QuizForm from "./QuizForm";
import { Quiz } from "../types/quiz";
import * as QuizService from './QuizService';
import { useAuth } from '../auth/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

const QuizCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { checkTokenExpiry, logout } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            navigate('/quizes');
        } catch (error: any) {
            console.error('There was a problem with the fetch operation: ', error);
            const errorMessage = error.message || 'Failed to create quiz';
            
            // Check for specific error types
            if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('authenticated')) {
                setError('Your session has expired. Please log in again.');
                setTimeout(() => {
                    logout();
                    navigate('/login');
                }, 2000);
            } else if (errorMessage.includes('400') || errorMessage.includes('validation')) {
                setError(`Validation error: ${errorMessage}`);
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                setError('Network error. Please check your connection and try again.');
            } else {
                setError(`Failed to create quiz: ${errorMessage}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div style={{ 
            background: 'linear-gradient(135deg, #f5e6ff 0%, #e6d5f5 50%, #d5c4e8 100%)',
            minHeight: 'calc(100vh - 56px)',
            width: '100%'
        }}>
            <Container className="py-5">
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
                <Row className="mb-5">
                    <Col>
                        <h1 
                            className="text-center mb-2 fw-bold" 
                            style={{ 
                                color: '#6f42c1',
                                fontSize: '3.5rem',
                                fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                            }}
                        >
                            Create Quiz
                        </h1>
                        <p className="text-center text-muted fs-5">
                            Design your own quiz for the ¿Qué? community
                        </p>
                    </Col>
                </Row>
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