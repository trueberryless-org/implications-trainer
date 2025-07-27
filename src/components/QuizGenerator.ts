import rawTemplates from "../data/quiz-templates.json";

type QuizStatement = string;
type QuizTemplate = {
  statements: [QuizStatement, QuizStatement];
  correct: QuizStatement;
};

const templates = rawTemplates.data as QuizTemplate[];
