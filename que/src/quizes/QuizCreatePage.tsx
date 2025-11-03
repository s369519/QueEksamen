import React from "react";
import { useNavigate } from "react-router-dom";
import QuizForm from "./QuizForm";
import { Quiz } from "../types/quiz";
import * as QuizService from './QuizService';
const API_URL = import.meta.env.VITE_API_URL;

const QuizCreatePage: React.FC = () => {
    const navigate = useNavigate();

    const handleQuizCreated = async (quiz: Quiz) => {
        try {
            const data = await QuizService.createQuiz(quiz);
            console.log('Quiz created successfully:', data);
            navigate('/quizes');
        } catch (error) {
            console.error('There was a problem with the fetch operation: ', error);
        }
    }

    return (
        <div>
            <h2>Create New Quiz</h2>
            <QuizForm onQuizChanged={handleQuizCreated}/>
        </div>
    );
};

export default QuizCreatePage;