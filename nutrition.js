(function (factory) {
  const planner = factory();
  if (typeof module === "object" && module.exports) module.exports = planner;
  if (typeof window === "object") window.NutritionPlanner = planner;
})(function () {
  "use strict";

  // App heuristic, not a validated exercise-energy equation. The daily activity
  // baselines exclude planned exercise; the weekly training term counts it once.
  const DAILY_ACTIVITY_FACTORS = { sedentary: 1.2, light: 1.35, active: 1.5 };

  function fail(errors) {
    return { ok: false, errors, plan: null };
  }

  function within(value, min, max) {
    return Number.isFinite(value) && value >= min && value <= max;
  }

  function calculate(profile) {
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      return fail(["请填写个人资料。"]);
    }

    const {
      sex, age, heightCm, currentWeight, bodyFatPct, formula,
      dailyActivity, trainingDays, trainingMinutes, goal,
    } = profile;
    const errors = [];
    const hasBodyFat = bodyFatPct !== null && bodyFatPct !== undefined;

    if (!["male", "female"].includes(sex)) errors.push("请选择公式使用的生理性别。");
    if (!Number.isInteger(age) || !within(age, 18, 80)) errors.push("年龄须为 18–80 岁的整数。");
    if (!within(heightCm, 130, 220)) errors.push("身高须为 130–220 cm。");
    if (!within(currentWeight, 35, 250)) errors.push("体重须为 35–250 kg。");
    if (hasBodyFat && !within(bodyFatPct, 5, 60)) errors.push("体脂率须为 5–60%，也可以留空。");
    if (!["auto", "mifflin", "lean"].includes(formula)) errors.push("请选择有效的估算公式。");
    if (formula === "lean" && !hasBodyFat) errors.push("使用去脂体重公式时，请填写体脂率。");
    if (typeof dailyActivity !== "string" || !Object.prototype.hasOwnProperty.call(DAILY_ACTIVITY_FACTORS, dailyActivity)) {
      errors.push("请选择日常活动水平。");
    }
    if (!Number.isInteger(trainingDays) || !within(trainingDays, 0, 7)) {
      errors.push("每周训练天数须为 0–7 天的整数。");
    }
    if (!within(trainingMinutes, 0, 240)) errors.push("每次训练须为 0–240 分钟。");
    if (!["lose", "maintain"].includes(goal)) errors.push("请选择减脂或维持体重。");
    if (errors.length) return fail(errors);

    const bmi = currentWeight / (heightCm / 100) ** 2;
    if (goal === "lose" && bmi < 18.5) {
      return fail(["当前 BMI 低于 18.5，无法生成减脂目标。可选择维持体重。"]);
    }

    // Mifflin–St Jeor (1990): https://pubmed.ncbi.nlm.nih.gov/2305711/
    const mifflinKcal = 10 * currentWeight + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
    // Cunningham (1991), also called Katch–McArdle: https://doi.org/10.1093/ajcn/54.6.963
    const leanMassKg = hasBodyFat ? currentWeight * (1 - bodyFatPct / 100) : null;
    const leanKcal = hasBodyFat ? 370 + 21.6 * leanMassKg : null;
    const method = formula === "lean" || (formula === "auto" && hasBodyFat) ? "lean" : "mifflin";
    const restingKcal = method === "lean" ? leanKcal : mifflinKcal;
    const trainingHours = trainingDays * trainingMinutes / 60;
    const activityFactor = Math.min(1.85, DAILY_ACTIVITY_FACTORS[dailyActivity] + Math.min(0.35, trainingHours / 18));
    const maintenanceKcal = restingKcal * activityFactor;
    const deficitPct = goal === "lose" ? 15 : 0;
    const kcal = Math.round(maintenanceKcal * (1 - deficitPct / 100) / 50) * 50;

    const minimum = sex === "male" ? 1500 : 1200;
    if (kcal < minimum) {
      return fail([`估算目标低于 ${minimum} kcal/天，未生成计划。请核对资料或咨询营养师；这是本工具的下限，并非通用安全保证。`]);
    }

    const protein = Math.round(currentWeight * 2);
    const fat = Math.round(currentWeight * 0.8);
    const remainingKcal = kcal - protein * 4 - fat * 9;
    if (remainingKcal < 0) {
      return fail(["目标热量不足以分配当前蛋白质和脂肪目标，请核对资料或改选维持体重。"]);
    }
    const carbs = Math.round(remainingKcal / 4 * 100) / 100;

    return {
      ok: true,
      errors: [],
      plan: {
        kcal, carbs, protein, fat, restingKcal, mifflinKcal, leanKcal, leanMassKg,
        maintenanceKcal, activityFactor, trainingHours, deficitPct, method,
        source: "estimate",
        version: 1,
      },
    };
  }

  return { calculate };
});
