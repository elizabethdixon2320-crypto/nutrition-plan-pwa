const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { templates, optimize, summarize } = require("../recipe-planner.js");

const window = {};
vm.runInNewContext(readFileSync(join(__dirname, "../data.js"), "utf8"), { window });
const { foods } = window.NUTRITION_DATA;
const target = { kcal: 600, protein: 40, carbs: 70, fat: 18 };

test("Brazil nuts are excluded from macro-only recommendations but actual intake can be recorded", () => {
  const result = optimize(foods, target, ["oats", "greek_yogurt", "banana", "brazil_nuts"]);
  assert.equal(result.ok, false);
  assert.match(result.errors[0], /不参与自动配量/);
  assert.equal(summarize(foods, [{ foodId: "brazil_nuts", grams: 5 }]).ok, true);
});

test("each built-in meal fits in reasonable bounds using entries from the current database", () => {
  assert.ok(templates.length >= 5);
  for (const template of templates) {
    const result = optimize(foods, target, template.foodIds);
    assert.equal(result.ok, true, template.id);
    assert.deepEqual(result.items.map(({ foodId }) => foodId), template.foodIds);
    assert.ok(Math.abs(result.difference.kcal) < 40, template.id);
    for (const key of ["protein", "carbs", "fat"]) assert.ok(Math.abs(result.difference[key]) < 4, template.id);
    assert.deepEqual(summarize(foods, result.items).totals, result.totals);
  }
});

test("food substitutions use the exact database entry, not a raw-to-cooked conversion", () => {
  const original = templates[0].foodIds;
  const substituted = original.map((id) => id === "rice_cooked" ? "rice_raw" : id);
  const cooked = optimize(foods, target, original);
  const raw = optimize(foods, target, substituted);

  assert.equal(raw.ok, true);
  assert.equal(raw.items[0].foodId, "rice_raw");
  assert.ok(raw.items[0].grams < cooked.items[0].grams);
  assert.ok(raw.items[0].grams <= 180);
  const totalCooked = summarize(foods, [{ foodId: "rice_cooked", grams: 100 }]).totals;
  const totalRaw = summarize(foods, [{ foodId: "rice_raw", grams: 100 }]).totals;
  assert.equal(totalCooked.kcal, foods.find(({ id }) => id === "rice_cooked").kcal);
  assert.equal(totalRaw.kcal, foods.find(({ id }) => id === "rice_raw").kcal);
  assert.notEqual(totalCooked.kcal, totalRaw.kcal);
});

test("an impossible target reports its true gap and never exceeds the recommendation caps", () => {
  const high = { kcal: 5000, protein: 200, carbs: 500, fat: 200 };
  const result = optimize(foods, high, templates[0].foodIds);

  assert.equal(result.ok, true);
  assert.deepEqual(result.items.map(({ grams }) => grams), [500, 300, 300, 25]);
  assert.deepEqual(result.cappedFoodIds, templates[0].foodIds);
  assert.ok(result.difference.kcal < -3000);
  for (const key of Object.keys(high)) assert.equal(result.difference[key], result.totals[key] - high[key]);
  for (const [foodId, cap, step] of [
    ["rice_raw", 180, 5], ["almonds", 45, 5], ["banana", 250, 5],
    ["egg", 200, 5], ["tofu", 500, 5], ["soy_sauce", 15, 1],
  ]) {
    const { items } = optimize(foods, high, [foodId]);
    assert.deepEqual(items, [{ foodId, grams: cap }], foodId);
    assert.equal(items[0].grams % step, 0);
  }
});

test("tiny meals can use less than a standard vegetable portion and omit the oil", () => {
  const result = optimize(foods, { kcal: 2, protein: 0, carbs: 0, fat: 0 }, ["broccoli", "olive_oil"]);
  assert.equal(result.ok, true);
  assert.ok(result.items[0].grams < 50);
  assert.equal(result.items[1].grams, 0);
  assert.deepEqual(summarize(foods, [{ foodId: "olive_oil", grams: 0 }]).totals, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
});

test("manual grams use the app's per-item rounding before summing", () => {
  const items = [{ foodId: "rice_cooked", grams: 1 }, { foodId: "chicken_breast", grams: 1 }, { foodId: "broccoli", grams: 17 }];
  const result = summarize(foods, items);
  assert.equal(result.ok, true);
  assert.deepEqual(result.items, items);
  // 1.3, 1.51 and 5.95 kcal round separately to 1, 2 and 6.
  assert.deepEqual(result.totals, { kcal: 9, protein: 0.7, carbs: 1.5, fat: 0.1 });
  assert.notEqual(result.items, items);
  assert.notEqual(result.items[0], items[0]);
});

test("invalid targets, unknown/duplicate foods, and invalid manual grams surface errors", () => {
  const known = ["rice_cooked"];
  for (const candidate of [null, {}, { ...target, kcal: 0 }, { ...target, kcal: NaN }, { ...target, protein: -1 }, { ...target, fat: "18" }]) {
    assert.equal(optimize(foods, candidate, known).ok, false);
  }
  for (const ids of [[], ["unknown"], ["rice_cooked", "rice_cooked"], Array(1)]) {
    assert.equal(optimize(foods, target, ids).ok, false);
  }
  assert.equal(summarize(foods, [{ foodId: "unknown", grams: 10 }]).ok, false);
  assert.equal(summarize(foods, []).ok, false);
  assert.equal(summarize(foods, [{ foodId: "rice_cooked", grams: 1 }, { foodId: "rice_cooked", grams: 2 }]).ok, false);
  for (const grams of [-1, NaN, Infinity, 1.5, 2001, "75"]) {
    assert.equal(summarize(foods, [{ foodId: "rice_cooked", grams }]).ok, false);
  }
});
