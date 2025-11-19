import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
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
        <div style={{ 
            background: 'linear-gradient(135deg, #f5e6ff 0%, #e6d5f5 50%, #d5c4e8 100%)',
            minHeight: 'calc(100vh - 56px)',
            width: '100%'
        }}>
            <Container className="py-5">
                <Row className="mb-5">
                    <Col>
                        <h1 
                            className="text-center mb-2 fw-bold" 
                            style={{ 
                                color: '#6f42c1',
                                fontSize: '3.5rem',
                                fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                            }}
                        >
                            Create Quiz
                        </h1>
                        <p className="text-center text-muted fs-5">
                            Design your own quiz for the ¿Qué? community
                        </p>
                    </Col>
                </Row>
                <Row>
                    <Col lg={10} xl={8} className="mx-auto">
                        <QuizForm onQuizChanged={handleQuizCreated}/>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default QuizCreatePage;