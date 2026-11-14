// Read the public Mainland China menu and its official per-serving tables.
// Does not infer recipe grams, portion weights, or custom-order nutrition.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const base = 'https://www.mcdonalds.com.cn';
const verifiedAt = new Date().toISOString().slice(0, 10);
const menus = ['burger', 'snacks-3', 'Dessert-11', 'beverage-2', 'breakfast'];
const clean = text => text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
function get(url) { return execFileSync('curl', ['--max-time', '25', '--retry', '1', '-fsS', encodeURI(url)], { encoding: 'utf8', maxBuffer: 8e6 }); }
const links = new Set();
for (const menu of menus) {
  const html = get(`${base}/index/Food/menu/${menu}`);
  for (const match of html.matchAll(/href="(\/product\/[^"?#]+)"/g)) if (!match[1].includes('/mcdonalds/')) links.add(match[1]);
}
const products = [];
const excluded = [];
for (const path of links) {
  try {
    const html = get(`${base}${path}`);
    const title = clean(html.match(/class="product-info[^>]*>[\s\S]*?<h3>([\s\S]*?)<\/h3>/)?.[1] || '');
    const section = html.split('class="classified-table"')[1]?.split('class="tips"')[0] || '';
    const sizes = [...section.matchAll(/<li\s+_id="[^"]+"[^>]*>([\s\S]*?)<\/li>/g)].map(match => clean(match[1]));
    const tables = [...section.matchAll(/<tbody>([\s\S]*?)<\/tbody>/g)];
    if (!title || !tables.length || sizes.length !== tables.length) { excluded.push({ path, reason: 'Missing or ambiguous per-serving table' }); continue; }
    for (const [index, table] of tables.entries()) {
      const values = [...table[1].matchAll(/<strong>\s*([\d.]+)\s*<i>([^<]*)<\/i><\/strong>/g)];
      if (values.length !== 6 || values[0][2] !== '千焦' || values.slice(1, 4).some(m => m[2] !== '克')) throw new Error('Unexpected nutrient columns');
      const [kj, protein, fat, carbs, sodiumMg, calciumMg] = values.map(m => Number(m[1]));
      if (![kj, protein, fat, carbs, sodiumMg, calciumMg].every(Number.isFinite)) throw new Error('Invalid numeric value');
      const size = sizes[index];
      const slug = path.split('/').at(-1).toLowerCase();
      const sourceDate = html.includes('2025年4月') ? '2025-04' : null;
      products.push({ id: `mcd-cn-${slug}-${index + 1}`, brand: '麦当劳', name: `${title}${sizes.length > 1 ? `（${size}）` : ''}`, region: '中国大陆', servingLabel: size, servingGrams: null,
        kcal: Math.round(kj / 4.184), protein, carbs, fat, rawKj: kj, sodiumMg, calciumMg,
        sourceUrl: `${base}${path}`, sourceTitle: `${title} | 麦当劳中国官网`, sourceDate, verifiedAt,
        standardRecipe: `官网所列“${size}”标准成品；未做去酱、加肉、加芝士或其他自定义，不含另购搭配。`,
        notes: '官方值按单份列示，未公开每份成品克重或各原料克重；热量由官方千焦÷4.184取整。原料批次、制作及份量会造成差异，门店在售情况和改配方以当次点单为准。', nutritionBasis: 'official', energyMethod: '官方 kJ ÷ 4.184，取整为 kcal' });
    }
    console.log(`${title}: ${sizes.length}`);
  } catch (error) { excluded.push({ path, reason: error.message }); }
}
mkdirSync(resolve(root, 'research'), { recursive: true });
writeFileSync(resolve(root, 'research/mcdonalds-products.json'), JSON.stringify(products, null, 2) + '\n');
writeFileSync(resolve(root, 'research/mcdonalds-import-report.json'), JSON.stringify({ verifiedAt, linkedProducts: links.size, rows: products.length, excluded }, null, 2) + '\n');
console.log(`Imported ${products.length} serving variants; ${excluded.length} pages excluded.`);
