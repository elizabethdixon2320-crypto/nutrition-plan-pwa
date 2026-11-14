(function (factory) {
  const nutrition = factory();
  if (typeof module === "object" && module.exports) module.exports = nutrition;
  if (typeof window === "object") window.FoodNutrition = nutrition;
})(function () {
  "use strict";

  const keys = ["kcal", "carbs", "protein", "fat"];

  function isServing(food) {
    return food?.basis === "serving";
  }

  function calculate(food, amount) {
    const ratio = Number.isFinite(amount) && amount >= 0
      ? amount / (isServing(food) ? 1 : 100)
      : NaN;
    return Object.fromEntries(keys.map((key) => {
      const value = Number.isFinite(food?.[key]) ? food[key] * ratio : NaN;
      const factor = key === "kcal" ? 1 : 10;
      const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
      return [key, Number.isFinite(rounded) ? rounded : null];
    }));
  }

  function sum(entries) {
    const totals = { kcal: 0, carbs: 0, protein: 0, fat: 0 };
    const missing = { kcal: 0, carbs: 0, protein: 0, fat: 0 };
    for (const entry of entries || []) {
      for (const key of keys) {
        const value = entry?.[key];
        if (Number.isFinite(value)) totals[key] += value;
        else missing[key] += 1;
      }
    }
    return { ...totals, missing };
  }

  function validateAmount(food, amount) {
    if (isServing(food)) {
      if (!Number.isFinite(amount) || amount < 0.01 || amount > 20 || amount !== Math.round(amount * 100) / 100) {
        return { ok: false, error: "请输入 0.01–20 份，份数最多保留两位小数。" };
      }
    } else if (!Number.isFinite(amount) || amount <= 0 || amount > 2000) {
      return { ok: false, error: "请输入大于 0 且不超过 2000 g 的重量。" };
    }
    return { ok: true, error: null };
  }

  function amountLabel(food, amount) {
    if (!isServing(food)) return `${amount}g`;
    const servingLabel = typeof food.servingLabel === "string" ? food.servingLabel.trim() : "";
    return `${amount} 份${servingLabel ? `（标准：${servingLabel}）` : ""}`;
  }

  return { isServing, calculate, sum, validateAmount, amountLabel };
});
