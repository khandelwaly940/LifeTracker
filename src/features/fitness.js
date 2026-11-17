// Mifflin–St Jeor (1990), PMID 2305711. Activity factors are a separate
// conventional approximation, not part of the original resting-energy equation.
export const fitnessGoals = {
  "fat-loss": { label: "Fat loss", adjustment: -500 },
  maintenance: { label: "Maintenance", adjustment: 0 },
  "muscle-gain": { label: "Muscle gain", adjustment: 300 },
};
export const activityLevels = {
  sedentary: {
    factor: 1.2,
    description: "Mostly sitting; little or no exercise.",
  },
  light: { factor: 1.375, description: "Light exercise 1–3 days a week." },
  moderate: { factor: 1.55, description: "Moderate exercise 3–5 days a week." },
  very: { factor: 1.725, description: "Hard exercise 6–7 days a week." },
  extra: {
    factor: 1.9,
    description: "Very hard training plus a physically demanding job.",
  },
};
export const fitnessLimits = {
  weight: { min: 20, max: 500 },
  height: { min: 100, max: 250 },
  age: { min: 18, max: 100, integer: true },
};
export function validFitnessNumber(value, field) {
  if (value === "" || value == null || typeof value === "boolean") return false;
  const n = Number(value),
    limit = fitnessLimits[field];
  return (
    Number.isFinite(n) &&
    n >= limit.min &&
    n <= limit.max &&
    (!limit.integer || Number.isInteger(n))
  );
}
export function calculateCalories(profile) {
  const { weight, height, age, sex, activity, goal } = profile;
  if (
    !["weight", "height", "age"].every((key) =>
      validFitnessNumber(profile[key], key),
    ) ||
    !["male", "female"].includes(sex) ||
    !Object.hasOwn(activityLevels, activity) ||
    !Object.hasOwn(fitnessGoals, goal)
  ) {
    return {
      calories: null,
      resting: null,
      maintenance: null,
      adjustment: null,
      message:
        "Add weight, height, age, sex and activity to calculate your calories.",
    };
  }
  const resting =
    10 * Number(weight) +
    6.25 * Number(height) -
    5 * Number(age) +
    (sex === "male" ? 5 : -161);
  if (resting <= 0)
    return {
      calories: null,
      resting: null,
      maintenance: null,
      adjustment: null,
      message:
        "Check your measurements; this profile is outside the model’s usable range.",
    };
  const maintenance = resting * activityLevels[activity].factor;
  const base = {
    resting,
    maintenance,
    calories: null,
    adjustment: null,
    message: "",
  };
  if (profile.pregnancy === true)
    return {
      ...base,
      resting: null,
      maintenance: null,
      message:
        "Pregnancy and breastfeeding need a different calorie plan. Ask a dietitian or clinician for an individual target.",
    };
  if (
    goal === "fat-loss" &&
    Number(weight) / (Number(height) / 100) ** 2 < 18.5
  ) {
    return {
      ...base,
      message:
        "A fat-loss target is not shown for a BMI below 18.5. Choose maintenance and discuss weight goals with a clinician.",
    };
  }
  const adjustment = fitnessGoals[goal].adjustment;
  const floor = sex === "male" ? 1500 : 1200;
  const requested = maintenance + adjustment;
  // These are conservative app guardrails, not universal safe intake thresholds.
  if (goal === "fat-loss" && maintenance <= floor)
    return {
      ...base,
      message:
        "This estimate is too low for an automatic calorie deficit. Seek an individual target from a dietitian.",
    };
  const calories = goal === "fat-loss" ? Math.max(requested, floor) : requested;
  return {
    ...base,
    calories,
    adjustment: calories - maintenance,
    message:
      calories !== requested
        ? `Deficit reduced to keep this estimate at ${floor.toLocaleString("en-IN")} kcal/day. This limit does not establish your individual needs.`
        : "",
  };
}
export function calculateFitness(profile) {
  const energy = calculateCalories(profile);
  const validWeight = validFitnessNumber(profile.weight, "weight");
  const weight = Number(profile.weight);
  return {
    ...energy,
    steps: validWeight ? weight * 100 : null,
    protein: validWeight ? [weight * 1.6, weight * 2.2] : null,
    water: profile.pregnancy
      ? null
      : profile.sex === "male"
        ? 3.7
        : profile.sex === "female"
          ? 2.7
          : null,
    movement: [150, 300],
  };
}
export const fitnessMetrics = [
  {
    key: "calories",
    title: "Your daily calorie estimate",
    formula: (state) => {
      const result = calculateCalories(state.fitness);
      if (result.calories === null) return "Mifflin–St Jeor → activity → goal";
      const adjustment = Math.round(result.adjustment);
      return adjustment === 0
        ? "Estimated maintenance calories"
        : `Maintenance ${adjustment < 0 ? "−" : "+"} ${Math.abs(adjustment).toLocaleString("en-IN")} kcal`;
    },
    detail:
      "A starting estimate. Review against your weight trend over 2–4 weeks.",
    hero: true,
    format: "integer",
    unit: "kcal / day",
    badge: "FUEL YOUR GOAL",
  },
  {
    key: "resting",
    title: "Resting energy",
    formula: "10 × kg + 6.25 × cm − 5 × age + sex term",
    detail: "Energy at rest; not your daily food target.",
    format: "integer",
    unit: "kcal",
    icon: "◉",
    tag: "PER DAY",
  },
  {
    key: "maintenance",
    title: "Maintenance estimate",
    formula: (state) =>
      activityLevels[state.fitness.activity]
        ? `Resting energy × ${activityLevels[state.fitness.activity].factor}`
        : "Resting energy × activity factor",
    detail: "Includes daily activity and exercise.",
    format: "integer",
    unit: "kcal",
    icon: "≋",
    tag: "PER DAY",
  },
  {
    key: "protein",
    title: "Training protein",
    formula: "Body weight × 1.6–2.2 g",
    detail: "A range for adults doing resistance training.",
    format: "decimal",
    unit: "g",
    icon: "↗",
    tag: "PER DAY",
  },
  {
    key: "water",
    title: "Total water reference",
    formula: "Adult reference: female 2.7 L / male 3.7 L",
    detail: "Includes food and all drinks. Needs vary with heat and activity.",
    format: "decimal",
    unit: "litres",
    icon: "◉",
    tag: "PER DAY",
  },
  {
    key: "steps",
    title: "Walking goal",
    formula: "Your original rule: body weight × 100",
    detail: "A personal rule of thumb, not a clinical requirement.",
    format: "integer",
    unit: "steps",
    icon: "↗",
    tag: "PER DAY",
  },
  {
    key: "movement",
    title: "Moderate activity",
    formula: "Adult physical activity guidance",
    detail: "Plus strength training on at least 2 days a week.",
    format: "integer",
    unit: "min",
    icon: "♡",
    tag: "PER WEEK",
  },
];
