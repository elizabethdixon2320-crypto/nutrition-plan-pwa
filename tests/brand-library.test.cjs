const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const sourceFiles = ["mcdonalds", "subway", "coffee-pizza", "kfc-bk"];
const sourceProducts = sourceFiles.flatMap((name) => JSON.parse(fs.readFileSync(path.join(root, "research", `${name}-products.json`), "utf8")));
const script = fs.readFileSync(path.join(root, "brand-data.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(script, context, { filename: "brand-data.js", timeout: 1000 });
// Normalize cross-realm arrays/objects for strict Node assertions.
const foods = JSON.parse(JSON.stringify(context.window.BRAND_FOODS));
const metadata = JSON.parse(JSON.stringify(context.window.BRAND_LIBRARY_METADATA));
const generator = import(pathToFileURL(path.join(root, "scripts", "build-brand-library.mjs")).href);

test("the browser bundle deduplicates 119 source entries into 117 products with explicit regions", () => {
  assert.equal(sourceProducts.length, 119);
  assert.equal(foods.length, 117);
  assert.equal(metadata.sourceItemCount, 119);
  assert.equal(metadata.itemCount, 117);
  assert.equal(metadata.mainlandCount, 102);
  assert.equal(metadata.otherRegionCount, 15);
  assert.equal(foods.filter((food) => food.region === "中国大陆").length, 102);
  assert.equal(foods.filter((food) => food.region === "中国台湾").length, 15);
  assert.equal(metadata.verifiedAt, "2026-11-15");
  assert.deepEqual(metadata.brands, { 麦当劳: 72, 赛百味: 9, 瑞幸咖啡: 21, 肯德基: 7, 汉堡王: 8 });
  assert.equal(metadata.duplicateExcluded, 2);
  assert.deepEqual(metadata.duplicateDetails.map(({ excludedId, retainedId }) => [excludedId, retainedId]), [
    ["mcd-cn-soybean-milk-3-1", "mcd-cn-soybean-milk-1"],
    ["mcd-cn-soybean-milk-3-2", "mcd-cn-soybean-milk-2"]
  ]);
  assert.ok(metadata.gaps.some((gap) => gap.includes("不可替代中国大陆")));
  assert.ok(metadata.gaps.some((gap) => gap.includes("null")));
});

test("every product uses serving-based app schema and preserves every research field", () => {
  const byId = new Map(foods.map((food) => [food.id, food]));
  assert.equal(byId.size, foods.length);
  for (const raw of sourceProducts) {
    if (metadata.duplicateDetails.some((duplicate) => duplicate.excludedId === raw.id)) continue;
    const food = byId.get(raw.id);
    assert.ok(food, raw.id);
    for (const [key, value] of Object.entries(raw)) {
      if (key !== "name") assert.deepEqual(food[key], value, `${raw.id}.${key}`);
    }
    assert.equal(food.rawName, raw.name);
    assert.equal(food.name, `${raw.brand} · ${raw.name}${raw.region === "中国大陆" ? "" : `（${raw.region}）`}`);
    assert.ok(food.aliases.includes(raw.name));
    assert.ok(food.aliases.includes(raw.brand));
    assert.equal(food.category, "品牌食品");
    assert.equal(food.state, "标准成品");
    assert.equal(food.basis, "serving");
    assert.equal(food.portion, 1);
    assert.equal(food.common, false);
    assert.equal(food.source, raw.sourceTitle);
    assert.ok(food.servingLabel.trim());
    assert.equal(new URL(food.sourceUrl).protocol, "https:");
  }
});

test("all 74 source and 72 distinct McDonald's calories use the published kJ conversion", () => {
  const mcdonalds = foods.filter((food) => food.brand === "麦当劳");
  const rawMcDonalds = sourceProducts.filter((food) => food.brand === "麦当劳");
  assert.equal(mcdonalds.length, 72);
  assert.equal(rawMcDonalds.length, 74);
  for (const food of [...rawMcDonalds, ...mcdonalds]) {
    assert.equal(typeof food.rawKj, "number", food.id);
    assert.equal(food.kcal, Math.round(food.rawKj / 4.184), food.id);
    assert.ok(food.energyMethod.includes("4.184"), food.id);
  }
  const bigMac = mcdonalds.find((food) => food.id === "mcd-cn-big-mac-1");
  assert.equal(bigMac.rawKj, 2146);
  assert.equal(bigMac.kcal, 513);
  assert.notEqual(bigMac.kcal, bigMac.protein * 4 + bigMac.carbs * 4 + bigMac.fat * 9);
});

test("unpublished macros and weights remain null without inventing zero or grams from cup volume", () => {
  const unknown = foods.filter((food) => ["瑞幸咖啡", "赛百味"].includes(food.brand));
  assert.equal(unknown.length, 30);
  for (const food of unknown) {
    assert.equal(food.protein, null, food.id);
    assert.equal(food.carbs, null, food.id);
    assert.equal(food.fat, null, food.id);
    assert.equal(food.servingGrams, null, food.id);
  }
  assert.equal(foods.find((food) => food.id === "luckin_cn_coconut_latte_iced").kcal, 179);
  assert.equal(foods.find((food) => food.id === "luckin_cn_fresh_cut_lemon_c_americano_iced").kcal, 112);
  for (const food of foods) {
    assert.ok(Number.isFinite(food.kcal) && food.kcal >= 0, food.id);
    for (const key of ["protein", "carbs", "fat"]) {
      assert.ok(food[key] === null || (Number.isFinite(food[key]) && food[key] >= 0), `${food.id}.${key}`);
    }
  }
});

test("brand IDs do not collide with the existing whole-food library", () => {
  const baseContext = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "data.js"), "utf8"), baseContext, { timeout: 1000 });
  const baseFoods = baseContext.window.NUTRITION_DATA.foods;
  assert.ok(Array.isArray(baseFoods));
  const allIds = [...baseFoods, ...foods].map((food) => food.id);
  assert.equal(new Set(allIds).size, allIds.length);
});

