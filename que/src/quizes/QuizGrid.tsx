import React from "react";
import { Card, Col, Row, Button } from 'react-bootstrap';
import { Quiz } from '../types/quiz';
import { useAuth } from "../auth/AuthContext";

interface QuizGridProps {
    quizes: Quiz[];
    apiUrl: string;
    onQuizDeleted?: (quizId: number) => void;
}

const QuizGrid: React.FC<QuizGridProps> = ({ quizes, apiUrl, onQuizDeleted }) => {
    const { user } = useAuth();

    return (
        <div>
            <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                {quizes.map(quiz => {
                    const isOwner = user && quiz.ownerId === user.sub;
                    const canEdit = onQuizDeleted && isOwner;

                    return (
                        <Col key={quiz.quizId}>
                            <Card className="h-100">
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title>{quiz.quizId}: {quiz.name}</Card.Title>
                                    <Card.Text>{quiz.description}</Card.Text>
                                    <Card.Text>{quiz.category}</Card.Text>
                                    <Card.Text>{quiz.difficulty}</Card.Text>
                                    <Card.Text>Time Limit: {quiz.timeLimit} Minutes</Card.Text>
                                    
                                    <div className="mt-auto d-flex justify-content-between gap-2">
                                        {canEdit && (
                                            <>
                                                <Button href={`/quizupdate/${quiz.quizId}`} variant="primary">Update</Button>
                                                <Button onClick={() => onQuizDeleted(quiz.quizId!)} variant="danger">Delete</Button>
                                            </>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
};

export default QuizGrid;