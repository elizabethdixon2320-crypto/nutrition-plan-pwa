const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const preferred = require("../preferred-planner.js");
const daily = require("../daily-planner.js");
const mealPlanner = require("../meal-planner.js");
const window = {};
for (const path of ["data.js", "brand-data.js"]) vm.runInNewContext(readFileSync(join(__dirname, "..", path), "utf8"), { window });
const foods = [...window.NUTRITION_DATA.foods, ...window.BRAND_FOODS];
const byId = new Map(foods.map((food) => [food.id, food]));
const target = { kcal: 2000, protein: 140, carbs: 220, fat: 62 };
const targets = mealPlanner.allocate(target, mealPlanner.preset(3)).meals;
const chosen = ["oats", "egg", "rice_cooked", "chicken_breast", "broccoli", "banana", "olive_oil", "greek_yogurt"];
const allItems = (result) => result.meals.flatMap((meal) => meal.items);

test("only explicitly selected foods and eligible mainland products of selected brands are generated", () => {
  const options = { brands: ["麦当劳"], foodIds: chosen, pins: [] };
  const original = JSON.stringify({ foods, targets, options });
  const result = preferred.generate(foods, targets, options);
  assert.equal(result.ok, true);
  const brandItems = allItems(result).filter((item) => byId.get(item.foodId).basis === "serving");
  assert.equal(brandItems.length, 1);assert.equal(brandItems[0].amount, 1);
  assert.equal(byId.get(brandItems[0].foodId).region, "中国大陆");
  assert.equal(byId.get(brandItems[0].foodId).brand, "麦当劳");
  for (const item of allItems(result)) if (byId.get(item.foodId).basis !== "serving") assert.ok(chosen.includes(item.foodId));
  assert.equal(JSON.stringify({ foods, targets, options }), original);
  assert.deepEqual(result, preferred.generate(foods, targets, options));
  for (const meal of result.meals) {
    assert.equal(daily.summarize(foods, meal.items).ok, true);
    assert.ok(Math.abs(daily.summarize(foods, meal.items).totals.kcal - meal.target.kcal) < 70);
  }
});

test("pins are additional explicit choices, remain exact and suppress extra automatic branded meals", () => {
  const options = { brands: ["麦当劳"], foodIds: ["rice_cooked", "chicken_breast"], pins: [{ foodId: "mcd-cn-big-mac-1", amount: .5, mealIndex: 1 }, { foodId: "egg", amount: 73, mealIndex: 0 }] };
  const result = preferred.generate(foods, targets, options);
  assert.equal(result.ok, true);
  assert.deepEqual(result.meals[1].items.find((item) => item.foodId === options.pins[0].foodId), { foodId: options.pins[0].foodId, amount: .5, locked: true });
  assert.equal(result.meals[0].items.find((item) => item.foodId === "egg").amount, 73);
  assert.equal(allItems(result).filter((item) => byId.get(item.foodId).basis === "serving").length, 1);
  assert.ok(allItems(result).every((item) => [...options.foodIds, ...options.pins.map((pin) => pin.foodId)].includes(item.foodId)));
});

test("incomplete selected products are not invented, while incomplete pins keep unknown macros and pause that meal", () => {
  const latte = "luckin_cn_coconut_latte_iced";
  const options = { brands: ["瑞幸咖啡", "赛百味"], foodIds: [latte, ...chosen], pins: [{ foodId: latte, amount: 1, mealIndex: 0 }] };
  const result = preferred.generate(foods, targets, options);
  assert.equal(result.ok, true);
  assert.deepEqual(result.meals[0].items, [{ foodId: latte, amount: 1, locked: true }]);
  const summary = daily.summarize(foods, result.meals[0].items);
  assert.equal(summary.totals.kcal, 179);assert.equal(summary.missing.protein, 1);
  assert.match(result.meals[0].warnings.join(""), /暂停自动补配/);
  assert.ok(result.meals.slice(1).every((meal) => meal.items.length > 0));
  const noPin = preferred.generate(foods, targets, { brands: ["瑞幸咖啡"], foodIds: [latte], pins: [] });
  assert.equal(noPin.ok, true);assert.equal(allItems(noPin).length, 0);
  assert.match(noPin.warnings.join(""), /未自动安排/);
});

test("over-budget and multiple branded pins are preserved without forcing added food", () => {
  const pins = [{ foodId: "mcd-cn-big-mac-1", amount: 2, mealIndex: 0 }, { foodId: "mcd-cn-big-mac-1", amount: 2, mealIndex: 1 }];
  const result = preferred.generate(foods, targets, { brands: ["麦当劳"], foodIds: chosen, pins });
  assert.equal(result.ok, true);
  for (const i of [0, 1]) {
    assert.deepEqual(result.meals[i].items, [{ foodId: "mcd-cn-big-mac-1", amount: 2, locked: true }]);
    assert.match(result.meals[i].warnings.join(""), /固定食物已用完/);
    assert.equal(daily.summarize(foods, result.meals[i].items).totals.kcal, 1026);
  }
  assert.equal(allItems(result).filter((item) => byId.get(item.foodId).basis === "serving").length, 2);
});

