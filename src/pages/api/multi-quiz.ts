// src/pages/api/multi-quiz.ts
import type { APIRoute } from "astro";
import quizData from "../../data/quiz-templates.json";

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

const allTypes: QuantifierType[] = ["all", "none", "some", "some_none", "unknown"];

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

// Load localized terms and templates
import de from "../../i18n/de.json";
import en from "../../i18n/en.json";

const termsMap = {
  de: de.terms,
  en: en.terms,
};

const templates = {
  de: de.templates,
  en: en.templates,
};

function generateMultiQuiz(lang: "de" | "en") {
  const t = templates[lang];
  const terms = shuffle([...termsMap[lang]]);

  const termMap: Record<"X" | "Y" | "Z", string> = {
    X: terms[0],
    Y: terms[1],
    Z: terms[2],
  };

  const mapVarsToTerms = (v: "X" | "Y" | "Z") => termMap[v];

  function expandCorrectAnswers(item: QuizItem): Conclusion[] {
    const derived: Conclusion[] = [...item.correct];

    for (const stmt of item.statements) {
      const { type, subject, object } = stmt;

      if (type === "all") {
        derived.push({ type: "some", subject, object });
        derived.push({ type: "some", subject: object, object: subject });
      }

      if (type === "some") {
        derived.push({ type: "some", subject: object, object: subject });
      }

      if (type === "none") {
        derived.push({ type: "none", subject: object, object: subject });
      }
    }

    // filter duplicates
    const unique = new Map<string, Conclusion>();
    for (const c of derived) {
      const key = `${c.type}:${c.subject}->${c.object}`;
      unique.set(key, c);
    }

    return [...unique.values()];
  }

  function isValid(item: QuizItem) {
    const expanded = expandCorrectAnswers(item);
    return expanded.length > 0 && !expanded.every((c) => c.type === "unknown");
  }

  let item: QuizItem;
  do {
    item = getRandomElement(quizData.data);
  } while (!isValid(item));

  const baseSentences = item.statements.map((s) =>
    t[s.type].replace("{sub}", mapVarsToTerms(s.subject)).replace("{obj}", mapVarsToTerms(s.object))
  );

  const correctAnswers = expandCorrectAnswers(item);

  const baseKeys = new Set(item.statements.map((s) => `${s.type}:${s.subject}->${s.object}`));

  const possibleAnswers = allTypes.flatMap((type) => {
    if (type === "unknown") return [];

    const candidates: Conclusion[] = [];

    for (const s of ["X", "Y", "Z"] as const) {
      for (const o of ["X", "Y", "Z"] as const) {
        if (s !== o) {
          const key = `${type}:${s}->${o}`;
          if (!baseKeys.has(key)) {
            candidates.push({ type, subject: s, object: o });
          }
        }
      }
    }

    return candidates.map((c) => {
      const sentence = t[type].replace("{sub}", mapVarsToTerms(c.subject)).replace("{obj}", mapVarsToTerms(c.object));
      const isCorrect = correctAnswers.some(
        (correct) =>
          correct.type === c.type &&
          ((correct.subject === c.subject && correct.object === c.object) ||
            (correct.subject === c.object && correct.object === c.subject && correct.type === "some"))
      );
      return { sentence, isCorrect };
    });
  });

  const answers = shuffle(possibleAnswers).filter((a, i, arr) => arr.findIndex((b) => b.sentence === a.sentence) === i);
  const finalAnswers = answers.slice(0, 6); // or however many you want to display

  // Ensure at least one correct in final set
  if (!finalAnswers.some((a) => a.isCorrect)) {
    const correct = shuffle(answers.filter((a) => a.isCorrect));
    finalAnswers.pop();
    finalAnswers.push(correct[0]);
    shuffle(finalAnswers);
  }

  return {
    baseSentences,
    answers: finalAnswers,
  };
}

export const GET: APIRoute = async ({ url, request }) => {
  try {
    // Get language from query parameter, default to 'en'
    const lang = (url.searchParams.get("lang") as "de" | "en") || "en";

    // Validate language
    if (!["de", "en"].includes(lang)) {
      return new Response(JSON.stringify({ error: "Invalid language. Supported: de, en" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const quiz = generateMultiQuiz(lang);

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
    console.error("Error generating multi-choice quiz:", error);
    return new Response(JSON.stringify({ error: "Failed to generate multi-choice quiz" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
