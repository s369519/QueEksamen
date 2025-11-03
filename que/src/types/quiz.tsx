import { Question } from "./question";

export interface Quiz {
    quizId?: number;
    name: string;
    description: string;
    category: string;
    difficulty: string;
    timeLimit: number;
    isPublic: boolean;
    ownerId?: string;
    questions?: Question[];
}