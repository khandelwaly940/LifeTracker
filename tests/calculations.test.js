import test from "node:test";
import assert from "node:assert/strict";
import { calculateFinance } from "../src/features/finance.js";
import {
  calculateCalories,
  calculateFitness,
  activityLevels,
} from "../src/features/fitness.js";
import { sanitizeState, defaults } from "../src/storage.js";

const profile = {
  weight: "70",
  height: "175",
  age: "30",
  sex: "male",
  activity: "moderate",
  goal: "maintenance",
  pregnancy: false,
};
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≠ ${expected}`);

test("finance targets remain unchanged", () => {
  assert.deepEqual(calculateFinance(100000), {
    independence: 39600000,
    emergency: 396000,
    investment: 20000,
    rent: 25000,
    emi: 20000,
  });
  assert.equal(calculateFinance(100000, true).emi, 36000);
  for (const value of [0, -1, NaN, Infinity])
    assert.equal(calculateFinance(value), null);
});
test("independently calculated male and female resting/maintenance examples", () => {
  const male = calculateCalories(profile);
  close(male.resting, 1648.75);
  close(male.maintenance, 2555.5625);
  close(male.calories, 2555.5625);
  const female = calculateCalories({
    ...profile,
    weight: "60",
    height: "165",
    age: "35",
    sex: "female",
    activity: "light",
  });
  close(female.resting, 1295.25);
  close(female.maintenance, 1780.96875);
});
test("every goal uses activity independently; no extra exercise calories", () => {
  for (const [activity, { factor }] of Object.entries(activityLevels)) {
    for (const [goal, adjustment] of [
      ["fat-loss", -500],
      ["maintenance", 0],
      ["muscle-gain", 300],
    ]) {
      const result = calculateCalories({
        ...profile,
        weight: "90",
        activity,
        goal,
      });
      close(result.maintenance, 1848.75 * factor);
      close(result.calories, 1848.75 * factor + adjustment);
    }
  }
});
test("missing, invalid, out-of-range inputs never produce calorie targets", () => {
  for (const field of ["weight", "height", "age", "sex", "activity", "goal"]) {
    assert.equal(
      calculateCalories({ ...profile, [field]: "" }).calories,
      null,
      field,
    );
  }
  for (const [field, values] of Object.entries({
    weight: [0, -1, 501, NaN, Infinity],
    height: [99, 251],
    age: [17, 101, 30.5],
    sex: ["unknown"],
    activity: ["unknown"],
    goal: ["unknown"],
  })) {
    for (const value of values)
      assert.equal(
        calculateCalories({ ...profile, [field]: value }).calories,
        null,
        `${field}=${value}`,
      );
  }
});
test("fat-loss limits are explicit and never accidentally prescribe a surplus", () => {
  const limited = calculateCalories({
    ...profile,
    sex: "female",
    weight: "60",
    height: "165",
    age: "35",
    activity: "sedentary",
    goal: "fat-loss",
  });
  assert.equal(limited.calories, 1200);
  assert.ok(limited.message.includes("Deficit reduced"));
  assert.ok(limited.adjustment < 0);
  const veryLow = calculateCalories({
    ...profile,
    sex: "female",
    weight: "45",
    height: "140",
    age: "90",
    activity: "sedentary",
    goal: "fat-loss",
  });
  assert.equal(veryLow.calories, null);
  const underweight = calculateCalories({
    ...profile,
    weight: "45",
    goal: "fat-loss",
  });
  assert.equal(underweight.calories, null);
  assert.ok(underweight.message.includes("BMI"));
  const pregnancy = calculateCalories({ ...profile, pregnancy: true });
  assert.equal(pregnancy.calories, null);
  assert.equal(pregnancy.maintenance, null);
});
test("other fitness metrics have correct units and missing-data behavior", () => {
  const result = calculateFitness(profile);
  assert.equal(result.steps, 7000);
  assert.deepEqual(result.protein, [112, 154]);
  assert.equal(result.water, 3.7);
  assert.equal(calculateFitness({ ...profile, sex: "female" }).water, 2.7);
  assert.equal(calculateFitness({ ...profile, pregnancy: true }).water, null);
  const empty = calculateFitness(defaults().fitness);
  assert.equal(empty.calories, null);
  assert.equal(empty.steps, null);
  assert.equal(empty.protein, null);
  assert.equal(empty.water, null);
  assert.deepEqual(empty.movement, [150, 300]);
});
test("new state round trips and malformed/unknown schemas reset safely", () => {
  const state = { ...defaults(), fitness: profile };
  assert.deepEqual(sanitizeState(state), state);
  for (const data of [null, [], { version: 999 }])
    assert.deepEqual(sanitizeState(data), defaults());
  const bad = sanitizeState({
    version: 2,
    fitness: {
      weight: "Infinity",
      age: "17",
      height: "999",
      sex: "other",
      activity: "hack",
      goal: "hack",
    },
  });
  assert.deepEqual(bad, defaults());
});
test("v1 migration preserves finances, weight and goal without assuming new fields", () => {
  const old = {
    version: 1,
    tab: "fitness",
    finance: { salary: "100000", period: "monthly", homeLoan: true },
    fitness: { weight: "70", goal: "muscle-gain", activity: "sedentary" },
  };
  const migrated = sanitizeState(old);
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.finance, old.finance);
  assert.equal(migrated.fitness.weight, "70");
  assert.equal(migrated.fitness.goal, "muscle-gain");
  assert.equal(migrated.fitness.activity, "");
  assert.equal(migrated.fitness.sex, "");
  assert.equal(calculateCalories(migrated.fitness).calories, null);
  assert.equal(
    sanitizeState({
      ...old,
      fitness: { ...old.fitness, goal: "maintenance", activity: "moderate" },
    }).fitness.activity,
    "moderate",
  );
});
