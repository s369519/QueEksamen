import React, { useState, useEffect } from "react";
import { Button, Form, Container, Card } from "react-bootstrap";
import QuizTable from "./QuizTable";
import { Quiz } from '../types/quiz';
import * as QuizService from './QuizService';
import { useAuth } from "../auth/AuthContext";
import "./QuizListPage.css";

const API_URL = import.meta.env.VITE_API_URL;

// QuizListPage Component 

const QuizListPage: React.FC = () => {
    // Array of quizzes fetched from the API
    const [quizes, setQuizes] = useState<Quiz[]>([]);
    
    // Loading state for async operations
    const [loading, setLoading] = useState<boolean>(false);
    
    // Error message to display if operations fail
    const [error, setError] = useState<string | null>(null);
    
    // Search query for filtering quizzes by name or description
    const [searchQuery, setSearchQuery] = useState<string>('');
    
    // ID of quiz currently being deleted (for loading indicator)
    const [deletingQuizId, setDeletingQuizId] = useState<number | null>(null);
    
    // Authentication context providing user info and auth status
    const { user, isAuthenticated } = useAuth();

    // Selected category filter (empty string = all categories)
    const [sortCategory, setSortCategory] = useState<string>('');
    
    // Selected difficulty filter (empty string = all difficulties)
    const [sortDifficulty, setSortDifficulty] = useState<string>('');

    // Fetches all quizzes created by the authenticated user
    const fetchQuizes = async () => {
        // Early return if user is not authenticated
        if (!isAuthenticated) {
            setQuizes([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch user's quizzes from API
            const data = await QuizService.getUserQuizzes();
            setQuizes(data);
        } catch (error: unknown) {
            setError("Failed to fetch quizzes");
        } finally {
            setLoading(false);
        }
    };

    // Effect hook to fetch quizzes when authentication state changes
    // Triggers on component mount and whenever isAuthenticated changes
    useEffect(() => {
        fetchQuizes();
    }, [isAuthenticated]);

    // First filter: Search query matching
    // Filters quizzes by search query, checking both name and description fields.
    const filteredQuizes = quizes.filter(quiz =>
        (quiz.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (quiz.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );


    // Second filter: Category and difficulty matching
    // Applies dropdown filter selections on top of search results.
    // Empty filter values (empty strings) match all quizzes.
    const sortedAndFilteredQuizzes = filteredQuizes.filter(quiz => {
        const matchesCategory = sortCategory ? quiz.category === sortCategory : true;
        const matchesDifficulty = sortDifficulty ? quiz.difficulty === sortDifficulty : true;
        return matchesCategory && matchesDifficulty;
    });

    // Handles quiz deletion with user confirmation
    const handleQuizDeleted = async (quizId: number) => {
        // Show confirmation dialog
        const confirmDelete = window.confirm(`Are you sure you want to delete the quiz ${quizId}?`);
        if (confirmDelete) {
            setDeletingQuizId(quizId);
            try {
                // Delete quiz via API
                await QuizService.deleteQuiz(quizId);
                // Remove deleted quiz from local state
                setQuizes(prev => prev.filter(q => q.quizId !== quizId));
            } catch {
                setError("Failed to delete quiz.");
            } finally {
                setDeletingQuizId(null);
            }
        }
    };

    return (
        <div className="quizlist-page">
            <Container className="py-5">

                {/* HEADER */}
                <div className="gradient-header mb-4 p-4 rounded text-white text-center shadow-sm">
                    <h1 className="fw-bold mb-0">My Quizzes</h1>
                </div>

                {!isAuthenticated ? (
                    <Card className="shadow-sm p-4 text-center">
                        <h4>Please log in to view your quizzes</h4>
                        <p>You need to be logged in to see quizzes you have created.</p>
                        <Button href="/login" className="btn-gradient mt-2">Go to Login</Button>
                    </Card>
                ) : (
                    <>
                        {/* FILTER BAR */}
                        <Card className="p-4 shadow-sm mb-4 rounded-4">
                            <div className="row g-3">

                                <div className="col-md-4">
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by name or description"
                                        className="quiz-control"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <Form.Select
                                        className="quiz-control"
                                        value={sortCategory}
                                        onChange={e => setSortCategory(e.target.value)}
                                    >
                                        <option value="">All Categories</option>
                                        <option value="History">History</option>
                                        <option value="Geography">Geography</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Trivia">Trivia</option>
                                        <option value="Other">Other</option>
                                    </Form.Select>
                                </div>

                                <div className="col-md-4">
                                    <Form.Select
                                        className="quiz-control"
                                        value={sortDifficulty}
                                        onChange={e => setSortDifficulty(e.target.value)}
                                    >
                                        <option value="">All Difficulties</option>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </Form.Select>
                                </div>
                            </div>
                        </Card>

                        {error && <p className="text-danger">{error}</p>}

                        {/* QUIZ TABLE */}
                        <Card className="shadow-sm p-4 rounded-4">
                            <QuizTable
                                quizes={sortedAndFilteredQuizzes}
                                apiUrl={API_URL}
                                onQuizDeleted={user ? handleQuizDeleted : undefined}
                                deletingQuizId={deletingQuizId}
                            />
                        </Card>

                        {/* CREATE NEW QUIZ */}
                        {user && (
                            <div className="text-end mt-4">
                                <Button href="/quizcreate" className="btn-gradient px-4">
                                    Create New Quiz
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </Container>
        </div>
    );
};

export default QuizListPage;
