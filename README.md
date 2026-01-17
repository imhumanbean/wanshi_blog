# 个人博客（静态站点）

这个项目是一个纯静态博客站点，文章源文件在 `posts/*.md`，构建后生成 `posts.json`。发布方式是 **本地改内容 + git push**。

## 快速写文章（推荐）

在仓库根目录执行：

```powershell
./scripts/new-post.ps1
```

按提示填写标题、摘要、标签、阅读时长。脚本会自动：
- 生成发布日期（当天）
- 读取你的 Git 作者名作为 `author`（如果没有会询问）
- 生成对应的 `posts/*.md`
- 自动执行 `npm run build:posts` 生成 `posts.json`

然后推送即可发布：

```powershell
git add .
git commit -m "add post"
git push
```

## 手动写文章

在 `posts/` 目录新增 Markdown 文件，然后执行构建：

```powershell
npm run build:posts
```

Markdown 示例：

```md
---
title: 文章标题
date: 2026-01-18
readTime: 5 分钟
tags:
  - 标签1
  - 标签2
summary: 摘要内容
author: 你的名字
---

这里是正文内容，可以自由写 Markdown。
```

## 在其他机器上也能识别你并提交

只要 **GitHub 仓库只有你有写权限**，就只有你能发布。

建议在新机器上做两件事：

1. **设置 Git 作者信息**（用于自动填充 author）  
   ```powershell
   git config --global user.name "你的名字"
   git config --global user.email "你的邮箱"
   ```

2. **确保 GitHub 身份认证**  
   推荐使用 **SSH** 或 **Personal Access Token**：
   - SSH：生成 `id_ed25519` 并添加到 GitHub
   - PAT：用 token 作为密码，或设置 Git Credential Manager

完成后，你在任意机器 `git push` 都会被 GitHub 识别为你本人。
