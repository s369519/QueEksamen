import React, { useState } from 'react';
import { Table, Button } from 'react-bootstrap';
import { Quiz } from '../types/quiz';
import { Link } from 'react-router-dom';

interface QuizTableProps {
    quizes: Quiz[];
    apiUrl: string;
    onQuizDeleted?: (quizId: number) => void;
}

const QuizTable: React.FC<QuizTableProps> = ({ quizes, apiUrl, onQuizDeleted }) => {
    const [showDescriptions, setShowDescriptions] = useState<boolean>(true);
    const toggleDescriptions = () => setShowDescriptions(prevShowDescriptions => !prevShowDescriptions);

    return (
        <div>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        {showDescriptions && <th>Description</th>}
                        <th>Category</th>
                        <th>Difficulty</th>
                        <th>TimeLimit</th>
                        <th>Visability</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {quizes.map(quiz => (
                        <tr key={quiz.quizId}>
                            <td>{quiz.quizId}</td>
                            <td>{quiz.name}</td>
                            {showDescriptions && <td>{quiz.description}</td>}
                            <td>{quiz.category}</td>
                            <td>{quiz.difficulty}</td>
                            <td>{quiz.timeLimit}</td>
                            <td>{quiz.isPublic}</td>
                            <td className='text-center'>
                                {onQuizDeleted && (
                                    <>
                                    <Link to={`/quizupdate/${quiz.quizId}`}>
                                    Update
                                    </Link>
                                    <Link to="#" onClick={() => onQuizDeleted(quiz.quizId!)} className='btn btn-link text-danger'>
                                    Delete
                                    </Link>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default QuizTable;