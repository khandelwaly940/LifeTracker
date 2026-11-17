import test from "node:test";
import assert from "node:assert/strict";
import { calculateFinance } from "../src/features/finance.js";
import { calculateFitness } from "../src/features/fitness.js";
import { sanitizeState, defaults } from "../src/storage.js";

test("finance targets for ₹1 lakh per month, with both loan scenarios", () => {
  assert.deepEqual(calculateFinance(100000), {
    independence: 39600000,
    emergency: 396000,
    investment: 20000,
    rent: 25000,
    emi: 20000,
  });
  assert.equal(calculateFinance(100000, true).emi, 36000);
});
test("fitness targets for 70 kg preserve fractional weekly estimates", () => {
  const result = calculateFitness(70);
  assert.equal(result.steps, 7000);
  assert.deepEqual(result.calories, [1540, 1750]);
  assert.deepEqual(result.protein, [112, 154]);
  assert.equal(result.water, 2.8);
  assert.ok(Math.abs(result.loss[0] - 0.35) < 1e-10);
  assert.ok(Math.abs(result.loss[1] - 0.7) < 1e-10);
});
test("empty, negative and non-finite inputs do not generate targets", () => {
  for (const invalid of [0, -1, NaN, Infinity, undefined]) {
    assert.equal(calculateFinance(invalid), null);
    assert.equal(calculateFitness(invalid), null);
  }
});
test("stored state is validated and unknown schema versions reset safely", () => {
  assert.deepEqual(sanitizeState(null), defaults());
  assert.deepEqual(sanitizeState({ version: 999 }), defaults());
  const data = {
    version: 1,
    tab: "fitness",
    finance: { salary: "100000", period: "annual", homeLoan: true },
    fitness: { weight: "70.5", goal: "fat-loss", activity: "sedentary" },
  };
  assert.deepEqual(sanitizeState(data), data);
  const bad = sanitizeState({
    version: 1,
    tab: "evil",
    finance: { salary: "-1", homeLoan: "false" },
    fitness: { weight: "Infinity" },
  });
  assert.deepEqual(bad, defaults());
});

test("calorie ranges follow all four goal and activity combinations", () => {
  assert.deepEqual(calculateFitness(70, "fat-loss").calories, [1540, 1750]);
  assert.deepEqual(
    calculateFitness(70, "maintenance", "sedentary").calories,
    [1820, 2030],
  );
  assert.deepEqual(
    calculateFitness(70, "maintenance", "moderate").calories,
    [2100, 2310],
  );
  assert.deepEqual(calculateFitness(70, "muscle-gain").calories, [2450, 2660]);
});
test("older saved profiles retain weight and gain default goal settings", () => {
  const old = sanitizeState({ version: 1, fitness: { weight: "80" } });
  assert.deepEqual(old.fitness, {
    weight: "80",
    goal: "fat-loss",
    activity: "sedentary",
  });
  const saved = sanitizeState({
    version: 1,
    fitness: { weight: "80", goal: "maintenance", activity: "moderate" },
  });
  assert.equal(saved.fitness.goal, "maintenance");
  assert.equal(saved.fitness.activity, "moderate");
});
