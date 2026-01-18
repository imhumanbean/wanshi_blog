const fs = require("fs");
const path = require("path");

const POSTS_DIR = path.join(__dirname, "..", "posts");
const OUTPUT_FILE = path.join(__dirname, "..", "posts.json");

const parseFrontMatter = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { data: {}, body: content };
  }

  const raw = match[1];
  const body = content.slice(match[0].length);
  const data = {};

  const lines = raw.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      i += 1;
      continue;
    }

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) {
      i += 1;
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (value === "|") {
      const blockLines = [];
      i += 1;
      while (i < lines.length && (/^\s+/.test(lines[i]) || lines[i] === "")) {
        blockLines.push(lines[i].replace(/^\s{2}/, ""));
        i += 1;
      }
      data[key] = blockLines.join("\n").trim();
      continue;
    }

    if (value === "") {
      const arrayItems = [];
      i += 1;
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        arrayItems.push(lines[i].trim().slice(2).trim());
        i += 1;
      }
      data[key] = arrayItems;
      continue;
    }

    data[key] = value.replace(/^"|"$/g, "");
    i += 1;
  }

  return { data, body };
};

const buildPosts = () => {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error("未找到 posts 目录。");
    process.exit(1);
  }

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"));

  const posts = files
    .map((file) => {
      const fullPath = path.join(POSTS_DIR, file);
      const content = fs.readFileSync(fullPath, "utf8");
      const { data, body } = parseFrontMatter(content);

      const views = Number.parseInt(data.views, 10);
      const safeViews = Number.isFinite(views) ? views : 0;

      return {
        title: data.title || path.basename(file, ".md"),
        date: data.date || "",
        readTime: data.readTime || "",
        tags: data.tags || [],
        summary: data.summary || "",
        author: data.author || "",
        views: safeViews,
        slug: data.slug || path.basename(file, ".md"),
        content: body.trim(),
      };
    })
    .filter((post) => post.title && post.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2), "utf8");
  console.log(`已生成 ${OUTPUT_FILE}`);
};

buildPosts();
