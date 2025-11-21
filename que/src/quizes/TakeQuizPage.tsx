import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Form, Alert, ProgressBar, Container, Spinner, Badge, Row, Col } from 'react-bootstrap';
import { QuizTake, QuestionTake } from '../types/quizTake';
import * as QuizService from './QuizService';
import { fetchQuizById, submitAnswer, submitQuizAttempt } from './QuizService';

interface AnswerHistory {
    questionId: number;
    questionText: string;
    selectedOptionIds: number[];
    isCorrect: boolean;
    isPartiallyCorrect: boolean;
    scoreValue: number;
}

const TakeQuizPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [quiz, setQuiz] = useState<QuizTake | null>(null);
    const [quizWithAnswers, setQuizWithAnswers] = useState<QuizTake | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [answerHistory, setAnswerHistory] = useState<AnswerHistory[]>([]);
    const [answerFeedback, setAnswerFeedback] = useState<{ 
        show: boolean; 
        isCorrect: boolean; 
        isPartiallyCorrect: boolean;
        scoreValue: number;
    } | null>(null);
    const [userAnswers, setUserAnswers] = useState<Map<number, number[]>>(new Map());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [finalTime, setFinalTime] = useState(0);

    useEffect(() => {
        if (showResult) return; // Stop timer når quiz er ferdig

        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [showResult]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const handleQuizComplete = async (finalScore: number) => {
        try {
            if (!id) return;
            
            await QuizService.submitQuizAttempt(parseInt(id), finalScore);
            
            console.log('Quiz attempt saved successfully with score:', finalScore);
        } catch (error) {
            console.error('Error submitting quiz attempt:', error);
        }
    };

    const handleRetakeQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedOptions([]);
        setScore(0);
        setShowResult(false);
        setAnswerHistory([]);
        setUserAnswers(new Map());
        setElapsedTime(0);
        setFinalTime(0);
        setQuizWithAnswers(null);
    };

    useEffect(() => {
        if (!id) return;
        
        const loadQuiz = async () => {
            try {
                setLoading(true);
                const data = await QuizService.fetchQuizForTaking(id);
                setQuiz(data);
                setError(null);
            } catch (err: any) {
                console.error('Error loading quiz:', err);
                setError(err.message || 'Failed to load quiz');
            } finally {
                setLoading(false);
            }
        };

        loadQuiz();
    }, [id]);

    useEffect(() => {
        if (!showResult || !id) return;

        const loadQuizResults = async () => {
            try {
                const data = await QuizService.fetchQuizResults(id);
                setQuizWithAnswers(data);
            } catch (err: any) {
                console.error('Error loading quiz results:', err);
            }
        };

        loadQuizResults();
    }, [showResult, id]);

    useEffect(() => {
        if (!currentQuestion) return;
        const savedAnswer = userAnswers.get(currentQuestion.questionId);
        if (savedAnswer) {
            setSelectedOptions(savedAnswer);
        } else {
            setSelectedOptions([]);
        }
    }, [currentQuestionIndex]);

    const currentQuestion: QuestionTake | undefined = quiz?.questions[currentQuestionIndex];

    const handleOptionToggle = (optionId: number) => {
        if (!currentQuestion) return;

        if (currentQuestion.allowMultiple) {
            setSelectedOptions(prev => 
                prev.includes(optionId) 
                    ? prev.filter(id => id !== optionId)
                    : [...prev, optionId]
            );
        } else {
            setSelectedOptions([optionId]);
        }
    };

    const handleNextQuestion = () => {
        if (!currentQuestion || selectedOptions.length === 0) return;

        const newUserAnswers = new Map(userAnswers);
        newUserAnswers.set(currentQuestion.questionId, selectedOptions);
        setUserAnswers(newUserAnswers);

        if (currentQuestionIndex + 1 < (quiz?.questions.length || 0)) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            if (currentQuestion && selectedOptions.length > 0) {
                const newUserAnswers = new Map(userAnswers);
                newUserAnswers.set(currentQuestion.questionId, selectedOptions);
                setUserAnswers(newUserAnswers);
            }
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitQuiz = async () => {
        if (!quiz || !currentQuestion || !id) return;

        const newUserAnswers = new Map(userAnswers);
        newUserAnswers.set(currentQuestion.questionId, selectedOptions);
        setUserAnswers(newUserAnswers);

        setIsSubmitting(true);
        try {
            let totalScore = 0;
            const history: AnswerHistory[] = [];

            for (const question of quiz.questions) {
                const answer = newUserAnswers.get(question.questionId);
                if (!answer || answer.length === 0) continue;

                const result = await QuizService.submitAnswer(
                    quiz.quizId,
                    question.questionId,
                    answer
                );

                const answerRecord = {
                    questionId: question.questionId,
                    questionText: question.text,
                    selectedOptionIds: answer,
                    isCorrect: result.isCorrect,
                    isPartiallyCorrect: result.isPartiallyCorrect,
                    scoreValue: result.scoreValue
                };

                history.push(answerRecord);
                totalScore += result.scoreValue;
            }

            setAnswerHistory(history);
            setScore(totalScore);
            setFinalTime(elapsedTime); // Lagre tiden når quizen er ferdig

            const maxScore = quiz.questions.length;
            const finalScore = (totalScore / maxScore) * 100;
            
            await handleQuizComplete(finalScore);
            setShowResult(true);

        } catch (err: any) {
            console.error('Error submitting quiz:', err);
            setError(err.message || 'Failed to submit quiz');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" style={{ color: '#6f42c1' }} />
                <h3 className="mt-3">Loading quiz...</h3>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={() => navigate('/quizlist')}>
                        Back to Home Page
                    </Button>
                </Alert>
            </Container>
        );
    }

    if (!quiz) {
        return (
            <Container className="mt-5">
                <Alert variant="warning">Quiz not found</Alert>
            </Container>
        );
    }

    if (showResult) {
        const percentage = (score / quiz.totalQuestions) * 100;
        const correctAnswers = answerHistory.filter(a => a.isCorrect).length;
        
        return (
            <div style={{ 
                backgroundColor: 'white',
                minHeight: 'calc(100vh - 56px)',
                padding: '2rem 0'
            }}>
                <Container>
                    <Card className="text-center mb-4 shadow-lg border-0">
                        <Card.Header as="h2" className="py-4" style={{ backgroundColor: '#6f42c1', color: 'white' }}>
                            <i className="bi bi-trophy me-2"></i>
                            Quiz Complete!
                        </Card.Header>
                        <Card.Body className="py-5">
                            <Card.Title className="mb-4 fs-3 fw-bold">{quiz.quizName}</Card.Title>
                            
                            {/* Statistics Row */}
                            <Row className="mb-4 justify-content-center">
                                <Col xs={12} md={3} className="text-center mb-3 mb-md-0">
                                    <div className="p-3 border rounded bg-light">
                                        <h2 className="mb-1 text-success fw-bold">{correctAnswers}/{quiz.totalQuestions}</h2>
                                        <small className="text-muted text-uppercase">Correct Answers</small>
                                    </div>
                                </Col>
                                <Col xs={12} md={3} className="text-center mb-3 mb-md-0">
                                    <div className="p-3 border rounded bg-light">
                                        <h2 className="mb-1 fw-bold" style={{ color: '#6f42c1' }}>{percentage.toFixed(1)}%</h2>
                                        <small className="text-muted text-uppercase">Score</small>
                                    </div>
                                </Col>
                                <Col xs={12} md={3} className="text-center mb-3 mb-md-0">
                                    <div className="p-3 border rounded bg-light">
                                        <h2 className="mb-1 text-primary fw-bold">{quiz.totalQuestions}</h2>
                                        <small className="text-muted text-uppercase">Total Questions</small>
                                    </div>
                                </Col>
                                <Col xs={12} md={3} className="text-center">
                                    <div className="p-3 border rounded bg-light">
                                        <h2 className="mb-1 text-secondary fw-bold">{formatTime(finalTime)}</h2>
                                        <small className="text-muted text-uppercase">Time Taken</small>
                                    </div>
                                </Col>
                            </Row>
                            
                            {/* Action Buttons */}
                            <div className="d-flex justify-content-center gap-3 mt-4">
                                <Button 
                                    size="lg"
                                    onClick={() => navigate('/quizlist')}
                                    style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
                                >
                                    <i className="bi bi-house-door me-2"></i>
                                    Back to Home Page
                                </Button>
                                <Button 
                                    size="lg"
                                    variant="outline-primary"
                                    onClick={handleRetakeQuiz}
                                >
                                    <i className="bi bi-arrow-clockwise me-2"></i>
                                    Retake Quiz
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    {quizWithAnswers && (
                        <Card className="shadow-lg border-0">
                            <Card.Header as="h3" className="py-3" style={{ backgroundColor: '#8A59D4', color: 'white' }}>
                                <i className="bi bi-clipboard-check me-2"></i>
                                Review Your Answers
                            </Card.Header>
                            <Card.Body>
                                {quizWithAnswers.questions.map((question, index) => {
                                    const userAnswer = answerHistory.find(a => a.questionId === question.questionId);
                                    if (!userAnswer) return null;

                                    return (
                                        <Card key={question.questionId} className="mb-3 border-0 shadow-sm">
                                            <Card.Header className={
                                                userAnswer.isCorrect ? 'bg-success text-white' :
                                                userAnswer.isPartiallyCorrect ? 'bg-warning' :
                                                'bg-danger text-white'
                                            }>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="fw-bold">Question {index + 1}</span>
                                                    <span>
                                                        {userAnswer.isCorrect && '✓ Correct'}
                                                        {userAnswer.isPartiallyCorrect && `◐ Partial (${(userAnswer.scoreValue * 100).toFixed(0)}%)`}
                                                        {!userAnswer.isCorrect && !userAnswer.isPartiallyCorrect && '✗ Incorrect'}
                                                    </span>
                                                </div>
                                            </Card.Header>
                                            <Card.Body>
                                                <h5 className="mb-3">{question.text}</h5>
                                                {question.allowMultiple && (
                                                    <Alert variant="info" className="mb-3">
                                                        <small><i className="bi bi-info-circle me-1"></i>Multiple answers allowed</small>
                                                    </Alert>
                                                )}
                                                <div className="ms-3">
                                                    {question.options.map(option => {
                                                        const wasSelected = userAnswer.selectedOptionIds.includes(option.optionId);
                                                        const isCorrect = option.isCorrect === true;
                                                        
                                                        return (
                                                            <div 
                                                                key={option.optionId}
                                                                className={`p-3 mb-2 border rounded ${
                                                                    isCorrect ? 'border-success bg-success bg-opacity-10' :
                                                                    wasSelected && !isCorrect ? 'border-danger bg-danger bg-opacity-10' :
                                                                    wasSelected ? 'border-primary bg-light' : ''
                                                                }`}
                                                            >
                                                                <Form.Check
                                                                    type={question.allowMultiple ? 'checkbox' : 'radio'}
                                                                    id={`review-${question.questionId}-${option.optionId}`}
                                                                    label={
                                                                        <span>
                                                                            {option.text}
                                                                            {isCorrect && <span className="text-success ms-2"><strong>✓ (Correct answer)</strong></span>}
                                                                            {wasSelected && !isCorrect && <span className="text-danger ms-2"><strong>✗ (Your wrong answer)</strong></span>}
                                                                            {wasSelected && isCorrect && <span className="text-success ms-2"><strong>(Your answer - Correct!)</strong></span>}
                                                                        </span>
                                                                    }
                                                                    checked={wasSelected || isCorrect}
                                                                    disabled
                                                                    readOnly
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="mt-3">
                                                    <small className="text-muted">
                                                        <i className="bi bi-star me-1"></i>
                                                        Score: {userAnswer.scoreValue.toFixed(2)} / 1.00
                                                    </small>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    );
                                })}
                            </Card.Body>
                        </Card>
                    )}

                    <div className="text-center mt-4 mb-5">
                        <div className="d-flex justify-content-center gap-3">
                            <Button 
                                size="lg"
                                onClick={() => navigate('/quizlist')}
                                style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
                            >
                                <i className="bi bi-house-door me-2"></i>
                                Back to Home Page
                            </Button>
                            <Button 
                                size="lg"
                                variant="outline-primary"
                                onClick={handleRetakeQuiz}
                            >
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Retake Quiz
                            </Button>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    if (!currentQuestion) {
        return <Container className="mt-5"><Alert variant="warning">No questions available</Alert></Container>;
    }

    const progress = ((currentQuestionIndex + 1) / quiz.totalQuestions) * 100;
    const answeredQuestions = userAnswers.size;

    return (
        <div style={{ 
            backgroundColor: 'white',
            minHeight: 'calc(100vh - 56px)',
            padding: '2rem 0'
        }}>
            <Container>
                <Card className="shadow-lg border-0">
                    <Card.Body className="p-0">
                        {/* Header without background color */}
                        <div className="p-4 border-bottom">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h2 className="mb-0" style={{ color: '#6f42c1' }}>
                                    <i className="bi bi-question-circle me-2"></i>
                                    {quiz.quizName}
                                </h2>
                                <Badge 
                                    bg="dark" 
                                    className="fs-5 p-3"
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        fontWeight: 'normal'
                                    }}
                                >
                                    <i className="bi bi-clock me-2"></i>
                                    {formatTime(elapsedTime)}
                                </Badge>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted">
                                    Question {currentQuestionIndex + 1} of {quiz.totalQuestions}
                                </span>
                                <span className="text-muted">
                                    Answered: {answeredQuestions} / {quiz.totalQuestions}
                                </span>
                            </div>
                            <style>
                                {`
                                    .custom-progress .progress-bar {
                                        background-color: #212529 !important;
                                    }
                                `}
                            </style>
                            <ProgressBar 
                                now={progress} 
                                className="custom-progress"
                                style={{ height: '15px', backgroundColor: '#e9ecef' }}
                            />
                        </div>

                        {/* Question Content */}
                        <div className="p-4">
                            <h4 className="mb-4 fw-bold" style={{ color: '#6f42c1' }}>
                                Question {currentQuestionIndex + 1}
                            </h4>
                            <p className="lead mb-4 fs-5">{currentQuestion.text}</p>

                            {currentQuestion.allowMultiple && (
                                <Alert variant="info" className="mb-4">
                                    <i className="bi bi-info-circle me-2"></i>
                                    <small>Multiple answers allowed - select all that apply</small>
                                </Alert>
                            )}

                            <style>
                                {`
                                    .quiz-option input[type="radio"]:checked,
                                    .quiz-option input[type="checkbox"]:checked {
                                        background-color: #6f42c1;
                                        border-color: #6f42c1;
                                    }
                                    .quiz-option input[type="radio"]:checked:focus,
                                    .quiz-option input[type="checkbox"]:checked:focus {
                                        box-shadow: 0 0 0 0.25rem rgba(111, 66, 193, 0.25);
                                    }
                                `}
                            </style>

                            <Form>
                                {currentQuestion.options.map(option => {
                                    const isSelected = selectedOptions.includes(option.optionId);
                                    return (
                                        <div
                                            key={option.optionId}
                                            onClick={() => !isSubmitting && handleOptionToggle(option.optionId)}
                                            className={`quiz-option p-4 mb-3 border rounded shadow-sm ${
                                                isSelected 
                                                    ? 'border-3' 
                                                    : 'border-2'
                                            }`}
                                            style={{ 
                                                cursor: isSubmitting ? 'default' : 'pointer',
                                                background: isSelected 
                                                    ? 'linear-gradient(135deg, #6f42c1 0%, #8b5fc7 25%, #a77dd0 50%, #6d9eeb 75%, #5b8fd9 100%)' 
                                                    : 'white',
                                                borderColor: isSelected ? '#6f42c1' : '#dee2e6',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <Form.Check
                                                type={currentQuestion.allowMultiple ? 'checkbox' : 'radio'}
                                                id={`option-${option.optionId}`}
                                                label={<span className="fs-5" style={{ color: isSelected ? 'white' : 'inherit' }}>{option.text}</span>}
                                                checked={isSelected}
                                                onChange={() => {}}
                                                disabled={isSubmitting}
                                                style={{ cursor: isSubmitting ? 'default' : 'pointer' }}
                                            />
                                        </div>
                                    );
                                })}
                            </Form>

                            {/* Navigation Buttons */}
                            <div className="d-flex justify-content-between mt-5">
                                <div>
                                    <Button 
                                        variant="outline-secondary" 
                                        size="lg"
                                        onClick={() => navigate('/quizlist')}
                                        disabled={isSubmitting}
                                        className="me-2"
                                    >
                                        <i className="bi bi-x-lg me-2"></i>
                                        Exit Quiz
                                    </Button>
                                    <Button 
                                        variant="outline-primary" 
                                        size="lg"
                                        onClick={handlePreviousQuestion}
                                        disabled={currentQuestionIndex === 0 || isSubmitting}
                                    >
                                        <i className="bi bi-arrow-left me-2"></i>
                                        Previous
                                    </Button>
                                </div>
                                <div>
                                    {currentQuestionIndex + 1 < quiz.totalQuestions ? (
                                        <Button 
                                            size="lg"
                                            onClick={handleNextQuestion}
                                            disabled={selectedOptions.length === 0 || isSubmitting}
                                            style={{ 
                                                backgroundColor: '#6f42c1', 
                                                borderColor: '#6f42c1',
                                                opacity: selectedOptions.length === 0 || isSubmitting ? 0.65 : 1
                                            }}
                                        >
                                            Next
                                            <i className="bi bi-arrow-right ms-2"></i>
                                        </Button>
                                    ) : (
                                        <Button 
                                            size="lg"
                                            onClick={handleSubmitQuiz}
                                            disabled={isSubmitting}
                                            style={{ 
                                                backgroundColor: '#6f42c1', 
                                                borderColor: '#6f42c1'
                                            }}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Spinner animation="border" size="sm" className="me-2" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    Submit Quiz
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default TakeQuizPage;