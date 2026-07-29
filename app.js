(function () {
  "use strict";

  const STORAGE_KEY = "personal-nutrition-plan-v1";
  const { foods, activityLevels, categories, library } = window.NUTRITION_DATA;
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
        activityId: "low"
      },
      targets: {
        carbs: 187,
        protein: 120,
        fat: 68,
        source: "视频示例目标"
      },
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
      if (saved && [1, 2].includes(saved.version)) {
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

  function calculateTargets(weight, sex, activityId) {
    const activity = activityLevels.find((item) => item.id === activityId) || activityLevels[0];
    return {
      carbs: Math.round(Number(weight) * activity.carbs[sex]),
      protein: Math.round(Number(weight) * activity.protein),
      fat: Math.round(Number(weight) * activity.fat[sex]),
      source: `${activity.label} · 当前体重重算`
    };
  }

  function targetCalories() {
    return state.targets.carbs * 4 + state.targets.protein * 4 + state.targets.fat * 9;
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
    const percentage = clamp((value / target) * 100, 0, 100);
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
          <div class="summary-head">
            <div>
              <span>今日还可摄入</span>
              <strong>${formatNumber(remainingKcal)}<small>千卡</small></strong>
            </div>
            <button class="pill-button" data-action="open-formula">目标说明</button>
          </div>
          <div class="summary-meta">
            <div><span>已记录</span><strong>${formatNumber(totals.kcal)}</strong><small>kcal</small></div>
            <div><span>今日目标</span><strong>${formatNumber(targetCalories())}</strong><small>kcal</small></div>
            <div><span>当前体重</span><strong>${formatNumber(state.profile.currentWeight, 1)}</strong><small>kg</small></div>
          </div>
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
            <input name="weight" type="number" min="30" max="300" step="0.1" value="${formatNumber(state.profile.currentWeight, 1)}" aria-label="今天体重" />
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
          <button class="button primary full recalculate-button" data-action="recalculate-targets">按当前 ${formatNumber(state.profile.currentWeight, 1)}kg 重新计算</button>
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
    const activity = activityLevels.find((item) => item.id === state.profile.activityId);
    return `
      <div class="scrim" data-action="close-modal"></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-label="目标计算说明">
        <div class="sheet-handle"></div>
        <div class="sheet-head">
          <div><h2>目标如何计算</h2><p>当前记录方案 · 不是医疗处方</p></div>
          <button class="close-button" data-action="close-modal" aria-label="关闭">${icon("x")}</button>
        </div>
        <p class="formula-note">
          当前档位为「${activity.label}」。视频方案按当前体重乘以对应系数：男性碳水 ${activity.carbs.male}、蛋白质 ${activity.protein}、脂肪 ${activity.fat.male}；女性碳水 ${activity.carbs.female}、蛋白质 ${activity.protein}、脂肪 ${activity.fat.female}。
        </p>
        <div class="nutrition-preview">
          <div><strong>${state.targets.carbs}g</strong><span>碳水</span></div>
          <div><strong>${state.targets.protein}g</strong><span>蛋白质</span></div>
          <div><strong>${state.targets.fat}g</strong><span>脂肪</span></div>
          <div><strong>${targetCalories()}</strong><span>千卡</span></div>
        </div>
        <p class="microcopy">体重变化、训练量、睡眠和健康状况都会影响实际需要。若有慢性病、妊娠或进食障碍风险，请先咨询医生或注册营养师。</p>
      </section>
    `;
  }

  function profileModal() {
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
            <label for="profile-sex">性别</label>
            <select id="profile-sex" data-profile="sex">
              <option value="male" ${state.profile.sex === "male" ? "selected" : ""}>男性</option>
              <option value="female" ${state.profile.sex === "female" ? "selected" : ""}>女性</option>
            </select>
          </div>
          <div class="field">
            <label for="profile-weight">当前体重（kg）</label>
            <input id="profile-weight" type="number" min="30" max="300" step="0.1" value="${state.profile.currentWeight}" data-profile="currentWeight" />
          </div>
          <div class="field">
            <label for="profile-activity">每周运动量</label>
            <select id="profile-activity" data-profile="activityId">
              ${activityLevels.map((item) => `<option value="${item.id}" ${state.profile.activityId === item.id ? "selected" : ""}>${item.label}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="settings-actions">
          <button class="button primary full" data-action="save-profile">保存资料</button>
          ${ui.deferredInstallPrompt ? `<button class="button secondary full" data-action="install-app">安装到设备</button>` : ""}
          <button class="button secondary full" data-action="export-data">导出本地备份</button>
          <button class="button danger full" data-action="reset-data">恢复演示数据</button>
        </div>
        <p class="microcopy">修改资料不会自动改变当前目标；请在趋势页确认后重新计算，避免目标在无感知的情况下变化。</p>
      </section>
    `;
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

  function saveWeight(value) {
    const weight = round(Number(value), 1);
    if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
      showToast("请输入 30–300kg 之间的体重");
      return;
    }
    const today = toDateKey(new Date());
    const existing = state.weights.find((item) => item.date === today);
    if (existing) existing.value = weight;
    else state.weights.push({ date: today, value: weight });
    state.weights.sort((a, b) => a.date.localeCompare(b.date));
    state.profile.currentWeight = weight;
    saveState();
    showToast(`今天体重已保存为 ${weight}kg`);
  }

  function saveProfile() {
    const sex = document.querySelector('[data-profile="sex"]').value;
    const currentWeight = round(Number(document.querySelector('[data-profile="currentWeight"]').value), 1);
    const activityId = document.querySelector('[data-profile="activityId"]').value;
    if (!Number.isFinite(currentWeight) || currentWeight < 30 || currentWeight > 300) {
      showToast("请输入 30–300kg 之间的体重");
      return;
    }
    state.profile = { ...state.profile, sex, currentWeight, activityId };
    saveState();
    ui.modal = null;
    showToast("资料已保存；目标保持不变");
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

    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const action = button.dataset.action;
        if (action === "open-profile") {
          ui.modal = "profile";
          render();
        } else if (action === "open-formula") {
          ui.modal = "formula";
          render();
        } else if (action === "close-modal") {
          ui.modal = null;
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
          state.targets = calculateTargets(state.profile.currentWeight, state.profile.sex, state.profile.activityId);
          saveState();
          ui.recalcMessage = `新目标为碳水 ${state.targets.carbs}g、蛋白质 ${state.targets.protein}g、脂肪 ${state.targets.fat}g。已保存，从下一餐开始参考即可。`;
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
      navigator.serviceWorker.register("./sw.js?v=7", { updateViaCache: "none" }).catch((error) => {
        console.warn("离线缓存注册失败。", error);
      });
    });
  }

  render();
})();
