const assert = require("node:assert/strict");
const test = require("node:test");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const daily = require("../daily-planner.js");
const mealPlanner = require("../meal-planner.js");
const nutrition = require("../food-nutrition.js");
const window = {};
for (const path of ["data.js", "brand-data.js"]) vm.runInNewContext(readFileSync(join(__dirname, "..", path), "utf8"), { window });
const foods = [...window.NUTRITION_DATA.foods, ...window.BRAND_FOODS];
const byId = new Map(foods.map((food) => [food.id, food]));
const target = { kcal: 700, protein: 46, carbs: 79, fat: 23 };
const dailyTarget = { kcal: 2000, protein: 140, carbs: 220, fat: 62 };

test("daily generation supports 1–6 allocated meals, both styles, deterministic variants and immutable inputs", () => {
  for (const count of [1, 2, 3, 4, 5, 6]) for (const style of ["common", "mixed"]) {
    const targets = mealPlanner.allocate(dailyTarget, mealPlanner.preset(count)).meals;
    const before = JSON.stringify({ foods, targets });
    for (const variant of [0, 1, 2]) {
      const result = daily.generate(foods, targets, { style, variant });
      assert.equal(result.ok, true, `${count}/${style}/${variant}`);
      assert.equal(result.meals.length, count);
      assert.deepEqual(result, daily.generate(foods, targets, { style, variant }));
      let brands = 0;
      for (const meal of result.meals) {
        const summary = daily.summarize(foods, meal.items);
        assert.equal(summary.ok, true);
        assert.ok(Object.values(summary.missing).every((count) => count === 0));
        for (const item of meal.items) {
          const food = byId.get(item.foodId);
          if (food.basis === "serving") {
            brands++;
            assert.equal(food.region, "中国大陆");assert.equal(item.amount, 1);assert.equal(item.locked, true);
          } else assert.ok(Number.isInteger(item.amount) && item.amount >= 0 && item.amount <= 2000);
          assert.notEqual(item.foodId, "brazil_nuts");
        }
      }
      assert.ok(brands <= 1);
      if (style === "common") assert.equal(brands, 0);
    }
    assert.equal(JSON.stringify({ foods, targets }), before);
  }
});

test("the default three-meal mixed plan includes one mainland brand, practical eggs and separately weighed produce", () => {
  const targets = mealPlanner.allocate(dailyTarget, mealPlanner.preset(3)).meals;
  const { meals } = daily.generate(foods, targets, { style: "mixed" });
  assert.equal(meals.flatMap((meal) => meal.items).filter((item) => byId.get(item.foodId).basis === "serving").length, 1);
  assert.equal(meals[0].items.find((item) => item.foodId === "egg").amount, 100);
  assert.ok(meals.reduce((total, meal) => total + daily.summarize(foods, meal.items).produceGrams, 0) >= 400);
  assert.ok(meals.some((meal) => meal.warnings.some((warning) => warning.includes("另备"))));
});

test("serving and gram quantities use their own bases and the exact per-record rounding", () => {
  const items = [{ foodId: "mcd-cn-big-mac-1", amount: .5 }, { foodId: "rice_cooked", amount: 100 }, { foodId: "broccoli", amount: 17 }];
  const result = daily.summarize(foods, items);
  assert.equal(result.ok, true);
  const expected = nutrition.sum(items.map((item) => nutrition.calculate(byId.get(item.foodId), item.amount)));
  assert.equal(result.totals.kcal, 257 + 130 + 6);
  for (const key of Object.keys(result.totals)) assert.ok(Math.abs(result.totals[key] - expected[key]) < 1e-8);
  assert.equal(result.produceGrams, 17);
  assert.equal(result.items[0].locked, true);
});

