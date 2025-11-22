import React, { useState } from 'react';
import { Table, Button, Badge, Card } from 'react-bootstrap';
import { Quiz } from '../types/quiz';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface QuizTableProps {
    quizes: Quiz[];
    apiUrl: string;
    onQuizDeleted?: (quizId: number) => void;
    deletingQuizId?: number | null;
}

const QuizTable: React.FC<QuizTableProps> = ({ quizes, apiUrl, onQuizDeleted, deletingQuizId }) => {
    const [showDescriptions, setShowDescriptions] = useState<boolean>(true);
    const toggleDescriptions = () => setShowDescriptions(prevShowDescriptions => !prevShowDescriptions);
    const { user } = useAuth();

    const getDifficultyVariant = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'success';
            case 'medium': return 'warning';
            case 'hard': return 'danger';
            default: return 'secondary';
        }
    };

    return (
        <Card className="shadow-sm border-0">
            <Card.Header 
                className="d-flex justify-content-between align-items-center py-3"
                style={{ backgroundColor: '#6f42c1', color: 'white' }}
            >
                <h5 className="mb-0">
                    <i className="bi bi-list-ul me-2"></i>
                    Your Quizzes ({quizes.length})
                </h5>
                <Button 
                    variant="light" 
                    size="sm"
                    onClick={toggleDescriptions}
                    style={{ fontWeight: 500 }}
                >
                    <i className={`bi bi-${showDescriptions ? 'eye-slash' : 'eye'} me-1`}></i>
                    {showDescriptions ? 'Hide' : 'Show'} Descriptions
                </Button>
            </Card.Header>
            <Card.Body className="p-0">
                <div className="table-responsive">
                    <Table hover className="mb-0" style={{ minWidth: '800px' }}>
                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                            <tr>
                                <th style={{ width: '60px', fontWeight: 600 }}>#</th>
                                <th style={{ fontWeight: 600 }}>Name</th>
                                {showDescriptions && <th style={{ fontWeight: 600 }}>Description</th>}
                                <th style={{ width: '120px', fontWeight: 600 }}>Category</th>
                                <th style={{ width: '100px', fontWeight: 600 }}>Difficulty</th>
                                <th style={{ width: '100px', fontWeight: 600 }}>
                                    <i className="bi bi-clock me-1"></i>Time
                                </th>
                                <th style={{ width: '100px', fontWeight: 600 }}>Visibility</th>
                                <th style={{ width: '280px', fontWeight: 600 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quizes.map(quiz => {
                                const isOwner = user && quiz.ownerId === user.sub;
                                const canEdit = onQuizDeleted !== undefined;
                                
                                return (
                                    <tr key={quiz.quizId} style={{ verticalAlign: 'middle' }}>
                                        <td className="text-muted fw-semibold">{quiz.quizId}</td>
                                        <td className="fw-semibold" style={{ color: '#6f42c1' }}>{quiz.name}</td>
                                        {showDescriptions && (
                                            <td className="text-muted small">
                                                {quiz.description || <em>No description</em>}
                                            </td>
                                        )}
                                        <td>
                                            <Badge bg="info" className="px-2 py-1">
                                                {quiz.category}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge 
                                                bg={getDifficultyVariant(quiz.difficulty)} 
                                                className="px-2 py-1"
                                            >
                                                {quiz.difficulty}
                                            </Badge>
                                        </td>
                                        <td className="text-center">{quiz.timeLimit} min</td>
                                        <td>
                                            {quiz.isPublic ? (
                                                <Badge bg="success" className="px-2 py-1">
                                                    <i className="bi bi-globe me-1"></i>Public
                                                </Badge>
                                            ) : (
                                                <Badge bg="secondary" className="px-2 py-1">
                                                    <i className="bi bi-lock me-1"></i>Private
                                                </Badge>
                                            )}
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Link 
                                                    to={`/quiztake/${quiz.quizId}`}
                                                    className="btn btn-sm"
                                                    style={{
                                                        backgroundColor: '#28a745',
                                                        borderColor: '#28a745',
                                                        color: 'white',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    <i className="bi bi-play-circle me-1"></i>
                                                    Take
                                                </Link>
                                                {canEdit && (
                                                    <>
                                                        <Link 
                                                            to={`/quizupdate/${quiz.quizId}`}
                                                            className="btn btn-sm"
                                                            style={{
                                                                backgroundColor: '#007bff',
                                                                borderColor: '#007bff',
                                                                color: 'white',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            <i className="bi bi-pencil me-1"></i>
                                                            Edit
                                                        </Link>
                                                        <button 
                                                            onClick={() => onQuizDeleted!(quiz.quizId!)} 
                                                            className="btn btn-sm"
                                                            disabled={deletingQuizId === quiz.quizId}
                                                            style={{
                                                                backgroundColor: deletingQuizId === quiz.quizId ? '#6c757d' : '#dc3545',
                                                                borderColor: deletingQuizId === quiz.quizId ? '#6c757d' : '#dc3545',
                                                                color: 'white',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            {deletingQuizId === quiz.quizId ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                    Deleting...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="bi bi-trash me-1"></i>
                                                                    Delete
                                                                </>
                                                            )}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
                {quizes.length === 0 && (
                    <div className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                        <p>No quizzes yet. Create your first quiz to get started!</p>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default QuizTable;