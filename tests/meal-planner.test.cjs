const assert = require("node:assert/strict");
const test = require("node:test");
const { allocate, preset, validate } = require("../meal-planner.js");

const daily = { kcal: 1731, protein: 103.6, carbs: 197.95, fat: 66.34 };

test("all six presets are valid and produce independent copies", () => {
  for (let count = 1; count <= 6; count += 1) {
    const options = preset(count);
    assert.equal(options.length, count);
    assert.equal(validate(options).ok, true);
    assert.notStrictEqual(options[0], preset(count)[0]);
  }
  assert.deepEqual(preset(3), [
    { name: "早餐", percent: 30 },
    { name: "午餐", percent: 35 },
    { name: "晚餐", percent: 35 },
  ]);
  for (const count of [0, 7, 2.5, "3", NaN]) assert.deepEqual(preset(count), []);
});

test("helps trim user labels but requires percentages to add to exactly 100", () => {
  assert.deepEqual(validate([{ name: " 午餐 ", percent: 40.1 }, { name: "晚餐", percent: 59.9 }]), {
    ok: true,
    errors: [],
    meals: [{ name: "午餐", percent: 40.1 }, { name: "晚餐", percent: 59.9 }],
  });
  const invalid = [
    null,
    [],
    Array(7).fill({ name: "餐", percent: 100 }),
    [{ name: "午餐", percent: 40 }, { name: " 午餐 ", percent: 60 }],
    [{ name: "  ", percent: 100 }],
    [{ name: "a".repeat(13), percent: 100 }],
    [{ name: "午餐", percent: 40.01 }, { name: "晚餐", percent: 59.99 }],
    ...[NaN, Infinity, -1, 0, 99, 101, "100"].map((percent) => [{ name: "午餐", percent }]),
  ];
  for (const meals of invalid) {
    const result = validate(meals);
    assert.equal(result.ok, false);
    assert.ok(result.errors.length);
    assert.deepEqual(result.meals, []);
  }
});

test("largest remainders get the remaining units and ties keep meal order", () => {
  const result = allocate(daily, preset(3));
  assert.equal(result.ok, true);
  assert.deepEqual(result.meals, [
    { name: "早餐", percent: 30, kcal: 519, protein: 31.1, carbs: 59.4, fat: 19.9 },
    { name: "午餐", percent: 35, kcal: 606, protein: 36.3, carbs: 69.3, fat: 23.2 },
    { name: "晚餐", percent: 35, kcal: 606, protein: 36.2, carbs: 69.3, fat: 23.2 },
  ]);
});

test("rounded totals are conserved in integer kcal and tenths of grams with 1–6 meals", () => {
  const scales = { kcal: 1, protein: 10, carbs: 10, fat: 10 };
  for (let count = 1; count <= 6; count += 1) {
    for (const targets of [daily, { kcal: 1.1, protein: 0.1, carbs: 0, fat: 0.2 }]) {
      const result = allocate(targets, preset(count));
      assert.equal(result.ok, true);
      for (const [name, scale] of Object.entries(scales)) {
        const units = result.meals.map((meal) => {
          const value = meal[name];
          assert.ok(value >= 0);
          assert.equal(value, Math.round(value * scale) / scale);
          return Math.round(value * scale);
        });
        assert.equal(units.reduce((a, b) => a + b, 0), Math.round(targets[name] * scale));
      }
    }
  }
});

test("rejects missing, non-finite or negative daily targets", () => {
  const invalid = [null, {}, { ...daily, kcal: NaN }, { ...daily, carbs: -1 }, { ...daily, protein: "100" }, { ...daily, fat: Infinity }];
  for (const targets of invalid) {
    const result = allocate(targets, preset(3));
    assert.equal(result.ok, false);
    assert.ok(result.errors.length);
    assert.deepEqual(result.meals, []);
  }
});
