import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './HomePage.css';

const API_URL = import.meta.env.VITE_API_URL;

// Interface for quiz preview data displayed on home page
// Contains essential quiz information without full question details
interface QuizPreview {
  quizId: number;
  name: string;
  description: string;
  difficulty: string;
  questionCount: number;
  timeLimit: number;
  category: string;
}

// HomePage Component
// Landing page displaying all available quizzes with filtering and search.
const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // All quizzes fetched from API (unfiltered)
  const [featuredQuizzes, setFeaturedQuizzes] = useState<QuizPreview[]>([]);
  
  // Quizzes after applying search and filters
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizPreview[]>([]);
  
  // Loading state for initial data fetch
  const [loading, setLoading] = useState(true);
  
  // Error message for fetch failures
  const [error, setError] = useState<string | null>(null);

  // Search term for title/description/category
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected category filter
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  
  // Selected difficulty level filter
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  
  // Selected quiz length filter (by question count)
  const [selectedLength, setSelectedLength] = useState('Any Length');

  // Number of quizzes currently visible
  const [visibleCount, setVisibleCount] = useState(9);
  
  // Quizzes to load per "Load More" click
  const ITEMS_PER_PAGE = 9;

  // Effect to fetch all quizzes on component mount
  useEffect(() => {
    const fetchFeaturedQuizzes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/QuizAPI/quizlist`);
        if (!response.ok) throw new Error('Failed to fetch featured quizzes');
        const data = await response.json();

        // Map API response to QuizPreview interface with default values
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

  // Effect to apply search and filters whenever they change
  // Filters are applied in order: search → category → level → length
  useEffect(() => {
    let filtered = [...featuredQuizzes];

    // Filter by search term (case-insensitive, searches name/description/category)
    if (searchTerm) {
      filtered = filtered.filter(quiz =>
        quiz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(
        quiz => quiz.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by difficulty level
    if (selectedLevel !== 'All Levels') {
      filtered = filtered.filter(
        quiz => quiz.difficulty.toLowerCase() === selectedLevel.toLowerCase()
      );
    }

    // Filter by quiz length (question count ranges)
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
    // Reset pagination to first page when filters change
    setVisibleCount(9);
  }, [featuredQuizzes, searchTerm, selectedCategory, selectedLevel, selectedLength]);

  // Returns color hex code based on difficulty level
  // Easy → green, Medium → yellow, Hard → red
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#28a745';
      case 'medium': return '#ffc107';
      case 'hard': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Resets all filters to default values
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setSelectedLevel('All Levels');
    setSelectedLength('Any Length');
  };

  // Loads next page of quizzes (increments visible count)
  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + ITEMS_PER_PAGE);
  };

  // Get slice of filtered quizzes to display (based on visibleCount)
  const displayedQuizzes = filteredQuizzes.slice(0, visibleCount);
  
  // Check if there are more quizzes to load
  const hasMore = visibleCount < filteredQuizzes.length;

  return (
    <div className="home-page"
     style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #faf8ff 20%, #f5f0ff 40%, #f0e6ff 60%, #ebe0ff 80%, #e6d9ff 100%)',
        minHeight: '100vh'
      }}
      >
      {/* Hero section with welcome title */}
      <section className="py-3 text-center fade-in-up">
        <Container>
          <Row>
            <Col>
              <h1 className="text-dark" style={{ fontWeight: 600, fontSize: '2.5rem' }}>
                Welcome to <span className="hero-que">¿Qué?</span>
              </h1>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Filter section with search bar and dropdown filters */}
      <section className="py-3 fade-in-up-delay">
        <Container>
          <div className="find-quiz-card p-4 p-md-5">
            <h2 className="find-quiz-title mb-4 fw-bold">Find Your Perfect Quiz</h2>

            {/* Search bar - searches across name, description, and category */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search quizzes by title, description, or category..."
                className="form-control quiz-control"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter dropdowns - 3 columns on desktop, stacked on mobile */}
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

            {/* Filter status bar with count and reset button */}
            <div className="d-flex flex-wrap justify-content-between align-items-center">
              <p className="mb-2 quiz-count">
                Showing {displayedQuizzes.length} of {filteredQuizzes.length} quizzes
              </p>

              <Button className="set-filters-btn" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Quiz list section with cards and pagination */}
      <section className="py-5 fade-in-up-delay-more">
        <Container>
          <h2 className="section-title mb-4 fw-bold text-dark">Take a Quiz</h2>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-5">
              <p className="text-muted">Loading quizzes...</p>
            </div>
          )}

          {/* Quiz grid - 3 columns on lg, 2 on md, 1 on mobile */}
          {!loading && displayedQuizzes.length > 0 && (
            <>
              <Row className="g-4">
                {displayedQuizzes.map(quiz => (
                  <Col key={quiz.quizId} md={6} lg={4}>
                    <QuizCard quiz={quiz} getDifficultyColor={getDifficultyColor} />
                  </Col>
                ))}
              </Row>

              {/* Load More button - shown when more quizzes available */}
              {hasMore && (
                <div className="text-center mt-5">
                  <Button 
                    variant="outline-primary" 
                    size="lg" 
                    className="view-all-btn"
                    onClick={handleLoadMore}
                  >
                    <i className="bi bi-arrow-down-circle me-2"></i>
                    Load More Quizzes
                  </Button>
                  <p className="text-muted mt-2 small">
                    {filteredQuizzes.length - visibleCount} more quizzes available
                  </p>
                </div>
              )}

              {/* All quizzes loaded message */}
              {!hasMore && filteredQuizzes.length > 9 && (
                <div className="text-center mt-5">
                  <p className="text-muted">
                    <i className="bi bi-check-circle me-2"></i>
                    All quizzes loaded!
                  </p>
                </div>
              )}
            </>
          )}

          {/* Empty state - shown when no quizzes match filters or none available */}
          {!loading && filteredQuizzes.length === 0 && (
            <div className="text-center py-5 text-muted">
              {featuredQuizzes.length === 0
                ? 'No quizzes available at the moment.'
                : 'No quizzes match your filters.'}
            </div>
          )}
        </Container>
      </section>
    </div>
  );
};

// QuizCard Component
// Individual quiz card displayed in grid layout.
// Shows quiz metadata with difficulty badge and start button.

// Props interface for QuizCard component
interface QuizCardProps {
  quiz: QuizPreview;
  getDifficultyColor: (difficulty: string) => string;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, getDifficultyColor }) => {
  return (
    <Card className="quiz-card h-100 shadow-sm">
      <Card.Body className="p-4">

        {/* Title and difficulty badge */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="fw-bold mb-0">{quiz.name}</Card.Title>
          <span
            className="badge"
            style={{ backgroundColor: getDifficultyColor(quiz.difficulty), color: '#fff' }}
          >
            {quiz.difficulty}
          </span>
        </div>

        {/* Quiz description */}
        <Card.Text className="text-muted small mb-2">
          {quiz.description}
        </Card.Text>

        {/* Category with folder icon */}
        <div className="text-muted small mb-3">
          📂 <span className="fw-semibold">{quiz.category}</span>
        </div>

        {/* Metadata row - question count and time limit */}
        <div className="quiz-meta d-flex justify-content-between text-muted small">
          <span>📚 {quiz.questionCount} questions</span>
          <span>⏱️ {quiz.timeLimit} min</span>
        </div>
      </Card.Body>

      {/* Card footer with Start Quiz button */}
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