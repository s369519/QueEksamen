import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Alert, Row, Col, Button } from 'react-bootstrap';
import QuizForm from './QuizForm';
import { Quiz } from '../types/quiz';
import * as QuizService from './QuizService';
import { useAuth } from '../auth/AuthContext';
const API_URL = import.meta.env.VITE_API_URL;

const QuizUpdatePage: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const { checkTokenExpiry, logout } = useAuth();
    const [ quiz, setQuiz ] = useState<Quiz | null>(null);
    const [ loading, setLoading ] = useState<boolean>(true);
    const [ error, setError ] = useState<string | null>(null);
    const [ updateError, setUpdateError ] = useState<string | null>(null);
    const [ isSubmitting, setIsSubmitting ] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const data = await QuizService.fetchQuizById(quizId!);
                setQuiz(data);
            } catch (error: any) {
                console.error('There was a problem with the fetch operation:', error);
                const errorMessage = error.message || 'Failed to fetch quiz';
                
                // Check if it's a 404 error (quiz deleted)
                if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                    setError('This quiz no longer exists. It may have been deleted.');
                } else if (errorMessage.includes('401') || errorMessage.includes('authorized')) {
                    setError('You do not have permission to edit this quiz.');
                } else {
                    setError('Failed to load quiz. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId]);

    const handleQuizUpdated = async (quiz: Quiz) => {
        // Check token expiry before submission
        if (!checkTokenExpiry()) {
            setUpdateError('Your session has expired. Please log in again.');
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
            navigate('/quizes');
        } catch (error: any) {
            console.error('There was a problem with the fetch operation:', error);
            const errorMessage = error.message || 'Failed to update quiz';
            
            // Check for specific error types
            if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('authenticated')) {
                setUpdateError('Your session has expired. Please log in again.');
                setTimeout(() => {
                    logout();
                    navigate('/login');
                }, 2000);
            } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                setUpdateError('This quiz no longer exists. It may have been deleted.');
            } else if (errorMessage.includes('400') || errorMessage.includes('validation')) {
                setUpdateError(`Validation error: ${errorMessage}`);
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                setUpdateError('Network error. Please check your connection and try again.');
            } else {
                setUpdateError(`Failed to update quiz: ${errorMessage}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

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