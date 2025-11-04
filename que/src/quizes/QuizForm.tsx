import React, { useState } from 'react';
import { Button, Form, Card, Row, Col } from 'react-bootstrap';
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
}

const QuizForm: React.FC<QuizFormProps> = ({
  onQuizChanged,
  quizId,
  isUpdate = false,
  initialData
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || '');
  const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 10);
  const [questions, setQuestions] = useState<Question[]>(initialData?.questions || [] );
  const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);
  const [nameError, setNameError] = useState('');
  const [timeLimitError, setTimeLimitError] = useState<string>('');

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
    const defaultOptions = Array(4).fill(null).map(() => ({ text: '', isCorrect: false}));
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

    // Ensure we have valid defaults for required fields
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

    console.log('Submitting quiz:', quiz); // Add logging
    onQuizChanged(quiz);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <h4>Quiz Information</h4>

      <Row className="mb-3">
        <Col>
            <Form.Group controlId="quizName">
            <Form.Label>Name</Form.Label>
            <Form.Control
                type="text"
                placeholder="Enter quiz name"
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    validateName(e.target.value);
                }}
                required
            />
            { nameError && <div className='text-danger mt-1'>{nameError}</div>}
            </Form.Group>
        </Col>

        <Col>
            <Form.Group controlId="quizCategory">
            <Form.Label>Category</Form.Label>
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
            <Form.Label>Description</Form.Label>
            <Form.Control
                as="textarea"
                rows={2}
                placeholder="Enter quiz description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            </Form.Group>
        </Col>
        </Row>

        <Row className="mb-3">
        <Col>
            <Form.Group controlId="quizDifficulty">
            <Form.Label>Difficulty</Form.Label>
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

        <Col>
            <Form.Group controlId="quizTimeLimit">
            <Form.Label>Time Limit (Minutes)</Form.Label>
            <Form.Control
                type="number"
                min="1"
                max="100"
                value={timeLimit}
                onChange={handleTimeLimitChange}
                isInvalid={!!timeLimitError}
                required
            />
            </Form.Group>
        </Col>

        <Col>
            <Form.Group controlId="quizVisibility">
            <Form.Label>Quiz Visibility</Form.Label>
            <Form.Check
                type="switch"
                id="visibility-switch"
                label={isPublic ? "Public - visible to everyone" : "Private - only visible to you"}
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
            />
            </Form.Group>
        </Col>
        </Row>

      <hr />
      <h4>Questions</h4>

      {questions.map((question, qIndex) => (
        <Card key={qIndex} className="mb-3 p-3">
          <Form.Group className="mb-2">
            <Form.Label>Question {qIndex + 1}</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter question text"
              value={question.text}
              onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
              required
            />
          </Form.Group>

          <Form.Check
            type="switch"
            label="Allow multiple answers"
            checked={question.allowMultiple || false}
            onChange={(e) => {
                const updated = [...questions];
                updated[qIndex].allowMultiple = e.target.checked;

                // Hvis vi slår av "allow multiple", behold kun første korrekt svar
                if (!e.target.checked) {
                let firstCorrectFound = false;
                updated[qIndex].options = updated[qIndex].options.map(opt => {
                    if (opt.isCorrect) {
                    if (!firstCorrectFound) {
                        firstCorrectFound = true;
                        return opt; // behold første korrekt
                    } else {
                        return { ...opt, isCorrect: false }; // fjern de andre
                    }
                    }
                    return opt;
                });
                }

                setQuestions(updated);
            }}
            />

          {question.options.map((option, oIndex) => (
            <div key={oIndex} className="d-flex align-items-center mb-2 gap-2">
              <Form.Check
                type="checkbox"
                checked={option.isCorrect}
                onChange={() => handleCorrectToggle(qIndex, oIndex)}
                label=""
              />
              <Form.Control
                type="text"
                placeholder={`Option ${oIndex + 1}`}
                value={option.text}
                onChange={(e) =>
                  handleOptionChange(qIndex, oIndex, e.target.value)
                }
                required
              />
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => removeOption(qIndex, oIndex)}
              >
                ✕
              </Button>
            </div>
          ))}

          <div className="d-flex justify-content-between mt-2">
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => addOption(qIndex)}
            >
              + Add Option
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => removeQuestion(qIndex)}
            >
              Remove Question
            </Button>
          </div>
        </Card>
      ))}

      <Button variant="outline-primary" onClick={addQuestion}>
        + Add Question
      </Button>

      <hr />
      <Button variant="primary" type="submit">
        {isUpdate ? 'Update Quiz' : 'Create Quiz'}
      </Button>
    </Form>
  );
};

export default QuizForm;