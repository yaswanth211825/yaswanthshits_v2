const APP = {
  postIndexPath: "posts/index.json",
  maxScraps: 8,
  maxGalleryItems: 12,
  defaultCollapsedArchiveHeight: "7.2rem",
  selectors: {
    archiveList: "#archive-list",
    blogEntry: "#blog-entry",
    dailyKicker: "#daily-kicker",
    dailyTitle: "#daily-title",
    meter: ".scroll-meter",
    panicButton: ".panic-button",
    scrapbook: "#scrapbook",
  },
};

const state = {
  prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)"),
  revealObserver: null,
  scrollTicking: false,
};

const dom = Object.fromEntries(
  Object.entries(APP.selectors).map(([key, selector]) => [key, document.querySelector(selector)])
);
dom.meterText = dom.meter?.querySelector("span");

const FALLBACK_POST = {
  kicker: "Post unavailable",
  title: "The Evidence Locker Jammed",
  buttonLabel: "Close & Go Back to Void",
  mood: "fallback mode",
  heroLine: "The site survived, but the post data did not.",
  body: [
    "The post data did not load. Check posts/index.json, the post path, and whether the local server is running.",
    "The comeback arc refuses to 404.",
  ],
  scraps: [
    {
      type: "note",
      stamp: "!",
      title: "Post data missed leg day",
      text: "Fix the JSON path or syntax and refresh.",
    },
  ],
  gallery: [],
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function text(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function number(value, fallback = undefined) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function imageRatio(image) {
  const width = number(image?.width);
  const height = number(image?.height);
  return width && height ? `${width} / ${height}` : undefined;
}

function postSlugFromUrl() {
  return new URLSearchParams(window.location.search).get("post");
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function normalizeImage(image) {
  if (!image || typeof image !== "object" || !text(image.src)) return null;

  return {
    src: text(image.src),
    alt: text(image.alt, "Blog image"),
    width: number(image.width),
    height: number(image.height),
    caption: text(image.caption),
    tone: text(image.tone, "photo"),
    fit: ["contain", "cover"].includes(image.fit) ? image.fit : "cover",
  };
}

function normalizeScrap(scrap, index) {
  const type = ["image", "list", "note"].includes(scrap?.type) ? scrap.type : "note";
  const items = Array.isArray(scrap?.items)
    ? scrap.items.map((item) => text(item)).filter(Boolean).slice(0, 8)
    : [];

  return {
    type,
    stamp: text(scrap?.stamp, String(index + 1).padStart(2, "0")),
    size: ["big", "wide"].includes(scrap?.size) ? scrap.size : "",
    tone: text(scrap?.tone, type),
    title: text(scrap?.title, "Untitled scrap"),
    text: text(scrap?.text, "No caption yet."),
    items,
    image: normalizeImage(scrap?.image),
  };
}

function normalizePost(post, meta = {}) {
  if (!post || typeof post !== "object") return { ...FALLBACK_POST };

  const body = Array.isArray(post.body)
    ? post.body.map((paragraph) => text(paragraph)).filter(Boolean)
    : [];
  const scraps = Array.isArray(post.scraps)
    ? post.scraps.slice(0, APP.maxScraps).map(normalizeScrap)
    : [];
  const gallery = Array.isArray(post.gallery)
    ? post.gallery.slice(0, APP.maxGalleryItems).map(normalizeImage).filter(Boolean)
    : [];

  return {
    date: text(post.date, text(meta.date)),
    slug: text(post.slug, text(meta.slug)),
    kicker: text(post.kicker, "Latest post"),
    title: text(post.title, "Untitled damage report"),
    mood: text(post.mood, "mood not filed"),
    heroLine: text(post.heroLine, "Evidence pending."),
    buttonLabel: text(post.buttonLabel, "Close & Go Back to Void"),
    body: body.length ? body : FALLBACK_POST.body,
    scraps: scraps.length ? scraps : FALLBACK_POST.scraps.map(normalizeScrap),
    gallery,
  };
}

function publishedPosts(index) {
  return (Array.isArray(index?.posts) ? index.posts : [])
    .filter((post) => post?.published !== false && text(post.path) && text(post.date))
    .sort((a, b) => {
      const aTime = Date.parse(a.date);
      const bTime = Date.parse(b.date);
      if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) return bTime - aTime;
      return text(b.slug).localeCompare(text(a.slug));
    });
}

function selectPostMeta(index) {
  const posts = publishedPosts(index);
  const requestedSlug = postSlugFromUrl();
  return posts.find((post) => post.slug === requestedSlug) || posts[0];
}

function createImage(image) {
  const normalized = normalizeImage(image);
  if (!normalized) return null;

  const img = document.createElement("img");
  img.src = normalized.src;
  img.alt = normalized.alt;
  img.loading = "lazy";
  img.decoding = "async";
  if (normalized.width) img.width = normalized.width;
  if (normalized.height) img.height = normalized.height;
  return img;
}

function applyImageFrame(figure, image) {
  const normalized = normalizeImage(image);
  if (!normalized) return;

  figure.dataset.tone = normalized.tone;
  figure.dataset.fit = normalized.fit;
  const ratio = imageRatio(normalized);
  if (ratio) figure.style.setProperty("--image-ratio", ratio);
}

function renderScrapImage(scrap) {
  const figure = el("figure", "scrap-media");
  applyImageFrame(figure, scrap.image || { tone: scrap.tone });
  const image = createImage(scrap.image);

  if (image) {
    figure.append(image);
    return figure;
  }

  const placeholder = el("div", "fake-photo");
  placeholder.append(el("span", "", "image missing"));
  return placeholder;
}

function renderScrap(scrapInput, index) {
  const scrap = normalizeScrap(scrapInput, index);
  const article = el("article", "scrap");
  article.dataset.stamp = scrap.stamp;
  article.dataset.type = scrap.type;
  article.dataset.tone = scrap.tone;

  if (scrap.size) article.classList.add(`is-${scrap.size}`);
  if (scrap.type === "image") article.classList.add("photo-scrap");
  if (scrap.type === "list") article.classList.add("receipt-scrap");
  if (scrap.type === "note") article.classList.add("note-scrap");

  article.append(
    scrap.type === "note"
      ? el("div", "pin")
      : el("div", index % 2 === 0 ? "tape tape-left" : "tape tape-right")
  );

  if (scrap.type === "image") article.append(renderScrapImage(scrap));
  article.append(el("h3", "", scrap.title));

  if (scrap.type === "list") {
    const list = document.createElement("ul");
    (scrap.items.length ? scrap.items : [scrap.text]).forEach((item) => list.append(el("li", "", item)));
    article.append(list);
  } else {
    article.append(el("p", "", scrap.text));
  }

  return article;
}

function renderGallery(galleryInput) {
  const gallery = galleryInput.map(normalizeImage).filter(Boolean);
  if (!gallery.length) return null;

  const wrapper = el("div", "blog-gallery");
  wrapper.setAttribute("aria-label", "Post photos");

  gallery.forEach((item) => {
    const figure = document.createElement("figure");
    applyImageFrame(figure, item);
    const image = createImage(item);
    if (!image) return;

    figure.append(image);
    figure.append(el("figcaption", "", item.caption || "Untitled evidence."));
    wrapper.append(figure);
  });

  return wrapper.children.length ? wrapper : null;
}

function renderPost(postInput, meta) {
  const post = normalizePost(postInput, meta);

  if (dom.dailyKicker) dom.dailyKicker.textContent = post.kicker;
  if (dom.dailyTitle) dom.dailyTitle.textContent = post.title;
  document.title = `${post.title} // yaswanthshits.com`;

  if (dom.scrapbook) {
    dom.scrapbook.replaceChildren(...post.scraps.map(renderScrap));
  }

  if (dom.blogEntry) {
    const button = el("button", "void-button", post.buttonLabel);
    button.type = "button";

    const nodes = [button];
    const galleryAfter = Math.min(4, Math.max(1, post.body.length - 1));
    post.body.forEach((paragraph, index) => {
      nodes.push(el("p", "", paragraph));
      if (index + 1 === galleryAfter) {
        const gallery = renderGallery(post.gallery);
        if (gallery) nodes.push(gallery);
      }
    });

    dom.blogEntry.replaceChildren(...nodes);
  }

  setupRevealObserver();
  requestScrollMeterUpdate();
}

async function loadPostByMeta(meta) {
  const rawPost = await fetchJson(meta.path);
  return normalizePost(rawPost, meta);
}

async function loadHomePost() {
  if (!dom.scrapbook && !dom.blogEntry) return;

  try {
    const index = await fetchJson(APP.postIndexPath);
    const meta = selectPostMeta(index);
    if (!meta) throw new Error("No published posts found");
    renderPost(await loadPostByMeta(meta), meta);
  } catch (error) {
    console.warn(error);
    renderPost(FALLBACK_POST);
  }
}

function renderArchiveCard(post) {
  const article = el("article", "archive-item");
  article.append(el("p", "kicker", post.kicker || post.date || "Undated"));
  article.append(el("h2", "", post.title));

  const contentId = `archive-${post.slug || post.date || Math.random().toString(36).slice(2)}`;
  const content = el("div", "archive-content");
  content.id = contentId;
  post.body.forEach((paragraph) => content.append(el("p", "", paragraph)));
  const gallery = renderGallery(post.gallery);
  if (gallery) content.append(gallery);
  article.append(content);

  article.append(el("p", "archive-line", post.heroLine));
  article.append(el("p", "archive-line", `Mood: ${post.mood}`));

  const actions = el("div", "archive-actions");
  const toggle = el("button", "archive-toggle", "Read full blog");
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", contentId);
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    toggle.textContent = expanded ? "Read full blog" : "Collapse";
    article.classList.toggle("is-expanded", !expanded);
  });

  const link = el("a", "", "Open post");
  link.href = post.slug ? `index.html?post=${encodeURIComponent(post.slug)}#daily` : "index.html#daily";
  actions.append(toggle, link);
  article.append(actions);
  return article;
}

