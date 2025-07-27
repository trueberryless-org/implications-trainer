// QuizGenerator.ts
import quizData from "../data/quiz-templates.json";
import type { APIContext } from "astro";

export type QuantifierType = "all" | "none" | "some" | "some_none" | "unknown";

export type Statement = {
  type: Exclude<QuantifierType, "unknown">;
  subject: "X" | "Y" | "Z";
  object: "X" | "Y" | "Z";
};

export type Conclusion = {
  type: QuantifierType;
  subject: "X" | "Y" | "Z";
  object: "X" | "Y" | "Z";
};

export type QuizItem = {
  statements: [Statement, Statement];
  correct: Conclusion[];
};

const allTypes: QuantifierType[] = ["all", "none", "some", "some_none", "unknown"];

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Load localized terms and templates
import de from "../i18n/de.json";
import en from "../i18n/en.json";
import type { ui } from "../i18n/ui";

const termsMap = {
  de: de.terms,
  en: en.terms,
};

const templates = {
  de: de.templates,
  en: en.templates,
};

export function generateQuiz(lang: keyof typeof ui) {
  const item: QuizItem = getRandomElement(quizData.data);
  const t = templates[lang as keyof typeof templates];
  const terms = [...termsMap[lang as keyof typeof termsMap]];
  shuffle(terms);

  const termMap: Record<"X" | "Y" | "Z", string> = {
    X: terms[0],
    Y: terms[1],
    Z: terms[2],
  };

  const mapVarsToTerms = (v: "X" | "Y" | "Z") => termMap[v];

  const baseSentences = item.statements.map((s) =>
    t[s.type].replace("{sub}", mapVarsToTerms(s.subject)).replace("{obj}", mapVarsToTerms(s.object))
  );

  const correct = getRandomElement(item.correct);
  const subj = mapVarsToTerms(correct.subject);
  const obj = mapVarsToTerms(correct.object);

  const answers = allTypes.map((type) => ({
    type,
    sentence: t[type].replace("{sub}", subj).replace("{obj}", obj),
    isCorrect: type === correct.type,
  }));

  // unknown-Antwort extrahieren
  const unknownAnswer = answers.find((a) => a.type === "unknown");
  // alle anderen mischen
  const otherAnswers = shuffle(answers.filter((a) => a.type !== "unknown"));

  // unknown am Ende anhängen (wenn vorhanden)
  const finalAnswers = unknownAnswer ? [...otherAnswers, unknownAnswer] : otherAnswers;

  return {
    baseSentences,
    answers: finalAnswers.map(({ sentence, isCorrect }) => ({ sentence, isCorrect })),
  };
}
