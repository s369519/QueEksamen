import React, { useState, useEffect } from "react";
import { Button, Form } from 'react-bootstrap';
import QuizTable from "./QuizTable";
import QuizGrid from "./QuizGrid"; 
import { Quiz } from '../types/quiz';
import * as QuizService from './QuizService';
import { useAuth } from "../auth/AuthContext";
const API_URL = import.meta.env.VITE_API_URL;

const QuizListPage: React.FC = () => {
    const [quizes, setQuizes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showTable, setShowTable] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const { user } = useAuth();

    const toggleTableOrGrid = () => setShowTable(prevShowTable => !prevShowTable);

    const fetchQuizes = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await QuizService.fetchQuizes();
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
    }, []);

    const filteredQuizes = quizes.filter(quiz =>
        quiz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h1>Quizes</h1>

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


            <div className="mb-4 d-flex gap-2 flex-wrap">
                <Button onClick={fetchQuizes} className="btn btn-primary" disabled={loading}>
                    {loading ? 'Loading...' : 'Refresh Quizes'}
                </Button>

                <Button onClick={toggleTableOrGrid} className="btn btn-primary">
                    {showTable ? 'Display Grid' : 'Display Table'}
                </Button>
            </div>
                {showTable
                ? <QuizTable quizes={sortedAndFilteredQuizzes} apiUrl={API_URL} onQuizDeleted={user ? handleQuizDeleted : undefined} />
                : <QuizGrid quizes={sortedAndFilteredQuizzes} apiUrl={API_URL} onQuizDeleted={user ? handleQuizDeleted : undefined} />
                }
            
                {user && (
                    <Button href="/quizcreate" className="btn btn-secondary mt-3">Add new Quiz</Button>
                )}
            </div>
        
    );
};

export default QuizListPage;