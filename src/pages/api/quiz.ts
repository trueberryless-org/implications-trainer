// src/pages/api/quiz.ts
import type { APIRoute } from "astro";

import quizData from "../../data/quiz-templates.json";
// Load localized terms and templates
import de from "../../i18n/de.json";
import en from "../../i18n/en.json";

export const prerender = false;

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

const allTypes: QuantifierType[] = [
  "all",
  "none",
  "some",
  "some_none",
  "unknown",
];

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const termsMap = {
  de: de.terms,
  en: en.terms,
};

const templates = {
  de: de.templates,
  en: en.templates,
};

function generateQuiz(lang: "de" | "en") {
  const item: QuizItem = getRandomElement(quizData.data);
  const t = templates[lang];
  const terms = [...termsMap[lang]];
  shuffle(terms);

  const termMap: Record<"X" | "Y" | "Z", string> = {
    X: terms[0],
    Y: terms[1],
    Z: terms[2],
  };

  const mapVarsToTerms = (v: "X" | "Y" | "Z") => termMap[v];

  const baseSentences = item.statements.map((s) =>
    t[s.type]
      .replace("{sub}", mapVarsToTerms(s.subject))
      .replace("{obj}", mapVarsToTerms(s.object))
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
  const finalAnswers = unknownAnswer
    ? [...otherAnswers, unknownAnswer]
    : otherAnswers;

  return {
    baseSentences,
    answers: finalAnswers.map(({ sentence, isCorrect }) => ({
      sentence,
      isCorrect,
    })),
  };
}

export const GET: APIRoute = async ({ url, request }) => {
  try {
    // Get language from query parameter, default to 'en'
    const lang = (url.searchParams.get("lang") as "de" | "en") || "en";

    // Validate language
    if (!["de", "en"].includes(lang)) {
      return new Response(
        JSON.stringify({ error: "Invalid language. Supported: de, en" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const quiz = generateQuiz(lang);

    return new Response(JSON.stringify(quiz), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return new Response(JSON.stringify({ error: "Failed to generate quiz" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
