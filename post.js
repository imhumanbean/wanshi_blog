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
  let text = escapeHtml(markdown);

  text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
    const token = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(code.trim());
    return token;
  });

  text = text.replace(/^######\s+(.*)$/gm, "<h6>$1</h6>");
  text = text.replace(/^#####\s+(.*)$/gm, "<h5>$1</h5>");
  text = text.replace(/^####\s+(.*)$/gm, "<h4>$1</h4>");
  text = text.replace(/^###\s+(.*)$/gm, "<h3>$1</h3>");
  text = text.replace(/^##\s+(.*)$/gm, "<h2>$1</h2>");
  text = text.replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");
  text = text.replace(/^>\s+(.*)$/gm, "<blockquote>$1</blockquote>");

  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");

  text = text.replace(/(?:^|\n)(- .*(?:\n- .*)*)/g, (match, list) => {
    const items = list
      .split("\n")
      .map((line) => line.replace(/^- /, "").trim())
      .filter(Boolean);
    if (items.length === 0) {
      return match;
    }
    return `\n<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  });

  text = text.replace(
    /(?:^|\n)(\d+\. .*(?:\n\d+\. .*)*)/g,
    (match, list) => {
      const items = list
        .split("\n")
        .map((line) => line.replace(/^\d+\.\s+/, "").trim())
        .filter(Boolean);
      if (items.length === 0) {
        return match;
      }
      return `\n<ol>${items.map((item) => `<li>${item}</li>`).join("")}</ol>`;
    }
  );

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
    postMeta.textContent = `${post.date} · ${post.readTime}${authorText}`;
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
