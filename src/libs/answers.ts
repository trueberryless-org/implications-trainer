export type AnswerStatus = "correct" | "incorrect" | "neutral";

export function getAnswerStatus({
  isCorrect,
  isSelected,
}: {
  isCorrect: boolean;
  isSelected: boolean;
}): AnswerStatus {
  if (isCorrect) {
    return "correct";
  }

  return isSelected ? "incorrect" : "neutral";
}
