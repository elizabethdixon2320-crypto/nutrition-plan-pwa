const assert = require("node:assert/strict");
const test = require("node:test");
const { calculate } = require("../nutrition.js");

const example = {
  sex: "male",
  age: 32,
  heightCm: 180,
  currentWeight: 83,
  bodyFatPct: 25,
  formula: "auto",
  dailyActivity: "sedentary",
  trainingDays: 3,
  trainingMinutes: 60,
  goal: "lose",
};

test("auto uses the available body composition estimate and retains the other comparison", () => {
  const result = calculate(example);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  const { plan } = result;
  assert.equal(plan.method, "lean");
  assert.equal(plan.leanMassKg, 62.25);
  assert.ok(Math.abs(plan.leanKcal - 1714.6) < 1e-8);
  assert.equal(plan.mifflinKcal, 1800);
  assert.equal(plan.restingKcal, plan.leanKcal);
  assert.equal(plan.kcal, 2000);
  assert.equal(plan.deficitPct, 15);
  assert.equal(plan.trainingHours, 3);
  assert.equal(plan.protein, 166);
  assert.equal(plan.fat, 66);
  assert.ok(Math.abs(plan.protein * 4 + plan.fat * 9 + plan.carbs * 4 - plan.kcal) < 0.1);
  assert.equal(plan.source, "estimate");
  assert.equal(plan.version, 1);
});

test("an explicit Mifflin choice wins; auto without body fat uses Mifflin", () => {
  const chosen = calculate({ ...example, formula: "mifflin" }).plan;
  assert.equal(chosen.method, "mifflin");
  assert.equal(chosen.restingKcal, 1800);
  assert.equal(chosen.kcal, 2100);
  assert.ok(chosen.leanKcal > 0);

  const missingBodyFat = calculate({ ...example, sex: "female", bodyFatPct: null }).plan;
  assert.equal(missingBodyFat.method, "mifflin");
  assert.equal(missingBodyFat.restingKcal, 1634);
  assert.equal(missingBodyFat.leanKcal, null);
  assert.equal(missingBodyFat.leanMassKg, null);
});

test("training is combined with daily activity and capped; maintain has no deficit", () => {
  const plan = calculate({
    ...example, formula: "mifflin", dailyActivity: "active", trainingDays: 7, trainingMinutes: 240, goal: "maintain",
  }).plan;
  assert.equal(plan.activityFactor, 1.85);
  assert.equal(plan.trainingHours, 28);
  assert.equal(plan.deficitPct, 0);
  assert.equal(plan.maintenanceKcal, 3330);
  assert.equal(plan.kcal, 3350);

  const noTraining = calculate({ ...example, dailyActivity: "light", trainingDays: 0 }).plan;
  assert.equal(noTraining.trainingHours, 0);
  assert.equal(noTraining.activityFactor, 1.35);
});

test("invalid values fail without coercion and lean requires body fat", () => {
  const invalidFields = [
    { age: "32" }, { age: 17 }, { age: 81 }, { heightCm: Infinity }, { heightCm: 221 },
    { currentWeight: NaN }, { currentWeight: 34 }, { bodyFatPct: "" }, { bodyFatPct: 0 },
    { formula: "lean", bodyFatPct: null }, { formula: "unknown" }, { sex: "" },
    { dailyActivity: "toString" }, { dailyActivity: ["sedentary"] },
    { trainingDays: 1.5 }, { trainingDays: 8 }, { trainingMinutes: 241 }, { goal: "unknown" },
  ];
  for (const invalid of invalidFields) {
    const result = calculate({ ...example, ...invalid });
    assert.equal(result.ok, false);
    assert.ok(result.errors.length > 0);
    assert.equal(result.plan, null);
  }
  assert.equal(calculate(null).ok, false);
});

test("unsafe deficit estimates and impossible macro distributions are not returned", () => {
  const underweight = calculate({ ...example, currentWeight: 55 });
  assert.match(underweight.errors[0], /BMI/);
  assert.equal(calculate({ ...example, currentWeight: 55, goal: "maintain" }).ok, true);

  const lowEnergy = { ...example, age: 80, heightCm: 155, currentWeight: 48, formula: "mifflin", trainingDays: 0 };
  assert.match(calculate(lowEnergy).errors[0], /1500 kcal/);
  assert.match(calculate({ ...lowEnergy, sex: "female" }).errors[0], /1200 kcal/);
  assert.equal(calculate({ ...lowEnergy, sex: "female", goal: "maintain" }).ok, false);

  const impossibleMacros = calculate({
    ...example, currentWeight: 250, bodyFatPct: 60, trainingDays: 0, goal: "maintain",
  });
  assert.equal(impossibleMacros.plan, null);
  assert.match(impossibleMacros.errors[0], /不足以分配/);
});
