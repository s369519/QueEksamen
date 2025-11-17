import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './HomePage.css';

interface QuizPreview {
  quizId: number;
  name: string;
  description: string;
  difficulty: string;
  questionCount: number;
  timeLimit: number;
  category: string;
}

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [featuredQuizzes, setFeaturedQuizzes] = useState<QuizPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [selectedLength, setSelectedLength] = useState('Any Length');

  useEffect(() => {
    const fetchFeaturedQuizzes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/quizzes?featured=true&limit=6');
        if (!response.ok) {
          throw new Error('Failed to fetch featured quizzes');
        }
        const data = await response.json();
        setFeaturedQuizzes(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching featured quizzes:', err);
        // Mock data for demo - no error message
        setFeaturedQuizzes([
          {
            quizId: 1,
            name: 'General Knowledge Quiz',
            description: 'Test your knowledge across various topics',
            difficulty: 'Medium',
            questionCount: 5,
            timeLimit: 10,
            category: 'General'
          },
          {
            quizId: 2,
            name: 'Science & Nature',
            description: 'Explore the wonders of science and nature',
            difficulty: 'Hard',
            questionCount: 5,
            timeLimit: 15,
            category: 'Science'
          }
        ]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedQuizzes();
  }, []);

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return '#28a745';
      case 'medium':
        return '#ffc107';
      case 'hard':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const handleSetFilters = () => {
    console.log('Filters applied:', {
      search: searchTerm,
      category: selectedCategory,
      level: selectedLevel,
      length: selectedLength
    });
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={12} className="text-center hero-content">
              <h1 className="hero-title">
                Welcome to <span className="hero-que">¿Qué?</span>
              </h1>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Find Your Perfect Quiz Section */}
      <section className="find-quiz-section py-5">
        <Container>
          <div className="find-quiz-card">
            <h2 className="find-quiz-title mb-4">Find Your Perfect Quiz</h2>

            <div className="search-bar mb-4">
              <input
                type="text"
                placeholder="Search quizzes by title, description, or category..."
                className="form-control search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filters mb-4">
              <select 
                className="form-select filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option>All Categories</option>
                <option>History</option>
                <option>Geography</option>
                <option>Sports</option>
                <option>Technology</option>
                <option>Trivia</option>
                <option>Other</option>
              </select>

              <select 
                className="form-select filter-select"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option>All Levels</option>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>

              <select 
                className="form-select filter-select"
                value={selectedLength}
                onChange={(e) => setSelectedLength(e.target.value)}
              >
                <option>Any Length</option>
                <option>5 questions</option>
                <option>10 questions</option>
                <option>15+ questions</option>
              </select>
            </div>

            <div className="filters-bottom">
              <p className="quiz-count text-muted">Showing 20 of 20 quizzes</p>
              <Button className="set-filters-btn" onClick={handleSetFilters}>
                Set Filters
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Take a Quiz Section */}
      <section className="featured-section py-5">
        <Container>
          <h2 className="section-title mb-4">Take a Quiz</h2>

          {loading && (
            <div className="text-center py-5">
              <p className="text-muted">Loading quizzes...</p>
            </div>
          )}

          {!loading && featuredQuizzes.length > 0 ? (
            <Row className="g-4">
              {featuredQuizzes.map((quiz) => (
                <Col key={quiz.quizId} md={6} lg={4}>
                  <QuizCard quiz={quiz} getDifficultyColor={getDifficultyColor} />
                </Col>
              ))}
            </Row>
          ) : (
            !loading && (
              <div className="text-center py-5">
                <p className="text-muted">No quizzes available at the moment.</p>
              </div>
            )
          )}

          <div className="text-center mt-5">
            <Link to="/quizes">
              <Button variant="outline-primary" size="lg" className="view-all-btn">
                View All Quizzes
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
};

// Quiz Card Component
interface QuizCardProps {
  quiz: QuizPreview;
  getDifficultyColor: (difficulty: string) => string;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, getDifficultyColor }) => {
  return (
    <Card className="quiz-card h-100 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="mb-0">{quiz.name}</Card.Title>
          <span
            className="badge"
            style={{
              backgroundColor: getDifficultyColor(quiz.difficulty),
              color: 'white'
            }}
          >
            {quiz.difficulty}
          </span>
        </div>

        <Card.Text className="text-muted small mb-3">
          {quiz.description}
        </Card.Text>

        <div className="quiz-meta d-flex justify-content-between text-muted small">
          <span>📚 {quiz.questionCount} questions</span>
          <span>⏱️ {quiz.timeLimit} min</span>
        </div>
      </Card.Body>

      <Card.Footer className="bg-white border-top-0">
        <Link to={`/quizes/${quiz.quizId}`} className="btn btn-sm btn-start-quiz w-100">
          Start Quiz
        </Link>
      </Card.Footer>
    </Card>
  );
};

export default HomePage;