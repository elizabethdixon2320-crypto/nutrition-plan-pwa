# 个人营养计划 PWA

在线体验：

```text
https://elizabethdixon2320-crypto.github.io/nutrition-plan-pwa/
```

## 本地启动

在 `macro-lens-prototypes` 目录运行：

```bash
python3 -m http.server 4173
```

浏览器打开：

```text
http://127.0.0.1:4173/pwa/
```

首次在线打开后，应用外壳会被 Service Worker 缓存。Chrome/Edge 可使用浏览器的“安装应用”，iPhone 可使用 Safari“添加到主屏幕”。

## 当前边界

- 已支持个人热量估算：身高、体重、年龄和生理性别用于 Mifflin–St Jeor；可选体脂率用于去脂体重公式，并展示两者对照。自动模式有体脂用体脂法，无体脂用身高体重法，也可手动选法。体脂估计不一定更准。
- 日常活动与每周训练次数、分钟共同用于粗略活动系数；此映射是工具假设，不是经过验证的个人消耗模型。减脂先取 15% 缺口，维持取 0%，最终取整到 50 kcal。保存资料或更新体重同步重算；每日总量可只分三餐。
- 未完善资料前，旧版／演示目标会明确标注，不会自动套用他人的健康数据。升级保留既有餐食和体重记录。只适用于健康成人估算，完整公式、来源和限制见页面“目标说明”。
- 已内置 161 条常用食物，营养数据来自 USDA FoodData Central Foundation Foods 2026-04 与 SR Legacy 2018-04。
- 食物数据随应用下载，可离线搜索，不需要在浏览器中保存第三方 API 密钥。
- 生重、熟重是独立数据条目，详情中的计量状态不可任意切换。例如白米（生）365 kcal/100g，白米饭（熟）130 kcal/100g。
- 今日餐次中的每条记录都可点击修改克数、移动到其他餐次或删除；保存时会自动重算营养。
- 拍照识别已暂时从导航和记录流程中移除，后续接入真实识别服务后再恢复。
- 数据保存在当前浏览器的 localStorage。清理浏览器站点数据会删除记录。

## 计算逻辑测试

```bash
node --test tests/nutrition.test.cjs
```

## 重新生成食物库

先从 FoodData Central 下载 Foundation Foods JSON 与 SR Legacy JSON，再运行：

```bash
node scripts/build-food-library.mjs \
  --foundation /path/to/Foundation.json \
  --sr /path/to/SR-Legacy.json
```

生成器会写入 `data.js`，保留每条食物的 FDC 编号、英文原始描述、营养数据版本与热量计算方式。
