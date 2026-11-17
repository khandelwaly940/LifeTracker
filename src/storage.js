import {
  fitnessGoals,
  activityLevels,
  validFitnessNumber,
} from "./features/fitness.js";

// Versioned, namespaced persistence. Add migrations here when the schema changes.
export const STORAGE_KEY = "lifetracker:state";
export const defaults = () => ({
  version: 2,
  tab: "finance",
  finance: { salary: "", period: "monthly", homeLoan: false },
  fitness: {
    weight: "",
    height: "",
    age: "",
    sex: "",
    goal: "maintenance",
    activity: "",
    pregnancy: false,
  },
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
  if (![1, 2].includes(data?.version)) return clean;
  clean.tab = data.tab === "fitness" ? "fitness" : "finance";
  if (validInput(data.finance?.salary, 1e10))
    clean.finance.salary = data.finance.salary;
  clean.finance.period =
    data.finance?.period === "annual" ? "annual" : "monthly";
  clean.finance.homeLoan = data.finance?.homeLoan === true;
  for (const key of ["weight", "height", "age"]) {
    if (
      typeof data.fitness?.[key] === "string" &&
      validFitnessNumber(data.fitness[key], key)
    )
      clean.fitness[key] = data.fitness[key];
  }
  if (Object.hasOwn(fitnessGoals, data.fitness?.goal))
    clean.fitness.goal = data.fitness.goal;
  // V1 only asked maintenance users for activity; other goals had implicit assumptions.
  if (
    (data.version === 2 || data.fitness?.goal === "maintenance") &&
    Object.hasOwn(activityLevels, data.fitness?.activity)
  )
    clean.fitness.activity = data.fitness.activity;
  if (["male", "female"].includes(data.fitness?.sex))
    clean.fitness.sex = data.fitness.sex;
  clean.fitness.pregnancy = data.fitness?.pregnancy === true;
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
