# Release Notes

## 2026-01-18
- 新增文章阅读量展示（列表页与文章页）。
- 阅读量字段来自 `posts/*.md` 的 `views`。

### 使用说明
在文章的 front matter 中增加：

```
views: 123
```

如果不填写，默认显示为 0。
