(function (factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./recipe-planner.js"), require("./food-nutrition.js"));
  } else if (typeof window === "object") {
    window.DailyPlanner = factory(window.RecipePlanner, window.FoodNutrition);
  }
})(function (recipePlanner, nutrition) {
  "use strict";

  const keys = ["kcal", "protein", "carbs", "fat"];
  const labels = { kcal: "热量", protein: "蛋白质", carbs: "碳水", fat: "脂肪" };
  // Only identified Mainland standard servings with complete nutrition can be
  // picked automatically. User replacements are validated independently below.
  const brandIds = Object.freeze([
    "mcd-cn-grilled-chicken-sandwich-1", "mcd-cn-cheeseburger-1",
    "mcd-cn-double-cheeseburger-1", "mcd-cn-big-mac-1"
  ]);
  const commonTemplates = [
    ["rice_cooked", "chicken_breast", "broccoli", "olive_oil"],
    ["noodles", "beef", "bok_choy", "olive_oil"],
    ["brown_rice_cooked", "cod", "spinach", "olive_oil"],
    ["rice_cooked", "tofu", "broccoli", "almonds"]
  ];
  const zeros = () => Object.fromEntries(keys.map((key) => [key, 0]));
  const round = (value, key) => Math.round((value + Number.EPSILON) * (key === "kcal" ? 1 : 10)) / (key === "kcal" ? 1 : 10);
  const complete = (value) => value && keys.every((key) => Number.isFinite(value[key]) && value[key] >= 0);
  const cloneItems = (items) => items.map((item) => ({ foodId: item.foodId, amount: item.amount, locked: Boolean(item.locked) }));
  const fail = (message) => ({ ok: false, errors: [message], items: [], meals: [], warnings: [], totals: null, missing: null });

  function indexFoods(foods) {
    if (!Array.isArray(foods)) return null;
    const index = new Map();
    for (const food of foods) {
      if (!food || typeof food.id !== "string" || !food.id || index.has(food.id)) return null;
      index.set(food.id, food);
    }
    return index;
  }

  function validateItems(foods, items) {
    const index = indexFoods(foods);
    if (!index || !Array.isArray(items)) return fail("食物库或食谱清单格式不正确。");
    const seen = new Set();
    const normalized = [];
    for (const item of items) {
      const food = item && typeof item.foodId === "string" ? index.get(item.foodId) : null;
      if (!food || seen.has(item.foodId)) return fail("同餐食物必须来自食物库，且不能重复选择。");
      seen.add(item.foodId);
      if (keys.some((key) => food[key] !== null && (!Number.isFinite(food[key]) || food[key] < 0))) return fail("食物营养值须为非负数字或明确标记未公布。");
      const serving = nutrition.isServing(food);
      if (!Number.isFinite(item.amount) || item.amount < 0 || (serving
        ? item.amount > 20 || item.amount !== Math.round(item.amount * 100) / 100
        : item.amount > 2000 || !Number.isInteger(item.amount))) {
        return fail(serving ? "品牌份数须为 0–20，最多两位小数；0 表示不加入。" : "基础食物重量须为 0–2000g 的整数；0 表示不加入。");
      }
      normalized.push({ foodId: item.foodId, amount: item.amount, locked: serving || Boolean(item.locked) });
    }
    return { ok: true, errors: [], index, items: normalized };
  }

  function summarize(foods, items) {
    const checked = validateItems(foods, items);
    if (!checked.ok) return checked;
    const units = zeros();
    const missing = zeros();
    let produceGrams = 0;
    for (const item of checked.items) {
      if (item.amount === 0) continue;
      const food = checked.index.get(item.foodId);
      const values = nutrition.calculate(food, item.amount);
      for (const key of keys) {
        if (Number.isFinite(values[key])) units[key] += Math.round(values[key] * (key === "kcal" ? 1 : 10));
        else missing[key] += 1;
      }
      // Brand sandwich vegetables have no separate published edible mass.
      if (!nutrition.isServing(food) && ["水果", "蔬菜"].includes(food.category)) produceGrams += item.amount;
    }
    return { ok: true, errors: [], items: checked.items, totals: Object.fromEntries(keys.map((key) => [key, units[key] / (key === "kcal" ? 1 : 10)])), missing, produceGrams };
  }

  function finish(foods, target, items, warnings = []) {
    const summary = summarize(foods, items);
    if (!summary.ok) return summary;
    const difference = Object.fromEntries(keys.map((key) => [key, summary.missing[key] ? null : round(summary.totals[key] - target[key], key)]));
    if (keys.some((key) => difference[key] !== null && Math.abs(difference[key]) > Math.max(key === "kcal" ? 30 : 3, target[key] * 0.1))) {
      warnings.push("当前组合与本餐目标仍有差额，请查看实际营养后调整；不保证四项同时达标。");
    }
    return { ...summary, difference, warnings: [...new Set(warnings)] };
  }

  function rebalance(foods, target, items) {
    if (!complete(target)) return fail("本餐热量和三大营养目标须为非负有效数字。");
    const checked = validateItems(foods, items);
    if (!checked.ok) return checked;
    const normalized = checked.items;
    const current = summarize(foods, normalized);
    if (keys.some((key) => current.missing[key] > 0)) {
      return finish(foods, target, normalized, ["有食物未公布营养素，保留当前份量，暂停自动配平；已知热量仍计入，未知不当作零。"]);
    }
    const adjustable = normalized.filter((item) => !item.locked);
    if (adjustable.some((item) => item.foodId === "brazil_nuts")) return fail("巴西坚果不参与自动配量；如需记录实际摄入，请固定已称的重量。");
    const fixed = summarize(foods, normalized.filter((item) => item.locked));
    const exceeded = keys.filter((key) => fixed.totals[key] > target[key]);
    const warnings = exceeded.length ? [`固定食物已超出本餐${exceeded.map((key) => labels[key]).join("、")}目标；保留固定份量，不宣称配平。`] : [];
    if (!adjustable.length) return finish(foods, target, normalized, [...warnings, "全部食物份量已固定；可手动修改后再查看差额。"]);
    if (target.kcal - fixed.totals.kcal < 30) {
      return finish(foods, target, normalized, [...warnings, "固定食物已用完或接近用完本餐热量，未自动增加或缩放其余食物，请手动调整。"]);
    }
    const remaining = Object.fromEntries(keys.map((key) => [key, round(Math.max(0, target[key] - fixed.totals[key]), key)]));
    const result = recipePlanner.optimize(foods, remaining, adjustable.map((item) => item.foodId));
    if (!result.ok) return fail(result.errors.join("；"));
    const amounts = new Map(result.items.map((item) => [item.foodId, item.grams]));
    const next = normalized.map((item) => item.locked ? { ...item } : { ...item, amount: amounts.get(item.foodId) });
    if (result.cappedFoodIds.length) warnings.push("部分基础食物已达到自动配量上限；没有为追平目标无限增加份量。");
    return finish(foods, target, next, warnings);
  }

  function normalItems(index, ids, target, { first = false, single = false, twoMeals = false } = {}) {
    const selected = [...ids];
    if (first && !selected.includes("egg")) selected.splice(1, 0, "egg");
    if (single && !selected.includes("banana")) selected.push("banana", "greek_yogurt");
    return selected.map((id) => {
      const food = index.get(id);
      const produce = food && ["水果", "蔬菜"].includes(food.category);
      const amount = id === "egg" ? (target.kcal >= 500 ? 100 : 50)
        : produce ? (food.category === "水果" ? (single ? 150 : 100) : single ? 250 : target.kcal >= 300 ? (twoMeals ? 200 : 150) : 80)
        : food?.portion || 100;
      return { foodId: id, amount, locked: id === "egg" || produce };
    });
  }

  function generate(foods, targets, options = {}) {
    const index = indexFoods(foods);
    if (!options || typeof options !== "object") return fail("食谱模式格式不正确。");
    const style = options.style || "mixed";
    const variant = options.variant ?? 0;
    if (!index || !Array.isArray(targets) || targets.length < 1 || targets.length > 6 || !["mixed", "common"].includes(style) || !Number.isSafeInteger(variant) || variant < 0) {
      return fail("请选择 1–6 餐、有效食物库和食谱模式。");
    }
    if (Array.from(targets).some((target) => !complete(target) || typeof target.name !== "string" || !target.name.trim()) || new Set(targets.map((target) => target.name.trim())).size !== targets.length) {
      return fail("餐次名称不能重复，每餐须有完整的非负营养目标。");
    }
    const nonBreakfast = targets.map((target, i) => ({ target, i })).filter(({ target }) => !target.name.includes("早") && !target.name.includes("加餐"));
    const brandIndex = (nonBreakfast.length ? nonBreakfast : targets.map((target, i) => ({ target, i })))
      .sort((a, b) => b.target.kcal - a.target.kcal || a.i - b.i)[0].i;
    const meals = [];
    for (const [i, target] of targets.entries()) {
      const copiedTarget = Object.fromEntries(["name", ...keys].map((key) => [key, target[key]]));
      if (target.kcal < 100) {
        meals.push({ name: target.name, target: copiedTarget, items: [], warnings: ["本餐可分配热量不足 100 kcal，不自动安排整餐。无需为凑数继续进食。"] });
        continue;
      }
      const breakfast = target.name.includes("早餐");
      const snack = target.name.includes("加餐");
      const ids = breakfast ? ["oats", "egg", "greek_yogurt", "banana"]
        : snack ? ["oats", "greek_yogurt", "banana", "almonds"]
        : commonTemplates[(i + variant) % commonTemplates.length];
      let items = normalItems(index, ids, target, { first: i === 0 && !snack, single: targets.length === 1, twoMeals: targets.length === 2 });
      let warnings = [];
      if (style === "mixed" && i === brandIndex) {
        const rotated = brandIds.map((_, n) => brandIds[(n + variant) % brandIds.length]);
        const brand = rotated.map((id) => index.get(id)).find((food) => food && food.region === "中国大陆" && nutrition.isServing(food) && complete(food) && food.kcal <= target.kcal * 0.72 && food.fat <= target.fat * 1.1);
        if (brand) {
          items = [{ foodId: brand.id, amount: 1, locked: true }, ...normalItems(index, ["rice_cooked", "chicken_breast", "broccoli", "olive_oil"], target, { first: targets.length === 1, single: targets.length === 1, twoMeals: targets.length === 2 })];
          warnings.push("品牌主食按中国大陆默认配方 1 份；蔬菜与其他基础食物需另备，不是门店套餐。");
        } else warnings.push("本餐目标无法合理容纳可核验的标准份品牌主食，已改用基础食物；可手动替换并查看差额。");
      }
      const fixed = summarize(foods, items.filter((item) => item.locked));
      if (!fixed.ok) return fail(`${target.name}：${fixed.errors.join("；")}`);
      // Keeping an over-budget user edit is intentional in rebalance(), but a
      // new automatic draft must not offer its untouched standard portions as
      // a recommendation when even its fixed core cannot fit the small budget.
      if (target.kcal - fixed.totals.kcal < 30) {
        meals.push({ name: target.name, target: copiedTarget, items: [], warnings: ["本餐热量分配不足以容纳这组食物的实用份量，未自动推荐；可调整餐次比例或手动选择更小份量。"] });
        continue;
      }
      const result = rebalance(foods, target, items);
      if (!result.ok) return fail(`${target.name}：${result.errors.join("；")}`);
      meals.push({ name: target.name, target: copiedTarget, items: cloneItems(result.items), warnings: [...warnings, ...result.warnings] });
    }
    return { ok: true, errors: [], meals };
  }

  return { generate, rebalance, summarize };
});
