(function (factory) {
  const planner = factory();
  if (typeof module === "object" && module.exports) module.exports = planner;
  if (typeof window === "object") window.RecipePlanner = planner;
})(function () {
  "use strict";

  const nutrients = ["kcal", "protein", "carbs", "fat"];
  const templates = [
    { id: "chicken-rice", label: "鸡胸肉米饭", foodIds: ["rice_cooked", "chicken_breast", "broccoli", "olive_oil"] },
    { id: "beef-noodles", label: "牛肉面条", foodIds: ["noodles", "beef", "bok_choy", "olive_oil"] },
    { id: "cod-rice", label: "鳕鱼糙米饭", foodIds: ["brown_rice_cooked", "cod", "spinach", "olive_oil"] },
    { id: "yogurt-oats", label: "燕麦酸奶碗", foodIds: ["oats", "greek_yogurt", "banana", "almonds"] },
    { id: "tofu-rice", label: "豆腐米饭", foodIds: ["rice_cooked", "tofu", "broccoli", "almonds"] },
  ].map((template) => Object.freeze({ ...template, foodIds: Object.freeze(template.foodIds) }));
  Object.freeze(templates);

  function fail(message) {
    return { ok: false, errors: [message], items: [], totals: null };
  }

  function hasNutrients(value) {
    return value && nutrients.every((key) => Number.isFinite(value[key]) && value[key] >= 0);
  }

  function selectFoods(foods, ids) {
    if (!Array.isArray(foods) || !Array.isArray(ids) || ids.length === 0) return null;
    const index = new Map(foods.map((food) => [food?.id, food]));
    if (new Set(ids).size !== ids.length) return null;
    const selection = Array.from(ids, (id) => typeof id === "string" && id ? index.get(id) : null);
    return selection.every(hasNutrients) ? selection : null;
  }

  function nutrientUnits(food, grams) {
    const ratio = grams / 100;
    // Match the app's per-record rounding (kcal to integers, macros to 0.1 g).
    return nutrients.map((key, index) => Math.round((food[key] * ratio + Number.EPSILON) * (index === 0 ? 1 : 10)));
  }

  function sumNutrients(rows) {
    const units = rows.reduce((sum, row) => sum.map((value, index) => value + row[index]), [0, 0, 0, 0]);
    return Object.fromEntries(nutrients.map((key, index) => [key, units[index] / (index === 0 ? 1 : 10)]));
  }

  function summarize(foods, items) {
    if (!Array.isArray(items) || !items.length) return fail("至少需要选择一种食物。");
    const selected = selectFoods(foods, items.map((item) => item?.foodId));
    if (!selected) return fail("请选择食物库中存在且不重复的食物。");
    if (!items.every((item) => Number.isInteger(item.grams) && item.grams >= 0 && item.grams <= 2000)) {
      return fail("食物重量须为 0–2000 g 的整数。");
    }
    return {
      ok: true,
      errors: [],
      items: items.map(({ foodId, grams }) => ({ foodId, grams })),
      totals: sumNutrients(selected.map((food, index) => nutrientUnits(food, items[index].grams))),
    };
  }

  function bounds(food, kcal) {
    const small = food.category === "油脂" || food.category === "调味";
    const step = small ? 1 : 5;
    let min = small ? 0 : 5;
    let max = 300;
    switch (food.category) {
      case "油脂": max = 25; break;
      case "调味": max = 15; break;
      case "坚果": max = 45; break;
      case "水果": max = 250; break;
      case "蔬菜":
        // A normal vegetable serving does not have to dominate a tiny meal.
        min = kcal < 200 ? Math.min(50, Math.floor(kcal * 2 / Math.max(food.kcal, 1)) * 5) : 50;
        break;
      case "谷薯": max = ["干重", "生重"].includes(food.state) ? 180 : 500; break;
      case "蛋奶豆": max = /^egg(?:_|$)/.test(food.id) ? 200 : 500; break;
    }
    return { step, min, max };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function dot(a, b) {
    return a.reduce((total, value, index) => total + value * b[index], 0);
  }

  function optimize(foods, target, foodIds) {
    if (!hasNutrients(target) || target.kcal <= 0) return fail("本餐目标须使用非负数字，热量须大于 0 kcal。");
    const selected = selectFoods(foods, foodIds);
    if (!selected) return fail("请选择食物库中存在且不重复的食物。");
    // Macro-only fitting cannot account for high selenium exposure from Brazil nuts.
    // https://ods.od.nih.gov/factsheets/Selenium-HealthProfessional/
    if (foodIds.includes("brazil_nuts")) return fail("巴西坚果不参与自动配量，请选择其他食物；已食用的实际重量仍可手动记录。");

    // Normalize the four dimensions; floors keep a near-zero target from
    // making the other nutrients irrelevant. Softly favor ordinary portions
    // when several gram combinations have similar nutrient totals.
    const floors = [100, 12, 15, 8];
    const scales = nutrients.map((key, index) => Math.max(target[key], floors[index]) / (index === 0 ? 1.3 : 1));
    const desired = nutrients.map((key, index) => target[key] / scales[index]);
    const limits = selected.map((food) => bounds(food, target.kcal));
    const guides = selected.map((food, index) => clamp(Number.isFinite(food.portion) ? food.portion : 100, limits[index].min, limits[index].max));
    const coefficients = selected.map((food) => nutrients.map((key, index) => food[key] / 100 / scales[index]));
    const penalties = limits.map(({ max }) => 0.001 / max ** 2);

    // First fit continuous portions within bounds, then optimize actual log
    // units on each item's discrete gram grid.
    const residual = desired.map((goal, dimension) => coefficients.reduce((sum, row, index) => sum + row[dimension] * guides[index], -goal));
    const weights = [...guides];
    for (let sweep = 0; sweep < 160; sweep += 1) {
      let movement = 0;
      for (let i = 0; i < selected.length; i += 1) {
        const a = coefficients[i];
        const previous = weights[i];
        const gradient = dot(a, residual) + penalties[i] * (previous - guides[i]);
        const next = clamp(previous - gradient / (dot(a, a) + penalties[i]), limits[i].min, limits[i].max);
        const delta = next - previous;
        weights[i] = next;
        movement = Math.max(movement, Math.abs(delta));
        a.forEach((value, dimension) => { residual[dimension] += value * delta; });
      }
      if (movement < 0.005) break;
    }

    const choices = selected.map((food, index) => {
      const { min, max, step } = limits[index];
      return Array.from({ length: (max - min) / step + 1 }, (_, offset) => {
        const grams = min + offset * step;
        return {
          grams,
          values: nutrientUnits(food, grams).map((value, dimension) => value / (dimension === 0 ? 1 : 10) / scales[dimension]),
          penalty: penalties[index] * (grams - guides[index]) ** 2,
        };
      });
    });
    const indices = choices.map((_, index) => Math.round((weights[index] - limits[index].min) / limits[index].step));
    const selectedChoices = indices.map((choice, index) => choices[index][choice]);
    const current = desired.map((goal, dimension) => selectedChoices.reduce((sum, choice) => sum + choice.values[dimension], -goal));

    for (let sweep = 0; sweep < 24; sweep += 1) {
      let changed = false;
      for (let i = 0; i < selected.length; i += 1) {
        const previous = choices[i][indices[i]];
        let bestIndex = indices[i];
        let bestScore = dot(current, current) + previous.penalty;
        choices[i].forEach((candidate, candidateIndex) => {
          const next = current.map((value, dimension) => value + candidate.values[dimension] - previous.values[dimension]);
          const score = dot(next, next) + candidate.penalty;
          if (score < bestScore - 1e-12) {
            bestIndex = candidateIndex;
            bestScore = score;
          }
        });
        if (indices[i] !== bestIndex) {
          const best = choices[i][bestIndex];
          best.values.forEach((value, dimension) => { current[dimension] += value - previous.values[dimension]; });
          indices[i] = bestIndex;
          changed = true;
        }
      }
      if (!changed) break;
    }

    const items = indices.map((choice, index) => ({ foodId: selected[index].id, grams: choices[index][choice].grams }));
    const totals = sumNutrients(selected.map((food, index) => nutrientUnits(food, items[index].grams)));
    const difference = Object.fromEntries(nutrients.map((key) => [key, totals[key] - target[key]]));
    const cappedFoodIds = items.filter(({ grams }, index) => grams === limits[index].max).map(({ foodId }) => foodId);
    return { ok: true, errors: [], items, totals, difference, cappedFoodIds };
  }

  return { templates, optimize, summarize };
});
