export type Random = () => number;

export function shuffle<T>(items: readonly T[], random: Random = Math.random) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = shuffled[index] as T;

    shuffled[index] = shuffled[swapIndex] as T;
    shuffled[swapIndex] = current;
  }

  return shuffled;
}

export function pickRandom<T>(
  items: readonly T[],
  random: Random = Math.random
) {
  return items[Math.floor(random() * items.length)] as T;
}
