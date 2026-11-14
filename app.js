(function () {
  "use strict";

  const STORAGE_KEY = "personal-nutrition-plan-v1";
  const { foods, categories, library } = window.NUTRITION_DATA;
  const planner = window.NutritionPlanner;
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
    const ratio = Math.max(0, Number(grams) || 0) / 100;
    return {
      kcal: round(food.kcal * ratio, 0),
      carbs: round(food.carbs * ratio),
      protein: round(food.protein * ratio),
      fat: round(food.fat * ratio)
    };
  }

  function makeLog(foodId, grams, meal, source = "manual") {
    const food = foodById.get(foodId);
    return {
      id: makeId("log"),
      date: toDateKey(new Date()),
      meal,
      source,
      foodId,
      name: food.name,
      grams: Number(grams),
      measure: food.state,
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
      logs: breakfast,
      weights: seedWeights(),
      historicalCompletion: { carbs: 83, protein: 91, fat: 80 },
      recentFoodIds: ["oats", "egg", "blueberry", "rice_cooked", "chicken_breast"],
      createdAt: new Date().toISOString()
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && [1, 2, 3].includes(saved.version)) {
        saved.logs = (saved.logs || []).map((entry) => {
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

  function sumEntries(entries) {
    return entries.reduce((total, entry) => ({
      kcal: total.kcal + Number(entry.kcal || 0),
      carbs: total.carbs + Number(entry.carbs || 0),
      protein: total.protein + Number(entry.protein || 0),
      fat: total.fat + Number(entry.fat || 0)
    }), { kcal: 0, carbs: 0, protein: 0, fat: 0 });
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
    selectedFoodId: null,
    foodDraft: { grams: 100, meal: "午餐" },
    selectedLogId: null,
    logDraft: { grams: 100, meal: "午餐" },
    toast: "",
    recalcMessage: "",
    profileDraft: null,
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

  function macroRow(label, value, target) {
    const remaining = Math.max(0, target - value);
    const percentage = target > 0 ? clamp((value / target) * 100, 0, 100) : 0;
    return `
      <div class="macro-card">
        <div class="macro-card-head">
          <span>${label}</span>
          <small>${Math.round(percentage)}%</small>
        </div>
        <strong>${formatNumber(remaining, 1)}<small>g</small></strong>
        <p>今日还差</p>
        <div class="macro-track" aria-label="${label}已完成 ${Math.round(percentage)}%">
          <div class="macro-fill" style="width:${percentage}%"></div>
        </div>
      </div>
    `;
  }

  function renderToday() {
    const entries = todayLogs();
    const totals = sumEntries(entries);
    const remainingKcal = Math.max(0, targetCalories() - totals.kcal);
    const proteinRemaining = Math.max(0, state.targets.protein - totals.protein);
    const meals = ["早餐", "午餐", "晚餐", "加餐"];

    const mealHtml = meals.map((meal) => {
      const mealEntries = entries.filter((entry) => entry.meal === meal);
      const mealTotal = sumEntries(mealEntries);
      const rows = mealEntries.length
        ? mealEntries.map((entry) => `
            <button class="meal-entry" data-log-id="${escapeHtml(entry.id)}" aria-label="修改${escapeHtml(entry.name)}记录">
              <div class="meal-mark" aria-hidden="true">${escapeHtml(entry.name.slice(0, 1))}</div>
              <div>
                <h3>${escapeHtml(entry.name)}</h3>
                <p>${formatNumber(entry.grams)}g · ${escapeHtml(entry.measure)} · ${entry.source === "photo" ? "照片确认" : "手动记录"}</p>
              </div>
              <div class="meal-entry-side">
                <div class="kcal">${formatNumber(entry.kcal)} kcal</div>
                <span>修改</span>
              </div>
            </button>
          `).join("")
        : `<div class="empty-meal">还没有记录</div>`;
      return `
        <section class="meal-group">
          <div class="meal-group-head">
            <strong>${meal}</strong>
            <span>${formatNumber(mealTotal.kcal)} kcal</span>
          </div>
          ${rows}
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
            ${macroRow("碳水", totals.carbs, state.targets.carbs)}
            ${macroRow("蛋白质", totals.protein, state.targets.protein)}
            ${macroRow("脂肪", totals.fat, state.targets.fat)}
          </div>
          <div class="highlight">
            ${icon("target-arrow")}
            <div>
              <span>下一餐建议</span>
              <h3>还可安排 ${formatNumber(proteinRemaining, 1)}g 蛋白质</h3>
              <p>先确定蛋白质来源，再补主食与蔬菜。</p>
            </div>
          </div>
          <button class="button primary full" data-action="go-food">记录下一餐</button>
        </section>

        <section class="section section-card">
          <div class="section-head">
            <h2>今日餐次</h2>
            <span>${entries.length} 条记录</span>
          </div>
          <div class="meal-groups">${mealHtml}</div>
        </section>
      </main>
    `;
  }

  function filteredFoods() {
    const normalized = ui.search.trim().toLowerCase();
    return foods.filter((food) => {
      const categoryMatch =
        ui.category === "全部" ||
        (ui.category === "常用" && commonFoodIds.has(food.id)) ||
        food.category === ui.category;
      const searchText = [food.name, food.state, ...(food.aliases || [])].join(" ").toLowerCase();
      const searchMatch = !normalized || searchText.includes(normalized);
      return categoryMatch && searchMatch;
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
          <p>${food.state} · 常用 ${food.portion}g<br />碳 ${food.carbs} · 蛋 ${food.protein} · 脂 ${food.fat}</p>
        </div>
        <div class="food-kcal">
          <strong>${food.kcal}</strong>
          <span>kcal/100g</span>
        </div>
      </button>
    `).join("");

    return `
      <main class="screen" data-screen="food">
        <div class="food-intro">
          <p class="page-eyebrow">FOOD INDEX</p>
          <h1 class="page-title">想吃什么，搜一搜。</h1>
          <p class="page-intro">生重和熟重分别计算，请按实际状态选择。</p>
        </div>

        <div class="search-wrap">
          ${icon("search", "search-icon")}
          <input class="search-input" type="search" value="${escapeHtml(ui.search)}" placeholder="搜索燕麦、鸡胸肉、米饭…" aria-label="搜索食物" data-input="food-search" />
          ${ui.search ? `<button class="search-clear" data-action="clear-search" aria-label="清空搜索">${icon("x")}</button>` : ""}
        </div>
        <div class="food-browser">
          <div class="chips" aria-label="食物分类">${chips}</div>
          <div class="catalog-panel">
            <div class="catalog-note"><span>每 100g 营养</span><strong>${visibleFoods.length} / ${library.itemCount}</strong></div>
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
            <p>${food.kcal} kcal / 100g · C ${food.carbs} · P ${food.protein} · F ${food.fat}</p>
          </div>
          <button class="close-button" data-action="close-modal" aria-label="关闭">${icon("x")}</button>
        </div>
        <div class="field-grid">
          <div class="field">
            <label for="food-grams">实际克数（${food.state}）</label>
            <input id="food-grams" type="number" min="0" max="2000" value="${ui.foodDraft.grams}" data-input="food-grams" />
          </div>
          <div class="measure-locked" role="note">
            <span>计量状态已锁定</span>
            <strong>${food.state}</strong>
            <small>生、熟营养密度不同。如需另一种状态，请返回搜索对应条目。</small>
          </div>
          <div class="field">
            <label for="food-meal">加入餐次</label>
            <select id="food-meal" data-input="food-meal">
              ${["早餐", "午餐", "晚餐", "加餐"].map((meal) => `<option ${ui.foodDraft.meal === meal ? "selected" : ""}>${meal}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="nutrition-preview" data-role="food-preview">
          <div><strong data-food-preview="kcal">${nutrition.kcal}</strong><span>千卡</span></div>
          <div><strong data-food-preview="carbs">${nutrition.carbs}g</strong><span>碳水</span></div>
          <div><strong data-food-preview="protein">${nutrition.protein}g</strong><span>蛋白质</span></div>
          <div><strong data-food-preview="fat">${nutrition.fat}g</strong><span>脂肪</span></div>
        </div>
        <div class="food-source">
          <span>数据来源</span>
          <strong>${escapeHtml(food.source)} · FDC ${food.sourceId}</strong>
          <small>${escapeHtml(food.sourceDescription)} · ${escapeHtml(food.energyMethod)}</small>
        </div>
        <button class="button primary full" data-action="add-food">加入${ui.foodDraft.meal}</button>
      </section>
    `;
  }

  function foodForLog(entry) {
    const currentFood = foodById.get(entry.foodId);
    if (currentFood) return currentFood;
    const ratio = 100 / Math.max(1, Number(entry.grams) || 1);
    return {
      name: entry.name,
      state: entry.measure || "记录重量",
      kcal: Number(entry.kcal || 0) * ratio,
      carbs: Number(entry.carbs || 0) * ratio,
      protein: Number(entry.protein || 0) * ratio,
      fat: Number(entry.fat || 0) * ratio,
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
            <p>${formatNumber(food.kcal)} kcal / 100g · ${escapeHtml(food.state)}</p>
          </div>
          <button class="close-button" data-action="close-modal" aria-label="关闭">${icon("x")}</button>
        </div>
        <div class="field-grid">
          <div class="field">
            <label for="log-grams">实际克数（${escapeHtml(food.state)}）</label>
            <input id="log-grams" type="number" min="1" max="2000" value="${ui.logDraft.grams}" data-input="log-grams" />
          </div>
          <div class="measure-locked" role="note">
            <span>计量状态已锁定</span>
            <strong>${escapeHtml(food.state)}</strong>
            <small>修改克数会按当前食物库自动重算热量和三大营养素。</small>
          </div>
          <div class="field">
            <label for="log-meal">所属餐次</label>
            <select id="log-meal" data-input="log-meal">
              ${["早餐", "午餐", "晚餐", "加餐"].map((meal) => `<option ${ui.logDraft.meal === meal ? "selected" : ""}>${meal}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="nutrition-preview" data-role="log-preview">
          <div><strong data-log-preview="kcal">${nutrition.kcal}</strong><span>千卡</span></div>
          <div><strong data-log-preview="carbs">${nutrition.carbs}g</strong><span>碳水</span></div>
          <div><strong data-log-preview="protein">${nutrition.protein}g</strong><span>蛋白质</span></div>
          <div><strong data-log-preview="fat">${nutrition.fat}g</strong><span>脂肪</span></div>
        </div>
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
          <p>每日总量可以只分三餐，无需加餐。连续记录 2–3 周，用晨起体重的 7 日均值、饥饿感和训练表现复盘；本工具不会自行根据单日体重涨跌加大缺口。</p>
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
      <p class="microcopy">总量可分三餐，不要求加餐。观察 2–3 周体重均值和训练表现后再调整。</p>`;
  }

  function readProfileForm() {
    const profile = { ...state.profile };
    const numericFields = ["age", "heightCm", "currentWeight", "bodyFatPct", "trainingDays", "trainingMinutes"];
    document.querySelectorAll("[data-profile]").forEach((input) => {
      profile[input.dataset.profile] = numericFields.includes(input.dataset.profile) ? (input.value.trim() === "" ? null : Number(input.value)) : input.value;
    });
    return profile;
  }

  function renderModal() {
    if (ui.modal === "food") return foodModal();
    if (ui.modal === "log") return logModal();
    if (ui.modal === "formula") return formulaModal();
    if (ui.modal === "profile") return profileModal();
    return "";
  }

  function render() {
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
      meal: "午餐"
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
      carbs: `${nutrition.carbs}g`,
      protein: `${nutrition.protein}g`,
      fat: `${nutrition.fat}g`
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
      carbs: `${nutrition.carbs}g`,
      protein: `${nutrition.protein}g`,
      fat: `${nutrition.fat}g`
    };
    Object.entries(values).forEach(([key, value]) => {
      const node = document.querySelector(`[data-log-preview="${key}"]`);
      if (node) node.textContent = value;
    });
  }

  function saveLog() {
    const grams = Number(ui.logDraft.grams);
    if (!Number.isFinite(grams) || grams <= 0 || grams > 2000) {
      showToast("请输入 1–2000g 之间的克数");
      return;
    }
    const index = state.logs.findIndex((item) => item.id === ui.selectedLogId);
    if (index < 0) return;
    const current = state.logs[index];
    const food = foodForLog(current);
    state.logs[index] = {
      ...current,
      name: food.name,
      grams,
      meal: ui.logDraft.meal,
      measure: food.state,
      ...nutrientsFor(food, grams)
    };
    saveState();
    ui.modal = null;
    showToast(`${food.name}已更新为 ${formatNumber(grams)}g · ${ui.logDraft.meal}`);
  }

  function deleteLog() {
    const entry = state.logs.find((item) => item.id === ui.selectedLogId);
    if (!entry) return;
    const confirmed = window.confirm(`确定删除“${entry.name} ${formatNumber(entry.grams)}g”这条记录吗？`);
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
        render();
      });
    });

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

    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const action = button.dataset.action;
        if (action === "open-profile") {
          ui.profileDraft = { ...state.profile };
          ui.modal = "profile";
          render();
        } else if (action === "open-formula") {
          ui.modal = "formula";
          render();
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
          const log = makeLog(ui.selectedFoodId, ui.foodDraft.grams, ui.foodDraft.meal, "manual");
          state.logs.push(log);
          state.recentFoodIds = [ui.selectedFoodId, ...state.recentFoodIds.filter((id) => id !== ui.selectedFoodId)].slice(0, 12);
          saveState();
          ui.modal = null;
          showToast(`${log.name} ${formatNumber(log.grams)}g 已加入${log.meal}`);
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

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js?v=8", { updateViaCache: "none" }).catch((error) => {
        console.warn("离线缓存注册失败。", error);
      });
    });
  }

  render();
})();
