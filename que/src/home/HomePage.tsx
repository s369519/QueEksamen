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
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizPreview[]>([]);
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
        const response = await fetch('http://localhost:5043/api/QuizAPI/quizlist');
        if (!response.ok) {
          throw new Error('Failed to fetch featured quizzes');
        }
        const data = await response.json();
        console.log('Fetched quizzes:', data);
        
        if (data && data.length > 0) {
          // Take only first 6 quizzes for featured section
          setFeaturedQuizzes(data.slice(0, 6).map((quiz: any) => ({
            quizId: quiz.quizId,
            name: quiz.name,
            description: quiz.description || 'No description available',
            difficulty: quiz.difficulty || 'Medium',
            questionCount: quiz.questionCount || 0,
            timeLimit: quiz.timeLimit || 10,
            category: quiz.category || 'General'
          })));
        } else {
          // No public quizzes available
          setFeaturedQuizzes([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching featured quizzes:', err);
        setFeaturedQuizzes([]);
        setError('Failed to load quizzes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedQuizzes();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    let filtered = [...featuredQuizzes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(quiz =>
        quiz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(quiz =>
        quiz.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Level filter
    if (selectedLevel !== 'All Levels') {
      filtered = filtered.filter(quiz =>
        quiz.difficulty.toLowerCase() === selectedLevel.toLowerCase()
      );
    }

    // Length filter
    if (selectedLength !== 'Any Length') {
      filtered = filtered.filter(quiz => {
        const questionCount = quiz.questionCount;
        switch (selectedLength) {
          case '1-5 questions':
            return questionCount >= 1 && questionCount <= 5;
          case '6-10 questions':
            return questionCount >= 6 && questionCount <= 10;
          case '11-15 questions':
            return questionCount >= 11 && questionCount <= 15;
          case '16+ questions':
            return questionCount >= 16;
          default:
            return true;
        }
      });
    }

    setFilteredQuizzes(filtered);
  }, [featuredQuizzes, searchTerm, selectedCategory, selectedLevel, selectedLength]);

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

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setSelectedLevel('All Levels');
    setSelectedLength('Any Length');
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
                <option>1-5 questions</option>
                <option>6-10 questions</option>
                <option>11-15 questions</option>
                <option>16+ questions</option>
              </select>
            </div>

            <div className="filters-bottom">
              <p className="quiz-count text-muted">
                Showing {filteredQuizzes.length} of {featuredQuizzes.length} quizzes
              </p>
              <Button className="set-filters-btn" onClick={handleResetFilters}>
                Reset Filters
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

          {!loading && filteredQuizzes.length > 0 ? (
            <Row className="g-4">
              {filteredQuizzes.map((quiz) => (
                <Col key={quiz.quizId} md={6} lg={4}>
                  <QuizCard quiz={quiz} getDifficultyColor={getDifficultyColor} />
                </Col>
              ))}
            </Row>
          ) : (
            !loading && (
              <div className="text-center py-5">
                <p className="text-muted">
                  {featuredQuizzes.length === 0 
                    ? 'No quizzes available at the moment.' 
                    : 'No quizzes match your filters.'}
                </p>
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
        <Link to={`/quiztake/${quiz.quizId}`} className="btn btn-sm btn-start-quiz w-100">
          Start Quiz
        </Link>
      </Card.Footer>
    </Card>
  );
};

export default HomePage;