test("generator is deterministic and the checked-in browser bundle is current", async () => {
  const { readProducts, buildBrandLibrary, renderBrandLibrary } = await generator;
  const raw = readProducts();
  const before = JSON.stringify(raw);
  const library = buildBrandLibrary(raw);
  assert.equal(JSON.stringify(raw), before, "building must not mutate research data");
  assert.equal(renderBrandLibrary(library), script);
  assert.deepEqual(library.metadata, metadata);
});

test("deduplication preserves different regions, serving sizes and published nutrition versions", async () => {
  const { buildBrandLibrary } = await generator;
  const base = { ...sourceProducts[0] };
  const variants = [
    base,
    { ...base, id: "same-values-second-source", sourceUrl: "https://example.com/duplicate" },
    { ...base, id: "changed-protein", protein: base.protein + 1 },
    { ...base, id: "changed-region", region: "中国台湾" },
    { ...base, id: "changed-portion", servingLabel: "2个" },
    { ...base, id: "published-weight", servingGrams: 200 },
    { ...base, id: "changed-raw-energy", rawKj: base.rawKj + 1 },
    { ...base, id: "changed-sodium", sodiumMg: base.sodiumMg + 1 }
  ];
  const result = buildBrandLibrary(variants);
  assert.equal(result.foods.length, 7);
  assert.equal(result.metadata.duplicateExcluded, 1);
  assert.equal(result.metadata.duplicateDetails[0].retainedId, base.id);
  assert.equal(result.metadata.duplicateDetails[0].excludedId, "same-values-second-source");
  assert.equal(result.metadata.duplicateDetails[0].sourceUrl, "https://example.com/duplicate");
});

test("validation rejects missing labels, duplicated IDs, invalid units, unsafe URLs and malformed nutrition", async () => {
  const { validateProducts } = await generator;
  const valid = { ...sourceProducts[0] };
  assert.doesNotThrow(() => validateProducts([valid]));
  assert.throws(() => validateProducts([valid, { ...valid }]), /id 重复/);
  for (const data of [null, {}, [], [null], [[]]]) assert.throws(() => validateProducts(data));
  const badFields = [
    ["kcal", -1], ["kcal", NaN], ["kcal", Infinity], ["kcal", "513"], ["kcal", null],
    ["protein", undefined], ["protein", "27"], ["carbs", -1], ["fat", Infinity],
    ["servingLabel", "  "], ["servingGrams", 0], ["servingGrams", "450"],
    ["sourceUrl", "http://example.com/food"], ["sourceUrl", "javascript:alert(1)"],
    ["sourceUrl", "https://user:password@example.com/food"],
    ["verifiedAt", "2026-02-30"], ["verifiedAt", "yesterday"], ["sourceDate", undefined],
    ["nutritionBasis", "estimated"], ["rawKj", 1], ["rawKj", -1], ["sodiumMg", NaN]
  ];
  for (const [key, value] of badFields) {
    assert.throws(() => validateProducts([{ ...valid, [key]: value }]), undefined, `${key}=${String(value)}`);
  }
  const zero = { ...valid, kcal: 0, rawKj: 0, protein: 0, carbs: 0, fat: 0, servingGrams: null };
  assert.doesNotThrow(() => validateProducts([zero]));
  assert.doesNotThrow(() => validateProducts([{ ...zero, protein: null, carbs: null, fat: null }]));
});
