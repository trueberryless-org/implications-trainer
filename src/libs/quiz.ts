import quizData from "../data/quiz-templates.json";
import de from "../i18n/de.json";
import en from "../i18n/en.json";
import type { Language } from "./language";
import { type Random, pickRandom, shuffle } from "./random";

type QuantifierType = "all" | "none" | "some" | "some_none" | "unknown";

type Variable = "X" | "Y" | "Z";

interface Statement {
  object: Variable;
  subject: Variable;
  type: Exclude<QuantifierType, "unknown">;
}

export interface Conclusion {
  object: Variable;
  subject: Variable;
  type: QuantifierType;
}

export interface QuizItem {
  correct: Conclusion[];
  statements: [Statement, Statement];
}

interface Answer {
  isCorrect: boolean;
  sentence: string;
}

export interface Quiz {
  answers: Answer[];
  baseSentences: string[];
}

const QUANTIFIER_TYPES: QuantifierType[] = [
  "all",
  "none",
  "some",
  "some_none",
  "unknown",
];

const VARIABLES: Variable[] = ["X", "Y", "Z"];

const MULTI_CHOICE_ANSWER_COUNT = 6;

const LOCALES = { de, en };

const QUIZ_ITEMS = quizData.data as QuizItem[];

export function fillTemplate(
  template: string,
  subject: string,
  object: string
) {
  return template.replace("{sub}", subject).replace("{obj}", object);
}

function getConclusionKey({ object, subject, type }: Conclusion) {
  return `${type}:${subject}->${object}`;
}

function createSentenceWriter(language: Language, random: Random) {
  const { templates, terms } = LOCALES[language];
  const [x, y, z] = shuffle(terms, random) as [string, string, string];
  const termsByVariable: Record<Variable, string> = { X: x, Y: y, Z: z };

  return (type: QuantifierType, subject: Variable, object: Variable) =>
    fillTemplate(
      templates[type],
      termsByVariable[subject],
      termsByVariable[object]
    );
}

export function generateQuiz(
  language: Language,
  random: Random = Math.random
): Quiz {
  const write = createSentenceWriter(language, random);
  const item = pickRandom(QUIZ_ITEMS, random);
  const conclusion = pickRandom(item.correct, random);

  const baseSentences = item.statements.map(({ object, subject, type }) =>
    write(type, subject, object)
  );

  const answers = QUANTIFIER_TYPES.map((type) => ({
    isCorrect: type === conclusion.type,
    sentence: write(type, conclusion.subject, conclusion.object),
    type,
  }));

  const unknownAnswers = answers.filter(({ type }) => type === "unknown");
  const otherAnswers = shuffle(
    answers.filter(({ type }) => type !== "unknown"),
    random
  );

  return {
    answers: [...otherAnswers, ...unknownAnswers].map(
      ({ isCorrect, sentence }) => ({ isCorrect, sentence })
    ),
    baseSentences,
  };
}

function deriveConclusions({
  object,
  subject,
  type,
}: Conclusion): Conclusion[] {
  switch (type) {
    case "all": {
      return [
        { object, subject, type: "some" },
        { object: subject, subject: object, type: "some" },
      ];
    }
    case "some": {
      return [{ object: subject, subject: object, type: "some" }];
    }
    case "none": {
      return [
        { object: subject, subject: object, type: "none" },
        { object, subject, type: "some_none" },
        { object: subject, subject: object, type: "some_none" },
      ];
    }
    default: {
      return [];
    }
  }
}

export function expandCorrectConclusions(item: QuizItem) {
  const derived = [
    ...item.correct,
    ...item.statements.flatMap((statement) => deriveConclusions(statement)),
    ...item.correct.flatMap((conclusion) => deriveConclusions(conclusion)),
  ];

  return [
    ...new Map(
      derived.map((conclusion) => [getConclusionKey(conclusion), conclusion])
    ).values(),
  ];
}

function isUsableForMultiChoice(item: QuizItem) {
  const conclusions = expandCorrectConclusions(item);

  return (
    conclusions.length > 0 &&
    !conclusions.every(({ type }) => type === "unknown")
  );
}

function isConclusionCorrect(
  candidate: Conclusion,
  correctConclusions: Conclusion[]
) {
  return correctConclusions.some(
    (correct) =>
      correct.type === candidate.type &&
      ((correct.subject === candidate.subject &&
        correct.object === candidate.object) ||
        (correct.type === "some" &&
          correct.subject === candidate.object &&
          correct.object === candidate.subject))
  );
}

export function generateMultiChoiceQuiz(
  language: Language,
  random: Random = Math.random
): Quiz {
  const write = createSentenceWriter(language, random);
  const item = pickRandom(QUIZ_ITEMS.filter(isUsableForMultiChoice), random);
  const correctConclusions = expandCorrectConclusions(item);
  const statementKeys = new Set(
    item.statements.map((statement) => getConclusionKey(statement))
  );

  const baseSentences = item.statements.map(({ object, subject, type }) =>
    write(type, subject, object)
  );

  const candidates = QUANTIFIER_TYPES.filter(
    (type) => type !== "unknown"
  ).flatMap((type) =>
    VARIABLES.flatMap((subject) =>
      VARIABLES.filter((object) => object !== subject).map(
        (object): Conclusion => ({ object, subject, type })
      )
    ).filter((candidate) => !statementKeys.has(getConclusionKey(candidate)))
  );

  const possibleAnswers = candidates.map((candidate) => ({
    isCorrect: isConclusionCorrect(candidate, correctConclusions),
    sentence: write(candidate.type, candidate.subject, candidate.object),
  }));

  const uniqueAnswers = shuffle(possibleAnswers, random).filter(
    (answer, index, all) =>
      all.findIndex(({ sentence }) => sentence === answer.sentence) === index
  );

  const answers = ensureCorrectAnswer(
    uniqueAnswers.slice(0, MULTI_CHOICE_ANSWER_COUNT),
    uniqueAnswers,
    random
  );

  return { answers, baseSentences };
}

export function ensureCorrectAnswer(
  selected: Answer[],
  pool: Answer[],
  random: Random = Math.random
) {
  const correctAnswer = pool.find(({ isCorrect }) => isCorrect);

  if (!correctAnswer || selected.some(({ isCorrect }) => isCorrect)) {
    return selected;
  }

  return shuffle([...selected.slice(0, -1), correctAnswer], random);
}
