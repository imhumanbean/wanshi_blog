const themeToggle = document.getElementById("themeToggle");
const postMeta = document.getElementById("postMeta");
const postTitle = document.getElementById("postTitle");
const postTags = document.getElementById("postTags");
const postContent = document.getElementById("postContent");

const escapeHtml = (text) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderMarkdown = (markdown) => {
  if (!markdown) {
    return "<p>暂无正文。</p>";
  }

  const codeBlocks = [];
  let text = escapeHtml(markdown).replace(/\r\n/g, "\n");

  text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
    const token = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(code.trim());
    return token;
  });

  text = text.replace(/^######\s+(.*)$/gm, "\n<h6>$1</h6>\n");
  text = text.replace(/^#####\s+(.*)$/gm, "\n<h5>$1</h5>\n");
  text = text.replace(/^####\s+(.*)$/gm, "\n<h4>$1</h4>\n");
  text = text.replace(/^###\s+(.*)$/gm, "\n<h3>$1</h3>\n");
  text = text.replace(/^##\s+(.*)$/gm, "\n<h2>$1</h2>\n");
  text = text.replace(/^#\s+(.*)$/gm, "\n<h1>$1</h1>\n");
  text = text.replace(/^>\s+(.*)$/gm, "\n<blockquote>$1</blockquote>\n");

  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");

  const renderList = (items, ordered, start) => {
    const tag = ordered ? "ol" : "ul";
    const startAttr =
      ordered && Number.isFinite(start) && start > 1 ? ` start="${start}"` : "";
    return `<${tag}${startAttr}>${items
      .map((item) => `<li>${item}</li>`)
      .join("")}</${tag}>`;
  };

  const renderListBlock = (block, ordered) => {
    const itemPattern = ordered
      ? /^\s*(\d+)\.\s+(.*)$/
      : /^\s*-\s+(.*)$/;
    const subUnordered = /^\s*-\s+(.*)$/;
    const subOrdered = /^\s*\d+\.\s+(.*)$/;
    const lines = block.split("\n");
    const items = [];
    const numbers = [];
    let current = null;
    let extras = [];

    const flush = () => {
      if (!current) {
        return;
      }
      const cleanExtras = extras.filter((line) => line.trim() !== "");
      let content = current;
      if (cleanExtras.length > 0) {
        const allUnordered = cleanExtras.every((line) => subUnordered.test(line));
        const allOrdered = cleanExtras.every((line) => subOrdered.test(line));
        if (allUnordered) {
          const subItems = cleanExtras.map((line) =>
            line.replace(subUnordered, "$1").trim()
          );
          content += renderList(subItems, false);
        } else if (allOrdered) {
          const subItems = cleanExtras.map((line) =>
            line.replace(subOrdered, "$1").trim()
          );
          content += renderList(subItems, true);
        } else {
          content += `<p>${cleanExtras.join("<br />")}</p>`;
        }
      }
      items.push(content);
      current = null;
      extras = [];
    };

    lines.forEach((line) => {
      const match = line.match(itemPattern);
      if (match) {
        flush();
        if (ordered) {
          numbers.push(Number.parseInt(match[1], 10));
          current = match[2].trim();
        } else {
          current = match[1].trim();
        }
        return;
      }
      if (current !== null && /^\s+/.test(line)) {
        extras.push(line.trim());
      } else if (line.trim()) {
        if (current !== null) {
          extras.push(line.trim());
        }
      }
    });
    flush();

    if (items.length === 0) {
      return block;
    }
    const start = ordered ? numbers[0] || 1 : undefined;
    return `\n${renderList(items, ordered, start)}\n`;
  };

  text = text.replace(/(?:^|\n)((?:\s*\d+\.\s+.*(?:\n|$))+)/g, (match, list) =>
    renderListBlock(list.trimEnd(), true)
  );
  text = text.replace(/(?:^|\n)((?:\s*-\s+.*(?:\n|$))+)/g, (match, list) =>
    renderListBlock(list.trimEnd(), false)
  );

  text = text.replace(/\n{3,}/g, "\n\n");

  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (
        block.startsWith("<h") ||
        block.startsWith("<ul>") ||
        block.startsWith("<ol>") ||
        block.startsWith("<blockquote>") ||
        block.startsWith("<pre>")
      ) {
        return block;
      }
      return `<p>${block.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return blocks.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
    const code = codeBlocks[Number(index)] || "";
    return `<pre><code>${code}</code></pre>`;
  });
};

const setTheme = (mode) => {
  document.body.classList.toggle("dark", mode === "dark");
  localStorage.setItem("theme", mode);
  themeToggle.textContent = mode === "dark" ? "切换浅色" : "切换深色";
};

themeToggle.addEventListener("click", () => {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  setTheme(next);
});

const getSlug = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug") || "";
};

const renderNotFound = () => {
  postTitle.textContent = "未找到文章";
  postMeta.textContent = "";
  postTags.innerHTML = "";
  postContent.innerHTML = "<p>请返回列表重新选择文章。</p>";
};

const loadPost = async () => {
  const slug = getSlug();
  if (!slug) {
    renderNotFound();
    return;
  }

  try {
    const response = await fetch("posts.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("posts.json 加载失败");
    }
    const posts = await response.json();
    const post = posts.find((item) => item.slug === slug);
    if (!post) {
      renderNotFound();
      return;
    }
    const authorText = post.author ? ` · ${post.author}` : "";
    const views = Number.isFinite(post.views) ? post.views : 0;
    postMeta.textContent = `${post.date} · ${post.readTime}${authorText} · 阅读量 ${views}`;
    postTitle.textContent = post.title;
    postTags.innerHTML = (post.tags || [])
      .map((tag) => `<span>${tag}</span>`)
      .join("");
    postContent.innerHTML = renderMarkdown(post.content);
    document.title = `${post.title} - 我的个人博客`;
  } catch (error) {
    console.error(error);
    renderNotFound();
  }
};

const savedTheme = localStorage.getItem("theme") || "light";
setTheme(savedTheme);
loadPost();
