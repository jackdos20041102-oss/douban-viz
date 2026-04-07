# GitHub Pages 部署步骤

---

## 前提条件

- 已注册 GitHub 账号
- 本机已安装 Git（`git --version` 可正常输出版本号）
- 已完成 `npm run build`，`dist/` 目录存在

---

## 步骤一：在 GitHub 上创建仓库

打开 https://github.com/new，填写仓库名（例如 `douban-viz`），选择 **Public**，不要勾选初始化 README，点击 Create repository。

记下仓库地址，格式为 `https://github.com/<你的用户名>/douban-viz.git`。

---

## 步骤二：修改 vite.config.js 中的 base 路径

GitHub Pages 部署后访问路径带有仓库名前缀，需要告知 Vite：

```js
export default defineConfig({
  base: '/douban-viz/',   // 替换为你实际的仓库名，注意前后斜杠
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

修改后重新构建：

```bash
npm run build
```

---

## 步骤三：初始化 Git 并推送主分支

在 `aqi-viz` 目录下执行：

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<你的用户名>/douban-viz.git
git push -u origin main
```

---

## 步骤四：将构建产物推送到 gh-pages 分支

```bash
git subtree push --prefix dist origin gh-pages
```

如果该命令报错，改用以下方式（Windows 兼容性更好）：

```bash
cd dist
git init
git add .
git commit -m "deploy"
git branch -M gh-pages
git remote add origin https://github.com/<你的用户名>/douban-viz.git
git push -f origin gh-pages
cd ..
```

---

## 步骤五：在 GitHub 仓库开启 Pages

进入仓库 → Settings → Pages → Branch 选择 `gh-pages`，目录选 `/ (root)` → Save。

等待约 1–2 分钟后，访问地址为：

```
https://<你的用户名>.github.io/douban-viz/
```

---

## 后续更新

修改代码后：

```bash
npm run build
git subtree push --prefix dist origin gh-pages

# 同时保存源码
git add .
git commit -m "update: ..."
git push origin main
```

---

## 常见问题

**页面空白或资源 404**：检查 `vite.config.js` 中 `base` 的值是否与仓库名完全一致（区分大小写）。

**`git subtree push` 报 rejected**：

```bash
git push origin `git subtree split --prefix dist main`:gh-pages --force
```

**本地预览构建效果**：

```bash
npm run preview
# 访问 http://localhost:4173/douban-viz/
```
