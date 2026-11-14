(function (factory) {
  const planner = factory();
  if (typeof module === "object" && module.exports) module.exports = planner;
  if (typeof window === "object") window.MealPlanner = planner;
})(function () {
  "use strict";

  const PRESETS = [
    null,
    [["正餐", 100]],
    [["午餐", 50], ["晚餐", 50]],
    [["早餐", 30], ["午餐", 35], ["晚餐", 35]],
    [["早餐", 25], ["午餐", 30], ["晚餐", 30], ["加餐", 15]],
    [["早餐", 20], ["上午加餐", 20], ["午餐", 20], ["下午加餐", 20], ["晚餐", 20]],
    [["早餐", 16.7], ["上午加餐", 16.7], ["午餐", 16.7], ["下午加餐", 16.7], ["晚餐", 16.6], ["晚间加餐", 16.6]],
  ];
  const NUTRIENTS = ["kcal", "protein", "carbs", "fat"];

  function preset(count) {
    if (!Number.isInteger(count) || count < 1 || count > 6) return [];
    return PRESETS[count].map(([name, percent]) => ({ name, percent }));
  }

  function fail(errors) {
    return { ok: false, errors, meals: [] };
  }

  function validate(meals) {
    if (!Array.isArray(meals) || meals.length < 1 || meals.length > 6) {
      return fail(["每天可安排 1–6 餐。"]);
    }

    const errors = [];
    const names = new Set();
    const result = [];
    let tenths = 0;
    for (const [index, meal] of meals.entries()) {
      const name = typeof meal?.name === "string" ? meal.name.trim() : "";
      const percent = meal?.percent;
      if (!name || Array.from(name).length > 12) {
        errors.push(`第 ${index + 1} 餐的名称须为 1–12 个字符。`);
      } else if (names.has(name)) {
        errors.push(`第 ${index + 1} 餐的名称与其他餐次重复。`);
      }
      names.add(name);

      if (!Number.isFinite(percent) || percent <= 0 || percent > 100 || percent !== Math.round(percent * 10) / 10) {
        errors.push(`第 ${index + 1} 餐的比例须大于 0%、不超过 100%，最多一位小数。`);
      } else {
        tenths += Math.round(percent * 10);
      }
      result.push({ name, percent });
    }
    if (errors.length) return fail(errors);
    // Summing integer tenths avoids floating point drift. A valid one-decimal
    // total is within 1e-8 of 100% precisely when it is 1000 tenths.
    if (tenths !== 1000) return fail(["所有餐次的比例合计须为 100%。"]);
    return { ok: true, errors: [], meals: result };
  }

  function split(target, weights, scale) {
    // Work in integer units, rounding each daily total once. Integer quotas
    // preserve the sum exactly and avoid floating point tie-breaking.
    const unitFactor = BigInt(scale);
    const scaled = target * scale;
    const totalUnits = Number.isFinite(scaled)
      ? BigInt(Math.round(scaled))
      : BigInt(target) * unitFactor;
    const quotas = weights.map((weight, index) => {
      const numerator = totalUnits * weight;
      return { index, units: numerator / 1000n, remainder: numerator % 1000n };
    });
    const unassigned = totalUnits - quotas.reduce((sum, quota) => sum + quota.units, 0n);
    const priority = [...quotas].sort((a, b) => Number(b.remainder - a.remainder) || a.index - b.index);
    for (let i = 0; i < Number(unassigned); i += 1) priority[i].units += 1n;
    return quotas.map(({ units }) => Number(units / unitFactor) + Number(units % unitFactor) / scale);
  }

  function allocate(targets, meals) {
    const checked = validate(meals);
    if (!checked.ok) return checked;
    if (!targets || NUTRIENTS.some((key) => !Number.isFinite(targets[key]) || targets[key] < 0)) {
      return fail(["每日热量、蛋白质、碳水和脂肪目标须为非负的有效数字。"]);
    }

    const result = checked.meals;
    const weights = result.map(({ percent }) => BigInt(Math.round(percent * 10)));
    for (const key of NUTRIENTS) {
      const parts = split(targets[key], weights, key === "kcal" ? 1 : 10);
      result.forEach((meal, index) => { meal[key] = parts[index]; });
    }
    return { ok: true, errors: [], meals: result };
  }

  return { preset, validate, allocate };
});
