(function () {
  "use strict";

  const STORAGE_KEY = "personal-nutrition-plan-v1";
  const baseData = window.NUTRITION_DATA;
  const brandFoods = window.BRAND_FOODS || [];
  const foods = [...baseData.foods, ...brandFoods];
  const categories = [...baseData.categories, "品牌食品"];
  const library = { ...baseData.library, itemCount: foods.length };
  const foodNutrition = window.FoodNutrition;
  const planner = window.NutritionPlanner;
  const mealPlanner = window.MealPlanner;
  const recipePlanner = window.RecipePlanner;
  const dailyPlanner = window.DailyPlanner;
  const foodById = new Map(foods.map((food) => [food.id, food]));
  const appRoot = document.getElementById("app");

  const commonFoodIds = new Set(foods.filter((food) => food.common).map((food) => food.id));

  function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dateHeading() {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "short"
    }).format(new Date());
  }

  function round(value, digits = 1) {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function icon(name, className = "") {
    return `<img class="ui-icon ${className}" src="icons/ui/${name}.svg" alt="" aria-hidden="true" />`;
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function nutrientsFor(food, grams) {
    return foodNutrition.calculate(food, grams);
  }

  function nutrientText(value, unit = "") { return Number.isFinite(value) ? `${formatNumber(value, 1)}${unit}` : "未公布"; }
  function amountText(food, amount) { return foodNutrition.amountLabel(food, amount); }
  function logAmount(entry) { return amountText(foodForLog(entry), entry.grams); }
  function foodBasis(food) { return foodNutrition.isServing(food) ? `份（${food.servingLabel || "原标准份"}）` : "100g"; }

  function makeLog(foodId, grams, meal, source = "manual") {
    const food = foodById.get(foodId);
    return {
      id: makeId("log"),
      date: toDateKey(new Date()),
      meal,
      source,
      foodId,
      name: food.name,
      // Legacy field name: quantityUnit distinguishes grams from standard servings.
      grams: Number(grams),
      measure: food.state,
      quantityUnit: foodNutrition.isServing(food) ? "serving" : "g",
      ...(foodNutrition.isServing(food) ? { foodSnapshot: { ...food } } : {}),
      ...nutrientsFor(food, grams)
    };
  }

  function seedWeights() {
    const values = [85.0, 84.8, 84.6, 84.6, 84.2, 84.5, 84.1, 83.9, 83.9, 84.3];
    return values.map((value, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (values.length - 1 - index));
      return { date: toDateKey(date), value };
    });
  }

  function createDefaultState() {
    const today = toDateKey(new Date());
    const breakfast = [
      makeLog("oats", 70, "早餐"),
      makeLog("egg", 150, "早餐"),
      makeLog("blueberry", 100, "早餐")
    ].map((item) => ({ ...item, date: today }));

    return {
      version: 2,
      profile: {
        sex: "male",
        startingWeight: 85,
        currentWeight: 84.3,
        activityId: "low",
        age: null,
        heightCm: null,
        bodyFatPct: null,
        formula: "auto",
        dailyActivity: "sedentary",
        trainingDays: null,
        trainingMinutes: null,
        goal: "lose"
      },
      targets: {
        carbs: 187,
        protein: 120,
        fat: 68,
        source: "视频示例目标"
      },
      plan: null,
      mealSchedule: { defaultMeals: mealPlanner.preset(3), byDate: {} },
      recipeDrafts: {},
      dailyRecipeDrafts: {},
      logs: breakfast,
      weights: seedWeights(),
      historicalCompletion: { carbs: 83, protein: 91, fat: 80 },
      recentFoodIds: ["oats", "egg", "blueberry", "rice_cooked", "chicken_breast"],
      createdAt: new Date().toISOString()
    };
  }

  function restoreServingLog(entry) {
    if (entry.foodSnapshot?.basis !== "serving") return entry;
    // Older open tabs may have edited an unfamiliar food as grams or coerced null to 0.
    // Recompute from the original snapshot, never today's product formulation.
    return { ...entry, name: entry.foodSnapshot.name, measure: entry.foodSnapshot.state,
      quantityUnit: "serving", ...nutrientsFor(entry.foodSnapshot, entry.grams) };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && [1, 2, 3].includes(saved.version)) {
        saved.logs = (saved.logs || []).map((entry) => {
          if (entry.foodSnapshot?.basis === "serving") return restoreServingLog(entry);
          const food = foodById.get(entry.foodId);
          if (!food) return entry;
          return {
            ...entry,
            name: food.name,
            measure: food.state,
            ...nutrientsFor(food, entry.grams)
          };
        });
        saved.profile = { age: null, heightCm: null, bodyFatPct: null, formula: "auto", dailyActivity: "sedentary", trainingDays: null, trainingMinutes: null, goal: "lose", ...saved.profile };
        saved.plan = saved.plan || null;
        saved.mealSchedule = saved.mealSchedule || { defaultMeals: mealPlanner.preset(3), byDate: {} };
        saved.recipeDrafts = saved.recipeDrafts || {};
        saved.dailyRecipeDrafts = saved.dailyRecipeDrafts || {};
        // Keep additive storage changes readable by an older cached app shell.
        saved.version = 2;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        return saved;
      }
    } catch (error) {
      console.warn("本地记录读取失败，已恢复演示数据。", error);
    }
    const initial = createDefaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function applyPlan(plan) {
    state.plan = plan;
    state.targets = { carbs: plan.carbs, protein: plan.protein, fat: plan.fat, source: "个人资料估算目标" };
  }

  function targetCalories() {
    return state.plan ? state.plan.kcal : state.targets.carbs * 4 + state.targets.protein * 4 + state.targets.fat * 9;
  }

  function todayLogs() {
    const today = toDateKey(new Date());
    return state.logs.filter((entry) => entry.date === today);
  }

  function mealPlanFor(date = toDateKey(new Date())) {
    const schedule = state.mealSchedule || {};
    const custom = mealPlanner.validate(schedule.byDate?.[date]);
    if (custom.ok) return custom.meals;
    const effectiveDates = Object.keys(schedule.defaultsByDate || {}).filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key) && key <= date).sort().reverse();
    for (const key of effectiveDates) {
      const defaults = mealPlanner.validate(schedule.defaultsByDate[key]);
      if (defaults.ok) return defaults.meals;
    }
    const fallback = mealPlanner.validate(schedule.defaultMeals);
    return fallback.ok ? fallback.meals : mealPlanner.preset(3);
  }

  function mealOptions(selected) {
    const names = mealPlanFor().map((meal) => meal.name);
    if (selected && !names.includes(selected)) names.push(selected);
    return names.map((name) => `<option value="${escapeHtml(name)}" ${selected === name ? "selected" : ""}>${escapeHtml(name)}${mealPlanFor().some((meal) => meal.name === name) ? "" : "（计划外）"}</option>`).join("");
  }

  function sumEntries(entries) {
    return foodNutrition.sum(entries);
  }

  function formatNumber(value, digits = 0) {
    return new Intl.NumberFormat("zh-CN", {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0
    }).format(value);
  }

  const ui = {
    screen: "today",
    modal: null,
    search: "",
    category: "全部",
    brand: "全部",
    brandRegion: "中国大陆",
    selectedFoodId: null,
    foodDraft: { grams: 100, meal: "午餐" },
    selectedLogId: null,
    logDraft: { grams: 100, meal: "午餐" },
    toast: "",
    recalcMessage: "",
    profileDraft: null,
    mealDraft: null,
    mealDate: null,
    mealAsDefault: false,
    preferredMeal: null,
    renderedDate: toDateKey(new Date()),
    recipeMeal: null,
    recipeDate: null,
    recipeMode: "remaining",
    recipeTemplate: "",
    recipeItems: [],
    recipeErrors: [],
    recipeCapped: [],
    recipeBasis: "",
    replacementIndex: null,
    replacementSearch: "",
    dayPlan: null,
    dayStyle: "mixed",
    dayReplaceMeal: null,
    dayReplaceItem: null,
    daySearch: "",
    dayFilter: "all",
    deferredInstallPrompt: null,
    online: navigator.onLine
  };

  let state = loadState();
  let toastTimer = null;

  function showToast(message) {
    ui.toast = message;
    clearTimeout(toastTimer);
    render();
    toastTimer = setTimeout(() => {
      ui.toast = "";
      render();
    }, 2600);
  }

  function pageMeta() {
    const map = {
      today: ["今日", dateHeading()],
      food: ["食物库", `${library.itemCount} 种常用食物`],
      trends: ["趋势", "最近十天"]
    };
    return map[ui.screen];
  }

  function renderTopbar() {
    const [title, subtitle] = pageMeta();
    return `
      <header class="topbar">
        <div class="topbar-title">
          <strong>${title}</strong>
          <span>${subtitle}</span>
        </div>
        <button class="profile-button" data-action="open-profile" aria-label="打开个人资料">${icon("user-circle")}</button>
      </header>
    `;
  }

  function macroRow(label, value, target, unknown = 0) {
    const remaining = Math.max(0, target - value);
    const percentage = target > 0 ? clamp((value / target) * 100, 0, 100) : 0;
    return `
      <div class="macro-card">
        <div class="macro-card-head">
          <span>${label}</span>
          <small>${unknown ? "资料不全" : `${Math.round(percentage)}%`}</small>
        </div>
        <strong>${unknown ? "—" : formatNumber(remaining, 1)}<small>g</small></strong>
        <p>${unknown ? "部分食物未公布此项" : "今日还差"}</p>
        <div class="macro-track" aria-label="${unknown ? `${label}数据不完整` : `${label}已完成 ${Math.round(percentage)}%`}">
          <div class="macro-fill" style="width:${unknown ? 0 : percentage}%"></div>
        </div>
      </div>
    `;
  }

  function renderToday() {
    const entries = todayLogs();
    const totals = sumEntries(entries);
    const remainingKcal = Math.max(0, targetCalories() - totals.kcal);
    const proteinRemaining = Math.max(0, state.targets.protein - totals.protein);
    const configuredMeals = mealPlanFor();
    const allocation = state.plan ? mealPlanner.allocate({ ...state.targets, kcal: targetCalories() }, configuredMeals) : { meals: [] };
    const plannedNames = configuredMeals.map((meal) => meal.name);
    const extraNames = [...new Set(entries.map((entry) => entry.meal))].filter((name) => !plannedNames.includes(name));
    const meals = [...plannedNames, ...extraNames];

    const mealHtml = meals.map((meal) => {
      const mealEntries = entries.filter((entry) => entry.meal === meal);
      const mealTotal = sumEntries(mealEntries);
      const mealTarget = allocation.meals.find((item) => item.name === meal);
      const isPlanned = plannedNames.includes(meal);
      const rows = mealEntries.length
        ? mealEntries.map((entry) => `
            <button class="meal-entry" data-log-id="${escapeHtml(entry.id)}" aria-label="修改${escapeHtml(entry.name)}记录">
              <div class="meal-mark" aria-hidden="true">${escapeHtml(entry.name.slice(0, 1))}</div>
              <div>
                <h3>${escapeHtml(entry.name)}</h3>
                <p>${escapeHtml(logAmount(entry))} · ${escapeHtml(entry.measure)} · ${entry.source === "photo" ? "照片确认" : entry.source === "recommendation" ? "推荐方案记录" : "手动记录"}</p>
              </div>
              <div class="meal-entry-side">
                <div class="kcal">${formatNumber(entry.kcal)} kcal</div>
                <span>修改</span>
              </div>
            </button>
          `).join("")
        : `<div class="empty-meal">还没有记录</div>`;
      return `
        <section class="meal-group ${isPlanned ? "planned-meal" : "unplanned-meal"}" data-meal-name="${escapeHtml(meal)}">
          <div class="meal-group-head">
            <strong>${escapeHtml(meal)}${!isPlanned ? '<small class="unplanned-label">计划外记录</small>' : ""}</strong>
            <span>${formatNumber(mealTotal.kcal)} kcal</span>
          </div>
          ${mealTarget ? mealBudget(mealTarget, mealTotal) : `<p class="microcopy">${isPlanned ? "完善个人资料后，将自动生成本餐营养目标。" : "仍计入每日总量，不额外增加目标；点击记录可移到计划内餐次。"}</p>`}
          ${mealTarget ? `<button class="button primary full recipe-open-button" data-action="open-recipe" data-meal="${escapeHtml(meal)}">推荐吃什么 · 自动算克数</button>` : ""}
          ${rows}
          ${isPlanned ? `<button class="button secondary full meal-record-button" data-action="record-meal" data-meal="${escapeHtml(meal)}">为${escapeHtml(meal)}添加食物</button>` : ""}
        </section>
      `;
    }).join("");

    return `
      <main class="screen" data-screen="today">
        <div class="home-intro">
          <p class="page-eyebrow">GOOD DAY</p>
          <h1 class="page-title">今天怎么吃，<br />心里有数。</h1>
          <p class="page-intro">先看剩余，再安排下一餐。</p>
        </div>

        <section class="summary">
          ${!state.plan ? `<div class="plan-notice"><strong>尚未生成个人目标</strong><p>下方为旧版／演示目标，不代表你的每日需要。原有餐食与体重记录已保留。</p><button class="pill-button" data-action="open-profile">完善资料并计算</button></div>` : ""}
          <div class="summary-head">
            <div>
              <span>${state.plan ? "今日还可摄入" : "旧版／演示剩余"}</span>
              <strong>${formatNumber(remainingKcal)}<small>千卡</small></strong>
            </div>
            <button class="pill-button" data-action="open-formula">目标说明</button>
          </div>
          <div class="summary-meta">
            <div><span>已记录</span><strong>${formatNumber(totals.kcal)}</strong><small>kcal</small></div>
            <div><span>${state.plan ? "今日目标" : "待更新目标"}</span><strong>${formatNumber(targetCalories())}</strong><small>kcal</small></div>
            <div><span>当前体重</span><strong>${formatNumber(state.profile.currentWeight, 1)}</strong><small>kg</small></div>
          </div>
          ${state.plan ? `<p class="plan-summary">维持约 ${formatNumber(state.plan.maintenanceKcal)} kcal · ${state.plan.deficitPct ? `减脂缺口 ${state.plan.deficitPct}%` : "维持体重"} · ${state.plan.method === "lean" ? "体脂参考法" : "身高体重法"}</p>` : ""}
        </section>

        <section class="quick-actions" aria-label="快捷功能">
          <button data-action="go-food">${icon("salad")}<strong>查食物</strong><span>热量与营养</span></button>
          <button data-action="open-profile">${icon("scale")}<strong>个人资料</strong><span>体重与目标</span></button>
          <button data-action="go-trends">${icon("chart-line")}<strong>十日趋势</strong><span>查看变化</span></button>
        </section>

        <section class="section section-card">
          <div class="section-head"><h2>宏量剩余</h2><span>今日还差</span></div>
          <div class="macro-list">
            ${macroRow("碳水", totals.carbs, state.targets.carbs, totals.missing.carbs)}
            ${macroRow("蛋白质", totals.protein, state.targets.protein, totals.missing.protein)}
            ${macroRow("脂肪", totals.fat, state.targets.fat, totals.missing.fat)}
          </div>
          <div class="highlight">
            ${icon("target-arrow")}
            <div>
              <span>下一餐建议</span>
              <h3>${totals.missing.protein ? "部分记录未公布蛋白质" : `还可安排 ${formatNumber(proteinRemaining, 1)}g 蛋白质`}</h3>
              <p>${totals.missing.protein ? "热量仍计入；未知营养不当作零，不据此精算剩余。" : "先确定蛋白质来源，再补主食与蔬菜。"}</p>
            </div>
          </div>
          <button class="button primary full" data-action="go-food">记录下一餐</button>
        </section>

        <section class="section section-card">
          <div class="section-head">
            <h2>今日 ${configuredMeals.length} 餐</h2>
            <button class="pill-button" data-action="open-meals">调整餐次</button>
          </div>
          <p class="microcopy">${state.plan ? `每日 ${formatNumber(targetCalories())} kcal 按比例分配；改变餐数不改变每日总量。` : "先在个人资料生成每日目标，再查看每餐分配。"}${extraNames.length ? " 当前有计划外记录，每日剩余量请以上方汇总为准。" : ""}</p>
          <button class="button primary full daily-open-button" data-action="open-daily">定制全天食谱</button>
          <p class="microcopy">品牌食品＋鸡蛋、米饭等常见食物，列出每餐份量；计划不会自动算作已吃。</p>
          <div class="meal-groups">${mealHtml}</div>
        </section>
      </main>
    `;
  }

  function mealBudget(target, consumed) {
    const fields = [["kcal", "热量", "kcal", 0], ["protein", "蛋白质", "g", 1], ["carbs", "碳水", "g", 1], ["fat", "脂肪", "g", 1]];
    return `<div class="meal-budget"><p>本餐分配 ${formatNumber(target.percent, 1)}%</p><table aria-label="${escapeHtml(target.name)}营养目标与摄入"><thead><tr><th scope="col">营养</th><th scope="col">目标</th><th scope="col">已吃</th><th scope="col">剩余 / 超出</th></tr></thead><tbody>${fields.map(([key, label, unit, digits]) => {
      const difference = round(target[key] - consumed[key], digits);
      const unknown = consumed.missing[key] > 0;
      return `<tr><th scope="row">${label}<small>${unit}</small></th><td>${formatNumber(target[key], digits)}</td><td>${unknown ? `已知 ${formatNumber(consumed[key], digits)}＋` : formatNumber(consumed[key], digits)}</td><td class="${!unknown && difference < 0 ? "meal-over" : ""}">${unknown ? "待核" : `${difference < 0 ? "超 " : ""}${formatNumber(Math.abs(difference), digits)}`}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  function filteredFoods() {
    const normalized = ui.search.trim().toLowerCase();
    return foods.filter((food) => {
      const categoryMatch =
        ui.category === "全部" ||
        (ui.category === "常用" && commonFoodIds.has(food.id)) ||
        food.category === ui.category;
      const searchText = [food.name, food.state, food.brand || "", food.region || "", ...(food.aliases || [])].join(" ").toLowerCase();
      const searchMatch = !normalized || searchText.includes(normalized);
      const regionMatch = !food.brand || ui.brandRegion === "全部地区" || food.region === ui.brandRegion;
      const brandMatch = ui.brand === "全部" || food.brand === ui.brand;
      return categoryMatch && searchMatch && regionMatch && brandMatch;
    });
  }

  function renderFood() {
    const visibleFoods = filteredFoods();
    const chips = categories.map((category) => `
      <button class="chip ${ui.category === category ? "active" : ""}" data-category="${category}">${category}</button>
    `).join("");
    const rows = visibleFoods.map((food) => `
      <button class="food-row" data-food-id="${food.id}">
        <div class="food-index-mark" aria-hidden="true">${escapeHtml(food.name.slice(0, 1))}</div>
        <div>
          <h3>${escapeHtml(food.name)}</h3>
          <p>${foodNutrition.isServing(food) ? `${escapeHtml(food.region)} · ${escapeHtml(food.servingLabel)}` : `${food.state} · 常用 ${food.portion}g`}<br />碳 ${nutrientText(food.carbs)} · 蛋 ${nutrientText(food.protein)} · 脂 ${nutrientText(food.fat)}</p>
        </div>
        <div class="food-kcal">
          <strong>${food.kcal}</strong>
          <span>${foodNutrition.isServing(food) ? "kcal/份" : "kcal/100g"}</span>
        </div>
      </button>
    `).join("");

    return `
      <main class="screen" data-screen="food">
        <div class="food-intro">
          <p class="page-eyebrow">FOOD INDEX</p>
          <h1 class="page-title">想吃什么，搜一搜。</h1>
          <p class="page-intro">基础食物按克，品牌成品按标准份。地区、规格与生熟状态分别计算。</p>
        </div>

        <div class="search-wrap">
          ${icon("search", "search-icon")}
          <input class="search-input" type="search" value="${escapeHtml(ui.search)}" placeholder="搜索米饭、麦当劳、赛百味…" aria-label="搜索食物" data-input="food-search" />
          ${ui.search ? `<button class="search-clear" data-action="clear-search" aria-label="清空搜索">${icon("x")}</button>` : ""}
        </div>
        <div class="brand-filters">
          <label>品牌<select data-input="brand-filter"><option value="全部">全部品牌与基础食物</option>${[...new Set(brandFoods.map((food) => food.brand))].map((brand) => `<option value="${escapeHtml(brand)}" ${ui.brand === brand ? "selected" : ""}>${escapeHtml(brand)}</option>`).join("")}</select></label>
          <label>品牌数据地区<select data-input="brand-region">${["中国大陆", "中国台湾", "全部地区"].map((region) => `<option ${ui.brandRegion === region ? "selected" : ""}>${region}</option>`).join("")}</select></label>
        </div>
        <div class="brand-coverage"><p>${ui.brandRegion === "中国大陆" ? "默认仅显示大陆品牌数据。肯德基、汉堡王目前仅有台湾地区参考，不能用于大陆同名产品。" : "请核对地区：不同市场的同名产品配方、份量可能不同，不能互相套用。"}</p><button class="pill-button" data-action="brand-info">收录范围与说明</button></div>
        <div class="food-browser">
          <div class="chips" aria-label="食物分类">${chips}</div>
          <div class="catalog-panel">
            <div class="catalog-note"><span>见条目标注单位</span><strong>${visibleFoods.length} / ${library.itemCount}</strong></div>
            <div class="food-list">
              ${rows || `<div class="no-results">没有匹配结果。<br />换一个名称或分类试试。</div>`}
            </div>
          </div>
        </div>
      </main>
    `;
  }

  function renderTrends() {
    const weights = [...state.weights].sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
    const first = weights[0];
    const last = weights[weights.length - 1];
    const delta = round(last.value - first.value, 1);
    const completion = state.historicalCompletion;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 10);
    const nextReviewText = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(nextReview);

    return `
      <main class="screen trends-screen" data-screen="trends">
        <div class="trend-intro">
          <p class="trend-kicker">TEN DAYS</p>
          <h1 class="trend-title">十天里，身体写下<br />一条缓慢的线。</h1>
          <p>记录变化，不评判一天。</p>
        </div>

        <div class="trend-summary">
          <div><span>十日变化</span><div class="trend-delta">${delta > 0 ? "+" : "−"}${formatNumber(Math.abs(delta), 1)}<small>kg</small></div></div>
          <div class="trend-next"><span>下一次复盘</span><strong>${nextReviewText}</strong><small>还有 10 天</small></div>
        </div>

        <section class="chart-card">
          ${window.renderWeightChart(weights)}
          <p class="human-note">单日上下不代表执行失效。把餐食、睡眠和训练一起看，趋势才会说完整的话。</p>
        </section>

        <div class="trend-stats">
          <div class="trend-stat"><strong>${weights.length} / 10</strong><span>有记录的日子</span></div>
          <div class="trend-stat"><strong>${Math.round((completion.carbs + completion.protein + completion.fat) / 3)}%</strong><span>平均完成度</span></div>
          <div class="trend-stat"><strong>${formatNumber(state.profile.currentWeight, 1)}</strong><span>当前体重 kg</span></div>
        </div>

        <section class="section section-card">
          <div class="section-head"><h2>三种营养的节奏</h2><span>近 10 天平均</span></div>
          <div class="rhythm-list">
            <div class="rhythm-row"><span>碳水</span><div class="rhythm-track"><div class="rhythm-fill" style="width:${completion.carbs}%"></div></div><b>${completion.carbs}%</b></div>
            <div class="rhythm-row"><span>蛋白质</span><div class="rhythm-track"><div class="rhythm-fill" style="width:${completion.protein}%"></div></div><b>${completion.protein}%</b></div>
            <div class="rhythm-row"><span>脂肪</span><div class="rhythm-track"><div class="rhythm-fill" style="width:${completion.fat}%"></div></div><b>${completion.fat}%</b></div>
          </div>
        </section>

        <section class="section section-card">
          <div class="section-head"><h2>补记今天体重</h2><span>同一天会覆盖旧值</span></div>
          <form class="trend-form" data-form="weight">
            <input name="weight" type="number" min="35" max="250" step="0.1" value="${state.profile.currentWeight}" aria-label="今天体重" />
            <button class="button primary" type="submit">保存体重</button>
          </form>
        </section>

        <section class="section section-card">
          <div class="section-head"><h2>当前营养目标</h2><span>${escapeHtml(state.targets.source)}</span></div>
          <div class="rhythm-list">
            <div class="rhythm-row"><span>碳水</span><div class="rhythm-track"><div class="rhythm-fill" style="width:88%"></div></div><b>${state.targets.carbs}g</b></div>
            <div class="rhythm-row"><span>蛋白质</span><div class="rhythm-track"><div class="rhythm-fill" style="width:72%"></div></div><b>${state.targets.protein}g</b></div>
            <div class="rhythm-row"><span>脂肪</span><div class="rhythm-track"><div class="rhythm-fill" style="width:56%"></div></div><b>${state.targets.fat}g</b></div>
          </div>
          ${ui.recalcMessage ? `<div class="recalc-feedback" role="status">${ui.recalcMessage}</div>` : ""}
          <p class="microcopy">${state.plan ? `每日 ${formatNumber(targetCalories())} kcal；保存新体重会同步重算目标。` : "这是旧版／演示目标，请补充身高、年龄及活动资料后生成个人目标。"}</p>
          <button class="button primary full recalculate-button" data-action="recalculate-targets">查看资料并重算目标</button>
        </section>
      </main>
    `;
  }

  function renderBottomNav() {
    const items = [
      ["today", "home", "今日"],
      ["food", "salad", "食物"],
      ["trends", "chart-line", "趋势"]
    ];
    return `
      <nav class="bottom-nav" aria-label="主导航">
        ${items.map(([id, iconName, label]) => `
          <button class="nav-button ${ui.screen === id ? "active" : ""}" data-nav="${id}" ${ui.screen === id ? 'aria-current="page"' : ""}>${icon(iconName)}<span>${label}</span></button>
        `).join("")}
      </nav>
    `;
  }

  function brandSource(food) {
    const safeUrl = /^https:\/\//.test(food.sourceUrl || "") ? food.sourceUrl : "";
    return `<div class="food-source brand-source"><span>官方标准份 · ${escapeHtml(food.region || "原记录地区")}</span>
      <strong>${escapeHtml(food.standardRecipe || "原标准配方")}</strong>
      <small>${Number.isFinite(food.servingGrams) ? `官方成品重量 ${food.servingGrams}g／份（不是原料生重）` : "成品克重未公布，不换算为每100g；份数不是克数。"}</small>
      ${["protein", "carbs", "fat"].some((key) => !Number.isFinite(food[key])) ? '<p class="recipe-warning">三大营养素有未公布项：热量照常计入，未知项不按零计算；该餐不能精算剩余营养推荐。</p>' : ""}
      <small>${escapeHtml(food.notes || "")}</small>
      ${food.energyMethod ? `<small>${escapeHtml(food.energyMethod)}</small>` : ""}
      <small>资料版本：${escapeHtml(food.sourceDate || "官网未标注日期")} · 核对：${escapeHtml(food.verifiedAt || "原记录")}</small>
      ${safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">查看来源：${escapeHtml(food.sourceTitle || "官方营养资料")}</a>` : ""}
      <small>配方、份量和在售情况可能变化；以购买地当前官方标示为准。</small></div>`;
  }

  function brandInfoModal() {
    const metadata = window.BRAND_LIBRARY_METADATA;
    return `<div class="scrim" data-action="close-modal"></div><section class="sheet" role="dialog" aria-modal="true" aria-label="品牌食物收录说明"><div class="sheet-handle"></div><div class="sheet-head"><div><h2>标准配方，不猜份量。</h2><p>本批 ${brandFoods.length} 个产品规格 · 并非市场全集</p></div><button class="close-button" data-action="close-modal" aria-label="关闭">${icon("x")}</button></div>
      <div class="calculation-notes"><p>大陆 ${metadata.mainlandCount} 个规格；其他地区 ${metadata.otherRegionCount} 个规格单独标明。大杯、小杯、不同配置按独立规格收录，不是品牌全部菜单。</p>
      <dl class="plan-breakdown">${Object.entries(metadata.brands).map(([brand, count]) => `<div><dt>${escapeHtml(brand)}${["肯德基", "汉堡王"].includes(brand) ? "（台湾参考）" : "（大陆）"}</dt><dd>${count} 个规格</dd></div>`).join("")}</dl>
      <p>优先采用官方标准成品营养。麦当劳官网以千焦发布，按 kcal = kJ ÷ 4.184 换算并取整；其他品牌保留官方千卡。不是拆解配方反推的精确结果，原料克重未公开时不编造。</p>
      <p>赛百味轻盈系列资料来自大陆官网公开索引；面包长度、克重与当前在售状态未能直接确认，只适用于所列搭配，不能套用到任意自选三明治。瑞幸按列出的杯型、冷热与糖奶配置记录，“不另外加糖”不代表无糖。</p>
      <p>未公布的蛋白质、碳水和脂肪显示“未公布”，不会把未知当作零。记录仍计入热量，但该餐剩余营养推荐暂停；可查看整餐计划，或选择资料完整的实际食物。</p>
      <p>本批未找到可核验的肯德基、汉堡王大陆完整营养表，也未收录星巴克大陆与披萨品牌。台湾条目仅供对应地区使用。品牌配方可能更新，来源和资料日期可在每个条目中查看。</p>
      <p>品牌成品按份记录，不参与按克自动配餐；套餐请逐项添加，额外酱料、油、饮料需另记。修改份数后重算；历史记录保留当时的数据快照。半份只表示等比例份量，不适用于只吃馅、不吃面包等拆分。</p></div></section>`;
  }

  function foodModal() {
    const food = foodById.get(ui.selectedFoodId);
    if (!food) return "";
    const nutrition = nutrientsFor(food, ui.foodDraft.grams);
    return `
      <div class="scrim" data-action="close-modal"></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-label="添加${food.name}">
        <div class="sheet-handle"></div>
        <div class="sheet-head">
          <div>
            <h2>${escapeHtml(food.name)}</h2>
            <p>${food.kcal} kcal / ${escapeHtml(foodBasis(food))}<br />碳 ${nutrientText(food.carbs)} · 蛋 ${nutrientText(food.protein)} · 脂 ${nutrientText(food.fat)}</p>
          </div>
          <button class="close-button" data-action="close-modal" aria-label="关闭">${icon("x")}</button>
        </div>
        <div class="field-grid">
          <div class="field">
            <label for="food-grams">${foodNutrition.isServing(food) ? "实际份数（半份填 0.5）" : `实际克数（${food.state}）`}</label>
            <input id="food-grams" type="number" min="0.01" max="${foodNutrition.isServing(food) ? 20 : 2000}" step="0.01" value="${ui.foodDraft.grams}" data-input="food-grams" />
          </div>
          <div class="measure-locked" role="note">
            <span>计量状态已锁定</span>
            <strong>${foodNutrition.isServing(food) ? escapeHtml(`${food.region} · 1份 = ${food.servingLabel}`) : food.state}</strong>
            <small>${foodNutrition.isServing(food) ? "按官方默认配方整份计。换规格、加料、改糖奶请选对应条目或另记，不自动推算。" : "生、熟营养密度不同。如需另一种状态，请返回搜索对应条目。"}</small>
          </div>
          <div class="field">
            <label for="food-meal">加入餐次</label>
            <select id="food-meal" data-input="food-meal">
              ${mealOptions(ui.foodDraft.meal)}
            </select>
          </div>
        </div>
        <div class="nutrition-preview" data-role="food-preview">
          <div><strong data-food-preview="kcal">${nutrition.kcal}</strong><span>千卡</span></div>
          <div><strong data-food-preview="carbs">${nutrientText(nutrition.carbs, "g")}</strong><span>碳水</span></div>
          <div><strong data-food-preview="protein">${nutrientText(nutrition.protein, "g")}</strong><span>蛋白质</span></div>
          <div><strong data-food-preview="fat">${nutrientText(nutrition.fat, "g")}</strong><span>脂肪</span></div>
        </div>
        ${foodNutrition.isServing(food) ? brandSource(food) : `<div class="food-source">
          <span>数据来源</span>
          <strong>${escapeHtml(food.source)} · FDC ${food.sourceId}</strong>
          <small>${escapeHtml(food.sourceDescription)} · ${escapeHtml(food.energyMethod)}</small>
        </div>`}
        <button class="button primary full" data-action="add-food">加入${escapeHtml(ui.foodDraft.meal)}</button>
      </section>
    `;
  }

  function foodForLog(entry) {
    if (entry.foodSnapshot?.basis === "serving") return entry.foodSnapshot;
    const currentFood = foodById.get(entry.foodId);
    if (currentFood) return currentFood;
    const serving = entry.quantityUnit === "serving";
    const ratio = (serving ? 1 : 100) / (Number(entry.grams) || 1);
    return {
      basis: serving ? "serving" : "100g",
      name: entry.name,
      state: entry.measure || "记录重量",
      ...Object.fromEntries(["kcal", "carbs", "protein", "fat"].map((key) => [key, Number.isFinite(entry[key]) ? entry[key] * ratio : null])),
      source: "历史记录",
      sourceDescription: "原食物条目已不在当前食物库中"
    };
  }

  function logModal() {
    const entry = state.logs.find((item) => item.id === ui.selectedLogId);
    if (!entry) return "";
    const food = foodForLog(entry);
    const nutrition = nutrientsFor(food, ui.logDraft.grams);
    return `
      <div class="scrim" data-action="close-modal"></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-label="修改${escapeHtml(entry.name)}记录">
        <div class="sheet-handle"></div>
        <div class="sheet-head">
          <div>
            <h2>修改${escapeHtml(entry.name)}</h2>
            <p>${nutrientText(food.kcal)} kcal / ${escapeHtml(foodBasis(food))} · ${escapeHtml(food.state)}</p>
          </div>
          <button class="close-button" data-action="close-modal" aria-label="关闭">${icon("x")}</button>
        </div>
        <div class="field-grid">
          <div class="field">
            <label for="log-grams">${foodNutrition.isServing(food) ? "实际份数（半份填 0.5）" : `实际克数（${escapeHtml(food.state)}）`}</label>
            <input id="log-grams" type="number" min="0.01" max="${foodNutrition.isServing(food) ? 20 : 2000}" step="0.01" value="${ui.logDraft.grams}" data-input="log-grams" />
          </div>
          <div class="measure-locked" role="note">
            <span>计量状态已锁定</span>
            <strong>${escapeHtml(foodNutrition.isServing(food) ? `1份 = ${food.servingLabel || "原标准份"}` : food.state)}</strong>
            <small>${foodNutrition.isServing(food) ? "按记录时保存的标准份营养重算，未公布项仍为未知。" : "修改克数会按当前食物库自动重算热量和三大营养素。"}</small>
          </div>
          <div class="field">
            <label for="log-meal">所属餐次</label>
            <select id="log-meal" data-input="log-meal">
              ${mealOptions(ui.logDraft.meal)}
            </select>
          </div>
        </div>
        <div class="nutrition-preview" data-role="log-preview">
          <div><strong data-log-preview="kcal">${nutrition.kcal}</strong><span>千卡</span></div>
          <div><strong data-log-preview="carbs">${nutrientText(nutrition.carbs, "g")}</strong><span>碳水</span></div>
          <div><strong data-log-preview="protein">${nutrientText(nutrition.protein, "g")}</strong><span>蛋白质</span></div>
          <div><strong data-log-preview="fat">${nutrientText(nutrition.fat, "g")}</strong><span>脂肪</span></div>
        </div>
        ${foodNutrition.isServing(food) ? brandSource(food) : ""}
        <div class="edit-actions">
          <button class="button primary full" data-action="save-log">保存修改</button>
          <button class="button danger full" data-action="delete-log">删除这条记录</button>
        </div>
      </section>
    `;
  }

  function formulaModal() {
    const plan = state.plan;
    return `
      <div class="scrim" data-action="close-modal"></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-label="目标计算说明">
        <div class="sheet-handle"></div>
        <div class="sheet-head">
          <div><h2>目标如何计算</h2><p>当前记录方案 · 不是医疗处方</p></div>
          <button class="close-button" data-action="close-modal" aria-label="关闭">${icon("x")}</button>
        </div>
        ${plan ? planPreview({ ok: true, plan }) : `<p class="formula-note">目前保留的是旧版／演示目标，尚未按完整个人资料计算。请先完善资料。</p>`}
        <div class="calculation-notes">
          <h3>1. 估算静息消耗</h3>
          <p>身高体重法（Mifflin–St Jeor）：10 × 体重 kg + 6.25 × 身高 cm − 5 × 年龄 + 性别常数（男性 +5，女性 −161）。</p>
          <p>体脂参考法（常称 Katch–McArdle）：去脂体重 = 体重 × (1 − 体脂率)；静息消耗 = 370 + 21.6 × 去脂体重。</p>
          <p>自动模式在填写体脂后使用体脂参考法，否则用身高体重法。两种公式独立估算，不混合平均；体脂法不直接使用身高、年龄和性别，它们用于另一公式的对照。体脂秤或目测有误差，填写体脂不代表更准确。</p>
          <h3>2. 估算维持与目标热量</h3>
          <p>维持热量 = 静息消耗 × 活动系数。日常久坐／轻活动／体力活动的基础系数分别为 1.20／1.35／1.50；另加每周训练小时 ÷ 18（最多加 0.35），总系数不高于 1.85。日常档位不含训练，不再额外加回运动消耗。</p>
          <p>活动换算是本工具的粗略假设，并非针对个人的测量或经过验证的预测模型。减脂模式先取维持热量的 85%（缺口 15%），维持模式取 100%，最后取整到 50 kcal。训练日与休息日采用相同的日均目标。</p>
          <h3>3. 分配营养和餐次</h3>
          <p>以规律力量训练成人为参考：蛋白质 2 g/kg、脂肪 0.8 g/kg，剩余热量分给碳水（蛋白质／碳水各 4 kcal/g，脂肪 9 kcal/g）。这是可调整的起点，不是人人必须达到的固定比例。</p>
          <p>在首页“调整餐次”中按实际安排分配每日总量，不要求加餐。连续记录 2–3 周，用晨起体重的 7 日均值、饥饿感和训练表现复盘；本工具不会自行根据单日体重涨跌加大缺口。</p>
          <p>仅供 18–80 岁健康成人估算；未成年人、孕期／哺乳期、有疾病或进食障碍风险者请咨询医生或注册营养师。输入范围和低热量拦截不是安全保证。</p>
          <p>资料来源：<a href="https://pubmed.ncbi.nlm.nih.gov/2305711/" target="_blank" rel="noopener noreferrer">Mifflin 原始研究</a> · <a href="https://ajcn.nutrition.org/article/S0002-9165%2823%2931936-1/fulltext" target="_blank" rel="noopener noreferrer">Cunningham 1991 去脂体重公式</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/28642676/" target="_blank" rel="noopener noreferrer">ISSN 蛋白质立场</a> · <a href="https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner" target="_blank" rel="noopener noreferrer">NIH 体重规划适用范围</a></p>
        </div>
        <button class="button primary full" data-action="open-profile">修改资料与目标</button>
      </section>
    `;
  }

  function profileModal() {
    const profile = ui.profileDraft || state.profile;
    const value = (key) => escapeHtml(profile[key] ?? "");
    const options = (key, items) => items.map(([id, label]) => `<option value="${id}" ${profile[key] === id ? "selected" : ""}>${label}</option>`).join("");
    return `
      <div class="scrim" data-action="close-modal"></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-label="个人资料">
        <div class="sheet-handle"></div>
        <div class="sheet-head">
          <div><h2>个人资料</h2><p>保存在当前浏览器，不上传云端</p></div>
          <button class="close-button" data-action="close-modal" aria-label="关闭">${icon("x")}</button>
        </div>
        <div class="field-grid">
          <div class="field">
            <label for="profile-sex">公式使用的生理性别</label>
            <select id="profile-sex" data-profile="sex">
              ${options("sex", [["male", "男性"], ["female", "女性"]])}
            </select>
          </div>
          <div class="field"><label for="profile-age">年龄（岁）</label><input id="profile-age" type="number" inputmode="numeric" min="18" max="80" step="1" value="${value("age")}" data-profile="age" placeholder="18–80" /></div>
          <div class="field"><label for="profile-height">身高（cm）</label><input id="profile-height" type="number" inputmode="decimal" min="130" max="220" step="0.1" value="${value("heightCm")}" data-profile="heightCm" placeholder="130–220" /></div>
          <div class="field">
            <label for="profile-weight">当前体重（kg）</label>
            <input id="profile-weight" type="number" inputmode="decimal" min="35" max="250" step="0.1" value="${value("currentWeight")}" data-profile="currentWeight" />
          </div>
          <div class="field"><label for="profile-fat">体脂率（%，可留空）</label><input id="profile-fat" type="number" inputmode="decimal" min="5" max="60" step="0.1" value="${value("bodyFatPct")}" data-profile="bodyFatPct" placeholder="填写百分数，不是小数" /></div>
          <div class="field"><label for="profile-formula">计算方式</label><select id="profile-formula" data-profile="formula">${options("formula", [["auto", "自动（有体脂时用体脂法）"], ["mifflin", "身高体重法"], ["lean", "体脂参考法（需填写体脂）"]])}</select></div>
          <div class="field">
            <label for="profile-activity">日常活动（不含训练）</label>
            <select id="profile-activity" data-profile="dailyActivity">
              ${options("dailyActivity", [["sedentary", "久坐：办公、日常步行较少"], ["light", "轻活动：经常站立和走动"], ["active", "体力活动：工作中持续走动／搬运"]])}
            </select>
          </div>
          <div class="field"><label for="profile-days">每周训练次数</label><input id="profile-days" type="number" inputmode="numeric" min="0" max="7" step="1" value="${value("trainingDays")}" data-profile="trainingDays" placeholder="0–7" /></div>
          <div class="field"><label for="profile-minutes">每次训练时长（分钟）</label><input id="profile-minutes" type="number" inputmode="numeric" min="0" max="240" step="1" value="${value("trainingMinutes")}" data-profile="trainingMinutes" placeholder="不训练请填 0" /></div>
          <div class="field"><label for="profile-goal">当前目标</label><select id="profile-goal" data-profile="goal">${options("goal", [["lose", "温和减脂（试行 15% 热量缺口）"], ["maintain", "维持体重"]])}</select></div>
        </div>
        <div id="profile-preview" class="profile-preview" aria-live="polite">${planPreview(planner.calculate(profile))}</div>
        <div class="settings-actions">
          <button class="button primary full" data-action="save-profile">保存并应用每日目标</button>
          ${ui.deferredInstallPrompt ? `<button class="button secondary full" data-action="install-app">安装到设备</button>` : ""}
          <button class="button secondary full" data-action="export-data">导出本地备份</button>
          <button class="button danger full" data-action="reset-data">恢复演示数据</button>
        </div>
        <p class="microcopy">保存后立即同步首页与营养目标；修改体重会更新今日称重记录，过去记录和餐食不变。首次使用的演示餐食与历史体重请自行核实，不是你的实际记录。数据仅保存在这台设备的当前浏览器，不会同步到其他手机。自动模式填写体脂后切换公式，体脂估计误差也会影响结果。仅适用于健康成人，不用于孕期、哺乳期或疾病营养治疗。</p>
      </section>
    `;
  }

  function planPreview(result) {
    if (!result.ok) return `<p class="plan-errors" role="status">请完善／检查资料：${result.errors.map(escapeHtml).join("；")}</p>`;
    const p = result.plan;
    return `<h3>每日目标预览 · ${p.method === "lean" ? "体脂参考法" : "身高体重法"}</h3>
      <div class="plan-kcal">${formatNumber(p.kcal)} <small>kcal / 天</small></div>
      <dl class="plan-breakdown"><div><dt>静息消耗估算</dt><dd>${formatNumber(p.restingKcal)} kcal</dd></div><div><dt>活动系数（粗估）</dt><dd>× ${formatNumber(p.activityFactor, 2)}</dd></div><div><dt>维持热量估算</dt><dd>${formatNumber(p.maintenanceKcal)} kcal</dd></div><div><dt>目标热量缺口</dt><dd>${p.deficitPct}%</dd></div></dl>
      <p class="microcopy">每周训练 ${formatNumber(p.trainingHours, 1)} 小时，已计入活动系数；无需另加运动热量。${p.leanMassKg !== null ? `去脂体重约 ${formatNumber(p.leanMassKg, 1)} kg。` : "未提供体脂，采用身高、体重、年龄和性别公式。"}</p>
      <div class="nutrition-preview"><div><strong>${formatNumber(p.carbs, 1)}g</strong><span>碳水</span></div><div><strong>${p.protein}g</strong><span>蛋白质</span></div><div><strong>${p.fat}g</strong><span>脂肪</span></div></div>
      ${p.leanKcal !== null ? `<p class="microcopy">静息消耗对照：身高体重法 ${formatNumber(p.mifflinKcal)} / 体脂法 ${formatNumber(p.leanKcal)} kcal。两者是估算，不代表测量结果；体脂法不一定更准。</p>` : ""}
      <p class="microcopy">每日总量可在首页按餐次分配，不要求加餐。观察 2–3 周体重均值和训练表现后再调整。</p>`;
  }

  function readProfileForm() {
    const profile = { ...state.profile };
    const numericFields = ["age", "heightCm", "currentWeight", "bodyFatPct", "trainingDays", "trainingMinutes"];
    document.querySelectorAll("[data-profile]").forEach((input) => {
      profile[input.dataset.profile] = numericFields.includes(input.dataset.profile) ? (input.value.trim() === "" ? null : Number(input.value)) : input.value;
    });
    return profile;
  }

  function mealsModal() {
    const draft = ui.mealDraft || mealPlanFor();
    return `<div class="scrim" data-action="close-modal"></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-label="调整餐次">
        <div class="sheet-handle"></div>
        <div class="sheet-head"><div><h2>安排一天怎么吃</h2><p>按每日目标分餐，总量不变</p></div><button class="close-button" data-action="close-modal" aria-label="关闭">${icon("x")}</button></div>
        <div class="field"><label for="meal-date">调整哪一天</label><input id="meal-date" data-meal-date type="date" min="${toDateKey(new Date())}" value="${escapeHtml(ui.mealDate)}" /></div><p class="microcopy">切换日期会读取那一天的安排，请先保存当前编辑。</p>
        <fieldset class="meal-count-field"><legend>一天吃几餐</legend><div class="meal-count-options">${[1, 2, 3, 4, 5, 6].map((count) => `<button type="button" data-action="set-meal-count" data-count="${count}" aria-pressed="${draft.length === count}">${count} 餐</button>`).join("")}</div></fieldset>
        <div class="section-head meal-ratio-heading"><h3>餐名与分配比例</h3><button class="pill-button" data-action="equalize-meals">平均分配</button></div>
        <p class="microcopy">每餐按相同比例分配热量、蛋白质、碳水和脂肪。比例合计需为 100%。比例只是安排示例，不是固定的营养建议。</p>
        <div class="meal-editor">${draft.map((meal, index) => `<div class="meal-editor-row"><div class="field"><label for="meal-name-${index}">第 ${index + 1} 餐名称</label><input id="meal-name-${index}" data-meal-index="${index}" data-meal-field="name" maxlength="12" value="${escapeHtml(meal.name)}" /></div><div class="field"><label for="meal-percent-${index}">占全天 %</label><input id="meal-percent-${index}" data-meal-index="${index}" data-meal-field="percent" type="number" inputmode="decimal" min="0.1" max="100" step="0.1" value="${meal.percent ?? ""}" /></div></div>`).join("")}</div>
        <div id="meal-preview" class="meal-allocation-preview" aria-live="polite">${mealAllocationPreview(draft)}</div>
        <label class="meal-default-toggle"><input type="checkbox" data-meal-default ${ui.mealAsDefault ? "checked" : ""} /><span>也从这天起用作默认安排<small>未勾选仅改变所选日期；不改变更早的日期，已单独安排的日期也不受影响。</small></span></label>
        <button class="button primary full" data-action="save-meals">保存餐次安排</button>
        <p class="microcopy">减少餐次或改名不会删除或自动移动食物。原餐次记录会保留在“计划外记录”中，仍计入全天；可点记录修改所属餐次。营养量为宏量分配，不包含维生素／矿物质；不自动生成食谱。餐数选择不代表一日一餐更适合你。</p>
      </section>`;
  }

  function mealAllocationPreview(meals) {
    const checked = mealPlanner.validate(meals);
    const total = meals.reduce((sum, meal) => sum + (Number.isFinite(meal.percent) ? meal.percent : 0), 0);
    const heading = `<p class="meal-percent-total">比例合计 <strong>${formatNumber(total, 1)}%</strong> / 100%</p>`;
    if (!checked.ok) return `${heading}<p class="plan-errors" role="status">${checked.errors.map(escapeHtml).join("；")}</p>`;
    if (!state.plan) return `${heading}<p class="microcopy">可先保存餐次；完善个人资料并生成每日目标后，会自动计算每餐营养量。</p>`;
    const result = mealPlanner.allocate({ ...state.targets, kcal: targetCalories() }, checked.meals);
    if (!result.ok) return `${heading}<p class="plan-errors">${result.errors.map(escapeHtml).join("；")}</p>`;
    return `${heading}<p class="microcopy">按当前每日 ${formatNumber(targetCalories())} kcal 目标预览；以后更新每日目标，各餐会按比例同步更新。</p>
      <div class="meal-preview-list">${result.meals.map((meal) => `<div class="meal-preview-item"><div><strong>${escapeHtml(meal.name)}</strong><span>${formatNumber(meal.kcal)} kcal</span></div><p>蛋白质 ${formatNumber(meal.protein, 1)}g · 碳水 ${formatNumber(meal.carbs, 1)}g · 脂肪 ${formatNumber(meal.fat, 1)}g</p></div>`).join("")}</div>`;
  }

  function openMeals() {
    ui.mealDate = toDateKey(new Date());
    ui.mealDraft = mealPlanFor(ui.mealDate);
    ui.mealAsDefault = false;
    ui.modal = "meals";
    render();
  }

  function saveMeals() {
    const checked = mealPlanner.validate(ui.mealDraft);
    const date = ui.mealDate;
    const parsedDate = new Date(`${date}T12:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !Number.isFinite(parsedDate.getTime()) || toDateKey(parsedDate) !== date || date < toDateKey(new Date())) {
      document.getElementById("meal-preview").innerHTML = '<p class="plan-errors" role="alert">请选择今天或未来的有效日期。</p>';
      return;
    }
    if (!checked.ok) {
      document.getElementById("meal-preview").innerHTML = mealAllocationPreview(ui.mealDraft);
      document.getElementById("meal-preview").scrollIntoView({ block: "nearest" });
      return;
    }
    const schedule = state.mealSchedule || { defaultMeals: mealPlanner.preset(3), byDate: {} };
    schedule.byDate = { ...schedule.byDate, [date]: checked.meals };
    if (ui.mealAsDefault) schedule.defaultsByDate = { ...schedule.defaultsByDate, [date]: checked.meals.map((meal) => ({ ...meal })) };
    state.mealSchedule = schedule;
    saveState();
    ui.modal = null;
    ui.preferredMeal = null;
    showToast(`${date === toDateKey(new Date()) ? "今日" : date}已安排 ${checked.meals.length} 餐${ui.mealAsDefault ? "，并设为默认" : ""}；食物记录已保留`);
  }

  function recipeContext() {
    if (!state.plan || ui.recipeDate !== toDateKey(new Date())) return { error: "日期或每日目标已变化，请关闭后重新打开推荐。" };
    const allocated = mealPlanner.allocate({ ...state.targets, kcal: targetCalories() }, mealPlanFor());
    const fullTarget = allocated.meals.find((meal) => meal.name === ui.recipeMeal);
    if (!fullTarget) return { error: "该餐次不在今天的计划内，请重新选择。" };
    const recorded = todayLogs().filter((entry) => entry.meal === ui.recipeMeal);
    const consumed = sumEntries(recorded);
    const target = Object.fromEntries(["kcal", "protein", "carbs", "fat"].map((key) => [key, round(Math.max(0, fullTarget[key] - (ui.recipeMode === "remaining" ? consumed[key] : 0)), key === "kcal" ? 0 : 1)]));
    if (ui.recipeMode === "remaining" && Object.values(consumed.missing).some((count) => count > 0)) return { target, fullTarget, consumed, recorded, blocked: "本餐有食物未公布营养素，无法可靠估算剩余目标。热量仍计入；可切换查看整餐目标，但不把未知营养当作零。" };
    return { target, fullTarget, consumed, recorded, blocked: target.kcal < 100 ? "当前可分配热量不足 100 kcal，暂不自动配整餐。可查看整餐方案，或直接手动记录实际吃的食物，无需为凑数继续添加。" : "" };
  }

  function recipeKey() { return `${ui.recipeDate}|${ui.recipeMeal}|${ui.recipeMode}`; }

  function latestStoredState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && [1, 2, 3].includes(saved.version) && Array.isArray(saved.logs) && saved.profile && saved.targets) return { ...state, ...saved, logs: saved.logs.map(restoreServingLog) };
    } catch (error) { console.warn("无法读取其他页面的最新记录。", error); }
    return state;
  }

  function rememberRecipe() {
    const context = recipeContext();
    const summary = recipePlanner.summarize(foods, ui.recipeItems);
    if (context.error || context.blocked || !summary.ok) return;
    // A preview saves only its own draft, never an older tab's copy of food logs.
    state = latestStoredState();
    state.recipeDrafts = { ...state.recipeDrafts, [recipeKey()]: {
      templateId: ui.recipeTemplate, mode: ui.recipeMode, target: ui.recipeBasis,
      items: ui.recipeItems.map((item) => ({ ...item }))
    } };
    saveState();
  }

  function generateRecipe(foodIds) {
    const context = recipeContext();
    if (context.error || context.blocked) { ui.recipeItems = []; ui.recipeErrors = []; return; }
    const template = recipePlanner.templates.find((item) => item.id === ui.recipeTemplate) || recipePlanner.templates[0];
    const result = recipePlanner.optimize(foods, context.target, foodIds || template.foodIds);
    ui.recipeBasis = JSON.stringify(context.target);
    ui.recipeItems = result.ok ? result.items : [];
    ui.recipeErrors = result.errors || [];
    ui.recipeCapped = result.cappedFoodIds || [];
    if (result.ok) rememberRecipe();
  }

  function loadRecipeDraft(fallbackIds) {
    const saved = state.recipeDrafts?.[recipeKey()];
    const context = recipeContext();
    if (saved && Array.isArray(saved.items) && recipePlanner.summarize(foods, saved.items).ok) {
      ui.recipeTemplate = recipePlanner.templates.some((item) => item.id === saved.templateId) ? saved.templateId : ui.recipeTemplate;
      if (!context.error && !context.blocked && saved.mode === ui.recipeMode && saved.target === JSON.stringify(context.target)) {
        ui.recipeItems = saved.items.map((item) => ({ ...item }));
        ui.recipeBasis = saved.target;
      } else generateRecipe(saved.items.map((item) => item.foodId));
    } else generateRecipe(fallbackIds);
  }

  function openRecipe(meal) {
    state = latestStoredState();
    ui.recipeMeal = meal;
    ui.recipeDate = toDateKey(new Date());
    ui.recipeMode = "remaining";
    ui.recipeTemplate = (meal.includes("早") ? recipePlanner.templates.find((item) => item.foodIds.includes("oats")) : null)?.id || recipePlanner.templates[0].id;
    ui.recipeErrors = [];
    ui.recipeCapped = [];
    loadRecipeDraft();
    ui.modal = "recipe";
    render();
  }

  function weighingLabel(food) {
    if (food.state === "生重") return "生重 · 烹调前的可食部分";
    if (food.state === "熟重") return "熟重 · 烹调后的可食部分";
    if (food.state === "干重" || food.name.includes("（干）")) return "干重 · 加水／浸泡前称";
    if (food.state === "沥干") return "沥干后重量 · 可食部分";
    if (food.state === "液体") return "液体重量 · g，不是 ml";
    if (food.name.includes("（生") || /\braw\b/i.test(food.sourceDescription || "")) return "生的可食部 · 去除不可食部分后称";
    if (/水煮|熟|炒/.test(food.name) || /\bcooked\b|\bboiled\b|\broasted\b/i.test(food.sourceDescription || "")) return "熟的可食部 · 去除不可食部分后称";
    return "可食部重量 · 去除不可食部分后称";
  }

  function recipeComparison() {
    const context = recipeContext();
    if (context.error) return `<p class="plan-errors">${escapeHtml(context.error)}</p>`;
    const summary = recipePlanner.summarize(foods, ui.recipeItems);
    if (!summary.ok) return `<p class="plan-errors" role="status">${summary.errors.map(escapeHtml).join("；")}</p>`;
    const fields = [["kcal", "热量", "kcal", 0], ["protein", "蛋白质", "g", 1], ["carbs", "碳水", "g", 1], ["fat", "脂肪", "g", 1]];
    const offTarget = fields.some(([key]) => Math.abs(summary.totals[key] - context.target[key]) > Math.max(key === "kcal" ? 30 : 3, context.target[key] * 0.1));
    const dailyRemaining = Math.max(0, targetCalories() - sumEntries(todayLogs()).kcal);
    return `<div class="meal-budget recipe-comparison"><p>${offTarget ? "这组食物未完全贴近目标，请查看差额后调整" : "这组食物与目标较接近，仍为估算值"}</p><table aria-label="推荐组合与目标差额"><thead><tr><th scope="col">营养</th><th scope="col">目标</th><th scope="col">本组合</th><th scope="col">差额</th></tr></thead><tbody>${fields.map(([key, label, unit, digits]) => {
      const delta = round(summary.totals[key] - context.target[key], digits);
      return `<tr><th scope="row">${label}<small>${unit}</small></th><td>${formatNumber(context.target[key], digits)}</td><td>${formatNumber(summary.totals[key], digits)}</td><td>${delta > 0 ? "多 " : delta < 0 ? "少 " : ""}${formatNumber(Math.abs(delta), digits)}</td></tr>`;
    }).join("")}</tbody></table></div>
      ${summary.totals.kcal > dailyRemaining ? `<p class="recipe-warning">如果将本组合全部新增记录，会超出今日剩余热量约 ${formatNumber(summary.totals.kcal - dailyRemaining)} kcal。请结合其他餐调整。</p>` : ""}
      ${ui.recipeCapped.length ? '<p class="microcopy">部分食物已达到自动推荐的份量上限。不会为了追平目标无限加量，可换食物或手动调整。</p>' : ""}`;
  }

  function recipeModal() {
    const context = recipeContext();
    const blocked = context.error || context.blocked;
    return `<div class="scrim" data-action="close-modal"></div><section class="sheet recipe-sheet" role="dialog" aria-modal="true" aria-label="每餐食物推荐">
      <div class="sheet-handle"></div><div class="sheet-head"><div><h2>${escapeHtml(ui.recipeMeal)} · 吃什么</h2><p>按食物库估算份量，确认后才计入记录</p></div><button class="close-button" data-action="close-modal" aria-label="关闭">${icon("x")}</button></div>
      <div class="recipe-mode" aria-label="推荐依据"><button data-action="recipe-mode" data-mode="remaining" aria-pressed="${ui.recipeMode === "remaining"}">按本餐剩余</button><button data-action="recipe-mode" data-mode="full" aria-pressed="${ui.recipeMode === "full"}">查看整餐方案</button></div>
      <p class="microcopy">${context.error ? escapeHtml(context.error) : ui.recipeMode === "remaining" ? `已扣除本餐记录的 ${formatNumber(context.consumed.kcal)} kcal；其余餐和计划外记录请同时看全天汇总。` : "这是整餐目标方案，未扣除已经吃过的食物，不能当作额外需要吃的量。"}</p>
      ${blocked ? `<p class="recipe-warning">${escapeHtml(blocked)}</p>` : `<div class="field"><label for="recipe-template">基础组合 · 当前食物以下方清单为准</label><select id="recipe-template" data-recipe-template>${recipePlanner.templates.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === ui.recipeTemplate ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></div>
      <div class="recipe-food-list">${ui.recipeItems.map((item, index) => {
        const food = foodById.get(item.foodId);
        return `<article class="recipe-food" data-recipe-food="${escapeHtml(item.foodId)}"><div class="recipe-food-head"><div><h3>${escapeHtml(food.name)}</h3><span class="weighing-label">${escapeHtml(weighingLabel(food))}</span></div><button class="pill-button" data-action="replace-recipe-food" data-index="${index}" aria-label="替换${escapeHtml(food.name)}">替换</button></div><div class="recipe-grams-row"><label for="recipe-grams-${index}">建议份量，可修改</label><div><input id="recipe-grams-${index}" type="number" inputmode="numeric" min="0" max="2000" step="1" value="${item.grams ?? ""}" data-recipe-grams="${index}" aria-label="${escapeHtml(food.name)}克数" /><span>g</span></div></div><p class="microcopy">每 100g：${food.kcal} kcal · 蛋白质 ${food.protein}g · 碳水 ${food.carbs}g · 脂肪 ${food.fat}g</p></article>`;
      }).join("")}</div>
      ${ui.recipeErrors.length ? `<p class="plan-errors">${ui.recipeErrors.map(escapeHtml).join("；")}</p>` : ""}
      <div id="recipe-comparison" aria-live="polite">${recipeComparison()}</div>
      <div class="settings-actions"><button class="button secondary full" data-action="rebalance-recipe">按当前食物重算克数</button><button class="button primary full" data-action="add-recipe">确认份量，一键加入本餐</button></div>`}
      <p class="microcopy">两种模式的方案分别保存在当前浏览器，不会自动记为已吃。替换或重算可能调整整组份量；手动改克数只改变当前食物。0g 表示不加入。</p>
      <div class="recipe-notes"><p>生重表示烹调前称量，不是建议生吃；熟重表示烹调后称。米饭与生米使用独立条目，不做固定倍数换算。液体按克称，不把克直接当毫升。</p><p>仅计算列出的食物与油，额外烹调油、酱料需另记。不同品牌、烹调失水和数据库取整都会造成差异，无法保证四项恰好达标，也不代表微量营养完整。</p><p>含乳、蛋、豆、坚果、鱼虾等食物时，请先检查过敏与饮食限制；本工具不自动排查禁忌。数据来源为现有 USDA FDC 食物库，称量口径可参考 <a href="https://fdc.nal.usda.gov/Foundation_Foods_Documentation/" target="_blank" rel="noopener noreferrer">USDA 可食部与克重说明</a>。</p></div>
    </section>`;
  }

  function replacementRows() {
    const term = ui.replacementSearch.trim().toLowerCase();
    const matches = foods.filter((food) => !foodNutrition.isServing(food) && [food.name, food.state, ...(food.aliases || [])].join(" ").toLowerCase().includes(term));
    return matches.length ? matches.map((food) => `<button class="recipe-replacement-row" data-replacement-id="${escapeHtml(food.id)}" ${food.id === "brazil_nuts" ? "disabled" : ""}><span><strong>${escapeHtml(food.name)}</strong><small>${escapeHtml(weighingLabel(food))}${food.id === "brazil_nuts" ? " · 不自动配量，可在食物库手动记录" : ""}</small></span><span>${food.kcal}<small>kcal / 100g</small></span></button>`).join("") : '<p class="empty-meal">没有找到，可换个名称或搜索生／熟。</p>';
  }

  function replacementModal() {
    const current = foodById.get(ui.recipeItems[ui.replacementIndex]?.foodId);
    return `<div class="scrim" data-action="back-to-recipe"></div><section class="sheet" role="dialog" aria-modal="true" aria-label="替换推荐食物"><div class="sheet-handle"></div><div class="sheet-head"><div><h2>换成想吃的食物</h2><p>正在替换：${escapeHtml(current?.name || "食物")}</p></div><button class="close-button" data-action="back-to-recipe" aria-label="返回方案">${icon("x")}</button></div><p class="microcopy">选择后会重新估算整组克数，不是同克数互换。注意区分生重、熟重；如无法满足营养目标，会保留实际差额。品牌成品暂不参与按克配餐，请在食物库按标准份记录。</p><div class="field"><label for="replacement-search">搜索食物</label><input id="replacement-search" type="search" placeholder="例如：米饭、生米、牛肉、豆腐" value="${escapeHtml(ui.replacementSearch)}" /></div><div id="replacement-results" class="recipe-replacement-list">${replacementRows()}</div></section>`;
  }

  function replaceRecipeFood(foodId) {
    const ids = ui.recipeItems.map((item) => item.foodId);
    if (ids.some((id, index) => id === foodId && index !== ui.replacementIndex)) {
      showToast("这组方案已包含该食物，请选其他食物或直接修改原条目的克数");
      return;
    }
    ids[ui.replacementIndex] = foodId;
    generateRecipe(ids);
    ui.modal = "recipe";
    render();
  }

  function addRecipe() {
    state = latestStoredState();
    const context = recipeContext();
    const summary = recipePlanner.summarize(foods, ui.recipeItems);
    if (context.error || context.blocked || !summary.ok) {
      showToast(context.error || context.blocked || summary.errors.join("；"));
      return;
    }
    if (ui.recipeBasis !== JSON.stringify(context.target)) {
      generateRecipe(ui.recipeItems.map((item) => item.foodId));
      showToast("本餐记录或目标已变化，份量已重新估算，请再次确认后加入");
      return;
    }
    const items = ui.recipeItems.filter((item) => item.grams > 0);
    if (!items.length) { showToast("所有份量都是 0g，没有可加入的食物"); return; }
    if (ui.recipeMode === "full" && context.recorded.length && !window.confirm("本餐已有饮食记录。继续会额外新增整份方案，不会替换原记录，可能重复计入。确认仍要加入吗？")) return;
    state.logs.push(...items.map((item) => makeLog(item.foodId, item.grams, ui.recipeMeal, "recommendation")));
    state.recentFoodIds = [...new Set([...items.map((item) => item.foodId), ...state.recentFoodIds])].slice(0, 12);
    saveState();
    ui.modal = null;
    ui.screen = "today";
    showToast(`已加入${ui.recipeMeal} ${items.length} 项食物，共 ${formatNumber(summary.totals.kcal)} kcal；可逐项修改`);
  }

  function dailyContext() {
    const date = toDateKey(new Date());
    const targets = { ...state.targets, kcal: targetCalories() };
    const allocated = mealPlanner.allocate(targets, mealPlanFor(date));
    const basis = JSON.stringify({ date, targets, meals: mealPlanFor(date) });
    return { date, targets, allocated, basis, stale: !state.plan || (ui.dayPlan && (ui.dayPlan.date !== date || ui.dayPlan.basis !== basis)) };
  }

  function dailyLogged(meal) {
    return state.logs.some((log) => log.date === ui.dayPlan.date && log.dailyPlanId === ui.dayPlan.id && log.dailyPlanMeal === meal.name);
  }

  function validDailyDraft(draft) {
    return draft && typeof draft.id === "string" && Array.isArray(draft.meals) && draft.meals.length > 0 && draft.meals.every((meal) => meal?.name && ["kcal", "protein", "carbs", "fat"].every((key) => Number.isFinite(meal.target?.[key]) && meal.target[key] >= 0) && dailyPlanner.summarize(foods, meal.items).ok);
  }

  function rememberDaily() {
    if (!validDailyDraft(ui.dayPlan) || dailyContext().stale) return;
    state = latestStoredState();
    // Save only this date's draft; never overwrite another tab's food logs.
    if (dailyContext().stale) return;
    state.dailyRecipeDrafts = { ...state.dailyRecipeDrafts, [ui.dayPlan.date]: JSON.parse(JSON.stringify(ui.dayPlan)) };
    saveState();
  }

  function generateDaily(variant = 0) {
    state = latestStoredState();
    const context = dailyContext();
    if (!state.plan || !context.allocated.ok) { showToast("请先完善个人资料并生成每日目标"); return; }
    const result = dailyPlanner.generate(foods, context.allocated.meals, { style: ui.dayStyle, variant });
    if (!result.ok) { showToast(result.errors.join("；")); return; }
    ui.dayPlan = { id: makeId("daily"), date: context.date, basis: context.basis, style: ui.dayStyle, variant, meals: result.meals };
    rememberDaily();
  }

  function openDaily() {
    state = latestStoredState();
    if (!state.plan) {
      ui.profileDraft = { ...state.profile };
      ui.modal = "profile";
      showToast("先完善个人资料，生成你的每日热量和营养目标");
      return;
    }
    const saved = state.dailyRecipeDrafts?.[toDateKey(new Date())];
    ui.dayPlan = validDailyDraft(saved) ? JSON.parse(JSON.stringify(saved)) : null;
    ui.dayStyle = ui.dayPlan?.style || "mixed";
    if (!ui.dayPlan) generateDaily();
    ui.modal = "daily";
    render();
  }

  function dailyComparison(target, summary, label) {
    if (!summary.ok) return `<p class="plan-errors" role="status">${summary.errors.map(escapeHtml).join("；")}</p>`;
    const fields = [["kcal", "热量", "kcal", 0], ["protein", "蛋白质", "g", 1], ["carbs", "碳水", "g", 1], ["fat", "脂肪", "g", 1]];
    return `<div class="meal-budget"><p>${escapeHtml(label)}</p><table aria-label="${escapeHtml(label)}"><thead><tr><th scope="col">营养</th><th scope="col">目标</th><th scope="col">计划</th><th scope="col">差额</th></tr></thead><tbody>${fields.map(([key, name, unit, digits]) => {
      const unknown = summary.missing[key] > 0;
      const delta = round(summary.totals[key] - target[key], digits);
      return `<tr><th scope="row">${name}<small>${unit}</small></th><td>${formatNumber(target[key], digits)}</td><td>${unknown ? "已知 " : ""}${formatNumber(summary.totals[key], digits)}${unknown ? "＋" : ""}</td><td>${unknown ? "待核" : `${delta > 0 ? "多 " : delta < 0 ? "少 " : ""}${formatNumber(Math.abs(delta), digits)}`}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  function dailyMealFeedback(meal) {
    const summary = dailyPlanner.summarize(foods, meal.items);
    return dailyComparison(meal.target, summary, `${meal.name} · 整餐计划与目标`) + (meal.warnings || []).map((warning) => `<p class="microcopy">${escapeHtml(warning)}</p>`).join("") + (summary.ok && Object.values(summary.missing).some((count) => count) ? '<p class="recipe-warning">有食物未公布营养素，不能判断该餐是否达标，也不会把未知项当零补配。</p>' : "");
  }

  function dailySummary() {
    if (!ui.dayPlan) return "";
    const summaries = ui.dayPlan.meals.map((meal) => dailyPlanner.summarize(foods, meal.items));
    if (summaries.some((item) => !item.ok)) return '<p class="plan-errors">请先修正各餐的份量，再保存或计入记录。</p>';
    const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    const missing = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    const target = { ...totals };
    ui.dayPlan.meals.forEach((meal, index) => {
      Object.keys(totals).forEach((key) => { totals[key] += summaries[index].totals[key]; missing[key] += summaries[index].missing[key]; target[key] += meal.target[key]; });
    });
    const produce = summaries.reduce((sum, summary) => sum + summary.produceGrams, 0);
    const unknown = Object.values(missing).some((count) => count > 0);
    const offTarget = Object.keys(target).some((key) => Math.abs(totals[key] - target[key]) > Math.max(key === "kcal" ? 50 : 5, target[key] * 0.1));
    return `${dailyComparison(target, { ok: true, totals, missing }, "全天计划合计（不含已吃记录）")}
      <p class="${unknown || offTarget ? "recipe-warning" : "microcopy"}">${unknown ? "营养资料不完整，不能确认全天达标。" : offTarget ? "计划与目标仍有差额，请按表调整食物或份量；不为追数字无限增加食物。" : "四项估算与目标较接近，不代表纤维、维生素、矿物质或钠都充足／合适。"}</p>
      <p class="microcopy">已列出的基础蔬果约 ${formatNumber(produce)}g（不计品牌中未知克重的蔬菜）。${produce < 400 ? "本计划已计蔬果不足 400g，可增加或替换蔬果后查看新总量。" : "仍需注意食物多样性。"} <a href="https://www.who.int/news-room/fact-sheets/detail/healthy-diet" target="_blank" rel="noopener noreferrer">WHO 膳食参考</a></p>`;
  }

  function dailyModal() {
    if (!ui.dayPlan) return "";
    const context = dailyContext();
    return `<div class="scrim" data-action="close-modal"></div><section class="sheet daily-sheet" role="dialog" aria-modal="true" aria-label="定制全天食谱"><div class="sheet-handle"></div>
      <div class="sheet-head"><div><h2>一天吃什么</h2><p>${escapeHtml(ui.dayPlan.date)} · ${ui.dayPlan.meals.length} 餐 · ${ui.dayPlan.meals.some(dailyLogged) ? `本方案已记录 ${ui.dayPlan.meals.filter(dailyLogged).length} 餐` : "尚未计为已吃"}</p></div><button class="close-button" data-action="close-modal" aria-label="关闭">${icon("x")}</button></div>
      <p class="microcopy">按你已保存的每日目标和餐次分配。这里是整日计划，不扣除已吃记录；已吃过的餐不要再次计入。草稿只保存在当前浏览器。</p>
      <div class="daily-controls"><div class="field"><label for="daily-style">搭配方式</label><select id="daily-style"><option value="mixed" ${ui.dayStyle === "mixed" ? "selected" : ""}>品牌＋常见食物</option><option value="common" ${ui.dayStyle === "common" ? "selected" : ""}>常见食物为主</option></select></div><button class="button secondary" data-action="regenerate-daily">重新生成／换一天搭配</button></div>
      <p class="microcopy">当前方案：${ui.dayPlan.style === "mixed" ? "品牌＋常见食物" : "常见食物为主"}。混合方案默认最多安排一餐大陆品牌主食；品牌自动搭配只使用营养完整条目，目前主要是麦当劳。赛百味、瑞幸可手动替换，未公布营养会单独提示。</p>
      ${context.stale ? '<p class="recipe-warning" role="status">日期、每日目标或餐次已变化。以下是旧草稿，请重新生成后再计入；已有饮食记录不受影响。</p>' : ""}
      <div id="daily-summary" aria-live="polite">${dailySummary()}</div>
      <div class="daily-meals">${ui.dayPlan.meals.map((meal, mi) => {
        const logged = dailyLogged(meal);
        const disabled = context.stale || logged;
        return `<article class="daily-meal" data-daily-meal="${mi}"><div class="section-head"><h3>${escapeHtml(meal.name)}</h3><span>${logged ? "已计入记录" : `${formatNumber(meal.target.kcal)} kcal 目标`}</span></div>
          ${logged ? '<p class="microcopy">这餐已记录。实际吃的份量要改，请回首页点该条记录修改；不会重复提交本方案。</p>' : ""}
          ${meal.items.map((item, ii) => {
            const food = foodById.get(item.foodId);
            const serving = foodNutrition.isServing(food);
            return `<div class="daily-food" data-daily-food="${escapeHtml(item.foodId)}"><div class="recipe-food-head"><div><h4>${escapeHtml(food.name)}</h4><span class="weighing-label">${escapeHtml(serving ? `${food.region} · 1份 = ${food.servingLabel}` : weighingLabel(food))}</span></div><button class="pill-button" data-action="replace-daily" data-mi="${mi}" data-ii="${ii}" ${disabled ? "disabled" : ""}>替换</button></div>
              <div class="recipe-grams-row"><label for="day-qty-${mi}-${ii}">${serving ? "标准份数" : "实际克数"}</label><div><input id="day-qty-${mi}-${ii}" type="number" min="0" max="${serving ? 20 : 2000}" step="${serving ? 0.01 : 1}" value="${item.amount ?? ""}" data-day-amount data-mi="${mi}" data-ii="${ii}" ${disabled ? "disabled" : ""} /><span>${serving ? "份" : "g"}</span></div></div>
              ${serving ? `<p class="microcopy">按官方默认配方，0.5 份表示等比例半份，不能模拟去面包、改糖奶。${food.sourceUrl ? `<a href="${escapeHtml(food.sourceUrl)}" target="_blank" rel="noopener noreferrer">官方配置与来源</a>` : ""}</p>` : `<label class="daily-lock"><input type="checkbox" data-day-lock data-mi="${mi}" data-ii="${ii}" ${item.locked ? "checked" : ""} ${disabled ? "disabled" : ""} />固定份量，重算时保留${food.id === "egg" ? "（水煮蛋去壳后称重，不按固定个重）" : ""}</label>`}
              ${serving ? `<small class="daily-source-note">${escapeHtml(food.standardRecipe)} ${escapeHtml(food.notes)}</small>` : ""}</div>`;
          }).join("")}
          <div id="daily-feedback-${mi}" aria-live="polite">${dailyMealFeedback(meal)}</div>
          <div class="daily-meal-actions"><button class="button secondary full" data-action="rebalance-daily" data-mi="${mi}" ${disabled ? "disabled" : ""}>按目标重算本餐</button><button class="button primary full" data-action="record-daily-meal" data-mi="${mi}" ${disabled || !meal.items.some((item) => item.amount > 0) ? "disabled" : ""}>${logged ? "本方案这餐已记录" : "吃完后，计入本餐"}</button></div></article>`;
      }).join("")}</div>
      <button class="button secondary full" data-action="record-daily-all" ${context.stale || ui.dayPlan.meals.every((meal) => dailyLogged(meal) || !meal.items.some((item) => item.amount > 0)) ? "disabled" : ""}>整天都已吃，批量记录未提交餐次</button>
      <div class="recipe-notes"><p>只按列出的食品估算热量和三大营养素。手动修改份量会自动固定该项；重算仅调整未固定的基础食物。0 表示不吃这一项。缺少营养资料时停止自动补配，但仍可手动计划和记录。</p><p>普通食物按标明的生重／熟重／去壳可食部称量；生重不是建议生吃。烹调油、酱料、奶糖和套餐配品未列出则需另记。不同配方、加工和份量会有误差。</p><p>本工具不自动检查过敏、饮食禁忌、钠、纤维和微量营养，不保证营养全面；品牌外食请留意钠与额外酱料。无法适配的目标显示实际差额，不强行凑到达标。</p></div></section>`;
  }

  function dailyReplacementRows() {
    const term = ui.daySearch.trim().toLowerCase();
    const meal = ui.dayPlan.meals[ui.dayReplaceMeal];
    const selected = new Set(meal.items.filter((_, index) => index !== ui.dayReplaceItem).map((item) => item.foodId));
    const matches = foods.filter((food) => (!food.brand || food.region === "中国大陆") && (ui.dayFilter === "all" || (ui.dayFilter === "brand") === foodNutrition.isServing(food)) && [food.name, ...(food.aliases || [])].join(" ").toLowerCase().includes(term));
    return matches.map((food) => `<button class="recipe-replacement-row" data-day-replacement="${escapeHtml(food.id)}" ${selected.has(food.id) || food.id === "brazil_nuts" ? "disabled" : ""}><span><strong>${escapeHtml(food.name)}</strong><small>${escapeHtml(foodNutrition.isServing(food) ? `${food.region} · ${food.servingLabel}` : weighingLabel(food))}${selected.has(food.id) ? " · 本餐已包含" : ""}${food.id === "brazil_nuts" ? " · 不用于自动配餐" : ""}${["protein", "carbs", "fat"].some((key) => !Number.isFinite(food[key])) ? " · 营养资料不完整" : ""}</small></span><span>${food.kcal}<small>${foodNutrition.isServing(food) ? "kcal / 份" : "kcal / 100g"}</small></span></button>`).join("") || '<p class="empty-meal">未找到对应食物，试试另一个名称。</p>';
  }

  function dailyReplacementModal() {
    return `<div class="scrim" data-action="back-daily"></div><section class="sheet" role="dialog" aria-modal="true" aria-label="替换全天食谱食物"><div class="sheet-handle"></div><div class="sheet-head"><div><h2>换成想吃的</h2><p>基础食物和大陆品牌可混合搭配</p></div><button class="close-button" data-action="back-daily" aria-label="返回食谱">${icon("x")}</button></div><p class="microcopy">替换会重设为新食物常用克数或 1 标准份，再调整未固定的其他食物；不是等克数、等热量替换。资料不全时仅替换，不补造营养。</p><div class="field"><label for="daily-food-search">搜索食品</label><input id="daily-food-search" type="search" placeholder="鸡蛋、米饭、赛百味、麦当劳…" value="${escapeHtml(ui.daySearch)}" /></div><div class="field"><label for="daily-food-filter">范围</label><select id="daily-food-filter">${[["all", "全部"], ["common", "基础食物"], ["brand", "大陆品牌食品"]].map(([id, label]) => `<option value="${id}" ${ui.dayFilter === id ? "selected" : ""}>${label}</option>`).join("")}</select></div><div id="daily-replacements">${dailyReplacementRows()}</div></section>`;
  }

  function rebalanceDailyMeal(index) {
    const meal = ui.dayPlan.meals[index];
    const result = dailyPlanner.rebalance(foods, meal.target, meal.items);
    if (!result.ok) { showToast(result.errors.join("；")); return false; }
    meal.items = result.items;
    meal.warnings = result.warnings;
    rememberDaily();
    return true;
  }

  function replaceDailyFood(foodId) {
    state = latestStoredState();
    const meal = ui.dayPlan.meals[ui.dayReplaceMeal];
    const food = foodById.get(foodId);
    if (dailyContext().stale || dailyLogged(meal) || !food || (food.brand && food.region !== "中国大陆") || foodId === "brazil_nuts") { showToast("当前方案不可替换，请返回检查日期或记录状态"); return; }
    if (meal.items.some((item, index) => index !== ui.dayReplaceItem && item.foodId === foodId)) { showToast("本餐已有该食物，可直接修改原项份量"); return; }
    meal.items[ui.dayReplaceItem] = { foodId, amount: foodNutrition.isServing(food) ? 1 : food.portion, locked: foodNutrition.isServing(food) };
    rebalanceDailyMeal(ui.dayReplaceMeal);
    ui.modal = "daily";
    render();
  }

  async function recordDaily(mealIndex = null) {
    state = latestStoredState();
    if (dailyContext().stale) { showToast("目标、日期或餐次已变化，请重新生成方案后再确认"); return; }
    const selected = ui.dayPlan.meals.filter((meal, index) => (mealIndex === null || index === mealIndex) && !dailyLogged(meal) && meal.items.some((item) => item.amount > 0));
    if (!selected.length) { showToast("没有待提交餐次，本方案不会重复计入"); return; }
    const errors = selected.flatMap((meal) => dailyPlanner.summarize(foods, meal.items).errors || []);
    if (errors.length) { showToast(errors.join("；")); return; }
    const duplicates = selected.filter((meal) => todayLogs().some((log) => log.meal === meal.name));
    const confirmedLogs = JSON.stringify(todayLogs());
    if ((mealIndex === null || duplicates.length) && !window.confirm(`确认这些食物已经吃完？将追加记录：${selected.map((meal) => meal.name).join("、")}。${duplicates.length ? `其中 ${duplicates.map((meal) => meal.name).join("、")} 已有记录，继续可能重复计入。` : ""}不会替换或删除原记录。`)) return;
    // A native confirmation can remain open while another tab writes data.
    // Let queued storage events synchronize this renderer before rereading.
    await new Promise((resolve) => setTimeout(resolve, 0));
    state = latestStoredState();
    if (dailyContext().stale || JSON.stringify(todayLogs()) !== confirmedLogs || selected.some(dailyLogged)) {
      showToast("确认期间记录或目标已变化，未新增食物。请核对最新数据后重新确认");
      return;
    }
    const added = selected.flatMap((meal) => meal.items.filter((item) => item.amount > 0).map((item) => ({ ...makeLog(item.foodId, item.amount, meal.name, "recommendation"), dailyPlanId: ui.dayPlan.id, dailyPlanMeal: meal.name })));
    state.logs.push(...added);
    state.recentFoodIds = [...new Set([...added.map((log) => log.foodId), ...state.recentFoodIds])].slice(0, 12);
    saveState();
    showToast(`已记录 ${selected.map((meal) => meal.name).join("、")}，共 ${added.length} 项；可在首页逐项修改`);
  }

  function renderModal() {
    if (ui.modal === "daily") return dailyModal();
    if (ui.modal === "daily-replacement") return dailyReplacementModal();
    if (ui.modal === "food") return foodModal();
    if (ui.modal === "brand-info") return brandInfoModal();
    if (ui.modal === "log") return logModal();
    if (ui.modal === "formula") return formulaModal();
    if (ui.modal === "profile") return profileModal();
    if (ui.modal === "meals") return mealsModal();
    if (ui.modal === "recipe") return recipeModal();
    if (ui.modal === "replacement") return replacementModal();
    return "";
  }

  function render() {
    ui.renderedDate = toDateKey(new Date());
    const screens = {
      today: renderToday,
      food: renderFood,
      trends: renderTrends
    };
    appRoot.innerHTML = `
      <div class="app">
        <div class="app-shell">
          ${renderTopbar()}
          ${screens[ui.screen]()}
        </div>
        ${renderBottomNav()}
        ${renderModal()}
        ${ui.toast ? `<div class="toast" role="status">${escapeHtml(ui.toast)}</div>` : ""}
        ${!ui.online ? `<div class="offline-badge">离线模式 · 记录仍保存在本机</div>` : ""}
      </div>
    `;
    bindEvents();
  }

  function navigate(screen) {
    ui.screen = screen;
    ui.modal = null;
    window.scrollTo({ top: 0, behavior: "auto" });
    render();
  }

  function openFood(foodId) {
    const food = foodById.get(foodId);
    ui.selectedFoodId = foodId;
    ui.foodDraft = {
      grams: food.portion,
      meal: mealPlanFor().some((meal) => meal.name === ui.preferredMeal) ? ui.preferredMeal : mealPlanFor()[0].name
    };
    ui.modal = "food";
    render();
  }

  function openLog(logId) {
    const entry = state.logs.find((item) => item.id === logId);
    if (!entry) return;
    ui.selectedLogId = logId;
    ui.logDraft = {
      grams: Number(entry.grams),
      meal: entry.meal
    };
    ui.modal = "log";
    render();
  }

  function updateFoodPreview() {
    const food = foodById.get(ui.selectedFoodId);
    if (!food) return;
    const nutrition = nutrientsFor(food, ui.foodDraft.grams);
    const values = {
      kcal: nutrition.kcal,
      carbs: nutrientText(nutrition.carbs, "g"),
      protein: nutrientText(nutrition.protein, "g"),
      fat: nutrientText(nutrition.fat, "g")
    };
    Object.entries(values).forEach(([key, value]) => {
      const node = document.querySelector(`[data-food-preview="${key}"]`);
      if (node) node.textContent = value;
    });
  }

  function updateLogPreview() {
    const entry = state.logs.find((item) => item.id === ui.selectedLogId);
    if (!entry) return;
    const nutrition = nutrientsFor(foodForLog(entry), ui.logDraft.grams);
    const values = {
      kcal: nutrition.kcal,
      carbs: nutrientText(nutrition.carbs, "g"),
      protein: nutrientText(nutrition.protein, "g"),
      fat: nutrientText(nutrition.fat, "g")
    };
    Object.entries(values).forEach(([key, value]) => {
      const node = document.querySelector(`[data-log-preview="${key}"]`);
      if (node) node.textContent = value;
    });
  }

  function saveLog() {
    const grams = Number(ui.logDraft.grams);
    state = latestStoredState();
    const index = state.logs.findIndex((item) => item.id === ui.selectedLogId);
    if (index < 0) return;
    const current = state.logs[index];
    const food = foodForLog(current);
    const checked = foodNutrition.validateAmount(food, grams);
    if (!checked.ok) { showToast(checked.error); return; }
    state.logs[index] = {
      ...current,
      name: food.name,
      // Legacy field name: quantityUnit distinguishes grams from standard servings.
      grams,
      meal: ui.logDraft.meal,
      measure: food.state,
      ...nutrientsFor(food, grams)
    };
    saveState();
    ui.modal = null;
    showToast(`${food.name}已更新为 ${amountText(food, grams)} · ${ui.logDraft.meal}`);
  }

  function deleteLog() {
    state = latestStoredState();
    const entry = state.logs.find((item) => item.id === ui.selectedLogId);
    if (!entry) return;
    const confirmed = window.confirm(`确定删除“${entry.name} ${logAmount(entry)}”这条记录吗？`);
    if (!confirmed) return;
    state.logs = state.logs.filter((item) => item.id !== entry.id);
    saveState();
    ui.modal = null;
    showToast(`${entry.name}记录已删除`);
  }

  function recordTodayWeight(weight) {
    const today = toDateKey(new Date());
    const existing = state.weights.find((item) => item.date === today);
    if (existing) existing.value = weight;
    else state.weights.push({ date: today, value: weight });
    state.weights.sort((a, b) => a.date.localeCompare(b.date));
  }

  function saveWeight(value) {
    const weight = round(Number(value), 1);
    if (!Number.isFinite(weight) || weight < 35 || weight > 250) {
      showToast("请输入 35–250kg 之间的体重");
      return;
    }
    const result = planner.calculate({ ...state.profile, currentWeight: weight });
    if (state.plan && !result.ok) {
      showToast(`未保存：${result.errors.join("；")}，请在个人资料中检查。`);
      return;
    }
    recordTodayWeight(weight);
    state.profile.currentWeight = weight;
    if (result.ok) applyPlan(result.plan);
    saveState();
    showToast(`今天体重已保存为 ${weight}kg${result.ok ? `；每日目标已同步为 ${result.plan.kcal} kcal` : "；完善个人资料后可生成目标"}`);
  }

  function saveProfile() {
    const profile = readProfileForm();
    ui.profileDraft = profile;
    const result = planner.calculate(profile);
    if (!result.ok) {
      document.getElementById("profile-preview").innerHTML = planPreview(result);
      document.getElementById("profile-preview").scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    if (profile.currentWeight !== state.profile.currentWeight) recordTodayWeight(profile.currentWeight);
    state.profile = profile;
    applyPlan(result.plan);
    saveState();
    ui.modal = null;
    ui.profileDraft = null;
    showToast(`资料已保存；每日目标已更新为 ${result.plan.kcal} kcal`);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `个人营养计划-${toDateKey(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("本地备份已导出");
  }

  function resetData() {
    const confirmed = window.confirm("恢复演示数据会覆盖当前浏览器中的饮食和体重记录。确定继续吗？");
    if (!confirmed) return;
    state = createDefaultState();
    saveState();
    ui.modal = null;
    ui.screen = "today";
    ui.recalcMessage = "";
    showToast("已恢复演示数据");
  }

  async function installApp() {
    if (!ui.deferredInstallPrompt) return;
    ui.deferredInstallPrompt.prompt();
    await ui.deferredInstallPrompt.userChoice;
    ui.deferredInstallPrompt = null;
    ui.modal = null;
    render();
  }

  function bindEvents() {
    document.querySelectorAll("[data-nav]").forEach((button) => {
      button.addEventListener("click", () => navigate(button.dataset.nav));
    });

    document.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        ui.category = button.dataset.category;
        if (ui.category !== "品牌食品" && ui.category !== "全部") ui.brand = "全部";
        render();
      });
    });

    const brandFilter = document.querySelector('[data-input="brand-filter"]');
    if (brandFilter) brandFilter.addEventListener("change", () => { ui.brand = brandFilter.value; if (ui.brand !== "全部") ui.category = "品牌食品"; render(); });
    const brandRegion = document.querySelector('[data-input="brand-region"]');
    if (brandRegion) brandRegion.addEventListener("change", () => { ui.brandRegion = brandRegion.value; render(); });

    document.querySelectorAll("[data-food-id]").forEach((button) => {
      button.addEventListener("click", () => openFood(button.dataset.foodId));
    });

    document.querySelectorAll("[data-log-id]").forEach((button) => {
      button.addEventListener("click", () => openLog(button.dataset.logId));
    });

    const searchInput = document.querySelector('[data-input="food-search"]');
    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        ui.search = event.target.value;
        const cursor = event.target.selectionStart;
        render();
        const next = document.querySelector('[data-input="food-search"]');
        if (next) {
          next.focus();
          next.setSelectionRange(cursor, cursor);
        }
      });
    }

    const foodGrams = document.querySelector('[data-input="food-grams"]');
    if (foodGrams) {
      foodGrams.addEventListener("input", (event) => {
        ui.foodDraft.grams = Number(event.target.value);
        updateFoodPreview();
      });
    }

    const foodMeal = document.querySelector('[data-input="food-meal"]');
    if (foodMeal) {
      foodMeal.addEventListener("change", (event) => {
        ui.foodDraft.meal = event.target.value;
        render();
      });
    }

    const logGrams = document.querySelector('[data-input="log-grams"]');
    if (logGrams) {
      logGrams.addEventListener("input", (event) => {
        ui.logDraft.grams = Number(event.target.value);
        updateLogPreview();
      });
    }

    const logMeal = document.querySelector('[data-input="log-meal"]');
    if (logMeal) {
      logMeal.addEventListener("change", (event) => {
        ui.logDraft.meal = event.target.value;
        render();
      });
    }

    const weightForm = document.querySelector('[data-form="weight"]');
    if (weightForm) {
      weightForm.addEventListener("submit", (event) => {
        event.preventDefault();
        saveWeight(new FormData(weightForm).get("weight"));
      });
    }

    document.querySelectorAll("[data-profile]").forEach((input) => {
      input.addEventListener("input", () => {
        ui.profileDraft = readProfileForm();
        document.getElementById("profile-preview").innerHTML = planPreview(planner.calculate(ui.profileDraft));
      });
    });

    document.querySelectorAll("[data-meal-field]").forEach((input) => {
      input.addEventListener("input", () => {
        const field = input.dataset.mealField;
        ui.mealDraft[Number(input.dataset.mealIndex)][field] = field === "name" ? input.value : (input.value.trim() === "" ? null : Number(input.value));
        document.getElementById("meal-preview").innerHTML = mealAllocationPreview(ui.mealDraft);
      });
    });
    const mealDate = document.querySelector("[data-meal-date]");
    if (mealDate) mealDate.addEventListener("change", () => {
      ui.mealDate = mealDate.value;
      ui.mealDraft = mealPlanFor(ui.mealDate);
      ui.mealAsDefault = false;
      render();
    });
    const mealDefault = document.querySelector("[data-meal-default]");
    if (mealDefault) mealDefault.addEventListener("change", () => { ui.mealAsDefault = mealDefault.checked; });

    const recipeTemplate = document.querySelector("[data-recipe-template]");
    if (recipeTemplate) recipeTemplate.addEventListener("change", () => {
      ui.recipeTemplate = recipeTemplate.value;
      generateRecipe();
      render();
    });
    document.querySelectorAll("[data-recipe-grams]").forEach((input) => {
      input.addEventListener("input", () => {
        ui.recipeItems[Number(input.dataset.recipeGrams)].grams = input.value.trim() === "" ? null : Number(input.value);
        ui.recipeCapped = [];
        document.getElementById("recipe-comparison").innerHTML = recipeComparison();
        rememberRecipe();
      });
    });
    const replacementSearch = document.getElementById("replacement-search");
    if (replacementSearch) replacementSearch.addEventListener("input", () => {
      ui.replacementSearch = replacementSearch.value;
      document.getElementById("replacement-results").innerHTML = replacementRows();
    });
    const replacementResults = document.getElementById("replacement-results");
    if (replacementResults) replacementResults.addEventListener("click", (event) => {
      const button = event.target.closest("[data-replacement-id]");
      if (button) replaceRecipeFood(button.dataset.replacementId);
    });

    const dayStyle = document.getElementById("daily-style");
    if (dayStyle) dayStyle.addEventListener("change", () => { ui.dayStyle = dayStyle.value; });
    document.querySelectorAll("[data-day-amount]").forEach((input) => {
      input.addEventListener("input", () => {
        const mi = Number(input.dataset.mi), ii = Number(input.dataset.ii);
        const meal = ui.dayPlan.meals[mi];
        if (dailyContext().stale || dailyLogged(meal)) return;
        meal.items[ii].amount = input.value.trim() === "" ? null : Number(input.value);
        meal.items[ii].locked = true;
        meal.warnings = [];
        const lock = document.querySelector(`[data-day-lock][data-mi="${mi}"][data-ii="${ii}"]`);
        if (lock) lock.checked = true;
        document.getElementById(`daily-feedback-${mi}`).innerHTML = dailyMealFeedback(meal);
        document.getElementById("daily-summary").innerHTML = dailySummary();
        const record = document.querySelector(`[data-action="record-daily-meal"][data-mi="${mi}"]`);
        if (record) record.disabled = !meal.items.some((item) => item.amount > 0);
        rememberDaily();
      });
    });
    document.querySelectorAll("[data-day-lock]").forEach((input) => {
      input.addEventListener("change", () => {
        const meal = ui.dayPlan.meals[Number(input.dataset.mi)];
        if (dailyContext().stale || dailyLogged(meal)) return;
        meal.items[Number(input.dataset.ii)].locked = input.checked;
        rememberDaily();
      });
    });
    const daySearch = document.getElementById("daily-food-search");
    if (daySearch) daySearch.addEventListener("input", () => { ui.daySearch = daySearch.value; document.getElementById("daily-replacements").innerHTML = dailyReplacementRows(); });
    const dayFilter = document.getElementById("daily-food-filter");
    if (dayFilter) dayFilter.addEventListener("change", () => { ui.dayFilter = dayFilter.value; document.getElementById("daily-replacements").innerHTML = dailyReplacementRows(); });
    const dayResults = document.getElementById("daily-replacements");
    if (dayResults) dayResults.addEventListener("click", (event) => {
      const button = event.target.closest("[data-day-replacement]");
      if (button && !button.disabled) replaceDailyFood(button.dataset.dayReplacement);
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const action = button.dataset.action;
        if (action === "open-daily") {
          openDaily();
        } else if (action === "regenerate-daily") {
          if (!window.confirm("重新生成会替换当前食谱草稿；已经吃过并记录的食物保持不变。继续吗？")) return;
          generateDaily((ui.dayPlan?.variant || 0) + 1);
          render();
        } else if (action === "replace-daily") {
          if (dailyContext().stale) { showToast("目标或餐次已变化，请重新生成"); return; }
          ui.dayReplaceMeal = Number(button.dataset.mi);
          ui.dayReplaceItem = Number(button.dataset.ii);
          if (dailyLogged(ui.dayPlan.meals[ui.dayReplaceMeal])) return;
          ui.daySearch = "";
          ui.dayFilter = "all";
          ui.modal = "daily-replacement";
          render();
        } else if (action === "back-daily") {
          ui.modal = "daily";
          render();
        } else if (action === "rebalance-daily") {
          if (dailyContext().stale || dailyLogged(ui.dayPlan.meals[Number(button.dataset.mi)])) return;
          rebalanceDailyMeal(Number(button.dataset.mi));
          render();
        } else if (action === "record-daily-meal") {
          await recordDaily(Number(button.dataset.mi));
        } else if (action === "record-daily-all") {
          await recordDaily();
        } else if (action === "brand-info") {
          ui.modal = "brand-info";
          render();
        } else if (action === "open-profile") {
          ui.profileDraft = { ...state.profile };
          ui.modal = "profile";
          render();
        } else if (action === "open-formula") {
          ui.modal = "formula";
          render();
        } else if (action === "open-meals") {
          openMeals();
        } else if (action === "set-meal-count") {
          ui.mealDraft = mealPlanner.preset(Number(button.dataset.count));
          render();
        } else if (action === "equalize-meals") {
          const count = ui.mealDraft.length;
          const base = Math.floor(1000 / count);
          ui.mealDraft = ui.mealDraft.map((meal, index) => ({ ...meal, percent: (base + (index < 1000 % count ? 1 : 0)) / 10 }));
          render();
        } else if (action === "save-meals") {
          saveMeals();
        } else if (action === "record-meal") {
          ui.preferredMeal = button.dataset.meal;
          navigate("food");
        } else if (action === "open-recipe") {
          openRecipe(button.dataset.meal);
        } else if (action === "recipe-mode") {
          ui.recipeMode = button.dataset.mode;
          ui.recipeErrors = [];
          ui.recipeCapped = [];
          loadRecipeDraft(ui.recipeItems.length ? ui.recipeItems.map((item) => item.foodId) : undefined);
          render();
        } else if (action === "replace-recipe-food") {
          ui.replacementIndex = Number(button.dataset.index);
          ui.replacementSearch = "";
          ui.modal = "replacement";
          render();
        } else if (action === "back-to-recipe") {
          ui.modal = "recipe";
          render();
        } else if (action === "rebalance-recipe") {
          generateRecipe(ui.recipeItems.map((item) => item.foodId));
          render();
        } else if (action === "add-recipe") {
          addRecipe();
        } else if (action === "close-modal") {
          ui.modal = null;
          ui.profileDraft = null;
          render();
        } else if (action === "go-food") {
          navigate("food");
        } else if (action === "go-trends") {
          navigate("trends");
        } else if (action === "clear-search") {
          ui.search = "";
          render();
        } else if (action === "add-food") {
          const checked = foodNutrition.validateAmount(foodById.get(ui.selectedFoodId), ui.foodDraft.grams);
          if (!checked.ok) { showToast(checked.error); return; }
          state = latestStoredState();
          const log = makeLog(ui.selectedFoodId, ui.foodDraft.grams, ui.foodDraft.meal, "manual");
          state.logs.push(log);
          state.recentFoodIds = [ui.selectedFoodId, ...state.recentFoodIds.filter((id) => id !== ui.selectedFoodId)].slice(0, 12);
          saveState();
          ui.modal = null;
          showToast(`${log.name} ${logAmount(log)} 已加入${log.meal}`);
        } else if (action === "save-log") {
          saveLog();
        } else if (action === "delete-log") {
          deleteLog();
        } else if (action === "recalculate-targets") {
          ui.profileDraft = { ...state.profile };
          ui.modal = "profile";
          render();
        } else if (action === "save-profile") {
          saveProfile();
        } else if (action === "export-data") {
          exportData();
        } else if (action === "reset-data") {
          resetData();
        } else if (action === "install-app") {
          await installApp();
        }
        event.stopPropagation();
      });
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    ui.deferredInstallPrompt = event;
  });

  window.addEventListener("online", () => {
    ui.online = true;
    render();
  });

  window.addEventListener("offline", () => {
    ui.online = false;
    render();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !ui.modal) render();
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    state = latestStoredState();
    render();
  });

  setInterval(() => {
    if (!ui.modal && ui.renderedDate !== toDateKey(new Date())) render();
  }, 30000);

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js?v=12", { updateViaCache: "none" }).catch((error) => {
        console.warn("离线缓存注册失败。", error);
      });
    });
  }

  render();
})();
