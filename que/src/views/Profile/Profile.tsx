import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, ListGroup, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import { getUserProfile, getUserQuizzes, getUserAttemptedQuizzes } from '../../quizes/QuizService';
import './Profile.css';

interface UserProfile {
    username: string;
    email: string;
}

interface QuizSummary {
    quizId: string;
    title: string;
    createdAt: string;
    description?: string;
    score?: number;
}

export default function Profile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [createdQuizzes, setCreatedQuizzes] = useState<QuizSummary[]>([]);
    const [attemptedQuizzes, setAttemptedQuizzes] = useState<QuizSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            setIsLoading(true);
            const [profileData, created, attempted] = await Promise.all([
                getUserProfile(),
                getUserQuizzes(),
                getUserAttemptedQuizzes()
            ]);

            setProfile(profileData);
            setCreatedQuizzes(created);
            setAttemptedQuizzes(attempted);
            setError(null);
        } catch (err: any) {
            console.error('Error loading profile data:', err);
            setError(err.message || 'Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateQuiz = () => {
        navigate('/quizcreate');
    };

    const handleCreatedQuizClick = (quizId: string) => {
        navigate(`/quizupdate/${quizId}`);
    };

    const handleAttemptedQuizClick = (quizId: string) => {
        navigate(`/quiztake/${quizId}`);
    };

    if (isLoading) {
        return (
            <Container className="profile-page d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="profile-page mt-5">
                <Alert variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                </Alert>
            </Container>
        );
    }

    return (
        <div className="profile-page">
            <Container className="py-5">
                {/* Header with Create Quiz Button */}
                <Row className="mb-4">
                    <Col>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h1 className="display-4 mb-0 fw-bold" style={{ color: '#6f42c1', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Dashboard</h1>
                            <Button 
                                size="lg"
                                onClick={handleCreateQuiz}
                                className="shadow-sm"
                                style={{ backgroundColor: '#652ABD', borderColor: '#652ABD' }}
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Create New Quiz
                            </Button>
                        </div>
                        <p className="text-muted">Manage your quizzes and track your progress</p>
                    </Col>
                </Row>

                {/* Profile Information Card */}
                <Row className="mb-4">
                    <Col md={12}>
                        <Card className="shadow-sm border-0">
                            <Card.Header className="bg-primary text-white">
                                <h5 className="mb-0">
                                    <i className="bi bi-person-circle me-2"></i>
                                    Profile Information
                                </h5>
                            </Card.Header>
                            <Card.Body className="p-4">
                                {profile && (
                                    <Row>
                                        <Col md={6} className="mb-3 mb-md-0">
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-person-badge fs-4 text-primary me-3"></i>
                                                <div>
                                                    <strong className="text-muted d-block mb-1">Username</strong>
                                                    <p className="fs-5 mb-0">{profile.username}</p>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-envelope fs-4 text-primary me-3"></i>
                                                <div>
                                                    <strong className="text-muted d-block mb-1">Email</strong>
                                                    <p className="fs-5 mb-0">{profile.email}</p>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Statistics Cards */}
                <Row className="mb-4">
                    <Col md={6} className="mb-3 mb-md-0">
                        <Card className="shadow-sm border-0 h-100 bg-success bg-opacity-10 border-success">
                            <Card.Body className="text-center p-4">
                                <i className="bi bi-pencil-square fs-1 text-success mb-3"></i>
                                <h3 className="display-4 fw-bold text-success mb-2">{createdQuizzes.length}</h3>
                                <p className="text-muted mb-0">Created Quizzes</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="shadow-sm border-0 h-100 bg-info bg-opacity-10 border-info">
                            <Card.Body className="text-center p-4">
                                <i className="bi bi-check-circle fs-1 text-info mb-3"></i>
                                <h3 className="display-4 fw-bold text-info mb-2">{attemptedQuizzes.length}</h3>
                                <p className="text-muted mb-0">Completed Quizzes</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Created and Completed Quizzes */}
                <Row>
                    {/* Created Quizzes */}
                    <Col lg={6} className="mb-4">
                        <Card className="shadow-sm border-0 h-100">
                            <Card.Header className="bg-success text-white">
                                <h5 className="mb-0">
                                    <i className="bi bi-pencil-square me-2"></i>
                                    My Created Quizzes
                                    <Badge bg="light" text="success" className="ms-2">{createdQuizzes.length}</Badge>
                                </h5>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {createdQuizzes.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                                        <p className="mb-0">You haven't created any quizzes yet.</p>
                                        <Button 
                                            variant="outline-success" 
                                            size="sm" 
                                            className="mt-3"
                                            onClick={handleCreateQuiz}
                                        >
                                            Create Your First Quiz
                                        </Button>
                                    </div>
                                ) : (
                                    <ListGroup variant="flush">
                                        {createdQuizzes.map((quiz) => (
                                            <ListGroup.Item 
                                                key={quiz.quizId} 
                                                action
                                                onClick={() => handleCreatedQuizClick(quiz.quizId)}
                                                className="py-3"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div className="me-auto">
                                                        <div className="fw-bold mb-1">{quiz.title}</div>
                                                        {quiz.description && (
                                                            <small className="text-muted d-block mb-2">{quiz.description}</small>
                                                        )}
                                                        <small className="text-muted">
                                                            <i className="bi bi-calendar3 me-1"></i>
                                                            Created: {new Date(quiz.createdAt).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                    <i className="bi bi-chevron-right text-muted"></i>
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Completed Quizzes */}
                    <Col lg={6} className="mb-4">
                        <Card className="shadow-sm border-0 h-100">
                            <Card.Header className="bg-info text-white">
                                <h5 className="mb-0">
                                    <i className="bi bi-check-circle me-2"></i>
                                    Completed Quizzes
                                    <Badge bg="light" text="info" className="ms-2">{attemptedQuizzes.length}</Badge>
                                </h5>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {attemptedQuizzes.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-trophy fs-1 d-block mb-3"></i>
                                        <p className="mb-0">You haven't completed any quizzes yet.</p>
                                        <Button 
                                            variant="outline-info" 
                                            size="sm" 
                                            className="mt-3"
                                            onClick={() => navigate('/quizlist')}
                                        >
                                            Browse Quizzes
                                        </Button>
                                    </div>
                                ) : (
                                    <ListGroup variant="flush">
                                        {attemptedQuizzes.map((quiz) => (
                                            <ListGroup.Item 
                                                key={quiz.quizId} 
                                                action
                                                onClick={() => handleAttemptedQuizClick(quiz.quizId)}
                                                className="py-3"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div className="me-auto">
                                                        <div className="fw-bold mb-1">{quiz.title}</div>
                                                        {quiz.score !== undefined && (
                                                            <div className="mb-2">
                                                                <Badge 
                                                                    bg={quiz.score >= 70 ? 'success' : quiz.score >= 50 ? 'warning' : 'danger'}
                                                                >
                                                                    Score: {quiz.score.toFixed(2)}%
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        <small className="text-muted">
                                                            <i className="bi bi-calendar-check me-1"></i>
                                                            Completed: {new Date(quiz.createdAt).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                    <i className="bi bi-chevron-right text-muted"></i>
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}