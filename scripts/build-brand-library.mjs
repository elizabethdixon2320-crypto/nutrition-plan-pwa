import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SOURCE_FILES = [
  "mcdonalds-products.json",
  "subway-products.json",
  "coffee-pizza-products.json",
  "kfc-bk-products.json"
];

const requiredTextFields = [
  "id", "brand", "name", "region", "servingLabel", "sourceTitle", "standardRecipe", "notes"
];
const macroFields = ["protein", "carbs", "fat"];
const isNonnegativeNumber = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;

function fail(label, message) {
  throw new Error(`品牌食品 ${label}：${message}`);
}

export function validateProducts(products) {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("品牌食品来源必须是非空数组");
  }
  const ids = new Set();
  products.forEach((product, index) => {
    const label = product?.id || `第 ${index + 1} 条`;
    if (!product || typeof product !== "object" || Array.isArray(product)) fail(label, "必须是对象");
    for (const key of requiredTextFields) {
      if (typeof product[key] !== "string" || !product[key].trim()) fail(label, `${key} 必须是非空文字`);
    }
    if (!/^[\p{L}\p{N}_-]+$/u.test(product.id)) fail(label, "id 只能包含文字、数字、下划线和连字符");
    if (ids.has(product.id)) fail(label, "id 重复");
    ids.add(product.id);
    if (!isNonnegativeNumber(product.kcal)) fail(label, "kcal 必须是非负有限数值");
    for (const key of macroFields) {
      if (product[key] !== null && !isNonnegativeNumber(product[key])) {
        fail(label, `${key} 必须是非负有限数值或 null，未知不能填 0`);
      }
    }
    if (product.servingGrams !== null && (!isNonnegativeNumber(product.servingGrams) || product.servingGrams === 0)) {
      fail(label, "servingGrams 必须是正数或 null，杯容不能冒充克重");
    }
    let source;
    try {
      source = new URL(product.sourceUrl);
    } catch {
      fail(label, "sourceUrl 必须是有效的 HTTPS 来源");
    }
    if (source.protocol !== "https:" || source.username || source.password) fail(label, "sourceUrl 必须是有效的 HTTPS 来源");
    if (product.nutritionBasis !== "official") fail(label, "当前品牌库只接受 official 数据");
    if (typeof product.verifiedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(product.verifiedAt)) {
      fail(label, "verifiedAt 必须为 YYYY-MM-DD");
    }
    const verifiedDate = new Date(`${product.verifiedAt}T00:00:00Z`);
    if (!Number.isFinite(verifiedDate.getTime()) || verifiedDate.toISOString().slice(0, 10) !== product.verifiedAt) {
      fail(label, "verifiedAt 不是有效日期");
    }
    if (product.sourceDate !== null && (typeof product.sourceDate !== "string" || !product.sourceDate.trim())) {
      fail(label, "sourceDate 必须是来源版本日期或 null");
    }
    for (const key of ["rawKj", "sodiumMg", "calciumMg"]) {
      if (Object.hasOwn(product, key) && product[key] !== null && !isNonnegativeNumber(product[key])) {
        fail(label, `${key} 必须是非负有限数值或 null`);
      }
    }
    if (product.rawKj != null && product.kcal !== Math.round(product.rawKj / 4.184)) {
      fail(label, "kcal 与官方 rawKj ÷ 4.184 取整不一致");
    }
  });
  return products;
}

export function readProducts(researchDirectory = path.join(projectRoot, "research")) {
  return SOURCE_FILES.flatMap((filename) => {
    const products = JSON.parse(fs.readFileSync(path.join(researchDirectory, filename), "utf8"));
    // Validate each file before flattening so an accidental object cannot silently pass.
    validateProducts(products);
    return products;
  });
}

export function buildBrandLibrary(products) {
  validateProducts(products);
  const uniqueProducts = [];
  const signatures = new Map();
  const duplicateDetails = [];
  for (const product of products) {
    // Only merge exact product/portion/nutrition matches; changed recipe values survive.
    const signature = JSON.stringify([
      product.brand, product.region, product.name, product.servingLabel,
      product.servingGrams, product.kcal, product.protein, product.carbs, product.fat,
      ...["rawKj", "sodiumMg", "calciumMg"].map((key) => [Object.hasOwn(product, key), product[key]])
    ]);
    const first = signatures.get(signature);
    if (first) {
      duplicateDetails.push({
        excludedId: product.id,
        retainedId: first.id,
        sourceUrl: product.sourceUrl,
        reason: "同品牌、地区、产品、份量及全部已公布营养数值相同，保留首条"
      });
    } else {
      signatures.set(signature, product);
      uniqueProducts.push(product);
    }
  }
  const foods = uniqueProducts.map((product) => ({
    ...product,
    rawName: product.name,
    name: `${product.brand} · ${product.name}${product.region === "中国大陆" ? "" : `（${product.region}）`}`,
    aliases: [...new Set([product.name, product.brand, ...(Array.isArray(product.aliases) ? product.aliases : [])])],
    category: "品牌食品",
    state: "标准成品",
    basis: "serving",
    portion: 1,
    common: false,
    source: product.sourceTitle
  }));
  const mainlandCount = foods.filter((food) => food.region === "中国大陆").length;
  const brands = Object.fromEntries([...new Set(foods.map((food) => food.brand))].map((brand) => [
    brand, foods.filter((food) => food.brand === brand).length
  ]));
  const metadata = {
    // If source batches have different dates, do not imply that the oldest was checked later.
    verifiedAt: products.map((product) => product.verifiedAt).sort()[0],
    itemCount: foods.length,
    mainlandCount,
    otherRegionCount: foods.length - mainlandCount,
    sourceItemCount: products.length,
    duplicateExcluded: duplicateDetails.length,
    duplicateDetails,
    brands,
    gaps: [
      "这是已核对的官方标准单品集合，不代表市面全部品牌、产品或当前门店在售菜单。",
      "赛百味、瑞幸咖啡未公开完整蛋白质、碳水和脂肪数值；未知保留 null，不能按 0 计算完整营养目标。",
      "肯德基、汉堡王目前仅收录中国台湾官方配方，不可替代中国大陆同名产品。",
      "暂未纳入可核实的中国大陆星巴克、必胜客、达美乐营养数据。",
      "赛百味数值经中国大陆官网公开索引核对；官网迁移后的当前在售状态未能确认，部分三明治未注明长度。",
      "营养按所列标准份数记录；未公开的成品克重和原料克重不反推，杯容量不作重量。改配方、冷热、糖度、杯型或加料后不沿用原数值。"
    ]
  };
  return { foods, metadata };
}

export function renderBrandLibrary({ foods, metadata }) {
  // Escape script delimiters and legacy JS line separators even though this is an external script.
  const serialize = (value) => JSON.stringify(value, null, 2)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return `// Generated by scripts/build-brand-library.mjs; edit research/*-products.json, then rebuild.\n(function () {\n  "use strict";\n\n  window.BRAND_FOODS = ${serialize(foods)};\n\n  window.BRAND_LIBRARY_METADATA = ${serialize(metadata)};\n})();\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const library = buildBrandLibrary(readProducts());
  const outputPath = path.join(projectRoot, "brand-data.js");
  fs.writeFileSync(outputPath, renderBrandLibrary(library));
  console.log(`已生成 ${library.metadata.itemCount} 条品牌食品：中国大陆 ${library.metadata.mainlandCount} 条，其他地区 ${library.metadata.otherRegionCount} 条。`);
}
