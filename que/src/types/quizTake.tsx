export interface QuizTake {
    quizId: number;
    quizName: string;
    totalQuestions: number;
    timeLimit: number;
    questions: QuestionTake[];
}

export interface QuestionTake {
    questionId: number;
    text: string;
    allowMultiple: boolean;
    options: OptionTake[];
}

export interface OptionTake {
    optionId: number;
    text: string;
    isCorrect?: boolean;
}

export interface AnswerResult {
    isCorrect: boolean;
    scoreValue: number;
    isPartiallyCorrect: boolean;
}
