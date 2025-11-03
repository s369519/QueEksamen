import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; 
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
            } catch (error) {
                setError('Failed to fetch quiz');
                console.error('There was a problem with the fetch operation:', error);
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

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!quiz) return <p>No quiz found</p>;

    return (
        <div>
            <h2>Update Quiz</h2>
            <QuizForm onQuizChanged={handleQuizUpdated} quizId={quiz.quizId} isUpdate={true} initialData={quiz} />
        </div>
    );
};

export default QuizUpdatePage;