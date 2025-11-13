import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Form, Alert, ProgressBar, Container } from 'react-bootstrap';
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

    // ========== NY FUNKSJON - LEGG TIL HER ==========
    const handleQuizComplete = async (finalScore: number) => {
        try {
            if (!id) return;
            
            // Lagre forsøket til backend
            await QuizService.submitQuizAttempt(parseInt(id), finalScore);
            
            console.log('Quiz attempt saved successfully with score:', finalScore);
        } catch (error) {
            console.error('Error submitting quiz attempt:', error);
            // Fortsett likevel - brukeren kan se resultatene
        }
    };
    // ========== SLUTT PÅ NY FUNKSJON ==========

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

    // Load quiz with correct answers after completion
    useEffect(() => {
        if (!showResult || !id) return;

        const loadQuizResults = async () => {
            try {
                const data = await QuizService.fetchQuizResults(id);
                setQuizWithAnswers(data);
            } catch (err: any) {
                console.error('Error loading quiz results:', err);
                // Not critical error - user can still see their score
            }
        };

        loadQuizResults();
    }, [showResult, id]);

    const currentQuestion: QuestionTake | undefined = quiz?.questions[currentQuestionIndex];

    const handleOptionToggle = (optionId: number) => {
        if (!currentQuestion) return;

        if (currentQuestion.allowMultiple) {
            // Multiple choice - toggle selection
            setSelectedOptions(prev => 
                prev.includes(optionId) 
                    ? prev.filter(id => id !== optionId)
                    : [...prev, optionId]
            );
        } else {
            // Single choice - replace selection
            setSelectedOptions([optionId]);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!quiz || !currentQuestion || selectedOptions.length === 0 || !id) return;

        setIsSubmitting(true);
        try {
            const result = await QuizService.submitAnswer(
                quiz.quizId, 
                currentQuestion.questionId, 
                selectedOptions
            );

            // Show feedback
            setAnswerFeedback({ 
                show: true, 
                isCorrect: result.isCorrect,
                isPartiallyCorrect: result.isPartiallyCorrect,
                scoreValue: result.scoreValue
            });

            // Save answer to history
            const answerRecord = {
                questionId: currentQuestion.questionId,
                questionText: currentQuestion.text,
                selectedOptionIds: selectedOptions,
                isCorrect: result.isCorrect,
                isPartiallyCorrect: result.isPartiallyCorrect,
                scoreValue: result.scoreValue
            };

            setAnswerHistory(prev => [...prev, answerRecord]);

            // Update score with actual score value (0.0 to 1.0)
            setScore(prev => prev + result.scoreValue);

            // Check if this is the last question
            if (currentQuestionIndex + 1 >= quiz.questions.length) {
                // Siste spørsmål - beregn total score og lagre forsøk
                const totalScore = [...answerHistory, answerRecord].reduce((sum, answer) => sum + answer.scoreValue, 0);
                const maxScore = quiz.questions.length;
                const finalScore = (totalScore / maxScore) * 100; // Score i prosent
                
                // Lagre forsøket til backend
                await handleQuizComplete(finalScore);
            }

            // Wait a moment to show feedback, then move to next question or show result
            setTimeout(() => {
                setAnswerFeedback(null);
                
                if (currentQuestionIndex + 1 < quiz.questions.length) {
                    // Move to next question
                    setCurrentQuestionIndex(prev => prev + 1);
                    setSelectedOptions([]);
                } else {
                    // Quiz finished
                    setShowResult(true);
                }
            }, 1500);

        } catch (err: any) {
            console.error('Error submitting answer:', err);
            setError(err.message || 'Failed to submit answer');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <h3>Loading quiz...</h3>
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
                        Back to Quiz List
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
        return (
            <Container className="mt-5">
                <Card className="text-center mb-4">
                    <Card.Header as="h2">Quiz Complete!</Card.Header>
                    <Card.Body>
                        <Card.Title>{quiz.quizName}</Card.Title>
                        <h3 className="my-4">Your Score: {score.toFixed(2)} / {quiz.totalQuestions}</h3>
                        <h4 className="mb-4">{percentage.toFixed(1)}%</h4>
                        <ProgressBar 
                            now={percentage} 
                            variant={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'danger'}
                            className="mb-4"
                        />
                        {percentage >= 70 && <p className="text-success">Excellent work! 🎉</p>}
                        {percentage >= 50 && percentage < 70 && <p className="text-warning">Good effort! 👍</p>}
                        {percentage < 50 && <p className="text-danger">Keep practicing! 💪</p>}
                        <Button variant="primary" onClick={() => navigate('/quizlist')}>
                            Back to Quiz List
                        </Button>
                    </Card.Body>
                </Card>

                {/* Answer Review Section */}
                {quizWithAnswers && (
                    <Card>
                        <Card.Header as="h3">Review Your Answers</Card.Header>
                        <Card.Body>
                            {quizWithAnswers.questions.map((question, index) => {
                                const userAnswer = answerHistory.find(a => a.questionId === question.questionId);
                                if (!userAnswer) return null;

                                return (
                                    <Card key={question.questionId} className="mb-3">
                                        <Card.Header className={
                                            userAnswer.isCorrect ? 'bg-success text-white' :
                                            userAnswer.isPartiallyCorrect ? 'bg-warning' :
                                            'bg-danger text-white'
                                        }>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span>Question {index + 1}</span>
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
                                                    <small>Multiple answers allowed</small>
                                                </Alert>
                                            )}
                                            <div className="ms-3">
                                                {question.options.map(option => {
                                                    const wasSelected = userAnswer.selectedOptionIds.includes(option.optionId);
                                                    const isCorrect = option.isCorrect === true;
                                                    
                                                    return (
                                                        <div 
                                                            key={option.optionId}
                                                            className={`p-2 mb-2 border rounded ${
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
                    <Button variant="primary" size="lg" onClick={() => navigate('/quizlist')}>
                        Back to Quiz List
                    </Button>
                </div>
            </Container>
        );
    }

    if (!currentQuestion) {
        return <Container className="mt-5"><Alert variant="warning">No questions available</Alert></Container>;
    }

    const progress = ((currentQuestionIndex + 1) / quiz.totalQuestions) * 100;

    return (
        <Container className="mt-5">
            <Card>
                <Card.Header>
                    <h2>{quiz.quizName}</h2>
                    <ProgressBar now={progress} label={`${currentQuestionIndex + 1} / ${quiz.totalQuestions}`} />
                </Card.Header>
                <Card.Body>
                    <h4 className="mb-4">Question {currentQuestionIndex + 1}</h4>
                    <p className="lead mb-4">{currentQuestion.text}</p>

                    {currentQuestion.allowMultiple && (
                        <Alert variant="info" className="mb-3">
                            <small>Multiple answers allowed - select all that apply</small>
                        </Alert>
                    )}

                    <Form>
                        {currentQuestion.options.map(option => (
                            <Form.Check
                                key={option.optionId}
                                type={currentQuestion.allowMultiple ? 'checkbox' : 'radio'}
                                id={`option-${option.optionId}`}
                                label={option.text}
                                checked={selectedOptions.includes(option.optionId)}
                                onChange={() => handleOptionToggle(option.optionId)}
                                className="mb-3 p-3 border rounded"
                                disabled={isSubmitting || answerFeedback !== null}
                            />
                        ))}
                    </Form>

                    {answerFeedback && (
                        <Alert 
                            variant={
                                answerFeedback.isCorrect ? 'success' : 
                                answerFeedback.isPartiallyCorrect ? 'warning' : 
                                'danger'
                            } 
                            className="mt-3"
                        >
                            {answerFeedback.isCorrect && '✓ Correct!'}
                            {answerFeedback.isPartiallyCorrect && (
                                <>
                                    ◐ Partially Correct! 
                                    <br />
                                    <small>You earned {(answerFeedback.scoreValue * 100).toFixed(0)}% of the points for this question</small>
                                </>
                            )}
                            {!answerFeedback.isCorrect && !answerFeedback.isPartiallyCorrect && '✗ Incorrect'}
                        </Alert>
                    )}

                    <div className="d-flex justify-content-between mt-4">
                        <Button 
                            variant="outline-secondary" 
                            onClick={() => navigate('/quizlist')}
                            disabled={isSubmitting}
                        >
                            Exit Quiz
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleSubmitAnswer}
                            disabled={selectedOptions.length === 0 || isSubmitting || answerFeedback !== null}
                        >
                            {isSubmitting ? 'Submitting...' : 
                             currentQuestionIndex + 1 === quiz.totalQuestions ? 'Finish Quiz' : 'Next Question'}
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default TakeQuizPage;