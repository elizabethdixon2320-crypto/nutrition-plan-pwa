(function () {
  "use strict";

  const foods = [
  {
    "id": "oats",
    "name": "燕麦片（干）",
    "aliases": [
      "燕麦",
      "麦片",
      "rolled oats"
    ],
    "category": "谷薯",
    "state": "干重",
    "kcal": 382,
    "carbs": 68.7,
    "protein": 13.5,
    "fat": 5.9,
    "portion": 50,
    "common": true,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346396,
    "sourceDescription": "Oats, whole grain, rolled, old fashioned",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "rice_raw",
    "name": "白米（生）",
    "aliases": [
      "生米",
      "大米",
      "白米",
      "raw rice"
    ],
    "category": "谷薯",
    "state": "生重",
    "kcal": 365,
    "carbs": 80,
    "protein": 7.1,
    "fat": 0.7,
    "portion": 80,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169756,
    "sourceDescription": "Rice, white, long-grain, regular, raw, unenriched",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "rice_cooked",
    "name": "白米饭（熟）",
    "aliases": [
      "熟米饭",
      "米饭",
      "白饭",
      "cooked rice"
    ],
    "category": "谷薯",
    "state": "熟重",
    "kcal": 130,
    "carbs": 28.2,
    "protein": 2.7,
    "fat": 0.3,
    "portion": 180,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169757,
    "sourceDescription": "Rice, white, long-grain, regular, unenriched, cooked without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "brown_rice_raw",
    "name": "糙米（生）",
    "aliases": [
      "生糙米",
      "brown rice raw"
    ],
    "category": "谷薯",
    "state": "生重",
    "kcal": 367,
    "carbs": 76.2,
    "protein": 7.5,
    "fat": 3.2,
    "portion": 80,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169703,
    "sourceDescription": "Rice, brown, long-grain, raw (Includes foods for USDA's Food Distribution Program)",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "brown_rice_cooked",
    "name": "糙米饭（熟）",
    "aliases": [
      "熟糙米",
      "糙米饭",
      "brown rice cooked"
    ],
    "category": "谷薯",
    "state": "熟重",
    "kcal": 123,
    "carbs": 25.6,
    "protein": 2.7,
    "fat": 1,
    "portion": 180,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169704,
    "sourceDescription": "Rice, brown, long-grain, cooked (Includes foods for USDA's Food Distribution Program)",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "oatmeal_cooked",
    "name": "燕麦粥（水煮）",
    "aliases": [
      "熟燕麦",
      "燕麦粥",
      "oatmeal"
    ],
    "category": "谷薯",
    "state": "熟重",
    "kcal": 71,
    "carbs": 12,
    "protein": 2.5,
    "fat": 1.5,
    "portion": 200,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 173905,
    "sourceDescription": "Cereals, oats, regular and quick, unenriched, cooked with water (includes boiling and microwaving), without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "millet_cooked",
    "name": "小米（熟）",
    "aliases": [
      "小米饭",
      "小米粥",
      "millet"
    ],
    "category": "谷薯",
    "state": "熟重",
    "kcal": 119,
    "carbs": 23.7,
    "protein": 3.5,
    "fat": 1,
    "portion": 180,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 168871,
    "sourceDescription": "Millet, cooked",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "quinoa_cooked",
    "name": "藜麦（熟）",
    "aliases": [
      "藜麦饭",
      "quinoa"
    ],
    "category": "谷薯",
    "state": "熟重",
    "kcal": 120,
    "carbs": 21.3,
    "protein": 4.4,
    "fat": 1.9,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 168917,
    "sourceDescription": "Quinoa, cooked",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "buckwheat_cooked",
    "name": "荞麦粒（熟）",
    "aliases": [
      "荞麦",
      "buckwheat"
    ],
    "category": "谷薯",
    "state": "熟重",
    "kcal": 92,
    "carbs": 19.9,
    "protein": 3.4,
    "fat": 0.6,
    "portion": 180,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 170686,
    "sourceDescription": "Buckwheat groats, roasted, cooked",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "noodles",
    "name": "鸡蛋面（熟）",
    "aliases": [
      "面条",
      "熟面条",
      "蛋面",
      "noodles"
    ],
    "category": "谷薯",
    "state": "熟重",
    "kcal": 138,
    "carbs": 25.2,
    "protein": 4.5,
    "fat": 2.1,
    "portion": 200,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 168926,
    "sourceDescription": "Noodles, egg, unenriched, cooked, without added salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "pasta_cooked",
    "name": "意大利面（熟）",
    "aliases": [
      "意面",
      "pasta"
    ],
    "category": "谷薯",
    "state": "熟重",
    "kcal": 158,
    "carbs": 30.9,
    "protein": 5.8,
    "fat": 0.9,
    "portion": 180,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169737,
    "sourceDescription": "Pasta, cooked, enriched, without added salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "whole_wheat_bread",
    "name": "全麦面包",
    "aliases": [
      "全麦吐司",
      "whole wheat bread"
    ],
    "category": "谷薯",
    "state": "可食部",
    "kcal": 252,
    "carbs": 42.7,
    "protein": 12.4,
    "fat": 3.5,
    "portion": 70,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 172688,
    "sourceDescription": "Bread, whole-wheat, commercially prepared",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "sweet_potato",
    "name": "红薯（水煮）",
    "aliases": [
      "地瓜",
      "番薯",
      "sweet potato"
    ],
    "category": "谷薯",
    "state": "熟重",
    "kcal": 76,
    "carbs": 17.7,
    "protein": 1.4,
    "fat": 0.1,
    "portion": 200,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 168484,
    "sourceDescription": "Sweet potato, cooked, boiled, without skin",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "potato",
    "name": "土豆（水煮）",
    "aliases": [
      "马铃薯",
      "potato"
    ],
    "category": "谷薯",
    "state": "熟重",
    "kcal": 86,
    "carbs": 20,
    "protein": 1.7,
    "fat": 0.1,
    "portion": 200,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 170440,
    "sourceDescription": "Potatoes, boiled, cooked without skin, flesh, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "corn",
    "name": "甜玉米（水煮）",
    "aliases": [
      "玉米",
      "甜玉米",
      "corn"
    ],
    "category": "谷薯",
    "state": "熟重",
    "kcal": 96,
    "carbs": 21,
    "protein": 3.4,
    "fat": 1.5,
    "portion": 150,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169999,
    "sourceDescription": "Corn, sweet, yellow, cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "black_rice_raw",
    "name": "黑米（生）",
    "aliases": [
      "黑米",
      "black rice"
    ],
    "category": "谷薯",
    "state": "生重",
    "kcal": 370,
    "carbs": 77.2,
    "protein": 7.6,
    "fat": 3.4,
    "portion": 80,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2710825,
    "sourceDescription": "Rice, black, unenriched, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "wild_rice_raw",
    "name": "野米（干）",
    "aliases": [
      "菰米",
      "wild rice"
    ],
    "category": "谷薯",
    "state": "干重",
    "kcal": 369,
    "carbs": 75.7,
    "protein": 12.8,
    "fat": 1.7,
    "portion": 80,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2710821,
    "sourceDescription": "Wild rice, dry, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "egg_raw",
    "name": "鸡蛋（生）",
    "aliases": [
      "生鸡蛋",
      "whole egg raw"
    ],
    "category": "蛋奶豆",
    "state": "可食部",
    "kcal": 148,
    "carbs": 1,
    "protein": 12.4,
    "fat": 10,
    "portion": 50,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 748967,
    "sourceDescription": "Eggs, Grade A, Large, egg whole",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "egg",
    "name": "鸡蛋（水煮）",
    "aliases": [
      "水煮蛋",
      "白煮蛋",
      "boiled egg"
    ],
    "category": "蛋奶豆",
    "state": "可食部",
    "kcal": 155,
    "carbs": 1.1,
    "protein": 12.6,
    "fat": 10.6,
    "portion": 50,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 173424,
    "sourceDescription": "Egg, whole, cooked, hard-boiled",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "egg_scrambled",
    "name": "炒鸡蛋",
    "aliases": [
      "煎蛋",
      "scrambled egg"
    ],
    "category": "蛋奶豆",
    "state": "熟重",
    "kcal": 149,
    "carbs": 1.6,
    "protein": 10,
    "fat": 11,
    "portion": 100,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 172187,
    "sourceDescription": "Egg, whole, cooked, scrambled",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "egg_white",
    "name": "鸡蛋白",
    "aliases": [
      "蛋清",
      "egg white"
    ],
    "category": "蛋奶豆",
    "state": "可食部",
    "kcal": 55,
    "carbs": 2.4,
    "protein": 10.7,
    "fat": 0,
    "portion": 100,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 747997,
    "sourceDescription": "Eggs, Grade A, Large, egg white",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "milk_whole",
    "name": "全脂牛奶",
    "aliases": [
      "纯牛奶",
      "whole milk"
    ],
    "category": "蛋奶豆",
    "state": "液体",
    "kcal": 60,
    "carbs": 4.6,
    "protein": 3.3,
    "fat": 3.2,
    "portion": 250,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 746782,
    "sourceDescription": "Milk, whole, 3.25% milkfat, with added vitamin D",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "milk",
    "name": "低脂牛奶（1%）",
    "aliases": [
      "低脂奶",
      "low fat milk"
    ],
    "category": "蛋奶豆",
    "state": "液体",
    "kcal": 43,
    "carbs": 5.2,
    "protein": 3.4,
    "fat": 1,
    "portion": 250,
    "common": true,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 746772,
    "sourceDescription": "Milk, lowfat, fluid, 1% milkfat, with added vitamin A and vitamin D",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "milk_skim",
    "name": "脱脂牛奶",
    "aliases": [
      "无脂牛奶",
      "skim milk"
    ],
    "category": "蛋奶豆",
    "state": "液体",
    "kcal": 34,
    "carbs": 4.9,
    "protein": 3.4,
    "fat": 0.1,
    "portion": 250,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 746776,
    "sourceDescription": "Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim)",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "yogurt",
    "name": "原味全脂酸奶",
    "aliases": [
      "无糖酸奶",
      "原味酸奶",
      "plain yogurt"
    ],
    "category": "蛋奶豆",
    "state": "可食部",
    "kcal": 78,
    "carbs": 5.6,
    "protein": 3.8,
    "fat": 4.5,
    "portion": 150,
    "common": true,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2259793,
    "sourceDescription": "Yogurt, plain, whole milk",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "greek_yogurt",
    "name": "无脂希腊酸奶",
    "aliases": [
      "希腊酸奶",
      "greek yogurt"
    ],
    "category": "蛋奶豆",
    "state": "可食部",
    "kcal": 61,
    "carbs": 3.6,
    "protein": 10.3,
    "fat": 0.4,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 330137,
    "sourceDescription": "Yogurt, Greek, plain, nonfat",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "cottage_cheese",
    "name": "低脂茅屋奶酪",
    "aliases": [
      "农家奶酪",
      "cottage cheese"
    ],
    "category": "蛋奶豆",
    "state": "可食部",
    "kcal": 81,
    "carbs": 4.8,
    "protein": 10.4,
    "fat": 2.3,
    "portion": 100,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 172182,
    "sourceDescription": "Cheese, cottage, lowfat, 2% milkfat",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "cheddar",
    "name": "切达奶酪",
    "aliases": [
      "车打奶酪",
      "cheddar"
    ],
    "category": "蛋奶豆",
    "state": "可食部",
    "kcal": 408,
    "carbs": 2.4,
    "protein": 23.3,
    "fat": 34,
    "portion": 30,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 328637,
    "sourceDescription": "Cheese, cheddar",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "soy_milk",
    "name": "无糖豆奶",
    "aliases": [
      "豆浆",
      "无糖豆浆",
      "soy milk"
    ],
    "category": "蛋奶豆",
    "state": "液体",
    "kcal": 39,
    "carbs": 1.3,
    "protein": 3.6,
    "fat": 2.1,
    "portion": 250,
    "common": true,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 1999630,
    "sourceDescription": "Soy milk, unsweetened, plain, shelf stable",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "tofu",
    "name": "北豆腐",
    "aliases": [
      "硬豆腐",
      "老豆腐",
      "firm tofu"
    ],
    "category": "蛋奶豆",
    "state": "可食部",
    "kcal": 78,
    "carbs": 2.9,
    "protein": 9,
    "fat": 4.2,
    "portion": 150,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 172448,
    "sourceDescription": "Tofu, firm, prepared with calcium sulfate and magnesium chloride (nigari)",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "tofu_soft",
    "name": "嫩豆腐",
    "aliases": [
      "南豆腐",
      "软豆腐",
      "soft tofu"
    ],
    "category": "蛋奶豆",
    "state": "可食部",
    "kcal": 61,
    "carbs": 1.2,
    "protein": 7.2,
    "fat": 3.7,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 172449,
    "sourceDescription": "Tofu, soft, prepared with calcium sulfate and magnesium chloride (nigari)",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "tofu_fried",
    "name": "油豆腐",
    "aliases": [
      "炸豆腐",
      "fried tofu"
    ],
    "category": "蛋奶豆",
    "state": "可食部",
    "kcal": 270,
    "carbs": 8.9,
    "protein": 18.8,
    "fat": 20.2,
    "portion": 100,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 172451,
    "sourceDescription": "Tofu, fried",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "edamame",
    "name": "毛豆（水煮）",
    "aliases": [
      "枝豆",
      "青大豆",
      "edamame"
    ],
    "category": "蛋奶豆",
    "state": "熟重",
    "kcal": 141,
    "carbs": 11,
    "protein": 12.4,
    "fat": 6.4,
    "portion": 100,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169283,
    "sourceDescription": "Soybeans, green, cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "lentils",
    "name": "扁豆（熟）",
    "aliases": [
      "小扁豆",
      "lentils"
    ],
    "category": "蛋奶豆",
    "state": "熟重",
    "kcal": 116,
    "carbs": 20.1,
    "protein": 9,
    "fat": 0.4,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 172421,
    "sourceDescription": "Lentils, mature seeds, cooked, boiled, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "chickpeas",
    "name": "鹰嘴豆（熟）",
    "aliases": [
      "鸡心豆",
      "chickpeas"
    ],
    "category": "蛋奶豆",
    "state": "熟重",
    "kcal": 164,
    "carbs": 27.4,
    "protein": 8.9,
    "fat": 2.6,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 173757,
    "sourceDescription": "Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "black_beans",
    "name": "黑豆（熟）",
    "aliases": [
      "黑芸豆",
      "black beans"
    ],
    "category": "蛋奶豆",
    "state": "熟重",
    "kcal": 132,
    "carbs": 23.7,
    "protein": 8.9,
    "fat": 0.5,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 173735,
    "sourceDescription": "Beans, black, mature seeds, cooked, boiled, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "mung_sprouts",
    "name": "绿豆芽（生）",
    "aliases": [
      "豆芽",
      "绿豆芽",
      "mung bean sprouts"
    ],
    "category": "蛋奶豆",
    "state": "可食部",
    "kcal": 30,
    "carbs": 5.9,
    "protein": 3,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169957,
    "sourceDescription": "Mung beans, mature seeds, sprouted, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "tempeh",
    "name": "天贝（熟）",
    "aliases": [
      "丹贝",
      "tempeh"
    ],
    "category": "蛋奶豆",
    "state": "熟重",
    "kcal": 195,
    "carbs": 7.6,
    "protein": 19.9,
    "fat": 11.4,
    "portion": 100,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 172467,
    "sourceDescription": "Tempeh, cooked",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "chicken_breast_raw",
    "name": "鸡胸肉（生）",
    "aliases": [
      "生鸡胸",
      "chicken breast raw"
    ],
    "category": "肉禽",
    "state": "生重",
    "kcal": 106,
    "carbs": 0,
    "protein": 22.5,
    "fat": 1.9,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2646170,
    "sourceDescription": "Chicken, breast, boneless, skinless, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "chicken_breast",
    "name": "鸡胸肉（熟）",
    "aliases": [
      "熟鸡胸",
      "烤鸡胸",
      "chicken breast"
    ],
    "category": "肉禽",
    "state": "熟重",
    "kcal": 151,
    "carbs": 0,
    "protein": 30.5,
    "fat": 3.2,
    "portion": 150,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 171534,
    "sourceDescription": "Chicken, broiler or fryers, breast, skinless, boneless, meat only, cooked, grilled",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "chicken_thigh_raw",
    "name": "去皮鸡腿肉（生）",
    "aliases": [
      "生鸡腿",
      "chicken thigh raw"
    ],
    "category": "肉禽",
    "state": "生重",
    "kcal": 144,
    "carbs": 0,
    "protein": 18.6,
    "fat": 7.9,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2646171,
    "sourceDescription": "Chicken, thigh, boneless, skinless, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "chicken_thigh",
    "name": "去皮鸡腿肉（熟）",
    "aliases": [
      "熟鸡腿",
      "鸡腿肉",
      "chicken thigh"
    ],
    "category": "肉禽",
    "state": "熟重",
    "kcal": 179,
    "carbs": 0,
    "protein": 24.8,
    "fat": 8.2,
    "portion": 150,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 172388,
    "sourceDescription": "Chicken, broilers or fryers, thigh, meat only, cooked, roasted",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "chicken_drumstick",
    "name": "鸡小腿肉（熟）",
    "aliases": [
      "鸡腿棒",
      "drumstick"
    ],
    "category": "肉禽",
    "state": "熟重",
    "kcal": 156,
    "carbs": 0,
    "protein": 23.9,
    "fat": 6,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 331897,
    "sourceDescription": "Chicken, broilers or fryers, drumstick, meat only, cooked, braised",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "turkey_breast",
    "name": "火鸡胸肉（熟）",
    "aliases": [
      "火鸡肉",
      "turkey breast"
    ],
    "category": "肉禽",
    "state": "熟重",
    "kcal": 147,
    "carbs": 0,
    "protein": 30.1,
    "fat": 2.1,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 171496,
    "sourceDescription": "Turkey, whole, breast, meat only, cooked, roasted",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "duck",
    "name": "鸭肉（熟、去皮）",
    "aliases": [
      "熟鸭肉",
      "duck"
    ],
    "category": "肉禽",
    "state": "熟重",
    "kcal": 201,
    "carbs": 0,
    "protein": 23.5,
    "fat": 11.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 172411,
    "sourceDescription": "Duck, domesticated, meat only, cooked, roasted",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "beef_raw",
    "name": "瘦牛肉（生）",
    "aliases": [
      "生牛肉",
      "牛后腿",
      "lean beef raw"
    ],
    "category": "肉禽",
    "state": "生重",
    "kcal": 141,
    "carbs": 0.9,
    "protein": 21.5,
    "fat": 5.7,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2646173,
    "sourceDescription": "Beef, round, top round, boneless, choice, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "beef",
    "name": "牛里脊（熟）",
    "aliases": [
      "熟牛肉",
      "牛排",
      "beef tenderloin"
    ],
    "category": "肉禽",
    "state": "熟重",
    "kcal": 198,
    "carbs": 0,
    "protein": 30.7,
    "fat": 8.3,
    "portion": 150,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 170641,
    "sourceDescription": "Beef, loin, tenderloin steak, boneless, separable lean only, trimmed to 0\" fat, all grades, cooked, grilled",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "ground_beef",
    "name": "瘦牛肉馅（熟）",
    "aliases": [
      "牛肉末",
      "牛肉馅",
      "ground beef"
    ],
    "category": "肉禽",
    "state": "熟重",
    "kcal": 230,
    "carbs": 0,
    "protein": 28.4,
    "fat": 12,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 171794,
    "sourceDescription": "Beef, ground, 90% lean meat / 10% fat, crumbles, cooked, pan-browned",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "pork_tenderloin_raw",
    "name": "猪里脊（生）",
    "aliases": [
      "生猪里脊",
      "pork tenderloin raw"
    ],
    "category": "肉禽",
    "state": "生重",
    "kcal": 119,
    "carbs": 0,
    "protein": 21.6,
    "fat": 3.9,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2646169,
    "sourceDescription": "Pork, loin, tenderloin, boneless, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "pork_tenderloin",
    "name": "猪里脊（熟）",
    "aliases": [
      "熟猪里脊",
      "pork tenderloin"
    ],
    "category": "肉禽",
    "state": "熟重",
    "kcal": 143,
    "carbs": 0,
    "protein": 26.2,
    "fat": 3.5,
    "portion": 150,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 168250,
    "sourceDescription": "Pork, fresh, loin, tenderloin, separable lean only, cooked, roasted",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "pork_loin",
    "name": "猪瘦肉（熟）",
    "aliases": [
      "瘦猪肉",
      "pork loin"
    ],
    "category": "肉禽",
    "state": "熟重",
    "kcal": 209,
    "carbs": 0,
    "protein": 28.6,
    "fat": 9.6,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 168233,
    "sourceDescription": "Pork, fresh, loin, whole, separable lean only, cooked, roasted",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "pork_belly_raw",
    "name": "五花肉（生）",
    "aliases": [
      "猪五花",
      "猪腹肉",
      "pork belly"
    ],
    "category": "肉禽",
    "state": "生重",
    "kcal": 380,
    "carbs": 0,
    "protein": 15.2,
    "fat": 35.8,
    "portion": 100,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2727576,
    "sourceDescription": "Pork, belly, with skin, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "lamb",
    "name": "羊腿肉（熟、瘦）",
    "aliases": [
      "羊肉",
      "lamb"
    ],
    "category": "肉禽",
    "state": "熟重",
    "kcal": 191,
    "carbs": 0,
    "protein": 28.3,
    "fat": 7.7,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 174314,
    "sourceDescription": "Lamb, leg, whole (shank and sirloin), separable lean only, trimmed to 1/4\" fat, choice, cooked, roasted",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "bacon",
    "name": "培根（熟）",
    "aliases": [
      "熏肉",
      "bacon"
    ],
    "category": "肉禽",
    "state": "熟重",
    "kcal": 500,
    "carbs": 2.1,
    "protein": 40.9,
    "fat": 36.5,
    "portion": 50,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 749420,
    "sourceDescription": "Pork, cured, bacon, cooked, restaurant",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "shrimp_raw",
    "name": "虾仁（生）",
    "aliases": [
      "生虾",
      "shrimp raw"
    ],
    "category": "水产",
    "state": "生重",
    "kcal": 71,
    "carbs": 0.5,
    "protein": 15.6,
    "fat": 0.8,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2684443,
    "sourceDescription": "Crustaceans, shrimp, farm raised, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "shrimp",
    "name": "虾仁（熟）",
    "aliases": [
      "熟虾",
      "白灼虾",
      "shrimp"
    ],
    "category": "水产",
    "state": "熟重",
    "kcal": 99,
    "carbs": 0.2,
    "protein": 24,
    "fat": 0.3,
    "portion": 150,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 175180,
    "sourceDescription": "Crustaceans, shrimp, cooked",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "salmon_raw",
    "name": "三文鱼（生）",
    "aliases": [
      "生三文鱼",
      "salmon raw"
    ],
    "category": "水产",
    "state": "生重",
    "kcal": 197,
    "carbs": 0,
    "protein": 20.3,
    "fat": 13.1,
    "portion": 120,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2684441,
    "sourceDescription": "Fish, salmon, Atlantic, farm raised, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "salmon",
    "name": "三文鱼（熟）",
    "aliases": [
      "熟三文鱼",
      "烤三文鱼",
      "salmon"
    ],
    "category": "水产",
    "state": "熟重",
    "kcal": 206,
    "carbs": 0,
    "protein": 22.1,
    "fat": 12.4,
    "portion": 120,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 175168,
    "sourceDescription": "Fish, salmon, Atlantic, farmed, cooked, dry heat",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "cod_raw",
    "name": "鳕鱼（生）",
    "aliases": [
      "生鳕鱼",
      "cod raw"
    ],
    "category": "水产",
    "state": "生重",
    "kcal": 66,
    "carbs": 0,
    "protein": 16.1,
    "fat": 0.7,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2684444,
    "sourceDescription": "Fish, cod, Atlantic, wild caught, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "cod",
    "name": "鳕鱼（熟）",
    "aliases": [
      "熟鳕鱼",
      "cod"
    ],
    "category": "水产",
    "state": "熟重",
    "kcal": 105,
    "carbs": 0,
    "protein": 22.8,
    "fat": 0.9,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 171956,
    "sourceDescription": "Fish, cod, Atlantic, cooked, dry heat",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "tilapia_raw",
    "name": "罗非鱼（生）",
    "aliases": [
      "生罗非鱼",
      "tilapia raw"
    ],
    "category": "水产",
    "state": "生重",
    "kcal": 95,
    "carbs": 0,
    "protein": 19,
    "fat": 2.5,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2684442,
    "sourceDescription": "Fish, tilapia, farm raised, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "tilapia",
    "name": "罗非鱼（熟）",
    "aliases": [
      "熟罗非鱼",
      "tilapia"
    ],
    "category": "水产",
    "state": "熟重",
    "kcal": 128,
    "carbs": 0,
    "protein": 26.2,
    "fat": 2.7,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 175177,
    "sourceDescription": "Fish, tilapia, cooked, dry heat",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "tuna_canned",
    "name": "水浸金枪鱼罐头",
    "aliases": [
      "吞拿鱼罐头",
      "金枪鱼",
      "tuna"
    ],
    "category": "水产",
    "state": "沥干",
    "kcal": 86,
    "carbs": 0,
    "protein": 19.4,
    "fat": 1,
    "portion": 100,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 173709,
    "sourceDescription": "Fish, tuna, light, canned in water, drained solids (Includes foods for USDA's Food Distribution Program)",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "crab",
    "name": "蟹肉（熟）",
    "aliases": [
      "螃蟹",
      "熟蟹肉",
      "crab"
    ],
    "category": "水产",
    "state": "熟重",
    "kcal": 83,
    "carbs": 0,
    "protein": 17.9,
    "fat": 0.7,
    "portion": 120,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 174205,
    "sourceDescription": "Crustaceans, crab, blue, cooked, moist heat",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "squid",
    "name": "鱿鱼（生）",
    "aliases": [
      "鲜鱿",
      "squid"
    ],
    "category": "水产",
    "state": "生重",
    "kcal": 44,
    "carbs": 0.9,
    "protein": 8.8,
    "fat": 0.6,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2747671,
    "sourceDescription": "Squid (calamari), frozen, tubes only",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "scallop",
    "name": "扇贝肉（生）",
    "aliases": [
      "带子",
      "scallop"
    ],
    "category": "水产",
    "state": "生重",
    "kcal": 66,
    "carbs": 2,
    "protein": 13.5,
    "fat": 0.5,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2747667,
    "sourceDescription": "Scallops, sea, frozen, wild caught",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "snapper",
    "name": "红鲷鱼（生）",
    "aliases": [
      "鲷鱼",
      "snapper"
    ],
    "category": "水产",
    "state": "生重",
    "kcal": 90,
    "carbs": 0.4,
    "protein": 20.7,
    "fat": 0.6,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2747669,
    "sourceDescription": "Snapper, frozen, wild caught",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "anchovy",
    "name": "橄榄油浸凤尾鱼",
    "aliases": [
      "鳀鱼",
      "anchovy"
    ],
    "category": "水产",
    "state": "沥干",
    "kcal": 206,
    "carbs": 2.4,
    "protein": 26.9,
    "fat": 9.9,
    "portion": 30,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2747652,
    "sourceDescription": "Anchovies, canned in olive oil, with salt, drained",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "broccoli_raw",
    "name": "西兰花（生）",
    "aliases": [
      "生西兰花",
      "broccoli raw"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 31,
    "carbs": 6.3,
    "protein": 2.6,
    "fat": 0.3,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 747447,
    "sourceDescription": "Broccoli, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "broccoli",
    "name": "西兰花（水煮）",
    "aliases": [
      "熟西兰花",
      "broccoli"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 35,
    "carbs": 7.2,
    "protein": 2.4,
    "fat": 0.4,
    "portion": 150,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169967,
    "sourceDescription": "Broccoli, cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "spinach_raw",
    "name": "菠菜（生）",
    "aliases": [
      "生菠菜",
      "spinach raw"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 28,
    "carbs": 2.6,
    "protein": 2.9,
    "fat": 0.6,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 1999633,
    "sourceDescription": "Spinach, mature",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "spinach",
    "name": "菠菜（水煮）",
    "aliases": [
      "熟菠菜",
      "spinach"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 23,
    "carbs": 3.8,
    "protein": 3,
    "fat": 0.3,
    "portion": 150,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 168463,
    "sourceDescription": "Spinach, cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "bok_choy_raw",
    "name": "小白菜（生）",
    "aliases": [
      "青菜",
      "上海青",
      "bok choy"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 20,
    "carbs": 3.5,
    "protein": 1,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2685572,
    "sourceDescription": "Cabbage, bok choy, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "bok_choy",
    "name": "小白菜（水煮）",
    "aliases": [
      "熟小白菜",
      "熟青菜"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 12,
    "carbs": 1.8,
    "protein": 1.6,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 170391,
    "sourceDescription": "Cabbage, chinese (pak-choi), cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "napa_cabbage_raw",
    "name": "大白菜（生）",
    "aliases": [
      "白菜",
      "娃娃菜",
      "napa cabbage"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 16,
    "carbs": 3.2,
    "protein": 1.2,
    "fat": 0.2,
    "portion": 200,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169979,
    "sourceDescription": "Cabbage, chinese (pe-tsai), raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "napa_cabbage",
    "name": "大白菜（水煮）",
    "aliases": [
      "熟白菜",
      "熟娃娃菜"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 14,
    "carbs": 2.4,
    "protein": 1.5,
    "fat": 0.2,
    "portion": 200,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169980,
    "sourceDescription": "Cabbage, chinese (pe-tsai), cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "cabbage_raw",
    "name": "卷心菜（生）",
    "aliases": [
      "包菜",
      "圆白菜",
      "cabbage"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 31,
    "carbs": 6.4,
    "protein": 1,
    "fat": 0.2,
    "portion": 200,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346407,
    "sourceDescription": "Cabbage, green, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "cabbage",
    "name": "卷心菜（水煮）",
    "aliases": [
      "熟包菜",
      "熟圆白菜"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 23,
    "carbs": 5.5,
    "protein": 1.3,
    "fat": 0.1,
    "portion": 200,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169976,
    "sourceDescription": "Cabbage, cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "cucumber",
    "name": "黄瓜",
    "aliases": [
      "青瓜",
      "cucumber"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 16,
    "carbs": 3,
    "protein": 0.6,
    "fat": 0.2,
    "portion": 200,
    "common": true,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346406,
    "sourceDescription": "Cucumber, with peel, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "tomato",
    "name": "番茄",
    "aliases": [
      "西红柿",
      "tomato"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 22,
    "carbs": 3.8,
    "protein": 0.7,
    "fat": 0.4,
    "portion": 200,
    "common": true,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 1999634,
    "sourceDescription": "Tomato, roma",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "carrot_raw",
    "name": "胡萝卜（生）",
    "aliases": [
      "生胡萝卜",
      "carrot raw"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 48,
    "carbs": 10.3,
    "protein": 0.9,
    "fat": 0.4,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2258586,
    "sourceDescription": "Carrots, mature, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "carrot",
    "name": "胡萝卜（水煮）",
    "aliases": [
      "熟胡萝卜",
      "carrot"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 35,
    "carbs": 8.2,
    "protein": 0.8,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 170394,
    "sourceDescription": "Carrots, cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "celery",
    "name": "西芹",
    "aliases": [
      "芹菜",
      "celery"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 17,
    "carbs": 3.3,
    "protein": 0.5,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346405,
    "sourceDescription": "Celery, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "eggplant_raw",
    "name": "茄子（生）",
    "aliases": [
      "生茄子",
      "eggplant raw"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 26,
    "carbs": 5.4,
    "protein": 0.9,
    "fat": 0.1,
    "portion": 200,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2685577,
    "sourceDescription": "Eggplant, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "eggplant",
    "name": "茄子（水煮）",
    "aliases": [
      "熟茄子",
      "eggplant"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 35,
    "carbs": 8.7,
    "protein": 0.8,
    "fat": 0.2,
    "portion": 200,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169229,
    "sourceDescription": "Eggplant, cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "pumpkin_raw",
    "name": "南瓜（生）",
    "aliases": [
      "生南瓜",
      "pumpkin raw"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 26,
    "carbs": 6.5,
    "protein": 1,
    "fat": 0.1,
    "portion": 180,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 168448,
    "sourceDescription": "Pumpkin, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "pumpkin",
    "name": "南瓜（水煮）",
    "aliases": [
      "熟南瓜",
      "pumpkin"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 20,
    "carbs": 4.9,
    "protein": 0.7,
    "fat": 0.1,
    "portion": 180,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 168449,
    "sourceDescription": "Pumpkin, cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "shiitake_raw",
    "name": "香菇（生）",
    "aliases": [
      "鲜香菇",
      "shiitake raw"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 44,
    "carbs": 8.2,
    "protein": 2.4,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 1999628,
    "sourceDescription": "Mushrooms, shiitake",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "shiitake",
    "name": "香菇（水煮）",
    "aliases": [
      "熟香菇",
      "shiitake"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 56,
    "carbs": 14.4,
    "protein": 1.6,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 168437,
    "sourceDescription": "Mushrooms, shiitake, cooked, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "mushroom_raw",
    "name": "白蘑菇（生）",
    "aliases": [
      "口蘑",
      "白蘑菇",
      "mushroom raw"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 31,
    "carbs": 4.1,
    "protein": 2.9,
    "fat": 0.4,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 1999629,
    "sourceDescription": "Mushrooms, white button",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "mushroom",
    "name": "白蘑菇（水煮）",
    "aliases": [
      "熟口蘑",
      "熟蘑菇"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 28,
    "carbs": 5.3,
    "protein": 2.2,
    "fat": 0.5,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169252,
    "sourceDescription": "Mushrooms, white, cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "green_beans_raw",
    "name": "四季豆（生）",
    "aliases": [
      "豆角",
      "菜豆",
      "green beans"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 40,
    "carbs": 7.4,
    "protein": 2,
    "fat": 0.3,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346400,
    "sourceDescription": "Beans, snap, green, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "green_beans",
    "name": "四季豆（水煮）",
    "aliases": [
      "熟豆角",
      "熟菜豆"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 35,
    "carbs": 7.9,
    "protein": 1.9,
    "fat": 0.3,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169141,
    "sourceDescription": "Beans, snap, green, cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "green_peas",
    "name": "青豌豆（水煮）",
    "aliases": [
      "豌豆",
      "green peas"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 84,
    "carbs": 15.6,
    "protein": 5.4,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 170420,
    "sourceDescription": "Peas, green, cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "asparagus_raw",
    "name": "芦笋（生）",
    "aliases": [
      "生芦笋",
      "asparagus raw"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 28,
    "carbs": 5.1,
    "protein": 1.4,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2710823,
    "sourceDescription": "Asparagus, green, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "asparagus",
    "name": "芦笋（水煮）",
    "aliases": [
      "熟芦笋",
      "asparagus"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 22,
    "carbs": 4.1,
    "protein": 2.4,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 168390,
    "sourceDescription": "Asparagus, cooked, boiled, drained",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "green_pepper",
    "name": "青椒",
    "aliases": [
      "绿甜椒",
      "green pepper"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 23,
    "carbs": 4.8,
    "protein": 0.7,
    "fat": 0.1,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2258588,
    "sourceDescription": "Peppers, bell, green, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "red_pepper",
    "name": "红甜椒",
    "aliases": [
      "红椒",
      "red pepper"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 31,
    "carbs": 6.7,
    "protein": 0.9,
    "fat": 0.1,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2258590,
    "sourceDescription": "Peppers, bell, red, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "onion",
    "name": "黄洋葱",
    "aliases": [
      "洋葱",
      "onion"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 38,
    "carbs": 8.6,
    "protein": 0.8,
    "fat": 0.1,
    "portion": 100,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 790646,
    "sourceDescription": "Onions, yellow, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "garlic",
    "name": "大蒜",
    "aliases": [
      "蒜头",
      "garlic"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 143,
    "carbs": 28.2,
    "protein": 6.6,
    "fat": 0.4,
    "portion": 10,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 1104647,
    "sourceDescription": "Garlic, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "cauliflower_raw",
    "name": "花椰菜（生）",
    "aliases": [
      "菜花",
      "生花菜",
      "cauliflower raw"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 28,
    "carbs": 4.7,
    "protein": 1.6,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2685573,
    "sourceDescription": "Cauliflower, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "cauliflower",
    "name": "花椰菜（水煮）",
    "aliases": [
      "熟菜花",
      "熟花菜",
      "cauliflower"
    ],
    "category": "蔬菜",
    "state": "熟重",
    "kcal": 23,
    "carbs": 4.1,
    "protein": 1.8,
    "fat": 0.5,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 170397,
    "sourceDescription": "Cauliflower, cooked, boiled, drained, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "zucchini",
    "name": "西葫芦（生）",
    "aliases": [
      "角瓜",
      "zucchini"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 19,
    "carbs": 3.3,
    "protein": 1,
    "fat": 0.2,
    "portion": 200,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2685568,
    "sourceDescription": "Squash, summer, green, zucchini, includes skin, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "lettuce",
    "name": "罗马生菜",
    "aliases": [
      "生菜",
      "lettuce"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 21,
    "carbs": 4.1,
    "protein": 1,
    "fat": 0.1,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346389,
    "sourceDescription": "Lettuce, romaine, green, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "radish",
    "name": "小红萝卜",
    "aliases": [
      "樱桃萝卜",
      "radish"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 20,
    "carbs": 4.1,
    "protein": 0.7,
    "fat": 0.1,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2747665,
    "sourceDescription": "Radishes, red, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "beet",
    "name": "甜菜根（生）",
    "aliases": [
      "红菜头",
      "beet"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 45,
    "carbs": 8.8,
    "protein": 1.7,
    "fat": 0.3,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2685576,
    "sourceDescription": "Beets, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "brussels_sprouts",
    "name": "抱子甘蓝（生）",
    "aliases": [
      "球芽甘蓝",
      "brussels sprouts"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 60,
    "carbs": 9.6,
    "protein": 4,
    "fat": 0.6,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2685575,
    "sourceDescription": "Brussels sprouts, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "leek",
    "name": "韭葱",
    "aliases": [
      "大葱",
      "leek"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 61,
    "carbs": 14.2,
    "protein": 1.5,
    "fat": 0.3,
    "portion": 100,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169246,
    "sourceDescription": "Leeks, (bulb and lower leaf-portion), raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "green_onion",
    "name": "小葱",
    "aliases": [
      "香葱",
      "葱",
      "scallion"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 32,
    "carbs": 7.3,
    "protein": 1.8,
    "fat": 0.2,
    "portion": 30,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 170005,
    "sourceDescription": "Onions, spring or scallions (includes tops and bulb), raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "sweet_corn_raw",
    "name": "甜玉米粒（生）",
    "aliases": [
      "生玉米粒",
      "corn kernels"
    ],
    "category": "蔬菜",
    "state": "可食部",
    "kcal": 85,
    "carbs": 14.7,
    "protein": 2.8,
    "fat": 1.6,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2710826,
    "sourceDescription": "Corn, sweet, yellow and white kernels,  fresh, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "apple",
    "name": "富士苹果",
    "aliases": [
      "苹果",
      "apple"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 65,
    "carbs": 15.7,
    "protein": 0.1,
    "fat": 0.2,
    "portion": 180,
    "common": true,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 1750340,
    "sourceDescription": "Apples, fuji, with skin, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "banana",
    "name": "香蕉",
    "aliases": [
      "banana"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 97,
    "carbs": 23,
    "protein": 0.7,
    "fat": 0.3,
    "portion": 120,
    "common": true,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 1105314,
    "sourceDescription": "Bananas, ripe and slightly ripe, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "orange",
    "name": "脐橙",
    "aliases": [
      "橙子",
      "orange"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 47,
    "carbs": 11.8,
    "protein": 0.9,
    "fat": 0.2,
    "portion": 180,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 746771,
    "sourceDescription": "Oranges, raw, navels",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "grape",
    "name": "红葡萄",
    "aliases": [
      "葡萄",
      "提子",
      "grape"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 86,
    "carbs": 20.2,
    "protein": 0.9,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346412,
    "sourceDescription": "Grapes, red, seedless, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "blueberry",
    "name": "蓝莓",
    "aliases": [
      "blueberry"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 64,
    "carbs": 14.6,
    "protein": 0.7,
    "fat": 0.3,
    "portion": 100,
    "common": true,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346411,
    "sourceDescription": "Blueberries, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "strawberry",
    "name": "草莓",
    "aliases": [
      "strawberry"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 36,
    "carbs": 8,
    "protein": 0.6,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346409,
    "sourceDescription": "Strawberries, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "pear",
    "name": "巴特利梨",
    "aliases": [
      "梨",
      "pear"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 57,
    "carbs": 15.1,
    "protein": 0.4,
    "fat": 0.2,
    "portion": 180,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 746773,
    "sourceDescription": "Pears, raw, bartlett",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "peach",
    "name": "黄桃（鲜）",
    "aliases": [
      "桃子",
      "鲜桃",
      "peach"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 42,
    "carbs": 10.1,
    "protein": 0.9,
    "fat": 0.3,
    "portion": 180,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 325430,
    "sourceDescription": "Peaches, yellow, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "kiwi",
    "name": "猕猴桃",
    "aliases": [
      "奇异果",
      "kiwi"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 65,
    "carbs": 13.8,
    "protein": 1,
    "fat": 0.6,
    "portion": 100,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2710831,
    "sourceDescription": "Kiwifruit (kiwi), green, peeled, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "mango",
    "name": "芒果",
    "aliases": [
      "mango"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 69,
    "carbs": 15.3,
    "protein": 0.6,
    "fat": 0.6,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2710833,
    "sourceDescription": "Mango, Tommy Atkins, peeled, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "pineapple",
    "name": "菠萝",
    "aliases": [
      "凤梨",
      "pineapple"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 60,
    "carbs": 14.1,
    "protein": 0.5,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346398,
    "sourceDescription": "Pineapple, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "watermelon",
    "name": "西瓜",
    "aliases": [
      "watermelon"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 30,
    "carbs": 7.6,
    "protein": 0.6,
    "fat": 0.2,
    "portion": 300,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 167765,
    "sourceDescription": "Watermelon, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "cantaloupe",
    "name": "哈密瓜",
    "aliases": [
      "甜瓜",
      "cantaloupe"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 34,
    "carbs": 8.2,
    "protein": 0.8,
    "fat": 0.2,
    "portion": 200,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 746770,
    "sourceDescription": "Melons, cantaloupe, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "grapefruit",
    "name": "葡萄柚",
    "aliases": [
      "西柚",
      "grapefruit"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 32,
    "carbs": 8.1,
    "protein": 0.6,
    "fat": 0.1,
    "portion": 200,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 173033,
    "sourceDescription": "Grapefruit, raw, pink and red and white, all areas",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "plum",
    "name": "黑李子",
    "aliases": [
      "李子",
      "plum"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 59,
    "carbs": 13.5,
    "protein": 0.6,
    "fat": 0.3,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2710837,
    "sourceDescription": "Plum, black, with skin, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "cherry",
    "name": "甜樱桃",
    "aliases": [
      "车厘子",
      "樱桃",
      "cherry"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 71,
    "carbs": 16.2,
    "protein": 1,
    "fat": 0.2,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346399,
    "sourceDescription": "Cherries, sweet, dark red, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "avocado",
    "name": "牛油果",
    "aliases": [
      "鳄梨",
      "avocado"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 223,
    "carbs": 8.3,
    "protein": 1.8,
    "fat": 20.3,
    "portion": 80,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2710824,
    "sourceDescription": "Avocado, Hass, peeled, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "lychee",
    "name": "荔枝",
    "aliases": [
      "litchi",
      "lychee"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 66,
    "carbs": 16.5,
    "protein": 0.8,
    "fat": 0.4,
    "portion": 100,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169086,
    "sourceDescription": "Litchis, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "papaya",
    "name": "木瓜",
    "aliases": [
      "papaya"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 43,
    "carbs": 10.8,
    "protein": 0.5,
    "fat": 0.3,
    "portion": 150,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169926,
    "sourceDescription": "Papayas, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "mandarin",
    "name": "橘子",
    "aliases": [
      "柑橘",
      "蜜橘",
      "mandarin"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 62,
    "carbs": 13.4,
    "protein": 1,
    "fat": 0.5,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2710832,
    "sourceDescription": "Mandarin, seedless, peeled, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "apricot",
    "name": "杏",
    "aliases": [
      "杏子",
      "apricot"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 48,
    "carbs": 10.2,
    "protein": 1,
    "fat": 0.4,
    "portion": 150,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2710815,
    "sourceDescription": "Apricot, with skin, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "blackberry",
    "name": "黑莓",
    "aliases": [
      "blackberry"
    ],
    "category": "水果",
    "state": "可食部",
    "kcal": 43,
    "carbs": 9.6,
    "protein": 1.4,
    "fat": 0.5,
    "portion": 100,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 173946,
    "sourceDescription": "Blackberries, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "almonds",
    "name": "巴旦木（生）",
    "aliases": [
      "杏仁",
      "扁桃仁",
      "almond"
    ],
    "category": "坚果",
    "state": "可食部",
    "kcal": 626,
    "carbs": 20,
    "protein": 21.5,
    "fat": 51.1,
    "portion": 20,
    "common": true,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346393,
    "sourceDescription": "Nuts, almonds, whole, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "walnuts",
    "name": "核桃仁（生）",
    "aliases": [
      "核桃",
      "walnut"
    ],
    "category": "坚果",
    "state": "可食部",
    "kcal": 730,
    "carbs": 10.9,
    "protein": 14.6,
    "fat": 69.7,
    "portion": 20,
    "common": true,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346394,
    "sourceDescription": "Nuts, walnuts, English, halves, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "peanuts",
    "name": "花生仁（生）",
    "aliases": [
      "花生米",
      "peanut"
    ],
    "category": "坚果",
    "state": "可食部",
    "kcal": 588,
    "carbs": 26.5,
    "protein": 23.2,
    "fat": 43.3,
    "portion": 20,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2515376,
    "sourceDescription": "Peanuts, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "cashews",
    "name": "腰果（生）",
    "aliases": [
      "腰果仁",
      "cashew"
    ],
    "category": "坚果",
    "state": "可食部",
    "kcal": 565,
    "carbs": 36.3,
    "protein": 17.4,
    "fat": 38.9,
    "portion": 20,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2515374,
    "sourceDescription": "Nuts, cashew nuts, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "pistachios",
    "name": "开心果仁（生）",
    "aliases": [
      "开心果",
      "pistachio"
    ],
    "category": "坚果",
    "state": "可食部",
    "kcal": 598,
    "carbs": 27.7,
    "protein": 20.5,
    "fat": 45,
    "portion": 20,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2515379,
    "sourceDescription": "Nuts, pistachio nuts, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "pine_nuts",
    "name": "松子仁（生）",
    "aliases": [
      "松子",
      "pine nuts"
    ],
    "category": "坚果",
    "state": "可食部",
    "kcal": 689,
    "carbs": 18.6,
    "protein": 15.7,
    "fat": 61.3,
    "portion": 20,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2346392,
    "sourceDescription": "Nuts, pine nuts, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "brazil_nuts",
    "name": "巴西坚果（生）",
    "aliases": [
      "巴西果",
      "brazil nuts"
    ],
    "category": "坚果",
    "state": "可食部",
    "kcal": 664,
    "carbs": 21.6,
    "protein": 15,
    "fat": 57.4,
    "portion": 20,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2515373,
    "sourceDescription": "Nuts, brazilnuts, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "macadamia",
    "name": "夏威夷果仁（生）",
    "aliases": [
      "澳洲坚果",
      "macadamia"
    ],
    "category": "坚果",
    "state": "可食部",
    "kcal": 712,
    "carbs": 24.1,
    "protein": 7.8,
    "fat": 64.9,
    "portion": 20,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2515378,
    "sourceDescription": "Nuts, macadamia nuts, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "pumpkin_seeds",
    "name": "南瓜籽仁（生）",
    "aliases": [
      "南瓜子",
      "pumpkin seeds"
    ],
    "category": "坚果",
    "state": "可食部",
    "kcal": 555,
    "carbs": 18.7,
    "protein": 29.9,
    "fat": 40,
    "portion": 20,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2515380,
    "sourceDescription": "Seeds, pumpkin seeds (pepitas), raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "sunflower_seeds",
    "name": "葵花籽仁（生）",
    "aliases": [
      "瓜子仁",
      "sunflower seeds"
    ],
    "category": "坚果",
    "state": "可食部",
    "kcal": 609,
    "carbs": 24.5,
    "protein": 18.9,
    "fat": 48.4,
    "portion": 20,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2515381,
    "sourceDescription": "Seeds, sunflower seed, kernel, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "sesame",
    "name": "芝麻（干）",
    "aliases": [
      "白芝麻",
      "黑芝麻",
      "sesame"
    ],
    "category": "坚果",
    "state": "可食部",
    "kcal": 573,
    "carbs": 23.4,
    "protein": 17.7,
    "fat": 49.7,
    "portion": 15,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 170150,
    "sourceDescription": "Seeds, sesame seeds, whole, dried",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "chia",
    "name": "奇亚籽",
    "aliases": [
      "chia seeds"
    ],
    "category": "坚果",
    "state": "干重",
    "kcal": 517,
    "carbs": 38.3,
    "protein": 17,
    "fat": 32.9,
    "portion": 15,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2710819,
    "sourceDescription": "Chia seeds, dry, raw",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "flaxseed",
    "name": "亚麻籽粉",
    "aliases": [
      "亚麻籽",
      "flaxseed"
    ],
    "category": "坚果",
    "state": "干重",
    "kcal": 545,
    "carbs": 34.4,
    "protein": 18,
    "fat": 37.3,
    "portion": 15,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2262075,
    "sourceDescription": "Flaxseed, ground",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "peanut_butter",
    "name": "花生酱",
    "aliases": [
      "peanut butter"
    ],
    "category": "坚果",
    "state": "可食部",
    "kcal": 632,
    "carbs": 22.7,
    "protein": 24,
    "fat": 49.4,
    "portion": 15,
    "common": true,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2262072,
    "sourceDescription": "Peanut butter, creamy",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "almond_butter",
    "name": "杏仁酱",
    "aliases": [
      "巴旦木酱",
      "almond butter"
    ],
    "category": "坚果",
    "state": "可食部",
    "kcal": 645,
    "carbs": 21.2,
    "protein": 20.8,
    "fat": 53,
    "portion": 15,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 2262074,
    "sourceDescription": "Almond butter, creamy",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "olive_oil",
    "name": "橄榄油",
    "aliases": [
      "olive oil"
    ],
    "category": "油脂",
    "state": "液体",
    "kcal": 884,
    "carbs": 0,
    "protein": 0,
    "fat": 100,
    "portion": 5,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 171413,
    "sourceDescription": "Oil, olive, salad or cooking",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "canola_oil",
    "name": "菜籽油",
    "aliases": [
      "芥花油",
      "canola oil"
    ],
    "category": "油脂",
    "state": "液体",
    "kcal": 884,
    "carbs": 0,
    "protein": 0,
    "fat": 100,
    "portion": 5,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 172336,
    "sourceDescription": "Oil, canola",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "cooking_oil",
    "name": "大豆油",
    "aliases": [
      "豆油",
      "soybean oil",
      "食用油"
    ],
    "category": "油脂",
    "state": "液体",
    "kcal": 884,
    "carbs": 0,
    "protein": 0,
    "fat": 100,
    "portion": 5,
    "common": true,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 171411,
    "sourceDescription": "Oil, soybean, salad or cooking",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "peanut_oil",
    "name": "花生油",
    "aliases": [
      "peanut oil"
    ],
    "category": "油脂",
    "state": "液体",
    "kcal": 884,
    "carbs": 0,
    "protein": 0,
    "fat": 100,
    "portion": 5,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 171410,
    "sourceDescription": "Oil, peanut, salad or cooking",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "butter",
    "name": "无盐黄油",
    "aliases": [
      "牛油",
      "butter"
    ],
    "category": "油脂",
    "state": "可食部",
    "kcal": 717,
    "carbs": 0.1,
    "protein": 0.9,
    "fat": 81.1,
    "portion": 10,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 173430,
    "sourceDescription": "Butter, without salt",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "coconut_oil",
    "name": "椰子油",
    "aliases": [
      "coconut oil"
    ],
    "category": "油脂",
    "state": "液体",
    "kcal": 833,
    "carbs": 0.8,
    "protein": 0,
    "fat": 99.1,
    "portion": 5,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 330458,
    "sourceDescription": "Oil, coconut",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "sugar",
    "name": "白砂糖",
    "aliases": [
      "砂糖",
      "白糖",
      "sugar"
    ],
    "category": "调味",
    "state": "可食部",
    "kcal": 385,
    "carbs": 99.6,
    "protein": 0,
    "fat": 0.3,
    "portion": 10,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 746784,
    "sourceDescription": "Sugars, granulated",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "honey",
    "name": "蜂蜜",
    "aliases": [
      "honey"
    ],
    "category": "调味",
    "state": "可食部",
    "kcal": 304,
    "carbs": 82.4,
    "protein": 0.3,
    "fat": 0,
    "portion": 15,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 169640,
    "sourceDescription": "Honey",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "soy_sauce",
    "name": "酱油",
    "aliases": [
      "生抽",
      "soy sauce"
    ],
    "category": "调味",
    "state": "液体",
    "kcal": 53,
    "carbs": 4.9,
    "protein": 8.1,
    "fat": 0.6,
    "portion": 10,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 174277,
    "sourceDescription": "Soy sauce made from soy and wheat (shoyu)",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "oyster_sauce",
    "name": "蚝油",
    "aliases": [
      "oyster sauce"
    ],
    "category": "调味",
    "state": "液体",
    "kcal": 51,
    "carbs": 10.9,
    "protein": 1.4,
    "fat": 0.3,
    "portion": 15,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 174529,
    "sourceDescription": "Sauce, oyster, ready-to-serve",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "ketchup",
    "name": "番茄酱",
    "aliases": [
      "ketchup"
    ],
    "category": "调味",
    "state": "可食部",
    "kcal": 117,
    "carbs": 26.8,
    "protein": 1.1,
    "fat": 0.6,
    "portion": 15,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 747693,
    "sourceDescription": "Ketchup, restaurant",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "mustard",
    "name": "黄芥末酱",
    "aliases": [
      "芥末酱",
      "mustard"
    ],
    "category": "调味",
    "state": "可食部",
    "kcal": 61,
    "carbs": 5.3,
    "protein": 4.3,
    "fat": 3.4,
    "portion": 10,
    "common": false,
    "source": "USDA FDC Foundation 2026-04",
    "sourceId": 326698,
    "sourceDescription": "Mustard, prepared, yellow",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "vinegar",
    "name": "白醋",
    "aliases": [
      "食醋",
      "vinegar"
    ],
    "category": "调味",
    "state": "液体",
    "kcal": 18,
    "carbs": 0,
    "protein": 0,
    "fat": 0,
    "portion": 10,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 172237,
    "sourceDescription": "Vinegar, distilled",
    "energyMethod": "FDC 公布值"
  },
  {
    "id": "mayonnaise",
    "name": "蛋黄酱",
    "aliases": [
      "沙拉酱",
      "mayonnaise"
    ],
    "category": "调味",
    "state": "可食部",
    "kcal": 680,
    "carbs": 0.6,
    "protein": 1,
    "fat": 74.8,
    "portion": 15,
    "common": false,
    "source": "USDA FDC SR Legacy 2018-04",
    "sourceId": 171009,
    "sourceDescription": "Salad dressing, mayonnaise, regular",
    "energyMethod": "FDC 公布值"
  }
];
  const activityLevels = [
  {
    "id": "low",
    "label": "每周 2–3 小时",
    "carbs": {
      "male": 2.2,
      "female": 2
    },
    "protein": 1.4,
    "fat": {
      "male": 0.8,
      "female": 1
    }
  },
  {
    "id": "moderate",
    "label": "每周 3–5 小时",
    "carbs": {
      "male": 2.5,
      "female": 2.2
    },
    "protein": 1.6,
    "fat": {
      "male": 0.9,
      "female": 1.1
    }
  },
  {
    "id": "high",
    "label": "每周 5–7 小时",
    "carbs": {
      "male": 3,
      "female": 2.5
    },
    "protein": 1.7,
    "fat": {
      "male": 1,
      "female": 1.1
    }
  },
  {
    "id": "very_high",
    "label": "每周 7 小时以上",
    "carbs": {
      "male": 3.5,
      "female": 3
    },
    "protein": 1.8,
    "fat": {
      "male": 1,
      "female": 1.2
    }
  }
];

  window.NUTRITION_DATA = Object.freeze({
    foods: Object.freeze(foods.map((food) => Object.freeze(food))),
    activityLevels: Object.freeze(activityLevels.map((level) => Object.freeze(level))),
    categories: Object.freeze(["全部", "常用", "谷薯", "蛋奶豆", "肉禽", "水产", "蔬菜", "水果", "坚果", "油脂", "调味"]),
    library: Object.freeze({
      name: "常用食物库",
      itemCount: foods.length,
      basis: "每 100g 可食部",
      sources: Object.freeze(["USDA FDC Foundation 2026-04", "USDA FDC SR Legacy 2018-04"])
    })
  });
})();
