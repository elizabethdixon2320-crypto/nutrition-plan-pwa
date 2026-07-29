(function () {
  "use strict";

  const foods = [
    { id: "oats", name: "燕麦", category: "谷薯", state: "干重", kcal: 379, carbs: 67.7, protein: 13.2, fat: 6.5, portion: 70 },
    { id: "rice_raw", name: "生米", category: "谷薯", state: "生重", kcal: 346, carbs: 77.2, protein: 7.4, fat: 0.8, portion: 80 },
    { id: "rice_cooked", name: "熟米饭", category: "谷薯", state: "熟重", kcal: 116, carbs: 25.9, protein: 2.6, fat: 0.3, portion: 180 },
    { id: "noodles", name: "熟面条", category: "谷薯", state: "熟重", kcal: 110, carbs: 23.7, protein: 3.4, fat: 0.5, portion: 200 },
    { id: "whole_wheat_bread", name: "全麦面包", category: "谷薯", state: "可食部", kcal: 246, carbs: 46.3, protein: 9.7, fat: 3.4, portion: 70 },
    { id: "sweet_potato", name: "红薯", category: "谷薯", state: "熟重", kcal: 86, carbs: 20.1, protein: 1.6, fat: 0.1, portion: 200 },
    { id: "potato", name: "土豆", category: "谷薯", state: "熟重", kcal: 81, carbs: 17.8, protein: 2.6, fat: 0.2, portion: 200 },
    { id: "pumpkin", name: "贝贝南瓜", category: "谷薯", state: "熟重", kcal: 91, carbs: 20.6, protein: 1.8, fat: 0.3, portion: 180 },
    { id: "corn", name: "甜玉米", category: "谷薯", state: "可食部", kcal: 112, carbs: 22.8, protein: 4.0, fat: 1.2, portion: 150 },

    { id: "egg", name: "鸡蛋", category: "蛋奶", state: "可食部", kcal: 144, carbs: 2.8, protein: 13.3, fat: 8.8, portion: 50 },
    { id: "milk", name: "低脂牛奶", category: "蛋奶", state: "液体", kcal: 46, carbs: 4.9, protein: 3.4, fat: 1.5, portion: 250 },
    { id: "yogurt", name: "无糖酸奶", category: "蛋奶", state: "可食部", kcal: 63, carbs: 4.8, protein: 4.5, fat: 2.8, portion: 150 },
    { id: "tofu", name: "北豆腐", category: "蛋奶", state: "可食部", kcal: 116, carbs: 3.0, protein: 12.2, fat: 6.5, portion: 150 },

    { id: "chicken_breast", name: "鸡胸肉", category: "肉类", state: "熟重", kcal: 165, carbs: 0, protein: 31.0, fat: 3.6, portion: 150 },
    { id: "chicken_thigh", name: "去皮鸡腿", category: "肉类", state: "熟重", kcal: 177, carbs: 0, protein: 24.0, fat: 8.0, portion: 150 },
    { id: "beef", name: "瘦牛肉", category: "肉类", state: "熟重", kcal: 190, carbs: 0, protein: 27.0, fat: 9.0, portion: 150 },
    { id: "pork_tenderloin", name: "猪里脊", category: "肉类", state: "熟重", kcal: 155, carbs: 0, protein: 29.0, fat: 3.5, portion: 150 },
    { id: "shrimp", name: "虾仁", category: "水产", state: "熟重", kcal: 99, carbs: 0.2, protein: 24.0, fat: 0.3, portion: 150 },
    { id: "salmon", name: "三文鱼", category: "水产", state: "熟重", kcal: 208, carbs: 0, protein: 20.4, fat: 13.4, portion: 120 },
    { id: "cod", name: "鳕鱼", category: "水产", state: "熟重", kcal: 105, carbs: 0, protein: 22.8, fat: 0.9, portion: 150 },

    { id: "broccoli", name: "西兰花", category: "果蔬", state: "熟重", kcal: 35, carbs: 7.2, protein: 2.4, fat: 0.4, portion: 150 },
    { id: "spinach", name: "菠菜", category: "果蔬", state: "熟重", kcal: 28, carbs: 4.6, protein: 3.0, fat: 0.4, portion: 150 },
    { id: "cucumber", name: "黄瓜", category: "果蔬", state: "可食部", kcal: 16, carbs: 3.6, protein: 0.8, fat: 0.2, portion: 200 },
    { id: "tomato", name: "番茄", category: "果蔬", state: "可食部", kcal: 20, carbs: 3.9, protein: 0.9, fat: 0.2, portion: 200 },
    { id: "blueberry", name: "蓝莓", category: "果蔬", state: "可食部", kcal: 57, carbs: 14.5, protein: 0.7, fat: 0.3, portion: 100 },
    { id: "apple", name: "苹果", category: "果蔬", state: "可食部", kcal: 52, carbs: 13.8, protein: 0.3, fat: 0.2, portion: 180 },
    { id: "banana", name: "香蕉", category: "果蔬", state: "可食部", kcal: 89, carbs: 22.8, protein: 1.1, fat: 0.3, portion: 120 },
    { id: "orange", name: "橙子", category: "果蔬", state: "可食部", kcal: 47, carbs: 11.8, protein: 0.9, fat: 0.1, portion: 180 },

    { id: "mixed_nuts", name: "混合坚果", category: "脂肪", state: "可食部", kcal: 607, carbs: 21.4, protein: 20.2, fat: 52.3, portion: 20 },
    { id: "peanut_butter", name: "花生酱", category: "脂肪", state: "可食部", kcal: 588, carbs: 20.0, protein: 25.0, fat: 50.0, portion: 15 },
    { id: "avocado", name: "牛油果", category: "脂肪", state: "可食部", kcal: 160, carbs: 8.5, protein: 2.0, fat: 14.7, portion: 80 },
    { id: "cooking_oil", name: "食用油", category: "脂肪", state: "可食部", kcal: 900, carbs: 0, protein: 0, fat: 100, portion: 5 },
    { id: "sauce", name: "常用酱料", category: "其他", state: "估算", kcal: 120, carbs: 20.0, protein: 2.0, fat: 3.5, portion: 15 }
  ];

  const activityLevels = [
    { id: "low", label: "每周 2–3 小时", carbs: { male: 2.2, female: 2.0 }, protein: 1.4, fat: { male: 0.8, female: 1.0 } },
    { id: "moderate", label: "每周 3–5 小时", carbs: { male: 2.5, female: 2.2 }, protein: 1.6, fat: { male: 0.9, female: 1.1 } },
    { id: "high", label: "每周 5–7 小时", carbs: { male: 3.0, female: 2.5 }, protein: 1.7, fat: { male: 1.0, female: 1.1 } },
    { id: "very_high", label: "每周 7 小时以上", carbs: { male: 3.5, female: 3.0 }, protein: 1.8, fat: { male: 1.0, female: 1.2 } }
  ];

  window.NUTRITION_DATA = Object.freeze({
    foods: Object.freeze(foods),
    activityLevels: Object.freeze(activityLevels),
    categories: Object.freeze(["全部", "常用", "谷薯", "蛋奶", "肉类", "水产", "果蔬", "脂肪"])
  });
})();