test("unpublished macros stay unknown, zero portions add no missing fields, and rebalancing does not invent a fit", () => {
  const items = [{ foodId: "luckin_cn_coconut_latte_iced", amount: 1 }, { foodId: "rice_cooked", amount: 130 }];
  const result = daily.rebalance(foods, target, items);
  assert.equal(result.ok, true);
  assert.deepEqual(result.items.map((item) => item.amount), [1, 130]);
  assert.equal(result.missing.protein, 1);
  assert.equal(result.totals.kcal, 179 + 169);
  assert.equal(result.difference.protein, null);
  assert.match(result.warnings.join(""), /暂停自动配平/);
  const zero = daily.summarize(foods, [{ foodId: items[0].foodId, amount: 0 }]);
  assert.deepEqual(zero.totals, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  assert.ok(Object.values(zero.missing).every((n) => n === 0));
  assert.equal(daily.summarize(foods, []).ok, true);
});

test("brand quantities and manually locked replacements never change during a rebalance", () => {
  const items = [{ foodId: "mcd-cn-cheeseburger-1", amount: .5 }, { foodId: "egg", amount: 50, locked: true }, { foodId: "rice_raw", amount: 80 }, { foodId: "chicken_breast", amount: 150 }, { foodId: "broccoli", amount: 150, locked: true }];
  const before = JSON.stringify(items);
  const result = daily.rebalance(foods, target, items);
  assert.equal(result.ok, true);
  assert.equal(result.items[0].amount, .5);assert.equal(result.items[1].amount, 50);assert.equal(result.items[4].amount, 150);
  assert.ok(result.items[2].amount <= 180);
  assert.ok(result.items[3].amount <= 300);
  assert.equal(JSON.stringify(items), before);
});

test("fixed foods over target and tiny budgets surface honest warnings without negative scaling", () => {
  const items = [{ foodId: "mcd-cn-big-mac-1", amount: 2 }, { foodId: "rice_cooked", amount: 100 }];
  const result = daily.rebalance(foods, { ...target, kcal: 300 }, items);
  assert.equal(result.ok, true);
  assert.deepEqual(result.items.map((item) => item.amount), [2, 100]);
  assert.match(result.warnings.join(""), /固定食物已超出/);
  assert.ok(result.difference.kcal > 0);
  const small = daily.generate(foods, [{ name: "加餐", kcal: 50, protein: 3, carbs: 6, fat: 1 }]);
  assert.equal(small.ok, true);assert.deepEqual(small.meals[0].items, []);
  assert.match(small.meals[0].warnings[0], /不足 100/);
  for (const kcal of [100, 150, 200]) {
    const tinyBreakfast = daily.generate(foods, [{ name: "早餐", kcal, protein: 10, carbs: 20, fat: 5 }], { style: "common" });
    assert.equal(tinyBreakfast.ok, true);
    assert.deepEqual(tinyBreakfast.meals[0].items, []);
    assert.match(tinyBreakfast.meals[0].warnings.join(""), /不足以容纳/);
  }
  const tinyMain = daily.generate(foods, [{ name: "正餐", kcal: 100, protein: 10, carbs: 10, fat: 2 }], { style: "mixed" });
  assert.equal(tinyMain.ok, true);assert.deepEqual(tinyMain.meals[0].items, []);
});

test("unavailable or inapplicable brand anchors fall back without substituting Taiwan nutrition", () => {
  const targets = [{ name: "午餐", ...target }];
  const noMainland = foods.filter((food) => food.region !== "中国大陆");
  const result = daily.generate(noMainland, targets, { style: "mixed" });
  assert.equal(result.ok, true);
  assert.ok(result.meals[0].items.every((item) => byId.get(item.foodId).basis !== "serving"));
  assert.match(result.meals[0].warnings.join(""), /已改用基础食物/);
});

test("malformed amounts, targets, duplicate IDs and unsafe auto-sized foods are rejected", () => {
  for (const amount of [-1, 1.5, 2001, "50", NaN, Infinity]) assert.equal(daily.summarize(foods, [{ foodId: "egg", amount }]).ok, false);
  for (const amount of [-1, .001, 21, "1", NaN]) assert.equal(daily.summarize(foods, [{ foodId: "mcd-cn-big-mac-1", amount }]).ok, false);
  for (const items of [[{ foodId: "missing", amount: 1 }], [{ foodId: "egg", amount: 50 }, { foodId: "egg", amount: 50 }], Array(1), null]) assert.equal(daily.summarize(foods, items).ok, false);
  assert.equal(daily.summarize([...foods, foods[0]], []).ok, false);
  assert.equal(daily.rebalance(foods, target, [{ foodId: "brazil_nuts", amount: 5 }]).ok, false);
  for (const bad of [null, {}, { ...target, fat: -1 }, { ...target, protein: "4" }]) assert.equal(daily.rebalance(foods, bad, []).ok, false);
  for (const targets of [[], null, Array(1), [{ name: "午餐", ...target }, { name: "午餐", ...target }], [{ name: "", ...target }]]) assert.equal(daily.generate(foods, targets).ok, false);
  assert.equal(daily.generate(foods, [{ name: "午餐", ...target }], { style: "all-fast-food" }).ok, false);
  assert.equal(daily.generate(foods, [{ name: "午餐", ...target }], null).ok, false);
});
