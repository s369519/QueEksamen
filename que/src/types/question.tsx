import { Option } from "./option";

export interface Question {
    text: string;
    options: Option[];
    allowMultiple?: boolean;
}