test("all auto grams use five-gram steps, practical egg portions and daily caps, with real gaps for inadequate pools", () => {
  const result = preferred.generate(foods, targets, { brands: [], foodIds: ["egg", "egg_raw", "olive_oil", "almonds"], pins: [] });
  assert.equal(result.ok, true);
  const eggs = allItems(result).filter((item) => ["egg", "egg_raw"].includes(item.foodId));
  assert.ok(eggs.every((item) => item.amount % 50 === 0));
  assert.ok(eggs.reduce((sum, item) => sum + item.amount, 0) <= 200);
  assert.ok(allItems(result).every((item) => item.amount % 5 === 0));
  assert.ok(allItems(result).filter((item) => item.foodId === "olive_oil").every((item) => item.amount <= 25));
  assert.ok(allItems(result).filter((item) => item.foodId === "almonds").reduce((sum, item) => sum + item.amount, 0) <= 60);
  assert.match(result.meals.flatMap((meal) => meal.warnings).join(""), /偏低/);
  assert.ok(allItems(result).every((item) => ["egg", "egg_raw", "olive_oil", "almonds"].includes(item.foodId)));
});

test("selected non-mainland foods and pins are rejected rather than replaced by mainland guesses", () => {
  const id = window.BRAND_FOODS.find((food) => food.region === "中国台湾").id;
  for (const options of [{ brands: [], foodIds: [id], pins: [] }, { brands: [], foodIds: [], pins: [{ foodId: id, amount: 1, mealIndex: 0 }] }]) {
    const result = preferred.generate(foods, targets, options);
    assert.equal(result.ok, false);assert.match(result.errors.join(""), /大陆/);
  }
  const brandOnly = preferred.generate(foods, targets, { brands: ["肯德基"], foodIds: [], pins: [] });
  assert.equal(brandOnly.ok, true);assert.equal(allItems(brandOnly).length, 0);
  assert.match(brandOnly.warnings.join(""), /未改用其他品牌或地区/);
});

test("one through six meals and empty low-budget meals remain valid", () => {
  for (const n of [1, 2, 3, 4, 5, 6]) {
    const allocated = mealPlanner.allocate(target, mealPlanner.preset(n)).meals;
    const result = preferred.generate(foods, allocated, { brands: [], foodIds: chosen, pins: [] });
    assert.equal(result.ok, true);assert.equal(result.meals.length, n);
    assert.ok(result.meals.every((meal) => daily.summarize(foods, meal.items).ok));
  }
  const tiny = preferred.generate(foods, [{ name: "加餐", kcal: 10, protein: 1, carbs: 1, fat: 0 }], { brands: [], foodIds: chosen, pins: [] });
  assert.equal(tiny.ok, true);assert.deepEqual(tiny.meals[0].items, []);
});

test("malformed and duplicate pins fail, and no selections never activate an unselected fallback", () => {
  assert.equal(preferred.generate(foods, targets, { brands: [], foodIds: [], pins: [] }).ok, false);
  for (const pins of [[{ foodId: "egg", amount: 0, mealIndex: 0 }], [{ foodId: "egg", amount: 1.5, mealIndex: 0 }], [{ foodId: "egg", amount: 50, mealIndex: 3 }], [{ foodId: "egg", amount: 50, mealIndex: 0 }, { foodId: "egg", amount: 100, mealIndex: 0 }], Array(1)]) {
    assert.equal(preferred.generate(foods, targets, { brands: [], foodIds: [], pins }).ok, false);
  }
  for (const badTargets of [null, [], Array(1), [{ name: "", ...target }], [{ name: "A", ...target }, { name: "A", ...target }]]) assert.equal(preferred.generate(foods, badTargets, { brands: [], foodIds: chosen, pins: [] }).ok, false);
  for (const options of [null, {}, { brands: [], foodIds: ["missing"], pins: [] }, { brands: Array(1), foodIds: chosen, pins: [] }]) assert.equal(preferred.generate(foods, targets, options).ok, false);
  const brazil = preferred.generate(foods, targets, { brands: [], foodIds: ["brazil_nuts"], pins: [] });
  assert.equal(brazil.ok, true);assert.equal(allItems(brazil).length, 0);
  assert.match(brazil.warnings.join(""), /巴西坚果/);
});

test("global selection warnings are not repeated per meal and only one oil is sized automatically", () => {
  const otherOil = foods.find((food) => food.category === "油脂" && food.id !== "olive_oil").id;
  const result = preferred.generate(foods, targets, { brands: ["瑞幸咖啡"], foodIds: [...chosen, otherOil], pins: [{ foodId: "olive_oil", amount: 10, mealIndex: 1 }] });
  assert.equal(result.ok, true);
  assert.match(result.warnings.join(""), /瑞幸咖啡/);
  for (const meal of result.meals) {
    assert.doesNotMatch(meal.warnings.join(""), /暂无符合/);
    assert.ok(meal.items.filter((item) => byId.get(item.foodId).category === "油脂").length <= 1);
    assert.ok(meal.warnings.filter((warning) => warning.includes("请查看营养差额")).length <= 1);
  }
});

test("an impossible macro target never causes a large automatic calorie overshoot", () => {
  const impossible = [{ name: "午餐", kcal: 100, protein: 100, carbs: 0, fat: 0 }];
  const result = preferred.generate(foods, impossible, { brands: [], foodIds: ["chicken_breast", "egg", "greek_yogurt"], pins: [] });
  assert.equal(result.ok, true);
  const summary = daily.summarize(foods, result.meals[0].items);
  assert.ok(summary.totals.kcal <= 115);
  assert.match(result.meals[0].warnings.join(""), /蛋白质偏低/);
});
