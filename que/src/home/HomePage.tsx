import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

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

  // for fade-in animation
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    const fetchFeaturedQuizzes = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5043/api/QuizAPI/quizlist');
        if (!response.ok) {
          throw new Error('Failed to fetch featured quizzes');
        }
        const data = await response.json();

        if (data && data.length > 0) {
          setFeaturedQuizzes(
            data.slice(0, 6).map((quiz: any) => ({
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

  // apply filters
  useEffect(() => {
    let filtered = [...featuredQuizzes];

    if (searchTerm) {
      filtered = filtered.filter((quiz) =>
        quiz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(
        (quiz) => quiz.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (selectedLevel !== 'All Levels') {
      filtered = filtered.filter(
        (quiz) => quiz.difficulty.toLowerCase() === selectedLevel.toLowerCase()
      );
    }

    if (selectedLength !== 'Any Length') {
      filtered = filtered.filter((quiz) => {
        const c = quiz.questionCount;
        switch (selectedLength) {
          case '1-5 questions':
            return c >= 1 && c <= 5;
          case '6-10 questions':
            return c >= 6 && c <= 10;
          case '11-15 questions':
            return c >= 11 && c <= 15;
          case '16+ questions':
            return c >= 16;
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
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setSelectedLevel('All Levels');
    setSelectedLength('Any Length');
  };

  // shared fade-in style
  const fadeInStyle: React.CSSProperties = {
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease'
  };

  const fadeInDelayed: React.CSSProperties = {
    ...fadeInStyle,
    transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s'
  };

  // gradient card style (ombre)
  const gradientCardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '1.5rem',
    color: '#ffffff'
  };

  // input/select style on gradient background
  const innerControlStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: '0.75rem',
    border: '2px solid rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.96)',
    fontSize: '1rem'
  };

  const gradientTextStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    fontWeight: 700
  };

  return (
    <div className="bg-white min-vh-100">
      {/* HERO */}
      <section className="py-5 text-center" style={fadeInStyle}>
        <Container>
          <h1 className="fw-normal fs-1 mb-0">
            Welcome to{' '}
            <span style={gradientTextStyle}>¿Qué?</span>
          </h1>
        </Container>
      </section>

      {/* FIND YOUR PERFECT QUIZ */}
      <section className="py-5" style={fadeInDelayed}>
        <Container>
          <div className="p-4 p-md-5" style={gradientCardStyle}>
            <h2 className="fw-bold mb-4" style={{ fontSize: '1.8rem' }}>
              Find Your Perfect Quiz
            </h2>

            {/* search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search quizzes by title, description, or category..."
                style={innerControlStyle}
                className="w-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* filters – 3 columns on md+, stacked on mobile */}
            <Row className="g-3 mb-4">
              <Col md={4}>
                <select
                  className="form-select"
                  style={innerControlStyle}
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
                  className="form-select"
                  style={innerControlStyle}
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
                  className="form-select"
                  style={innerControlStyle}
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

            {/* bottom row: text left, button right */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mt-2">
              <p className="mb-2 mb-md-0" style={{ opacity: 0.9 }}>
                Showing {filteredQuizzes.length} of {featuredQuizzes.length} quizzes
              </p>
              <Button
                variant="light"
                className="fw-bold px-4"
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* QUIZ LIST */}
      <section className="py-5" style={fadeInDelayed}>
        <Container>
          <h2 className="fw-bold mb-4" style={{ fontSize: '2rem' }}>
            Take a Quiz
          </h2>

          {loading && (
            <div className="text-center py-5">
              <p className="text-muted mb-0">Loading quizzes...</p>
            </div>
          )}

          {!loading && filteredQuizzes.length > 0 && (
            <Row className="g-4">
              {filteredQuizzes.map((quiz) => (
                <Col key={quiz.quizId} md={6} lg={4}>
                  <QuizCard quiz={quiz} getDifficultyColor={getDifficultyColor} />
                </Col>
              ))}
            </Row>
          )}

          {!loading && filteredQuizzes.length === 0 && (
            <div className="text-center py-5">
              <p className="text-muted mb-0">
                {featuredQuizzes.length === 0
                  ? 'No quizzes available at the moment.'
                  : 'No quizzes match your filters.'}
              </p>
            </div>
          )}

          <div className="text-center mt-5">
            <Link to="/quizes">
              <Button variant="outline-primary" size="lg" className="fw-bold">
                View All Quizzes
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
};

// Quiz Card
interface QuizCardProps {
  quiz: QuizPreview;
  getDifficultyColor: (difficulty: string) => string;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, getDifficultyColor }) => {
  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body className="p-4">

        {/* Title + difficulty badge */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="mb-0 fs-6 fw-bold text-dark">
            {quiz.name}
          </Card.Title>

          <span className={`badge bg-${getDifficultyColor(quiz.difficulty)} text-white`}>
            {quiz.difficulty}
          </span>
        </div>

        {/* Description */}
        <Card.Text className="text-muted small mb-3">
          {quiz.description}
        </Card.Text>

        {/* Category */}
        <div className="text-muted small mb-3">
          📂 <span className="fw-semibold">{quiz.category}</span>
        </div>

        {/* Questiong + time */}
        <div className="d-flex justify-content-between text-muted small pt-3 border-top">
          <span>📚 {quiz.questionCount} questions</span>
          <span>⏱️ {quiz.timeLimit} min</span>
        </div>
      </Card.Body>

      <Card.Footer className="bg-white border-0 px-4 pb-4 pt-3">
        <Link
          to={`/quiztake/${quiz.quizId}`}
          className="btn btn-outline-primary btn-sm w-100 fw-bold"
        >
          Start Quiz
        </Link>
      </Card.Footer>
    </Card>
  );
};

export default HomePage;
