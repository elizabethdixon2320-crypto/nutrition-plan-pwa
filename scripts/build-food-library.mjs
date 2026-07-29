import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const foundationPath = args.get("--foundation");
const srLegacyPath = args.get("--sr");
if (!foundationPath || !srLegacyPath) {
  throw new Error("用法：node scripts/build-food-library.mjs --foundation <Foundation JSON> --sr <SR Legacy JSON>");
}

const foundation = JSON.parse(fs.readFileSync(foundationPath, "utf8")).FoundationFoods;
const srLegacy = JSON.parse(fs.readFileSync(srLegacyPath, "utf8")).SRLegacyFoods;
const sources = {
  foundation: {
    label: "USDA FDC Foundation 2026-04",
    items: new Map(foundation.filter(Boolean).map((food) => [food.fdcId, food]))
  },
  sr: {
    label: "USDA FDC SR Legacy 2018-04",
    items: new Map(srLegacy.filter(Boolean).map((food) => [food.fdcId, food]))
  }
};

const item = (id, name, aliases, category, state, portion, dataset, fdcId, common = false) => ({
  id, name, aliases, category, state, portion, dataset, fdcId, common
});

const mappings = [
  item("oats", "燕麦片（干）", ["燕麦", "麦片", "rolled oats"], "谷薯", "干重", 50, "foundation", 2346396, true),
  item("rice_raw", "白米（生）", ["生米", "大米", "白米", "raw rice"], "谷薯", "生重", 80, "sr", 169756, true),
  item("rice_cooked", "白米饭（熟）", ["熟米饭", "米饭", "白饭", "cooked rice"], "谷薯", "熟重", 180, "sr", 169757, true),
  item("brown_rice_raw", "糙米（生）", ["生糙米", "brown rice raw"], "谷薯", "生重", 80, "sr", 169703),
  item("brown_rice_cooked", "糙米饭（熟）", ["熟糙米", "糙米饭", "brown rice cooked"], "谷薯", "熟重", 180, "sr", 169704),
  item("oatmeal_cooked", "燕麦粥（水煮）", ["熟燕麦", "燕麦粥", "oatmeal"], "谷薯", "熟重", 200, "sr", 173905),
  item("millet_cooked", "小米（熟）", ["小米饭", "小米粥", "millet"], "谷薯", "熟重", 180, "sr", 168871),
  item("quinoa_cooked", "藜麦（熟）", ["藜麦饭", "quinoa"], "谷薯", "熟重", 150, "sr", 168917),
  item("buckwheat_cooked", "荞麦粒（熟）", ["荞麦", "buckwheat"], "谷薯", "熟重", 180, "sr", 170686),
  item("noodles", "鸡蛋面（熟）", ["面条", "熟面条", "蛋面", "noodles"], "谷薯", "熟重", 200, "sr", 168926, true),
  item("pasta_cooked", "意大利面（熟）", ["意面", "pasta"], "谷薯", "熟重", 180, "sr", 169737),
  item("whole_wheat_bread", "全麦面包", ["全麦吐司", "whole wheat bread"], "谷薯", "可食部", 70, "sr", 172688, true),
  item("sweet_potato", "红薯（水煮）", ["地瓜", "番薯", "sweet potato"], "谷薯", "熟重", 200, "sr", 168484, true),
  item("potato", "土豆（水煮）", ["马铃薯", "potato"], "谷薯", "熟重", 200, "sr", 170440, true),
  item("corn", "甜玉米（水煮）", ["玉米", "甜玉米", "corn"], "谷薯", "熟重", 150, "sr", 169999, true),
  item("black_rice_raw", "黑米（生）", ["黑米", "black rice"], "谷薯", "生重", 80, "foundation", 2710825),
  item("wild_rice_raw", "野米（干）", ["菰米", "wild rice"], "谷薯", "干重", 80, "foundation", 2710821),

  item("egg_raw", "鸡蛋（生）", ["生鸡蛋", "whole egg raw"], "蛋奶豆", "可食部", 50, "foundation", 748967),
  item("egg", "鸡蛋（水煮）", ["水煮蛋", "白煮蛋", "boiled egg"], "蛋奶豆", "可食部", 50, "sr", 173424, true),
  item("egg_scrambled", "炒鸡蛋", ["煎蛋", "scrambled egg"], "蛋奶豆", "熟重", 100, "sr", 172187),
  item("egg_white", "鸡蛋白", ["蛋清", "egg white"], "蛋奶豆", "可食部", 100, "foundation", 747997),
  item("milk_whole", "全脂牛奶", ["纯牛奶", "whole milk"], "蛋奶豆", "液体", 250, "foundation", 746782),
  item("milk", "低脂牛奶（1%）", ["低脂奶", "low fat milk"], "蛋奶豆", "液体", 250, "foundation", 746772, true),
  item("milk_skim", "脱脂牛奶", ["无脂牛奶", "skim milk"], "蛋奶豆", "液体", 250, "foundation", 746776),
  item("yogurt", "原味全脂酸奶", ["无糖酸奶", "原味酸奶", "plain yogurt"], "蛋奶豆", "可食部", 150, "foundation", 2259793, true),
  item("greek_yogurt", "无脂希腊酸奶", ["希腊酸奶", "greek yogurt"], "蛋奶豆", "可食部", 150, "foundation", 330137),
  item("cottage_cheese", "低脂茅屋奶酪", ["农家奶酪", "cottage cheese"], "蛋奶豆", "可食部", 100, "sr", 172182),
  item("cheddar", "切达奶酪", ["车打奶酪", "cheddar"], "蛋奶豆", "可食部", 30, "foundation", 328637),
  item("soy_milk", "无糖豆奶", ["豆浆", "无糖豆浆", "soy milk"], "蛋奶豆", "液体", 250, "foundation", 1999630, true),
  item("tofu", "北豆腐", ["硬豆腐", "老豆腐", "firm tofu"], "蛋奶豆", "可食部", 150, "sr", 172448, true),
  item("tofu_soft", "嫩豆腐", ["南豆腐", "软豆腐", "soft tofu"], "蛋奶豆", "可食部", 150, "sr", 172449),
  item("tofu_fried", "油豆腐", ["炸豆腐", "fried tofu"], "蛋奶豆", "可食部", 100, "sr", 172451),
  item("edamame", "毛豆（水煮）", ["枝豆", "青大豆", "edamame"], "蛋奶豆", "熟重", 100, "sr", 169283, true),
  item("lentils", "扁豆（熟）", ["小扁豆", "lentils"], "蛋奶豆", "熟重", 150, "sr", 172421),
  item("chickpeas", "鹰嘴豆（熟）", ["鸡心豆", "chickpeas"], "蛋奶豆", "熟重", 150, "sr", 173757),
  item("black_beans", "黑豆（熟）", ["黑芸豆", "black beans"], "蛋奶豆", "熟重", 150, "sr", 173735),
  item("mung_sprouts", "绿豆芽（生）", ["豆芽", "绿豆芽", "mung bean sprouts"], "蛋奶豆", "可食部", 150, "sr", 169957),
  item("tempeh", "天贝（熟）", ["丹贝", "tempeh"], "蛋奶豆", "熟重", 100, "sr", 172467),

  item("chicken_breast_raw", "鸡胸肉（生）", ["生鸡胸", "chicken breast raw"], "肉禽", "生重", 150, "foundation", 2646170),
  item("chicken_breast", "鸡胸肉（熟）", ["熟鸡胸", "烤鸡胸", "chicken breast"], "肉禽", "熟重", 150, "sr", 171534, true),
  item("chicken_thigh_raw", "去皮鸡腿肉（生）", ["生鸡腿", "chicken thigh raw"], "肉禽", "生重", 150, "foundation", 2646171),
  item("chicken_thigh", "去皮鸡腿肉（熟）", ["熟鸡腿", "鸡腿肉", "chicken thigh"], "肉禽", "熟重", 150, "sr", 172388, true),
  item("chicken_drumstick", "鸡小腿肉（熟）", ["鸡腿棒", "drumstick"], "肉禽", "熟重", 150, "foundation", 331897),
  item("turkey_breast", "火鸡胸肉（熟）", ["火鸡肉", "turkey breast"], "肉禽", "熟重", 150, "sr", 171496),
  item("duck", "鸭肉（熟、去皮）", ["熟鸭肉", "duck"], "肉禽", "熟重", 150, "sr", 172411),
  item("beef_raw", "瘦牛肉（生）", ["生牛肉", "牛后腿", "lean beef raw"], "肉禽", "生重", 150, "foundation", 2646173),
  item("beef", "牛里脊（熟）", ["熟牛肉", "牛排", "beef tenderloin"], "肉禽", "熟重", 150, "sr", 170641, true),
  item("ground_beef", "瘦牛肉馅（熟）", ["牛肉末", "牛肉馅", "ground beef"], "肉禽", "熟重", 150, "sr", 171794),
  item("pork_tenderloin_raw", "猪里脊（生）", ["生猪里脊", "pork tenderloin raw"], "肉禽", "生重", 150, "foundation", 2646169),
  item("pork_tenderloin", "猪里脊（熟）", ["熟猪里脊", "pork tenderloin"], "肉禽", "熟重", 150, "sr", 168250, true),
  item("pork_loin", "猪瘦肉（熟）", ["瘦猪肉", "pork loin"], "肉禽", "熟重", 150, "sr", 168233),
  item("pork_belly_raw", "五花肉（生）", ["猪五花", "猪腹肉", "pork belly"], "肉禽", "生重", 100, "foundation", 2727576),
  item("lamb", "羊腿肉（熟、瘦）", ["羊肉", "lamb"], "肉禽", "熟重", 150, "sr", 174314),
  item("bacon", "培根（熟）", ["熏肉", "bacon"], "肉禽", "熟重", 50, "foundation", 749420),

  item("shrimp_raw", "虾仁（生）", ["生虾", "shrimp raw"], "水产", "生重", 150, "foundation", 2684443),
  item("shrimp", "虾仁（熟）", ["熟虾", "白灼虾", "shrimp"], "水产", "熟重", 150, "sr", 175180, true),
  item("salmon_raw", "三文鱼（生）", ["生三文鱼", "salmon raw"], "水产", "生重", 120, "foundation", 2684441),
  item("salmon", "三文鱼（熟）", ["熟三文鱼", "烤三文鱼", "salmon"], "水产", "熟重", 120, "sr", 175168, true),
  item("cod_raw", "鳕鱼（生）", ["生鳕鱼", "cod raw"], "水产", "生重", 150, "foundation", 2684444),
  item("cod", "鳕鱼（熟）", ["熟鳕鱼", "cod"], "水产", "熟重", 150, "sr", 171956),
  item("tilapia_raw", "罗非鱼（生）", ["生罗非鱼", "tilapia raw"], "水产", "生重", 150, "foundation", 2684442),
  item("tilapia", "罗非鱼（熟）", ["熟罗非鱼", "tilapia"], "水产", "熟重", 150, "sr", 175177),
  item("tuna_canned", "水浸金枪鱼罐头", ["吞拿鱼罐头", "金枪鱼", "tuna"], "水产", "沥干", 100, "sr", 173709, true),
  item("crab", "蟹肉（熟）", ["螃蟹", "熟蟹肉", "crab"], "水产", "熟重", 120, "sr", 174205),
  item("squid", "鱿鱼（生）", ["鲜鱿", "squid"], "水产", "生重", 150, "foundation", 2747671),
  item("scallop", "扇贝肉（生）", ["带子", "scallop"], "水产", "生重", 150, "foundation", 2747667),
  item("snapper", "红鲷鱼（生）", ["鲷鱼", "snapper"], "水产", "生重", 150, "foundation", 2747669),
  item("anchovy", "橄榄油浸凤尾鱼", ["鳀鱼", "anchovy"], "水产", "沥干", 30, "foundation", 2747652),

  item("broccoli_raw", "西兰花（生）", ["生西兰花", "broccoli raw"], "蔬菜", "可食部", 150, "foundation", 747447),
  item("broccoli", "西兰花（水煮）", ["熟西兰花", "broccoli"], "蔬菜", "熟重", 150, "sr", 169967, true),
  item("spinach_raw", "菠菜（生）", ["生菠菜", "spinach raw"], "蔬菜", "可食部", 150, "foundation", 1999633),
  item("spinach", "菠菜（水煮）", ["熟菠菜", "spinach"], "蔬菜", "熟重", 150, "sr", 168463, true),
  item("bok_choy_raw", "小白菜（生）", ["青菜", "上海青", "bok choy"], "蔬菜", "可食部", 150, "foundation", 2685572),
  item("bok_choy", "小白菜（水煮）", ["熟小白菜", "熟青菜"], "蔬菜", "熟重", 150, "sr", 170391),
  item("napa_cabbage_raw", "大白菜（生）", ["白菜", "娃娃菜", "napa cabbage"], "蔬菜", "可食部", 200, "sr", 169979),
  item("napa_cabbage", "大白菜（水煮）", ["熟白菜", "熟娃娃菜"], "蔬菜", "熟重", 200, "sr", 169980),
  item("cabbage_raw", "卷心菜（生）", ["包菜", "圆白菜", "cabbage"], "蔬菜", "可食部", 200, "foundation", 2346407),
  item("cabbage", "卷心菜（水煮）", ["熟包菜", "熟圆白菜"], "蔬菜", "熟重", 200, "sr", 169976),
  item("cucumber", "黄瓜", ["青瓜", "cucumber"], "蔬菜", "可食部", 200, "foundation", 2346406, true),
  item("tomato", "番茄", ["西红柿", "tomato"], "蔬菜", "可食部", 200, "foundation", 1999634, true),
  item("carrot_raw", "胡萝卜（生）", ["生胡萝卜", "carrot raw"], "蔬菜", "可食部", 150, "foundation", 2258586),
  item("carrot", "胡萝卜（水煮）", ["熟胡萝卜", "carrot"], "蔬菜", "熟重", 150, "sr", 170394),
  item("celery", "西芹", ["芹菜", "celery"], "蔬菜", "可食部", 150, "foundation", 2346405),
  item("eggplant_raw", "茄子（生）", ["生茄子", "eggplant raw"], "蔬菜", "可食部", 200, "foundation", 2685577),
  item("eggplant", "茄子（水煮）", ["熟茄子", "eggplant"], "蔬菜", "熟重", 200, "sr", 169229),
  item("pumpkin_raw", "南瓜（生）", ["生南瓜", "pumpkin raw"], "蔬菜", "可食部", 180, "sr", 168448),
  item("pumpkin", "南瓜（水煮）", ["熟南瓜", "pumpkin"], "蔬菜", "熟重", 180, "sr", 168449),
  item("shiitake_raw", "香菇（生）", ["鲜香菇", "shiitake raw"], "蔬菜", "可食部", 150, "foundation", 1999628),
  item("shiitake", "香菇（水煮）", ["熟香菇", "shiitake"], "蔬菜", "熟重", 150, "sr", 168437),
  item("mushroom_raw", "白蘑菇（生）", ["口蘑", "白蘑菇", "mushroom raw"], "蔬菜", "可食部", 150, "foundation", 1999629),
  item("mushroom", "白蘑菇（水煮）", ["熟口蘑", "熟蘑菇"], "蔬菜", "熟重", 150, "sr", 169252),
  item("green_beans_raw", "四季豆（生）", ["豆角", "菜豆", "green beans"], "蔬菜", "可食部", 150, "foundation", 2346400),
  item("green_beans", "四季豆（水煮）", ["熟豆角", "熟菜豆"], "蔬菜", "熟重", 150, "sr", 169141),
  item("green_peas", "青豌豆（水煮）", ["豌豆", "green peas"], "蔬菜", "熟重", 150, "sr", 170420),
  item("asparagus_raw", "芦笋（生）", ["生芦笋", "asparagus raw"], "蔬菜", "可食部", 150, "foundation", 2710823),
  item("asparagus", "芦笋（水煮）", ["熟芦笋", "asparagus"], "蔬菜", "熟重", 150, "sr", 168390),
  item("green_pepper", "青椒", ["绿甜椒", "green pepper"], "蔬菜", "可食部", 150, "foundation", 2258588),
  item("red_pepper", "红甜椒", ["红椒", "red pepper"], "蔬菜", "可食部", 150, "foundation", 2258590),
  item("onion", "黄洋葱", ["洋葱", "onion"], "蔬菜", "可食部", 100, "foundation", 790646),
  item("garlic", "大蒜", ["蒜头", "garlic"], "蔬菜", "可食部", 10, "foundation", 1104647),
  item("cauliflower_raw", "花椰菜（生）", ["菜花", "生花菜", "cauliflower raw"], "蔬菜", "可食部", 150, "foundation", 2685573),
  item("cauliflower", "花椰菜（水煮）", ["熟菜花", "熟花菜", "cauliflower"], "蔬菜", "熟重", 150, "sr", 170397),
  item("zucchini", "西葫芦（生）", ["角瓜", "zucchini"], "蔬菜", "可食部", 200, "foundation", 2685568),
  item("lettuce", "罗马生菜", ["生菜", "lettuce"], "蔬菜", "可食部", 150, "foundation", 2346389),
  item("radish", "小红萝卜", ["樱桃萝卜", "radish"], "蔬菜", "可食部", 150, "foundation", 2747665),
  item("beet", "甜菜根（生）", ["红菜头", "beet"], "蔬菜", "可食部", 150, "foundation", 2685576),
  item("brussels_sprouts", "抱子甘蓝（生）", ["球芽甘蓝", "brussels sprouts"], "蔬菜", "可食部", 150, "foundation", 2685575),
  item("leek", "韭葱", ["大葱", "leek"], "蔬菜", "可食部", 100, "sr", 169246),
  item("green_onion", "小葱", ["香葱", "葱", "scallion"], "蔬菜", "可食部", 30, "sr", 170005),
  item("sweet_corn_raw", "甜玉米粒（生）", ["生玉米粒", "corn kernels"], "蔬菜", "可食部", 150, "foundation", 2710826),

  item("apple", "富士苹果", ["苹果", "apple"], "水果", "可食部", 180, "foundation", 1750340, true),
  item("banana", "香蕉", ["banana"], "水果", "可食部", 120, "foundation", 1105314, true),
  item("orange", "脐橙", ["橙子", "orange"], "水果", "可食部", 180, "foundation", 746771),
  item("grape", "红葡萄", ["葡萄", "提子", "grape"], "水果", "可食部", 150, "foundation", 2346412),
  item("blueberry", "蓝莓", ["blueberry"], "水果", "可食部", 100, "foundation", 2346411, true),
  item("strawberry", "草莓", ["strawberry"], "水果", "可食部", 150, "foundation", 2346409),
  item("pear", "巴特利梨", ["梨", "pear"], "水果", "可食部", 180, "foundation", 746773),
  item("peach", "黄桃（鲜）", ["桃子", "鲜桃", "peach"], "水果", "可食部", 180, "foundation", 325430),
  item("kiwi", "猕猴桃", ["奇异果", "kiwi"], "水果", "可食部", 100, "foundation", 2710831),
  item("mango", "芒果", ["mango"], "水果", "可食部", 150, "foundation", 2710833),
  item("pineapple", "菠萝", ["凤梨", "pineapple"], "水果", "可食部", 150, "foundation", 2346398),
  item("watermelon", "西瓜", ["watermelon"], "水果", "可食部", 300, "sr", 167765, true),
  item("cantaloupe", "哈密瓜", ["甜瓜", "cantaloupe"], "水果", "可食部", 200, "foundation", 746770),
  item("grapefruit", "葡萄柚", ["西柚", "grapefruit"], "水果", "可食部", 200, "sr", 173033),
  item("plum", "黑李子", ["李子", "plum"], "水果", "可食部", 150, "foundation", 2710837),
  item("cherry", "甜樱桃", ["车厘子", "樱桃", "cherry"], "水果", "可食部", 150, "foundation", 2346399),
  item("avocado", "牛油果", ["鳄梨", "avocado"], "水果", "可食部", 80, "foundation", 2710824),
  item("lychee", "荔枝", ["litchi", "lychee"], "水果", "可食部", 100, "sr", 169086),
  item("papaya", "木瓜", ["papaya"], "水果", "可食部", 150, "sr", 169926),
  item("mandarin", "橘子", ["柑橘", "蜜橘", "mandarin"], "水果", "可食部", 150, "foundation", 2710832),
  item("apricot", "杏", ["杏子", "apricot"], "水果", "可食部", 150, "foundation", 2710815),
  item("blackberry", "黑莓", ["blackberry"], "水果", "可食部", 100, "sr", 173946),

  item("almonds", "巴旦木（生）", ["杏仁", "扁桃仁", "almond"], "坚果", "可食部", 20, "foundation", 2346393, true),
  item("walnuts", "核桃仁（生）", ["核桃", "walnut"], "坚果", "可食部", 20, "foundation", 2346394, true),
  item("peanuts", "花生仁（生）", ["花生米", "peanut"], "坚果", "可食部", 20, "foundation", 2515376),
  item("cashews", "腰果（生）", ["腰果仁", "cashew"], "坚果", "可食部", 20, "foundation", 2515374),
  item("pistachios", "开心果仁（生）", ["开心果", "pistachio"], "坚果", "可食部", 20, "foundation", 2515379),
  item("pine_nuts", "松子仁（生）", ["松子", "pine nuts"], "坚果", "可食部", 20, "foundation", 2346392),
  item("brazil_nuts", "巴西坚果（生）", ["巴西果", "brazil nuts"], "坚果", "可食部", 20, "foundation", 2515373),
  item("macadamia", "夏威夷果仁（生）", ["澳洲坚果", "macadamia"], "坚果", "可食部", 20, "foundation", 2515378),
  item("pumpkin_seeds", "南瓜籽仁（生）", ["南瓜子", "pumpkin seeds"], "坚果", "可食部", 20, "foundation", 2515380),
  item("sunflower_seeds", "葵花籽仁（生）", ["瓜子仁", "sunflower seeds"], "坚果", "可食部", 20, "foundation", 2515381),
  item("sesame", "芝麻（干）", ["白芝麻", "黑芝麻", "sesame"], "坚果", "可食部", 15, "sr", 170150),
  item("chia", "奇亚籽", ["chia seeds"], "坚果", "干重", 15, "foundation", 2710819),
  item("flaxseed", "亚麻籽粉", ["亚麻籽", "flaxseed"], "坚果", "干重", 15, "foundation", 2262075),
  item("peanut_butter", "花生酱", ["peanut butter"], "坚果", "可食部", 15, "foundation", 2262072, true),
  item("almond_butter", "杏仁酱", ["巴旦木酱", "almond butter"], "坚果", "可食部", 15, "foundation", 2262074),

  item("olive_oil", "橄榄油", ["olive oil"], "油脂", "液体", 5, "sr", 171413),
  item("canola_oil", "菜籽油", ["芥花油", "canola oil"], "油脂", "液体", 5, "sr", 172336),
  item("cooking_oil", "大豆油", ["豆油", "soybean oil", "食用油"], "油脂", "液体", 5, "sr", 171411, true),
  item("peanut_oil", "花生油", ["peanut oil"], "油脂", "液体", 5, "sr", 171410),
  item("butter", "无盐黄油", ["牛油", "butter"], "油脂", "可食部", 10, "sr", 173430),
  item("coconut_oil", "椰子油", ["coconut oil"], "油脂", "液体", 5, "foundation", 330458),

  item("sugar", "白砂糖", ["砂糖", "白糖", "sugar"], "调味", "可食部", 10, "foundation", 746784),
  item("honey", "蜂蜜", ["honey"], "调味", "可食部", 15, "sr", 169640),
  item("soy_sauce", "酱油", ["生抽", "soy sauce"], "调味", "液体", 10, "sr", 174277),
  item("oyster_sauce", "蚝油", ["oyster sauce"], "调味", "液体", 15, "sr", 174529),
  item("ketchup", "番茄酱", ["ketchup"], "调味", "可食部", 15, "foundation", 747693),
  item("mustard", "黄芥末酱", ["芥末酱", "mustard"], "调味", "可食部", 10, "foundation", 326698),
  item("vinegar", "白醋", ["食醋", "vinegar"], "调味", "液体", 10, "sr", 172237),
  item("mayonnaise", "蛋黄酱", ["沙拉酱", "mayonnaise"], "调味", "可食部", 15, "sr", 171009)
];

