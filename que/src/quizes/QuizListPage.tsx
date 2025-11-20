import React, { useState, useEffect } from "react";
import { Button, Form } from 'react-bootstrap';
import QuizTable from "./QuizTable";
import { Quiz } from '../types/quiz';
import * as QuizService from './QuizService';
import { useAuth } from "../auth/AuthContext";
const API_URL = import.meta.env.VITE_API_URL;

const QuizListPage: React.FC = () => {
    const [quizes, setQuizes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const { user, isAuthenticated } = useAuth();

    const fetchQuizes = async () => {
        if (!isAuthenticated) {
            setQuizes([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await QuizService.getUserQuizzes();
            setQuizes(data);
            console.log(data);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(`There was a problem with the fetch operation: ${error.message}`);
            } else {
                console.error('Unknown error', error);
            }
            setError('Failed to fetch quizes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizes();
    }, [isAuthenticated]);

    const filteredQuizes = quizes.filter(quiz =>
        (quiz.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (quiz.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const [sortCategory, setSortCategory] = useState<string>('');
    const [sortDifficulty, setSortDifficulty] = useState<string>('');

    const sortedAndFilteredQuizzes = filteredQuizes.filter(quiz => {
        const matchesCategory = sortCategory ? quiz.category === sortCategory : true;
        const matchesDifficulty = sortDifficulty ? quiz.difficulty === sortDifficulty : true;
        return matchesCategory && matchesDifficulty;
    });


    const handleQuizDeleted = async (quizId: number) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the quiz ${quizId}?`);
        if (confirmDelete) {
            try {
                await QuizService.deleteQuiz(quizId);
                setQuizes(prevQuizes => prevQuizes.filter(quiz => quiz.quizId !== quizId));
                console.log('Quiz deleted:', quizId);
            } catch (error) {
                console.error('Error deleting quiz:', error);
                setError('Failed to delete quiz.');
            }
        }
    };


    return (
        <div>
            <h1>My Quizes</h1>

            {!isAuthenticated ? (
                <div className="alert alert-info" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
                    <h4>Please log in to view your quizzes</h4>
                    <p>You need to be logged in to see quizzes you have created.</p>
                    <Button href="/login" variant="primary">Go to Login</Button>
                </div>
            ) : (
                <>
            <div className="mb-3 d-flex gap-2 flex-wrap align-items-center">
                <Form.Control
                    type="text"
                    placeholder="Search by name or description"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ maxWidth: '300px' }}
                />

                <Form.Select
                    value={sortCategory}
                    onChange={e => setSortCategory(e.target.value)}
                    style={{ maxWidth: '200px' }}
                >
                    <option value="">All Categories</option>
                    <option value="History">History</option>
                    <option value="Geography">Geography</option>
                    <option value="Sports">Sports</option>
                    <option value="Technology">Technology</option>
                    <option value="Trivia">Trivia</option>
                    <option value="Other">Other</option>
                </Form.Select>

                <Form.Select
                    value={sortDifficulty}
                    onChange={e => setSortDifficulty(e.target.value)}
                    style={{ maxWidth: '200px' }}
                >
                    <option value="">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                </Form.Select>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}

                <QuizTable quizes={sortedAndFilteredQuizzes} apiUrl={API_URL} onQuizDeleted={user ? handleQuizDeleted : undefined} />
            
                {user && (
                    <Button href="/quizcreate" className="btn btn-secondary mt-3">Create New Quiz</Button>
                )}
                </>
            )}
            </div>
    );
};

export default QuizListPage;  