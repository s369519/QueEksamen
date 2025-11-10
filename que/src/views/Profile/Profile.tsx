import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, getUserQuizzes, getUserAttemptedQuizzes } from '../../quizes/QuizService';
import './Profile.css';

interface UserProfile {
    username: string;
    email: string;
}

interface QuizSummary {
    quizId: string;
    title: string;
    createdAt: string;
    description?: string;
    score?: number;
}

export default function Profile() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [createdQuizzes, setCreatedQuizzes] = useState<QuizSummary[]>([]);
    const [attemptedQuizzes, setAttemptedQuizzes] = useState<QuizSummary[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const loadProfileData = async () => {
            try {
                setIsLoading(true);
                const [profileData, created, attempted] = await Promise.all([
                    getUserProfile(),
                    getUserQuizzes(),
                    getUserAttemptedQuizzes()
                ]);
                setProfile(profileData);
                setCreatedQuizzes(created);
                setAttemptedQuizzes(attempted);
            } catch (error) {
                console.error('Error loading profile data:', error);
                setError('Failed to load profile data. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        loadProfileData();
    }, []);

    const handleCreateQuiz = () => {
        navigate('/quizcreate');
    };

    const handleQuizClick = (quizId: string) => {
        navigate(`/quiz/${quizId}`);
    };

    if (isLoading) {
        return <div className="loading-spinner">Loading...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="profile-container">
            <header className="profile-header">
                <h1>Dashboard</h1>
                <button className="create-quiz-btn" onClick={handleCreateQuiz}>
                    Create New Quiz
                </button>
            </header>
            
            <div className="profile-content">
                <section className="profile-info-section">
                    <h2>Profile Information</h2>
                    <div className="profile-details">
                        <p><strong>Username:</strong> {profile?.username}</p>
                        <p><strong>Email:</strong> {profile?.email}</p>
                    </div>
                </section>

                <section className="quiz-stats-section">
                    <h2>Statistics</h2>
                    <div className="stats-grid">
                        <div className="stat-box">
                            <h3>Created Quizzes</h3>
                            <p>{createdQuizzes.length}</p>
                        </div>
                        <div className="stat-box">
                            <h3>Completed Quizzes</h3>
                            <p>{attemptedQuizzes.length}</p>
                        </div>
                    </div>
                </section>

                <section className="quizzes-section">
                    <h2>My Created Quizzes</h2>
                    <div className="quiz-list">
                        {createdQuizzes.length === 0 ? (
                            <p className="no-quizzes">You haven't created any quizzes yet.</p>
                        ) : (
                            createdQuizzes.map(quiz => (
                                <div 
                                    key={quiz.quizId} 
                                    className="quiz-card"
                                    onClick={() => handleQuizClick(quiz.quizId)}
                                >
                                    <h3>{quiz.title}</h3>
                                    {quiz.description && <p>{quiz.description}</p>}
                                    <p className="quiz-date">Created: {new Date(quiz.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="quizzes-section">
                    <h2>Completed Quizzes</h2>
                    <div className="quiz-list">
                        {attemptedQuizzes.length === 0 ? (
                            <p className="no-quizzes">You haven't completed any quizzes yet.</p>
                        ) : (
                            attemptedQuizzes.map(quiz => (
                                <div 
                                    key={quiz.quizId} 
                                    className="quiz-card"
                                    onClick={() => handleQuizClick(quiz.quizId)}
                                >
                                    <h3>{quiz.title}</h3>
                                    <p className="quiz-score">Score: {quiz.score}%</p>
                                    <p className="quiz-date">Completed: {new Date(quiz.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}