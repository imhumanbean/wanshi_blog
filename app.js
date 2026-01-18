let posts = [];
const postGrid = document.getElementById("postGrid");
const postDirectory = document.getElementById("postDirectory");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");
let searchTerm = "";

const getUniqueTags = () =>
  [...new Set(posts.flatMap((post) => post.tags || []))].sort();

const sortPostsByDate = (list) =>
  [...list].sort((a, b) => (a.date < b.date ? 1 : -1));

const getFilteredPosts = () => {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  return posts.filter((post) => {
    const searchable = `${post.title} ${post.tags.join(" ")}`.toLowerCase();
    const matchesSearch =
      normalizedSearch === "" || searchable.includes(normalizedSearch);
    return matchesSearch;
  });
};

const renderDirectory = () => {
  postDirectory.innerHTML = "";
  if (posts.length === 0) {
    postDirectory.innerHTML = "<p class='post-meta'>暂无文章</p>";
    return;
  }

  const tags = getUniqueTags();
  if (tags.length === 0) {
    const list = document.createElement("ul");
    list.className = "post-directory-list";
    sortPostsByDate(posts).forEach((post) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      const postLink = post.slug
        ? `post.html?slug=${encodeURIComponent(post.slug)}`
        : "post.html";
      link.href = postLink;
      link.textContent = post.title;
      item.appendChild(link);
      list.appendChild(item);
    });
    postDirectory.appendChild(list);
    return;
  }

  tags.forEach((tag) => {
    const section = document.createElement("div");
    section.className = "post-directory-section";
    const heading = document.createElement("h4");
    heading.textContent = tag;
    const list = document.createElement("ul");
    list.className = "post-directory-list";
    sortPostsByDate(posts.filter((post) => post.tags.includes(tag))).forEach(
      (post) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        const postLink = post.slug
          ? `post.html?slug=${encodeURIComponent(post.slug)}`
          : "post.html";
        link.href = postLink;
        link.textContent = post.title;
        item.appendChild(link);
        list.appendChild(item);
      }
    );
    section.appendChild(heading);
    section.appendChild(list);
    postDirectory.appendChild(section);
  });
};

const renderPosts = () => {
  const filtered = sortPostsByDate(getFilteredPosts());

  postGrid.innerHTML = "";
  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "post-card";
    empty.innerHTML =
      "<h3>没有匹配的文章</h3><p class='post-meta'>试试其他关键词或标签。</p>";
    postGrid.appendChild(empty);
    return;
  }

  filtered.forEach((post) => {
    const card = document.createElement("article");
    card.className = "post-card";
    const authorText = post.author ? ` · ${post.author}` : "";
    const views = Number.isFinite(post.views) ? post.views : 0;
    const postLink = post.slug
      ? `post.html?slug=${encodeURIComponent(post.slug)}`
      : "post.html";
    card.innerHTML = `
      <div class="post-meta">${post.date} · ${post.readTime}${authorText} · 阅读量 ${views}</div>
      <h3>${post.title}</h3>
      <p>${post.summary}</p>
      <div class="post-tags">
        ${post.tags.map((tag) => `<span>${tag}</span>`).join("")}
      </div>
      <a class="post-read" href="${postLink}">阅读全文</a>
    `;
    postGrid.appendChild(card);
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

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderPosts();
});

const savedTheme = localStorage.getItem("theme") || "light";
setTheme(savedTheme);

const loadPosts = async () => {
  try {
    const response = await fetch("posts.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("posts.json 加载失败");
    }
    posts = await response.json();
  } catch (error) {
    posts = [];
    console.error(error);
  }
  renderPosts();
  renderDirectory();
};

loadPosts();

document.querySelector(".subscribe-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const emailInput = event.target.querySelector("input");
  const email = emailInput.value.trim();
  if (!email) {
    return;
  }
  event.target.reset();
  alert("感谢订阅，更新会第一时间发送到你的邮箱。");
});
