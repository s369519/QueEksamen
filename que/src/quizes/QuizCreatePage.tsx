import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Alert, Button } from "react-bootstrap";
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