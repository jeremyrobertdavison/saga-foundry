export const ATTRIBUTE_KEYS = ['general', 'arcana', 'technology', 'body', 'mind', 'mutation'] as const;
export type AttributeName = typeof ATTRIBUTE_KEYS[number];

export const ATTRIBUTE_LABELS: Record<AttributeName, string> = {
  general: 'General',
  arcana: 'Arcana',
  technology: 'Technology',
  body: 'Body',
  mind: 'Mind',
  mutation: 'Mutation',
};

export const ATTRIBUTE_OPTIONS: { value: AttributeName; label: string }[] = ATTRIBUTE_KEYS.map(key => ({
  value: key,
  label: ATTRIBUTE_LABELS[key],
}));

export function getDieForPoints(points: number): string {
  const p = Math.max(0, points); // Ensure points are not negative for calculation
  if (p === 0) return "1d4";
  if (p >= 1 && p <= 2) return "1d6";
  if (p >= 3 && p <= 4) return "1d8";
  if (p >= 5 && p <= 6) return "1d10";
  if (p >= 7 && p <= 11) return "1d12"; // Changed from p <= 12
  if (p >= 12) return "1d20";         // Changed from p > 12
  return "1d4"; // Default for 0 or unexpected values.
}