async function loadArchive() {
  if (!dom.archiveList) return;

  try {
    const index = await fetchJson(APP.postIndexPath);
    const metas = publishedPosts(index);
    if (!metas.length) throw new Error("No posts found");

    const posts = await Promise.all(
      metas.map(async (meta) => {
        try {
          return await loadPostByMeta(meta);
        } catch (error) {
          console.warn(error);
          return normalizePost(null, meta);
        }
      })
    );

    dom.archiveList.replaceChildren(...posts.map(renderArchiveCard));
  } catch (error) {
    console.warn(error);
    const article = el("article", "archive-item");
    article.append(el("p", "kicker", "archive error"));
    article.append(el("h2", "", "The evidence locker jammed."));
    article.append(el("p", "", "Check posts/index.json and published post paths."));
    dom.archiveList.replaceChildren(article);
  }
}

function setupRevealObserver() {
  state.revealObserver?.disconnect();
  state.revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.18 }
  );

  document.querySelectorAll(".scrap").forEach((scrap) => state.revealObserver.observe(scrap));
}

function updateScrollMeter() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  const percent = Math.round(progress * 100);

  dom.meter?.style.setProperty("--progress", `${percent}%`);
  if (dom.meterText) dom.meterText.textContent = `${percent}%`;
}

function requestScrollMeterUpdate() {
  if (state.scrollTicking) return;

  state.scrollTicking = true;
  window.requestAnimationFrame(() => {
    updateScrollMeter();
    state.scrollTicking = false;
  });
}

function addWobble(target) {
  if (state.prefersReducedMotion.matches) return;

  target.animate(
    [
      { transform: "translateY(0) rotate(0deg)" },
      { transform: "translateY(-4px) rotate(-2deg)" },
      { transform: "translateY(2px) rotate(2deg)" },
      { transform: "translateY(0) rotate(0deg)" },
    ],
    { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }
  );
}

window.addEventListener("scroll", requestScrollMeterUpdate, { passive: true });
window.addEventListener("resize", requestScrollMeterUpdate);
window.addEventListener("orientationchange", requestScrollMeterUpdate);

dom.panicButton?.addEventListener("click", () => {
  document.querySelector("#daily")?.scrollIntoView({
    behavior: state.prefersReducedMotion.matches ? "auto" : "smooth",
    block: "start",
  });
  addWobble(dom.panicButton);
});

dom.meter?.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: state.prefersReducedMotion.matches ? "auto" : "smooth",
  });
});

updateScrollMeter();
loadHomePost();
loadArchive();
