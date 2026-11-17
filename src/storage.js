import { fitnessGoals } from "./features/fitness.js";

// Versioned, namespaced persistence. Add migrations here when the schema changes.
export const STORAGE_KEY = "lifetracker:state";
export const defaults = () => ({
  version: 1,
  tab: "finance",
  finance: { salary: "", period: "monthly", homeLoan: false },
  fitness: { weight: "", goal: "fat-loss", activity: "sedentary" },
});
function validInput(value, max) {
  return (
    value === "" ||
    (typeof value === "string" &&
      Number.isFinite(Number(value)) &&
      Number(value) > 0 &&
      Number(value) <= max)
  );
}
export function sanitizeState(data) {
  const clean = defaults();
  if (data?.version !== 1) return clean;
  clean.tab = data.tab === "fitness" ? "fitness" : "finance";
  if (validInput(data.finance?.salary, 1e10))
    clean.finance.salary = data.finance.salary;
  clean.finance.period =
    data.finance?.period === "annual" ? "annual" : "monthly";
  clean.finance.homeLoan = data.finance?.homeLoan === true;
  if (validInput(data.fitness?.weight, 500))
    clean.fitness.weight = data.fitness.weight;
  if (Object.hasOwn(fitnessGoals, data.fitness?.goal))
    clean.fitness.goal = data.fitness.goal;
  clean.fitness.activity =
    data.fitness?.activity === "moderate" ? "moderate" : "sedentary";
  return clean;
}
export function loadState() {
  try {
    return {
      state: sanitizeState(JSON.parse(localStorage.getItem(STORAGE_KEY))),
      available: true,
    };
  } catch {
    return { state: defaults(), available: false };
  }
}
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
