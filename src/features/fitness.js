export function calculateFitness(weight) {
  if (!Number.isFinite(weight) || weight <= 0) return null;
  return { steps: weight * 100, calories: [weight * 22, weight * 24], protein: [weight * 1.6, weight * 2.2], water: weight * 40 / 1000, loss: [weight * 0.005, weight * 0.01] };
}
export const fitnessMetrics = [
  { key: 'steps', title: 'A little movement, every day', formula: 'Body weight × 100 steps', detail: 'One walk at a time. It all adds up.', hero: true, format: 'integer', unit: 'steps / day', badge: 'KEEP MOVING' },
  { key: 'calories', title: 'Daily calories', formula: 'Body weight × 22–24 kcal', detail: 'An estimate of your daily intake.', format: 'integer', unit: 'kcal', icon: '☀', tag: 'PER DAY' },
  { key: 'protein', title: 'Protein range', formula: 'Body weight × 1.6–2.2 g', detail: 'Support your strength and recovery.', format: 'decimal', unit: 'g', icon: '↗', tag: 'PER DAY' },
  { key: 'water', title: 'Water estimate', formula: 'Body weight × 40 mL', detail: 'Make hydration part of your routine.', format: 'decimal', unit: 'litres', icon: '◉', tag: 'PER DAY' },
  { key: 'loss', title: 'Weight-loss estimate', formula: 'Body weight × 0.5–1%', detail: 'A weekly range, not a daily race.', format: 'decimal', unit: 'kg', icon: '↘', tag: 'PER WEEK' },
];
