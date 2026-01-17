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
  let currentKey = null;

  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }
    if (trimmed.startsWith("- ")) {
      if (!currentKey) {
        return;
      }
      if (!Array.isArray(data[currentKey])) {
        data[currentKey] = [];
      }
      data[currentKey].push(trimmed.slice(2).trim());
      return;
    }
    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) {
      return;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    currentKey = key;
    if (value === "") {
      data[key] = [];
      return;
    }
    data[key] = value.replace(/^"|"$/g, "");
  });

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

      return {
        title: data.title || path.basename(file, ".md"),
        date: data.date || "",
        readTime: data.readTime || "",
        tags: data.tags || [],
        summary: data.summary || "",
        author: data.author || "",
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