function nutrientAmount(food, ids) {
  for (const id of ids) {
    const match = food.foodNutrients.find((entry) => entry.nutrient.id === id);
    if (match && Number.isFinite(Number(match.amount))) return Number(match.amount);
  }
  return null;
}

const foods = mappings.map((mapping) => {
  const source = sources[mapping.dataset];
  const food = source.items.get(mapping.fdcId);
  if (!food) throw new Error(`未找到 FDC ${mapping.fdcId}：${mapping.name}`);

  const protein = nutrientAmount(food, [1003]);
  const fat = nutrientAmount(food, [1004]);
  const carbs = nutrientAmount(food, [1005]);
  if ([protein, fat, carbs].some((value) => value === null)) {
    throw new Error(`营养字段不完整：${mapping.name} / FDC ${mapping.fdcId}`);
  }
  const publishedKcal = nutrientAmount(food, [2047, 1008, 2048]);
  const kcal = publishedKcal ?? (protein * 4 + carbs * 4 + fat * 9);

  return {
    id: mapping.id,
    name: mapping.name,
    aliases: mapping.aliases,
    category: mapping.category,
    state: mapping.state,
    kcal: Math.round(kcal),
    carbs: Math.max(0, Math.round(carbs * 10) / 10),
    protein: Math.max(0, Math.round(protein * 10) / 10),
    fat: Math.max(0, Math.round(fat * 10) / 10),
    portion: mapping.portion,
    common: mapping.common,
    source: source.label,
    sourceId: mapping.fdcId,
    sourceDescription: food.description,
    energyMethod: publishedKcal === null ? "由三大营养素按 4/4/9 计算" : "FDC 公布值"
  };
});

const activityLevels = [
  { id: "low", label: "每周 2–3 小时", carbs: { male: 2.2, female: 2.0 }, protein: 1.4, fat: { male: 0.8, female: 1.0 } },
  { id: "moderate", label: "每周 3–5 小时", carbs: { male: 2.5, female: 2.2 }, protein: 1.6, fat: { male: 0.9, female: 1.1 } },
  { id: "high", label: "每周 5–7 小时", carbs: { male: 3.0, female: 2.5 }, protein: 1.7, fat: { male: 1.0, female: 1.1 } },
  { id: "very_high", label: "每周 7 小时以上", carbs: { male: 3.5, female: 3.0 }, protein: 1.8, fat: { male: 1.0, female: 1.2 } }
];

const output = `(function () {
  "use strict";

  const foods = ${JSON.stringify(foods, null, 2)};
  const activityLevels = ${JSON.stringify(activityLevels, null, 2)};

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
`;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDir, "..", "data.js");
fs.writeFileSync(outputPath, output);
console.log(`已生成 ${foods.length} 条食物数据：${outputPath}`);
