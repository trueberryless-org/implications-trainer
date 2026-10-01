import { getAnswerStatus } from "../libs/answers";

function revealOption(
  option: HTMLElement,
  container: HTMLElement,
  isSelected: boolean
) {
  const status = getAnswerStatus({
    isCorrect: option.dataset["correct"] === "true",
    isSelected,
  });

  if (status === "neutral") {
    return;
  }

  option.dataset["status"] = status;
  option.querySelector(".option-status")!.textContent =
    status === "correct"
      ? (container.dataset["correctLabel"] ?? "")
      : (container.dataset["incorrectLabel"] ?? "");
}

function setUpSingleChoice(container: HTMLElement) {
  const options = [
    ...container.querySelectorAll<HTMLButtonElement>("button.option"),
  ];
  let isAnswered = false;

  for (const option of options) {
    option.addEventListener("click", () => {
      if (isAnswered) {
        return;
      }

      isAnswered = true;

      for (const other of options) {
        other.setAttribute("aria-disabled", "true");
        revealOption(other, container, other === option);
      }
    });
  }
}

function setUpMultiChoice(container: HTMLElement) {
  const form = container.querySelector("form")!;
  let isAnswered = false;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (isAnswered) {
      return;
    }

    isAnswered = true;

    for (const option of form.querySelectorAll<HTMLElement>("label.option")) {
      const checkbox = option.querySelector("input")!;

      checkbox.disabled = true;
      revealOption(option, container, checkbox.checked);
    }

    form.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled =
      true;
  });
}

for (const container of document.querySelectorAll<HTMLElement>("[data-quiz]")) {
  if (container.dataset["quiz"] === "multi") {
    setUpMultiChoice(container);
  } else {
    setUpSingleChoice(container);
  }
}
