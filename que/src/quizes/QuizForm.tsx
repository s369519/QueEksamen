import React, { useState } from 'react';
import { Button, Form, Card, Row, Col, Container } from 'react-bootstrap';
import { Quiz } from '../types/quiz';

interface Question {
  text: string;
  options: { text: string; isCorrect: boolean }[];
  allowMultiple?: boolean;
}

interface QuizFormProps {
  onQuizChanged: (newQuiz: Quiz) => void;
  quizId?: number;
  isUpdate?: boolean;
  initialData?: Quiz;
  isSubmitting?: boolean;
}

const QuizForm: React.FC<QuizFormProps> = ({
  onQuizChanged,
  quizId,
  isUpdate = false,
  initialData,
  isSubmitting = false
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || '');
  const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 10);
  const [questions, setQuestions] = useState<Question[]>(initialData?.questions || []);
  const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);
  const [nameError, setNameError] = useState('');
  const [timeLimitError, setTimeLimitError] = useState<string>('');
  const [questionsError, setQuestionsError] = useState<string>('');

  const difficulties = ['Easy', 'Medium', 'Hard'];

  const categories = [
    'History',
    'Geography',
    'Sports',
    'Technology',
    'Trivia',
    'Other'
  ];

  const validateName = (value: string) => {
    const regex = /^[a-zA-ZæøåÆØÅ0-9 \-]{2,40}$/;
    if (!regex.test(value)) {
      setNameError('The name must be numbers or letters between 2 and 40 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const validateTimeLimit = (value: number) => {
    if (isNaN(value)) {
      setTimeLimitError('The time limit must be a number');
      return false;
    }

    if (value < 1 || value > 100) {
      setTimeLimitError('The time limit must be between 1 and 100 minutes');
      return false;
    }

    setTimeLimitError('');
    return true;
  };

  const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setTimeLimit(value);
    
    if (isNaN(value)) {
      setTimeLimitError("The time limit must be a number");
      return;
    }
    
    if (value < 1 || value > 100) {
      setTimeLimitError("The time limit must be between 1 and 100 minutes");
      return;
    }
    
    setTimeLimitError("");
  };

  const addQuestion = () => {
    const defaultOptions = Array(4).fill(null).map(() => ({ text: '', isCorrect: false }));
    setQuestions([
      ...questions,
      { text: '', options: defaultOptions }
    ]);
  };

  const removeQuestion = (index: number) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...questions];
    updated[index].text = value;
    setQuestions(updated);
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push({ text: '', isCorrect: false });
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.splice(oIndex, 1);
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex].text = value;
    setQuestions(updated);
  };

  const handleCorrectToggle = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    const question = updated[qIndex];
  
    if (question.allowMultiple) {
      // Multiple answers
      updated[qIndex].options[oIndex].isCorrect = !updated[qIndex].options[oIndex].isCorrect;
    } else {
      // Only one answer
      updated[qIndex].options = updated[qIndex].options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === oIndex
      }));
    }
  
    setQuestions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateName(name)) return;

    // Validate that quiz has at least one question
    if (questions.length === 0) {
      setQuestionsError('Quiz must have at least one question');
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      // Validate question text
      if (!question.text || question.text.trim() === '') {
        setQuestionsError(`Question ${i + 1} text cannot be empty`);
        return;
      }
      
      if (question.text.length > 500) {
        setQuestionsError(`Question ${i + 1} text is too long (max 500 characters)`);
        return;
      }
      
      // Check if question has at least 2 options
      if (question.options.length < 2) {
        setQuestionsError(`Question ${i + 1} must have at least 2 options`);
        return;
      }
      
      // Check if question has at least one correct answer
      const hasCorrectAnswer = question.options.some(opt => opt.isCorrect);
      if (!hasCorrectAnswer) {
        setQuestionsError(`Question ${i + 1} must have at least one correct answer`);
        return;
      }
      
      // Validate each option
      for (let j = 0; j < question.options.length; j++) {
        const option = question.options[j];
        
        if (!option.text || option.text.trim() === '') {
          setQuestionsError(`Question ${i + 1}, Option ${j + 1} text cannot be empty`);
          return;
        }
        
        if (option.text.length > 200) {
          setQuestionsError(`Question ${i + 1}, Option ${j + 1} text is too long (max 200 characters)`);
          return;
        }
      }
    }
    
    setQuestionsError('');

    const quiz: Quiz = {
      quizId: quizId ?? initialData?.quizId,
      name,
      description: description || '',
      category: category || 'General',
      difficulty: difficulty || 'Medium',
      timeLimit: timeLimit || 10,
      isPublic,
      questions: questions.map(q => ({
        ...q,
        text: q.text || '',
        options: q.options.map(o => ({
          ...o,
          text: o.text || '',
          isCorrect: o.isCorrect || false
        }))
      }))
    };

    console.log('Submitting quiz:', quiz);
    onQuizChanged(quiz);
  };

  return (
    <Card className="shadow-sm border-0" style={{ backgroundColor: 'white' }}>
      <Card.Body className="p-4">
        <Form onSubmit={handleSubmit}>
          {/* Quiz Information Section */}
          <div className="mb-4">
            <h4 className="fw-bold mb-3" style={{ color: '#6f42c1' }}>
              <i className="bi bi-info-circle me-2"></i>
              Quiz Information
            </h4>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="quizName">
                  <Form.Label className="fw-semibold">Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter quiz name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      validateName(e.target.value);
                    }}
                    isInvalid={!!nameError}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {nameError}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="quizCategory">
                  <Form.Label className="fw-semibold">Category</Form.Label>
                  <Form.Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <Form.Group controlId="quizDescription">
                  <Form.Label className="fw-semibold">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter quiz description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="quizDifficulty">
                  <Form.Label className="fw-semibold">Difficulty</Form.Label>
                  <Form.Select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    required
                  >
                    <option value="">Select difficulty</option>
                    {difficulties.map((diff, i) => (
                      <option key={i} value={diff}>{diff}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="quizTimeLimit">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-clock me-1"></i>
                    Time Limit (Minutes)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="100"
                    value={timeLimit}
                    onChange={handleTimeLimitChange}
                    isInvalid={!!timeLimitError}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {timeLimitError}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="quizVisibility">
                  <Form.Label className="fw-semibold d-flex align-items-center">
                    <i className="bi bi-globe me-2"></i>
                    Quiz Visibility
                  </Form.Label>
                  <Form.Check
                    type="switch"
                    id="visibility-switch"
                    label={isPublic ? "Public - Anyone can take this quiz" : "Private - Only you can see this quiz"}
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mt-2"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          <hr className="my-4" />

          {/* Questions Section */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold mb-0" style={{ color: '#6f42c1' }}>
                <i className="bi bi-question-circle me-2"></i>
                Questions
              </h4>
              <Button 
                variant="outline-success" 
                onClick={addQuestion}
                className="shadow-sm"
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Question
              </Button>
            </div>

            {questions.length === 0 && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-clipboard-x fs-1 d-block mb-3"></i>
                <p>No questions yet. Click "Add Question" to start building your quiz.</p>
              </div>
            )}

            {questionsError && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {questionsError}
              </div>
            )}

            {questions.map((question, qIndex) => (
              <Card key={qIndex} className="mb-3 shadow-sm border-0" style={{ backgroundColor: '#f8f9fa' }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="fw-bold" style={{ color: '#6f42c1' }}>
                      Question {qIndex + 1}
                    </h5>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Remove
                    </Button>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Question Text</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter question text"
                      value={question.text}
                      onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                      maxLength={500}
                      required
                    />
                    <Form.Text className="text-muted" style={{ fontSize: '11px' }}>
                      {question.text.length}/500 characters
                    </Form.Text>
                  </Form.Group>

                  <Form.Check
                    type="switch"
                    label="Allow multiple correct answers"
                    checked={question.allowMultiple || false}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[qIndex].allowMultiple = e.target.checked;

                      if (!e.target.checked) {
                        let firstCorrectFound = false;
                        updated[qIndex].options = updated[qIndex].options.map(opt => {
                          if (opt.isCorrect) {
                            if (!firstCorrectFound) {
                              firstCorrectFound = true;
                              return opt;
                            } else {
                              return { ...opt, isCorrect: false };
                            }
                          }
                          return opt;
                        });
                      }

                      setQuestions(updated);
                    }}
                    className="mb-3"
                  />

                  <div className="mb-3">
                    <Form.Label className="fw-semibold">Options</Form.Label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="d-flex align-items-center mb-2 gap-2">
                        <Form.Check
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={() => handleCorrectToggle(qIndex, oIndex)}
                          label=""
                          title="Mark as correct answer"
                        />
                        <Form.Control
                          type="text"
                          placeholder={`Option ${oIndex + 1}`}
                          value={option.text}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          maxLength={200}
                          required
                        />
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeOption(qIndex, oIndex)}
                          disabled={question.options.length <= 2}
                        >
                          <i className="bi bi-x-lg"></i>
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => addOption(qIndex)}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Add Option
                  </Button>
                </Card.Body>
              </Card>
            ))}
          </div>

          <hr className="my-4" />

          {/* Submit Buttons */}
          <div className="d-flex justify-content-end gap-2">
            <Button 
              variant="outline-secondary" 
              size="lg"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              size="lg"
              className="px-4"
              style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1', color: 'white' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {isUpdate ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  {isUpdate ? 'Update Quiz' : 'Create Quiz'}
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default QuizForm;