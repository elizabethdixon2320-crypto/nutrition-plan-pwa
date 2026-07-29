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

- 食物库是本地演示数据，不是薄荷健康数据库。
- 拍照流程会读取用户选择的图片用于本地预览，但分析结果来自 `app.js` 中的 `recognitionAdapter` 模拟适配器。
- 接真实识别服务时，应由后端保存 API 密钥并替换 `recognitionAdapter.analyze(file)`，不要把密钥写入前端。
- 数据保存在当前浏览器的 localStorage。清理浏览器站点数据会删除记录。
