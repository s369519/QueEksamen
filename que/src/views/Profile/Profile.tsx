import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Spinner,
  Alert,
  Button,
  Badge
} from 'react-bootstrap';
import { getUserProfile, getUserQuizzes, getUserAttemptedQuizzes } from '../../quizes/QuizService';

const API_URL = import.meta.env.VITE_API_URL;

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
  questionCount?: number;
  timeLimit?: number;
  isPublic?: boolean;
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

  const handleCreateQuiz = () => navigate('/quizcreate');
  const handleCreatedQuizClick = async (quizId: string) => {
    try {
      // Check if quiz still exists before navigating to update page
      const response = await fetch(`${API_URL}/api/QuizAPI/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        // Quiz exists, navigate to update page
        navigate(`/quizupdate/${quizId}`);
      } else if (response.status === 404) {
        // Quiz has been deleted - remove from list
        alert('This quiz has been deleted. Removing from your list.');
        setCreatedQuizzes(prev => prev.filter(q => q.quizId !== quizId));
      } else if (response.status === 401) {
        // User no longer owns this quiz (shouldn't happen, but handle it)
        alert('You no longer have access to this quiz.');
        setCreatedQuizzes(prev => prev.filter(q => q.quizId !== quizId));
      } else {
        alert('Unable to access this quiz.');
      }
    } catch (error) {
      console.error('Error checking quiz access:', error);
      alert('An error occurred while trying to access this quiz.');
    }
  };
  const handleAttemptedQuizClick = async (quizId: string) => {
    try {
      // Check if quiz still exists and is accessible
      const response = await fetch(`${API_URL}/api/QuizAPI/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        // Quiz exists and is accessible, go to take it again
        navigate(`/quiztake/${quizId}`);
      } else if (response.status === 401) {
        // Quiz is private and user doesn't have access
        alert('This quiz is private and you no longer have access to it.');
      } else if (response.status === 404) {
        // Quiz has been deleted
        alert('This quiz has been deleted by its owner.');
      } else {
        alert('Unable to access this quiz.');
      }
    } catch (error) {
      console.error('Error checking quiz access:', error);
      alert('An error occurred while trying to access this quiz.');
    }
  };

  // Colors / shadows
  const accent = '#4b39ef'; // deep purple
  const softShadow = '0 8px 30px rgba(75,57,239,0.12)';
  const greenShadow = '0 8px 30px rgba(34,197,94,0.10)'; // light green shadow

  if (isLoading) {
    return (
      <div style={{ minHeight: '70vh', background: 'white' }} className="d-flex align-items-center justify-content-center">
        <Spinner animation="border" role="status" style={{ color: accent }}>
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Container className="py-4">
        <Row className="align-items-center mb-4">
          <Col>
            {/* Dashboard title with ombre / gradient text */}
            <h2
              style={{
                fontWeight: 650,
                letterSpacing: '-0.02em',
                marginBottom: 6,
                fontSize: '2.75rem',
                background: 'linear-gradient(90deg, #4b39ef 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent'
              }}
            >
              Dashboard
            </h2>
            <p className="text-muted mb-0">Manage your quizzes and track progress</p>
          </Col>
          <Col xs="auto">
            <Button
              onClick={handleCreateQuiz}
              style={{
                background: accent,
                border: 'none',
                boxShadow: softShadow,
                borderRadius: 12,
                padding: '10px 16px',
                fontWeight: 600
              }}
              className="d-flex align-items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <i className="bi bi-plus-circle me-2" style={{ fontSize: 18 }} />
                  Create New Quiz
                </>
              )}
            </Button>
          </Col>
        </Row>

        {/* Profile card */}
        <Row className="mb-4">
          <Col>
            <Card style={{ borderRadius: 12, boxShadow: softShadow, border: 'none' }}>
              <Card.Body className="p-3 p-md-4">
                <Row className="align-items-center">
                  <Col md={8}>
                    <h5 className="mb-1" style={{ fontWeight: 500, color: '#111' }}>
                      <i className="bi bi-person-circle me-2" style={{ color: accent }} />
                      Profile Information
                    </h5>
                    {profile && (
                      <Row className="mt-3">
                        <Col sm={6} className="mb-2">
                          <small className="text-muted d-block mb-1">Username</small>
                          <div style={{ fontWeight: 600 }}>{profile.username}</div>
                        </Col>
                        <Col sm={6} className="mb-2">
                          <small className="text-muted d-block mb-1">Email</small>
                          <div>{profile.email}</div>
                        </Col>
                      </Row>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Stat cards */}
        <Row className="g-3 mb-4">
          <Col md={6}>
            <Card style={{ borderRadius: 12, border: 'none', boxShadow: softShadow }}>
              <Card.Body className="p-3 d-flex align-items-center" style={{ gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, background: 'rgba(75,57,239,0.12)', display: 'grid', placeItems: 'center' }}>
                  <i className="bi bi-pencil-square" style={{ color: accent, fontSize: 22 }} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 620, color: '#111' }}>{createdQuizzes.length}</div>
                  <div className="text-muted">Created quizzes</div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            {/* Attempted / Completed stat uses green shadow */}
            <Card style={{ borderRadius: 12, border: 'none', boxShadow: greenShadow }}>
              <Card.Body className="p-3 d-flex align-items-center" style={{ gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, background: 'rgba(34,197,94,0.08)', display: 'grid', placeItems: 'center' }}>
                  <i className="bi bi-check-circle" style={{ color: '#22c55e', fontSize: 22 }} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>{attemptedQuizzes.length}</div>
                  <div className="text-muted">Completed quizzes</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Lists */}
        <Row className="g-4">
          <Col lg={6}>
            <Card style={{ borderRadius: 12, border: 'none', boxShadow: softShadow }}>
              <Card.Header style={{ background: 'transparent', borderBottom: 'none', padding: '1rem 1.25rem' }}>
                <h6 className="mb-0" style={{ fontWeight: 700 }}><i className="bi bi-pencil-square me-2" style={{ color: accent }} /> My Created Quizzes <Badge bg="light" text="dark" className="ms-2">{createdQuizzes.length}</Badge></h6>
              </Card.Header>
              <Card.Body className="p-0">
                {createdQuizzes.length === 0 ? (
                  <div className="text-center p-4 text-muted">
                    <i className="bi bi-inbox fs-2 mb-2" />
                    <div>You haven't created any quizzes yet.</div>
                    <Button variant="outline-primary" className="mt-3" onClick={handleCreateQuiz}>Create one</Button>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {createdQuizzes.map(q => (
                      <ListGroup.Item key={q.quizId} action onClick={() => handleCreatedQuizClick(q.quizId)} className="py-3" style={{ borderRadius: 8, margin: '8px', boxShadow: 'none' }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div style={{ fontWeight: 700 }}>{q.title}</div>
                            {q.description && <small className="text-muted d-block">{q.description}</small>}
                            <div className="mt-1">
                              <small className="text-muted me-3">
                                <i className="bi bi-question-circle me-1"></i>
                                {q.questionCount} {q.questionCount === 1 ? 'question' : 'questions'}
                              </small>
                              <small className="text-muted me-3">
                                <i className="bi bi-clock me-1"></i>
                                {q.timeLimit} min
                              </small>
                              <small className="text-muted">
                                <i className="bi bi-eye me-1"></i>
                                {q.isPublic ? 'Public' : 'Private'}
                              </small>
                            </div>
                          </div>
                          <div className="text-muted"><i className="bi bi-chevron-right" /></div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            {/* Completed Quizzes card now has light green shadow for emphasis */}
            <Card style={{ borderRadius: 12, border: 'none', boxShadow: softShadow }}>
              <Card.Header style={{ background: 'transparent', borderBottom: 'none', padding: '1rem 1.25rem' }}>
                <h6 className="mb-0" style={{ fontWeight: 700 }}><i className="bi bi-check-circle me-2" style={{ color: '#22c55e' }} /> Completed Quizzes <Badge bg="light" text="dark" className="ms-2">{attemptedQuizzes.length}</Badge></h6>
              </Card.Header>
              <Card.Body className="p-0">
                {attemptedQuizzes.length === 0 ? (
                  <div className="text-center p-4 text-muted">
                    <i className="bi bi-trophy fs-2 mb-2" />
                    <div>No completed quizzes yet.</div>
                    <Button variant="outline-primary" className="mt-3" onClick={() => navigate('/quizlist')}>Browse quizzes</Button>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {attemptedQuizzes.map(q => (
                      <ListGroup.Item key={q.quizId} action onClick={() => handleAttemptedQuizClick(q.quizId)} className="py-3" style={{ borderRadius: 8, margin: '8px' }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div style={{ fontWeight: 700 }}>{q.title}</div>
                            {q.score !== undefined && <div className="mt-1"><Badge bg={q.score >= 70 ? 'success' : q.score >= 50 ? 'warning' : 'danger'}>Score: {q.score.toFixed(0)}%</Badge></div>}
                            <small className="text-muted d-block mt-1">Completed: {new Date(q.createdAt).toLocaleDateString()}</small>
                          </div>
                          <div className="text-muted"><i className="bi bi-chevron-right" /></div>
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