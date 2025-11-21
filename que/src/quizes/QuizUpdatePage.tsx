import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import QuizForm from './QuizForm';
import { Quiz } from '../types/quiz';
import * as QuizService from './QuizService';
const API_URL = import.meta.env.VITE_API_URL;

const QuizUpdatePage: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const [ quiz, setQuiz ] = useState<Quiz | null>(null);
    const [ loading, setLoading ] = useState<boolean>(true);
    const [ error, setError ] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const data = await QuizService.fetchQuizById(quizId!);
                setQuiz(data);
            } catch (error: any) {
                console.error('There was a problem with the fetch operation:', error);
                const errorMessage = error.message || 'Failed to fetch quiz';
                
                // Check if it's a 404 error (quiz deleted)
                if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                    setError('This quiz no longer exists. It may have been deleted.');
                } else if (errorMessage.includes('401') || errorMessage.includes('authorized')) {
                    setError('You do not have permission to edit this quiz.');
                } else {
                    setError('Failed to load quiz. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId]);

    const handleQuizUpdated = async (quiz: Quiz) => {
        try {
            const data = await QuizService.updateQuiz(quiz);
            console.log('Quiz updated successfully', data);
            navigate('/quizes');
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
            <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading quiz...</p>
            </div>
        </div>
    );
    
    if (error) return (
        <div className="container mt-5">
            <div className="alert alert-danger" role="alert">
                <h4 className="alert-heading"><i className="bi bi-exclamation-triangle me-2"></i>Error</h4>
                <p>{error}</p>
                <hr />
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-danger" onClick={() => navigate('/quizes')}>
                        <i className="bi bi-arrow-left me-2"></i>Back to My Quizzes
                    </button>
                    <button className="btn btn-outline-primary" onClick={() => navigate('/home')}>
                        <i className="bi bi-house me-2"></i>Go to Home
                    </button>
                </div>
            </div>
        </div>
    );
    
    if (!quiz) return (
        <div className="container mt-5">
            <div className="alert alert-warning" role="alert">
                <h4 className="alert-heading">Quiz Not Found</h4>
                <p>The quiz you're looking for could not be found.</p>
                <button className="btn btn-outline-warning" onClick={() => navigate('/quizes')}>
                    <i className="bi bi-arrow-left me-2"></i>Back to My Quizzes
                </button>
            </div>
        </div>
    );

    return (
        <div>
            <h2>Update Quiz</h2>
            <QuizForm onQuizChanged={handleQuizUpdated} quizId={quiz.quizId} isUpdate={true} initialData={quiz} />
        </div>
    );
};

export default QuizUpdatePage;