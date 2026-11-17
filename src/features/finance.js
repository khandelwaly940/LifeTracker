export function calculateFinance(monthly, homeLoan = false) {
  if (!Number.isFinite(monthly) || monthly <= 0) return null;
  const annual = monthly * 12;
  return { independence: annual * 33, emergency: annual * 0.33, investment: monthly * 0.2, rent: monthly * 0.25, emi: monthly * (homeLoan ? 0.36 : 0.2) };
}
export const financeMetrics = [
  { key: 'independence', title: 'Your financial independence target', formula: 'Annual salary × 33', detail: 'A long-term number to work towards.', hero: true, format: 'currency', badge: 'THE BIG PICTURE' },
  { key: 'emergency', title: 'Emergency fund', formula: 'Annual salary × 33%', detail: 'A buffer for life’s unexpected turns.', format: 'currency', icon: '◇', tag: 'SET ASIDE' },
  { key: 'investment', title: 'Minimum investment', formula: 'Monthly salary × 20%', detail: 'Build a habit. Let it compound.', format: 'currency', icon: '↗', tag: 'PER MONTH' },
  { key: 'rent', title: 'Rent ceiling', formula: 'Monthly salary × 25%', detail: 'Room to live, and room to save.', format: 'currency', icon: '⌂', tag: 'PER MONTH' },
  { key: 'emi', title: 'Total EMI ceiling', formula: state => `Monthly salary × ${state.finance.homeLoan ? '36' : '20'}%`, detail: 'The upper limit across all your loans.', format: 'currency', icon: '≋', tag: 'PER MONTH' },
];
