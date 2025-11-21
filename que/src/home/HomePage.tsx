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
        if (!response.ok) throw new Error('Failed to fetch featured quizzes');
        const data = await response.json();

        if (data && data.length > 0) {
          setFeaturedQuizzes(
            data.map((quiz: any) => ({
              quizId: quiz.quizId,
              name: quiz.name,
              description: quiz.description || 'No description available',
              difficulty: quiz.difficulty || 'Medium',
              questionCount: quiz.questionCount || 0,
              timeLimit: quiz.timeLimit || 10,
              category: quiz.category || 'General'
            }))
          );
        } else {
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

  // Filtering
  useEffect(() => {
    let filtered = [...featuredQuizzes];

    if (searchTerm) {
      filtered = filtered.filter(quiz =>
        quiz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(
        quiz => quiz.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (selectedLevel !== 'All Levels') {
      filtered = filtered.filter(
        quiz => quiz.difficulty.toLowerCase() === selectedLevel.toLowerCase()
      );
    }

    if (selectedLength !== 'Any Length') {
      filtered = filtered.filter(quiz => {
        const count = quiz.questionCount;
        switch (selectedLength) {
          case '1-5 questions': return count >= 1 && count <= 5;
          case '6-10 questions': return count >= 6 && count <= 10;
          case '11-15 questions': return count >= 11 && count <= 15;
          case '16+ questions': return count >= 16;
          default: return true;
        }
      });
    }

    setFilteredQuizzes(filtered);
  }, [featuredQuizzes, searchTerm, selectedCategory, selectedLevel, selectedLength]);

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#28a745';
      case 'medium': return '#ffc107';
      case 'hard': return '#dc3545';
      default: return '#6c757d';
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
      {/* HERO */}
      <section className="py-5 text-center fade-in-up">
        <Container>
          <Row>
            <Col>
              <h1 className="fw-normal fs-1 text-dark">
                Welcome to <span className="hero-que">¿Qué?</span>
              </h1>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FIND YOUR PERFECT QUIZ */}
      <section className="py-5 fade-in-up-delay">
        <Container>
          <div className="find-quiz-card p-4 p-md-5">
            <h2 className="find-quiz-title mb-4 fw-bold">Find Your Perfect Quiz</h2>

            {/* SEARCH – én lang bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search quizzes by title, description, or category..."
                className="form-control quiz-control"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* FILTERS – 3 kolonner på md+, 1 per rad på mobil */}
            <Row className="g-3 mb-4">
              <Col md={4}>
                <select
                  className="form-select quiz-control"
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
              </Col>

              <Col md={4}>
                <select
                  className="form-select quiz-control"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                >
                  <option>All Levels</option>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </Col>

              <Col md={4}>
                <select
                  className="form-select quiz-control"
                  value={selectedLength}
                  onChange={(e) => setSelectedLength(e.target.value)}
                >
                  <option>Any Length</option>
                  <option>1-5 questions</option>
                  <option>6-10 questions</option>
                  <option>11-15 questions</option>
                  <option>16+ questions</option>
                </select>
              </Col>
            </Row>

            {/* BOTTOM LINE */}
            <div className="d-flex flex-wrap justify-content-between align-items-center">
              <p className="mb-2 quiz-count">
                Showing {filteredQuizzes.length} of {featuredQuizzes.length} quizzes
              </p>

              <Button className="set-filters-btn" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* QUIZ LIST */}
      <section className="py-5 fade-in-up-delay-more">
        <Container>
          <h2 className="section-title mb-4 fw-bold text-dark">Take a Quiz</h2>

          {loading && (
            <div className="text-center py-5">
              <p className="text-muted">Loading quizzes...</p>
            </div>
          )}

          {!loading && filteredQuizzes.length > 0 && (
            <Row className="g-4">
              {filteredQuizzes.map(quiz => (
                <Col key={quiz.quizId} md={6} lg={4}>
                  <QuizCard quiz={quiz} getDifficultyColor={getDifficultyColor} />
                </Col>
              ))}
            </Row>
          )}

          {!loading && filteredQuizzes.length === 0 && (
            <div className="text-center py-5 text-muted">
              {featuredQuizzes.length === 0
                ? 'No quizzes available at the moment.'
                : 'No quizzes match your filters.'}
            </div>
          )}

          <div className="text-center mt-4">
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

/* QUIZ CARD */
interface QuizCardProps {
  quiz: QuizPreview;
  getDifficultyColor: (difficulty: string) => string;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, getDifficultyColor }) => {
  return (
    <Card className="quiz-card h-100 shadow-sm">
      <Card.Body className="p-4">

        {/* Title + Difficulty */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="fw-bold mb-0">{quiz.name}</Card.Title>
          <span
            className="badge"
            style={{ backgroundColor: getDifficultyColor(quiz.difficulty), color: '#fff' }}
          >
            {quiz.difficulty}
          </span>
        </div>

        {/* Description */}
        <Card.Text className="text-muted small mb-2">
          {quiz.description}
        </Card.Text>

        {/* Category */}
        <div className="text-muted small mb-3">
          📂 <span className="fw-semibold">{quiz.category}</span>
        </div>

        {/* Meta */}
        <div className="quiz-meta d-flex justify-content-between text-muted small">
          <span>📚 {quiz.questionCount} questions</span>
          <span>⏱️ {quiz.timeLimit} min</span>
        </div>
      </Card.Body>

      <Card.Footer className="bg-white border-0 px-4 pb-4 pt-3">
        <Link
          to={`/quiztake/${quiz.quizId}`}
          className="btn btn-gradient btn-sm w-100"
        >
          Start Quiz
        </Link>

      </Card.Footer>
    </Card>
  );
};

export default HomePage;
