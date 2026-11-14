const assert = require("node:assert/strict");
const test = require("node:test");
const { isServing, calculate, sum, validateAmount, amountLabel } = require("../food-nutrition.js");

const burger = { basis: "serving", servingLabel: "1个", kcal: 511, carbs: 37.7, protein: 24.2, fat: 26.1 };
const drink = { basis: "serving", servingLabel: "1杯", kcal: 6, carbs: 0, protein: 0, fat: 0 };
const incomplete = { basis: "serving", kcal: 315, carbs: null, protein: null };
const rice = { kcal: 130, carbs: 28.2, protein: 2.7, fat: 0.3 };

test("serving-based products scale by number of portions, including half a burger", () => {
  assert.equal(isServing(burger), true);
  assert.deepEqual(calculate(burger, 0.5), { kcal: 256, carbs: 18.9, protein: 12.1, fat: 13.1 });
  assert.equal(amountLabel(burger, 0.5), "0.5 份（标准：1个）");
  assert.equal(amountLabel(drink, 1), "1 份（标准：1杯）");
  assert.equal(amountLabel(incomplete, 1), "1 份");
});

test("published zeros remain known and unpublished nutrients remain null", () => {
  assert.deepEqual(calculate(drink, 1), { kcal: 6, carbs: 0, protein: 0, fat: 0 });
  assert.deepEqual(calculate(incomplete, 0.5), { kcal: 158, carbs: null, protein: null, fat: null });
  assert.deepEqual(calculate({ ...incomplete, kcal: NaN }, 1), { kcal: null, carbs: null, protein: null, fat: null });
});

test("existing foods still use per-100g values and the existing rounding", () => {
  assert.equal(isServing(rice), false);
  assert.equal(isServing({ ...rice, basis: "per100g", servingLabel: "份" }), false);
  assert.deepEqual(calculate(rice, 125), { kcal: 163, carbs: 35.3, protein: 3.4, fat: 0.4 });
  assert.deepEqual(calculate(rice, 0.5), { kcal: 1, carbs: 0.1, protein: 0, fat: 0 });
  assert.equal(amountLabel(rice, 100), "100g");
  assert.equal(amountLabel(rice, 0.025), "0.025g");
});

test("sum counts missing nutrients individually instead of treating them as zero", () => {
  const totals = sum([
    calculate(burger, 0.5), calculate(drink, 1), calculate(incomplete, 1),
    { kcal: undefined, carbs: NaN, protein: "9", fat: 1 },
  ]);
  assert.deepEqual(totals, {
    kcal: 577, carbs: 18.9, protein: 12.1, fat: 14.1,
    missing: { kcal: 1, carbs: 2, protein: 2, fat: 1 },
  });
  assert.deepEqual(sum([]), {
    kcal: 0, carbs: 0, protein: 0, fat: 0, missing: { kcal: 0, carbs: 0, protein: 0, fat: 0 },
  });
});

test("amount validation distinguishes serving precision from gram bounds", () => {
  for (const amount of [0.01, 0.25, 0.29, 0.5, 20]) assert.deepEqual(validateAmount(burger, amount), { ok: true, error: null });
  for (const amount of [0, -0.01, 0.001, 20.01, 0.555, "0.5", Infinity, NaN, null]) {
    assert.equal(validateAmount(burger, amount).ok, false);
    assert.ok(validateAmount(burger, amount).error);
  }
  for (const amount of [0.001, 1, 2.55, 1999.99, 2000]) assert.equal(validateAmount(rice, amount).ok, true);
  for (const amount of [0, -0.01, 2000.1, "125", Infinity, NaN, null]) assert.equal(validateAmount(rice, amount).ok, false);
});
