import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Alert, Row, Col, Button } from 'react-bootstrap';
import QuizForm from './QuizForm';
import { Quiz } from '../types/quiz';
import * as QuizService from './QuizService';
import { useAuth } from '../auth/AuthContext';
const API_URL = import.meta.env.VITE_API_URL;

// QuizUpdatePage Component
// Page for editing an existing quiz.
// Fetches quiz data by ID, displays edit form, and handles update submission.
const QuizUpdatePage: React.FC = () => {
    // Get quizId from URL parameters
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const { checkTokenExpiry, logout } = useAuth();
    
    // Quiz data fetched from API
    const [ quiz, setQuiz ] = useState<Quiz | null>(null);
    
    // Loading state for initial data fetch
    const [ loading, setLoading ] = useState<boolean>(true);
    
    // Error message for fetch failures (404, 401, network errors)
    const [ error, setError ] = useState<string | null>(null);
    
    // Error message for update operation failures
    const [ updateError, setUpdateError ] = useState<string | null>(null);
    
    // Submission state to disable form during update
    const [ isSubmitting, setIsSubmitting ] = useState(false);

    // Effect hook to fetch quiz data when component mounts or quizId changes
    useEffect(() => {
        // Fetch quiz data from API by ID
        const fetchQuiz = async () => {
            try {
                const data = await QuizService.fetchQuizById(quizId!);
                setQuiz(data);
            } catch (error: any) {
                console.error('There was a problem with the fetch operation:', error);
                const errorMessage = error.message || 'Failed to fetch quiz';
                
                // Parse error message and set appropriate user-friendly message
                // Check if it's a 404 error (quiz deleted)
                if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                    setError('This quiz no longer exists. It may have been deleted.');
                } else if (errorMessage.includes('401') || errorMessage.includes('authorized')) {
                    // 401 Unauthorized - user doesn't have permission
                    setError('You do not have permission to edit this quiz.');
                } else {
                    // Generic error message for other failures
                    setError('Failed to load quiz. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId]);

    // Handles quiz update submission from QuizForm
    // Validates token expiry, submits update to API, and handles various error scenarios.
    // On success, navigates to quiz list. On failure, displays error message.
    const handleQuizUpdated = async (quiz: Quiz) => {
        // Check token expiry before submission to avoid failed requests
        if (!checkTokenExpiry()) {
            setUpdateError('Your session has expired. Please log in again.');
            // Auto-logout and redirect after 2 seconds
            setTimeout(() => {
                logout();
                navigate('/login');
            }, 2000);
            return;
        }

        setIsSubmitting(true);
        setUpdateError(null);
        
        try {
            const data = await QuizService.updateQuiz(quiz);
            console.log('Quiz updated successfully', data);
            // Navigate back to quiz list on success
            navigate('/quizes');
        } catch (error: any) {
            console.error('There was a problem with the fetch operation:', error);
            const errorMessage = error.message || 'Failed to update quiz';
            
            // Parse error type and set appropriate user-friendly message
            // Check for authentication errors
            if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('authenticated')) {
                setUpdateError('Your session has expired. Please log in again.');
                // Auto-logout and redirect after 2 seconds
                setTimeout(() => {
                    logout();
                    navigate('/login');
                }, 2000);
            } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                // Quiz was deleted while user was editing
                setUpdateError('This quiz no longer exists. It may have been deleted.');
            } else if (errorMessage.includes('400') || errorMessage.includes('validation')) {
                // Validation error from server
                setUpdateError(`Validation error: ${errorMessage}`);
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                // Network connection error
                setUpdateError('Network error. Please check your connection and try again.');
            } else {
                // Generic error message
                setUpdateError(`Failed to update quiz: ${errorMessage}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    // Loading state - show spinner while fetching quiz data
    if (loading) return (
        <div style={{ 
            background: 'linear-gradient(180deg, #ffffff 0%, #f8f5ff 50%, #f0e6ff 100%)',
            minHeight: 'calc(100vh - 56px)',
        }}>
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="text-center">
                    <div className="spinner-border" style={{ color: '#6f42c1' }} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading quiz...</p>
                </div>
            </div>
        </div>
    );
    
    // Error state - show error message with navigation options
    if (error) return (
        <div style={{ 
            background: 'linear-gradient(180deg, #ffffff 0%, #f8f5ff 50%, #f0e6ff 100%)',
            minHeight: 'calc(100vh - 56px)',
        }}>
            <Container className="mt-5">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading"><i className="bi bi-exclamation-triangle me-2"></i>Error</h4>
                    <p>{error}</p>
                    <hr />
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-danger" onClick={() => navigate('/quizes')}>
                            <i className="bi bi-arrow-left me-2"></i>Back to My Quizzes
                        </button>
                        <button className="btn btn-outline-primary" onClick={() => navigate('/home')}>
                            <i className="bi bi-house me-2"></i>Go to Home
                        </button>
                    </div>
                </div>
            </Container>
        </div>
    );
    
    // Quiz not found state - quiz is null after loading completed
    if (!quiz) return (
        <div style={{ 
            background: 'linear-gradient(180deg, #ffffff 0%, #f8f5ff 50%, #f0e6ff 100%)',
            minHeight: 'calc(100vh - 56px)',
        }}>
            <Container className="mt-5">
                <div className="alert alert-warning" role="alert">
                    <h4 className="alert-heading">Quiz Not Found</h4>
                    <p>The quiz you're looking for could not be found.</p>
                    <button className="btn btn-outline-warning" onClick={() => navigate('/quizes')}>
                        <i className="bi bi-arrow-left me-2"></i>Back to My Quizzes
                    </button>
                </div>
            </Container>
        </div>
    );

    // Main quiz update page with form and error handling
    return (
        <div style={{ 
            background: 'linear-gradient(180deg, #ffffff 0%, #f8f5ff 50%, #f0e6ff 100%)',
            minHeight: 'calc(100vh - 56px)',
            width: '100%'
        }}>
            <Container className="py-5">
                {/* Back to Profile navigation button */}
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

                {/* Update error alert - dismissible */}
                {updateError && (
                    <Row className="mb-4">
                        <Col lg={10} xl={8} className="mx-auto">
                            <Alert variant="danger" dismissible onClose={() => setUpdateError(null)}>
                                <Alert.Heading><i className="bi bi-exclamation-triangle me-2"></i>Error</Alert.Heading>
                                <p>{updateError}</p>
                            </Alert>
                        </Col>
                    </Row>
                )}

                {/* Page header with gradient title */}
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
                            Update Quiz
                        </h1>
                        <p className="text-muted fs-5">
                            Edit and improve your quiz
                        </p>
                    </Col>
                </Row>

                {/* QuizForm component with initialData for editing */}
                <Row>
                    <Col lg={10} xl={8} className="mx-auto">
                        <QuizForm onQuizChanged={handleQuizUpdated} quizId={quiz.quizId} isUpdate={true} initialData={quiz} isSubmitting={isSubmitting} />
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default QuizUpdatePage;