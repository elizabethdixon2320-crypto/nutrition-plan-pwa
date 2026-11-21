(function (factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./daily-planner.js"), require("./food-nutrition.js"));
  } else if (typeof window === "object") {
    window.PreferredPlanner = factory(window.DailyPlanner, window.FoodNutrition);
  }
})(function (daily, nutrition) {
  "use strict";

  const keys = ["kcal", "protein", "carbs", "fat"];
  const mainBrandIds = Object.freeze([
    "mcd-cn-grilled-chicken-sandwich-1", "mcd-cn-cheeseburger-1",
    "mcd-cn-double-cheeseburger-1", "mcd-cn-big-mac-1"
  ]);
  const labels = { kcal: "热量", protein: "蛋白质", carbs: "碳水", fat: "脂肪" };
  const complete = (value) => value && keys.every((key) => Number.isFinite(value[key]) && value[key] >= 0);
  const round = (value, key) => Math.round((value + Number.EPSILON) * (key === "kcal" ? 1 : 10)) / (key === "kcal" ? 1 : 10);
  const fail = (message) => ({ ok: false, errors: [message], meals: [], warnings: [] });
  const isEgg = (food) => /^(egg|egg_raw|egg_scrambled)$/.test(food.id);
  const isBrand = (food) => food.basis === "serving";
  const brandEligible = (food) => isBrand(food) && food.region === "中国大陆" && complete(food) && food.kcal > 0;
  const asItem = (pin) => ({ foodId: pin.foodId, amount: pin.amount, locked: true });

  function indexFoods(foods) {
    if (!Array.isArray(foods)) return null;
    const index = new Map();
    for (const food of foods) {
      if (!food || typeof food.id !== "string" || !food.id || index.has(food.id)) return null;
      index.set(food.id, food);
    }
    return index;
  }

  function validate(foods, targets, options) {
    const index = indexFoods(foods);
    if (!index || !Array.isArray(targets) || targets.length < 1 || targets.length > 6 ||
      Array.from(targets).some((target) => !complete(target) || typeof target.name !== "string" || !target.name.trim()) ||
      new Set(targets.map((target) => target.name.trim())).size !== targets.length) return fail("食物库或 1–6 餐的营养目标不正确，餐名不能重复。");
    if (!options || !Array.isArray(options.brands) || !Array.isArray(options.foodIds) || !Array.isArray(options.pins)) return fail("请提供品牌、食物选择和固定份量清单。");
    if (Array.from(options.brands).some((brand) => typeof brand !== "string" || !brand.trim()) ||
      Array.from(options.foodIds).some((id) => typeof id !== "string" || !index.has(id))) return fail("所选品牌或食物无效，请重新选择。");
    const foodIds = [...new Set(options.foodIds)];
    const brands = [...new Set(options.brands.map((brand) => brand.trim()))];
    for (const id of foodIds) {
      const food = index.get(id);
      if (isBrand(food) && food.region !== "中国大陆") return fail("自选食谱仅使用中国大陆品牌配方；不能混用其他地区的同名产品。");
      const checked = daily.summarize(foods, [{ foodId: id, amount: isBrand(food) ? 1 : 5 }]);
      if (!checked.ok) return fail(checked.errors.join("；"));
    }
    const pins = [];
    const usedPins = new Set();
    for (const pin of options.pins) {
      if (!pin || !Number.isInteger(pin.mealIndex) || pin.mealIndex < 0 || pin.mealIndex >= targets.length ||
        typeof pin.foodId !== "string" || !index.has(pin.foodId) || !Number.isFinite(pin.amount) || pin.amount <= 0) return fail("固定食物须指定有效餐次和大于 0 的份量。");
      if (usedPins.has(`${pin.mealIndex}|${pin.foodId}`)) return fail("同一餐不能重复固定同一种食物，请合并份量。");
      const food = index.get(pin.foodId);
      if (isBrand(food) && food.region !== "中国大陆") return fail("固定的品牌食物也须为中国大陆配方，不能跨地区套用。");
      const checked = daily.summarize(foods, [asItem(pin)]);
      if (!checked.ok) return fail(checked.errors.join("；"));
      pins.push({ foodId: pin.foodId, amount: pin.amount, mealIndex: pin.mealIndex });
      usedPins.add(`${pin.mealIndex}|${pin.foodId}`);
    }
    return { ok: true, index, brands, foodIds, pins };
  }

  function group(food) {
    if (food.category === "谷薯") return "grain";
    if (food.category === "蔬菜") return "vegetable";
    if (food.category === "水果" && food.fat < 10) return "fruit";
    if (["油脂", "坚果"].includes(food.category) || food.id === "avocado") return "fat";
    if (["蛋奶豆", "肉禽", "水产"].includes(food.category)) return "protein";
    return "other";
  }

  // These are conservative tool portion limits, not clinical intake limits.
  // Explicit user pins remain untouched even when they exceed an auto limit.
  function dailyLimitKey(food) {
    if (isEgg(food)) return "whole-eggs";
    if (food.category === "油脂") return "oils";
    if (food.category === "坚果") return "nuts";
    return food.id;
  }

  function dailyLimit(food) {
    if (isEgg(food)) return 200;
    if (food.category === "油脂") return 50;
    if (food.category === "坚果") return 60;
    if (["肉禽", "水产"].includes(food.category)) return 600;
    if (food.category === "谷薯") return ["生重", "干重"].includes(food.state) ? 300 : 1000;
    return 1000;
  }

  function limits(food, used) {
    let min = 25, max = 300, step = 5;
    switch (food.category) {
      case "谷薯": min = ["生重", "干重"].includes(food.state) ? 20 : 50; max = ["生重", "干重"].includes(food.state) ? 180 : 500; break;
      case "肉禽": case "水产": min = 40; max = 300; break;
      case "蔬菜": min = 50; max = 300; break;
      case "水果": min = 50; max = 250; break;
      case "坚果": min = 5; max = 45; break;
      case "油脂": min = 5; max = 25; break;
      case "蛋奶豆": min = 50; max = 400; break;
    }
    if (isEgg(food)) { min = 50; max = 200; step = 50; }
    if (food.id === "egg_white") { min = 30; max = 300; }
    if (food.id === "cheddar") { min = 10; max = 60; }
    const remaining = dailyLimit(food) - (used.get(dailyLimitKey(food)) || 0);
    max = Math.floor(Math.min(max, remaining) / step) * step;
    return { min, max: Math.max(0, max), step };
  }

  function choicesFor(food, used) {
    const { min, max, step } = limits(food, used);
    const amounts = [0];
    for (let amount = min; amount <= max; amount += step) amounts.push(amount);
    return amounts.map((amount) => ({ amount, values: nutrition.calculate(food, amount) }));
  }

  function shortlist(pool, target, frequency, excluded) {
    const breakfast = /早|加餐/.test(target.name);
    const buckets = new Map();
    for (const food of pool) {
      if (excluded.has(food.id)) continue;
      const role = group(food);
      let preference = (frequency.get(food.id) || 0) * 2;
      if (breakfast) {
        if (isEgg(food) || /^(oats|milk|yogurt|greek_yogurt|soy_milk)/.test(food.id)) preference -= 1;
        if (["肉禽", "水产"].includes(food.category)) preference += 1;
      }
      const bucket = buckets.get(role) || [];
      bucket.push({ food, preference });
      buckets.set(role, bucket);
    }
    // Limiting alternatives per role keeps large selections fast and readable.
    return ["grain", "protein", "vegetable", "fruit", "fat", "other"].flatMap((role) => (buckets.get(role) || [])
      .sort((a, b) => a.preference - b.preference || a.food.id.localeCompare(b.food.id, "en"))
      .slice(0, role === "protein" ? 4 : 3).map(({ food }) => food));
  }

  function fit(foods, target, fixed, pool, used, frequency) {
    const fixedSummary = daily.summarize(foods, fixed);
    const excluded = new Set(fixed.map((item) => item.foodId));
    const hasPinnedOil = fixed.some((item) => foods.find((food) => food.id === item.foodId)?.category === "油脂");
    const candidates = shortlist(pool, target, frequency, excluded).filter((food) => (!hasPinnedOil || food.category !== "油脂") && limits(food, used).max >= limits(food, used).min);
    if (!candidates.length) return { items: fixed.map((item) => ({ ...item })), score: Infinity };
    const scales = { kcal: Math.max(100, target.kcal) / 1.8, protein: Math.max(12, target.protein), carbs: Math.max(15, target.carbs), fat: Math.max(8, target.fat) };
    const tables = candidates.map((food) => choicesFor(food, used));
    const wantsProduce = candidates.some((food) => ["vegetable", "fruit"].includes(group(food))) && target.kcal >= 250;
    const maxAutoItems = Math.max(1, 6 - fixed.length);
    const breakfast = /早|加餐/.test(target.name);
    const dairy = (food) => /^(milk|yogurt|greek_yogurt|soy_milk|cottage_cheese)/.test(food.id);
    const breakfastGrain = (food) => /^(oats|bread|whole_wheat_bread)/.test(food.id);
    const hasBreakfastGrain = candidates.some(breakfastGrain);
    const hasMainGrain = candidates.some((food) => group(food) === "grain" && !breakfastGrain(food));
    const hasBreakfastProtein = candidates.some((food) => dairy(food) || isEgg(food));
    const hasMainProtein = candidates.some((food) => ["肉禽", "水产"].includes(food.category) || /^(tofu|tempeh|edamame)/.test(food.id));
    const hasFruit = candidates.some((food) => group(food) === "fruit");
    const hasVegetable = candidates.some((food) => group(food) === "vegetable");

    function mealPreference(food) {
      if (breakfast) {
        if (hasBreakfastGrain && group(food) === "grain" && !breakfastGrain(food)) return .07;
        if (hasBreakfastProtein && ["肉禽", "水产"].includes(food.category)) return .06;
        if (hasFruit && group(food) === "vegetable") return .035;
        if (food.category === "油脂") return .025;
      } else {
        if (hasMainGrain && breakfastGrain(food)) return .07;
        if (hasMainProtein && dairy(food)) return .06;
        if (hasVegetable && group(food) === "fruit") return .02;
      }
      return 0;
    }

    function score(indices) {
      const totals = { ...fixedSummary.totals };
      const mealUse = new Map();
      let active = 0, produce = 0, penalty = 0, oils = 0;
      for (let i = 0; i < candidates.length; i += 1) {
        const choice = tables[i][indices[i]];
        if (!choice.amount) continue;
        if (candidates[i].category === "油脂" && ++oils > 1) return Infinity;
        const capKey = dailyLimitKey(candidates[i]);
        const amountForKey = (mealUse.get(capKey) || 0) + choice.amount;
        if (amountForKey + (used.get(capKey) || 0) > dailyLimit(candidates[i])) return Infinity;
        mealUse.set(capKey, amountForKey);
        active += 1;
        if (["fruit", "vegetable"].includes(group(candidates[i]))) produce += choice.amount;
        penalty += 0.003 + 0.003 * Math.min(3, frequency.get(candidates[i].id) || 0) + mealPreference(candidates[i]);
        for (const key of keys) totals[key] += choice.values[key];
      }
      if (active > maxAutoItems) return Infinity;
      // Never trade a large calorie overshoot for a smaller macro deviation.
      // Pinned overshoots are retained by generate(), without entering fit().
      if (totals.kcal > target.kcal + Math.max(15, target.kcal * .05)) return Infinity;
      if (wantsProduce) {
        const guide = breakfast ? 100 : target.kcal >= 300 ? 150 : 75;
        penalty += .07 * (Math.max(0, guide - produce - fixedSummary.produceGrams) / guide) ** 2;
      }
      let result = penalty;
      for (const key of keys) result += ((totals[key] - target[key]) / scales[key]) ** 2;
      if (totals.kcal > target.kcal) result += 3 * ((totals.kcal - target.kcal) / scales.kcal) ** 2;
      return result;
    }

    let best = null;
    const baseOrder = candidates.map((_, i) => i);
    const orders = [baseOrder, [...baseOrder].reverse(), [...baseOrder.slice(1), baseOrder[0]]];
    const produceIndex = candidates.findIndex((food) => group(food) === (breakfast && hasFruit ? "fruit" : "vegetable"));
    for (const order of orders) for (const produceSeed of [false, true]) {
      const indices = candidates.map(() => 0);
      if (produceSeed && produceIndex >= 0 && wantsProduce) {
        const guide = breakfast ? 100 : 150;
        indices[produceIndex] = tables[produceIndex].reduce((bestIndex, choice, choiceIndex, choices) => Math.abs(choice.amount - guide) < Math.abs(choices[bestIndex].amount - guide) ? choiceIndex : bestIndex, 0);
      }
      let current = score(indices);
      for (let sweep = 0; sweep < 18; sweep += 1) {
        let changed = false;
        for (const i of order) {
          // Evaluate a practical produce-anchored solution as well as the
          // unconstrained solution; a local coordinate step cannot otherwise
          // trade 100g of fruit against an already fitted grain portion.
          if (produceSeed && i === produceIndex && wantsProduce) continue;
          const original = indices[i];
          let chosen = original;
          let chosenScore = current;
          for (let j = 0; j < tables[i].length; j += 1) {
            indices[i] = j;
            const candidateScore = score(indices);
            if (candidateScore < chosenScore - 1e-10) { chosen = j; chosenScore = candidateScore; }
          }
          indices[i] = chosen;
          if (chosen !== original) changed = true;
          current = chosenScore;
        }
        if (!changed) break;
      }
      if (!best || current < best.score - 1e-10) best = { indices: [...indices], score: current };
    }
    return { score: best.score, items: [...fixed.map((item) => ({ ...item })), ...candidates.flatMap((food, i) => {
      const amount = tables[i][best.indices[i]].amount;
      return amount ? [{ foodId: food.id, amount, locked: false }] : [];
    })] };
  }

  function noteGaps(foods, target, items, warnings) {
    const summary = daily.summarize(foods, items);
    const gaps = [];
    for (const key of keys) {
      if (summary.missing[key]) continue;
      const difference = round(summary.totals[key] - target[key], key);
      if (Math.abs(difference) > Math.max(key === "kcal" ? 30 : 3, target[key] * 0.1)) gaps.push(`${labels[key]}偏${difference < 0 ? "低" : "高"}`);
    }
    if (gaps.length) warnings.push(`本餐${gaps.join("、")}，请查看营养差额；仅使用所选食物，未补入其他食物。`);
    if (!items.length) warnings.push("当前选择与份量限制无法为本餐生成合适组合，请增加可用食物或调整餐次比例。");
    return [...new Set(warnings)];
  }

  function generate(foods, targets, options) {
    const checked = validate(foods, targets, options);
    if (!checked.ok) return checked;
    const { index, brands, foodIds, pins } = checked;
    const selected = foodIds.map((id) => index.get(id));
    const notes = [];
    const pool = selected.filter((food) => !isBrand(food) && complete(food) && food.kcal > 0 && food.id !== "brazil_nuts" && food.category !== "调味");
    const automaticBrands = new Map(selected.filter(brandEligible).map((food) => [food.id, food]));
    for (const brand of brands) {
      const eligible = mainBrandIds.map((id) => index.get(id)).filter((food) => food && food.brand === brand && brandEligible(food));
      eligible.forEach((food) => automaticBrands.set(food.id, food));
      if (!eligible.length) notes.push(`${brand}暂无符合当前大陆完整营养主食白名单的条目；如想吃已收录产品，请明确固定产品与份数。未改用其他品牌或地区。`);
    }
    if (selected.some((food) => !complete(food))) notes.push("勾选食物中有营养未公布项，未自动安排；需要时请固定具体餐次和份量，未知营养不会填零。");
    if (selected.some((food) => food.id === "brazil_nuts" || food.category === "调味")) notes.push("巴西坚果与调味品不用于自动凑营养；如需使用，请固定实际份量。自动配量上限不代表医学建议。");
    if (!foodIds.length && !brands.length && !pins.length) return fail("请先选择品牌、常见食物，或添加固定食物。");

    const used = new Map();
    const frequency = new Map();
    for (const pin of pins) {
      const food = index.get(pin.foodId);
      if (!isBrand(food)) used.set(dailyLimitKey(food), (used.get(dailyLimitKey(food)) || 0) + pin.amount);
      frequency.set(food.id, (frequency.get(food.id) || 0) + 1);
    }
    // Any explicit branded serving disables extra automatic branded servings.
    // Multiple branded meals occur only when the user has explicitly pinned them.
    const hasBrandPin = pins.some((pin) => isBrand(index.get(pin.foodId)));
    let brandMealIndex = -1;
    if (!hasBrandPin && automaticBrands.size) {
      const ranked = targets.map((target, mealIndex) => ({ target, mealIndex })).sort((a, b) => Number(/早|加餐/.test(a.target.name)) - Number(/早|加餐/.test(b.target.name)) || b.target.kcal - a.target.kcal || a.mealIndex - b.mealIndex);
      const compatible = ranked.find(({ target, mealIndex }) => {
        const fixed = daily.summarize(foods, pins.filter((pin) => pin.mealIndex === mealIndex).map(asItem));
        return !keys.some((key) => fixed.missing[key]) && [...automaticBrands.values()].some((food) => food.kcal <= (target.kcal - fixed.totals.kcal) * .9 && food.fat + fixed.totals.fat <= target.fat + Math.max(3, target.fat * .2));
      });
      if (compatible) brandMealIndex = compatible.mealIndex;
      else notes.push("所选标准份品牌食品无法在本餐预算内合理安排，未自动添加；可明确固定份量并查看实际差额。");
    }

    const meals = [];
    for (const [mealIndex, target] of targets.entries()) {
      const fixed = pins.filter((pin) => pin.mealIndex === mealIndex).map(asItem);
      const fixedSummary = daily.summarize(foods, fixed);
      let warnings = [];
      let items = fixed;
      if (keys.some((key) => fixedSummary.missing[key])) {
        warnings.push("本餐固定食物有未公布营养素，已保留固定份量并暂停自动补配；热量照常计入，未知不作零，不能宣称营养已达标。");
      } else if (fixedSummary.totals.kcal >= target.kcal || target.kcal - fixedSummary.totals.kcal < 100) {
        warnings.push(fixed.length ? "固定食物已用完或接近用完本餐热量，原份量保留，未强行添加食物。" : "本餐热量预算不足 100 kcal，未自动拼凑整餐。");
      } else {
        if (keys.some((key) => fixedSummary.totals[key] > target[key])) warnings.push("固定食物的部分营养已超出目标；固定份量保留，后续组合不代表四项都能达标。");
        if (mealIndex === brandMealIndex) {
          let best = null;
          for (const food of automaticBrands.values()) {
            if (food.kcal > (target.kcal - fixedSummary.totals.kcal) * .9 || food.fat + fixedSummary.totals.fat > target.fat + Math.max(3, target.fat * .2)) continue;
            const candidate = fit(foods, target, [...fixed, { foodId: food.id, amount: 1, locked: true }], pool, used, frequency);
            // A brand-only selected pool is still useful, but keep its real gap.
            const summary = daily.summarize(foods, candidate.items);
            const score = Number.isFinite(candidate.score) ? candidate.score : keys.reduce((sum, key) => sum + ((summary.totals[key] - target[key]) / Math.max(key === "kcal" ? 100 : 10, target[key])) ** 2, 0);
            if (!best || score < best.score) best = { items: candidate.items, score };
          }
          if (best) { items = best.items; warnings.push("标准份品牌食品仅自动安排 1 餐、1 份；基础食物需另备，不是门店套餐。手动固定的品牌份量另按本人选择保留。"); }
          else items = fit(foods, target, fixed, pool, used, frequency).items;
        } else items = fit(foods, target, fixed, pool, used, frequency).items;
      }
      for (const item of items) {
        if (item.locked) continue;
        const food = index.get(item.foodId);
        used.set(dailyLimitKey(food), (used.get(dailyLimitKey(food)) || 0) + item.amount);
        frequency.set(food.id, (frequency.get(food.id) || 0) + 1);
      }
      warnings = noteGaps(foods, target, items, warnings);
      meals.push({ name: target.name, target: { ...target }, items: items.map((item) => ({ ...item })), warnings });
    }
    return { ok: true, errors: [], meals, warnings: [...new Set(notes)] };
  }

  return { generate };
});
