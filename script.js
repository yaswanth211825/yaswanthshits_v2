const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const meter = document.querySelector(".scroll-meter");
const meterText = meter?.querySelector("span");
const panicButton = document.querySelector(".panic-button");
const scrapbook = document.querySelector("#scrapbook");
const dailyKicker = document.querySelector("#daily-kicker");
const dailyTitle = document.querySelector("#daily-title");
const blogEntry = document.querySelector("#blog-entry");
const archiveList = document.querySelector("#archive-list");

let revealScraps;
let scrollTicking = false;

const FALLBACK_POST = {
  kicker: "15 June // 2:00 AM",
  title: "Day 01: The 2 AM Gym vs Biryani Loop",
  buttonLabel: "Close & Go Back to Void",
  body: [
    "My brain is completely not braining and sleep is absolutely not sleeping.",
    "The post data did not load, but the comeback arc refuses to 404.",
  ],
  scraps: [
    {
      type: "note",
      stamp: "!",
      title: "Post data missed leg day",
      text: "Check posts/index.json and the latest post.json path.",
    },
  ],
  gallery: [],
};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function normalizeText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizePost(post) {
  if (!post || typeof post !== "object") return FALLBACK_POST;

  const body = Array.isArray(post.body)
    ? post.body.map((item) => normalizeText(item)).filter(Boolean)
    : [];
  const scraps = Array.isArray(post.scraps) ? post.scraps.slice(0, 8) : [];
  const gallery = Array.isArray(post.gallery) ? post.gallery.slice(0, 9) : [];

  return {
    ...post,
    kicker: normalizeText(post.kicker, "Latest post"),
    title: normalizeText(post.title, "Untitled damage report"),
    buttonLabel: normalizeText(post.buttonLabel, "Close & Go Back to Void"),
    body: body.length ? body : FALLBACK_POST.body,
    scraps: scraps.length ? scraps : FALLBACK_POST.scraps,
    gallery,
  };
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function getLatestPostMeta(index) {
  const posts = Array.isArray(index?.posts) ? index.posts : [];
  const requestedSlug = new URLSearchParams(window.location.search).get("post");
  const published = posts.filter((post) => post?.published !== false && post?.path && post?.date);

  if (requestedSlug) {
    const requested = published.find((post) => post.slug === requestedSlug);
    if (requested) return requested;
  }

  return published
    .sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      return Number.isNaN(dateCompare) || dateCompare === 0
        ? normalizeText(b.slug).localeCompare(normalizeText(a.slug))
        : dateCompare;
    })[0];
}

function createImage(image, className) {
  if (!image?.src) return null;

  const img = document.createElement("img");
  img.src = image.src;
  img.alt = normalizeText(image.alt, "Blog image");
  img.loading = "lazy";
  img.decoding = "async";
  if (Number.isFinite(image.width)) img.width = image.width;
  if (Number.isFinite(image.height)) img.height = image.height;
  if (className) img.className = className;
  return img;
}

function renderScrapImage(scrap) {
  const figure = createElement("figure", `scrap-media ${normalizeText(scrap.tone, "photo")}-media`);
  const image = createImage(scrap.image);

  if (image) {
    figure.append(image);
    return figure;
  }

  const placeholder = createElement("div", "fake-photo");
  placeholder.append(createElement("span", "", "image missing"));
  return placeholder;
}

function renderScrap(scrap, index) {
  const type = normalizeText(scrap.type, "note");
  const article = createElement("article", "scrap");
  const size = normalizeText(scrap.size);

  article.dataset.stamp = normalizeText(scrap.stamp, String(index + 1).padStart(2, "0"));
  if (size === "big") article.classList.add("is-big");
  if (size === "wide") article.classList.add("is-wide");
  if (type === "image") article.classList.add("photo-scrap");
  if (type === "list") article.classList.add("receipt-scrap");
  if (type === "note") article.classList.add("note-scrap");

  if (type === "note") {
    article.append(createElement("div", "pin"));
  } else {
    article.append(createElement("div", index % 2 === 0 ? "tape tape-left" : "tape tape-right"));
  }

  if (type === "image") article.append(renderScrapImage(scrap));

  article.append(createElement("h3", "", normalizeText(scrap.title, "Untitled scrap")));

  if (type === "list" && Array.isArray(scrap.items)) {
    const list = document.createElement("ul");
    scrap.items.map((item) => normalizeText(item)).filter(Boolean).forEach((item) => {
      list.append(createElement("li", "", item));
    });
    article.append(list);
  } else {
    article.append(createElement("p", "", normalizeText(scrap.text, "No caption yet.")));
  }

  return article;
}

function renderGallery(gallery) {
  if (!gallery.length) return null;

  const wrapper = createElement("div", "blog-gallery");
  wrapper.setAttribute("aria-label", "Post photos");

  gallery.forEach((item) => {
    const figure = document.createElement("figure");
    const tone = normalizeText(item.tone);
    if (tone) figure.dataset.tone = tone;
    const image = createImage(item);
    if (!image) return;

    figure.append(image);
    figure.append(createElement("figcaption", "", normalizeText(item.caption, "Untitled evidence.")));
    wrapper.append(figure);
  });

  return wrapper.children.length ? wrapper : null;
}

function setupRevealObserver() {
  revealScraps?.disconnect();
  revealScraps = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.18,
    }
  );

  document.querySelectorAll(".scrap").forEach((scrap) => revealScraps.observe(scrap));
}

function renderPost(postInput) {
  const post = normalizePost(postInput);

  if (dailyKicker) dailyKicker.textContent = post.kicker;
  if (dailyTitle) dailyTitle.textContent = post.title;

  if (scrapbook) {
    scrapbook.replaceChildren(...post.scraps.map(renderScrap));
  }

  if (blogEntry) {
    const nodes = [createElement("button", "void-button", post.buttonLabel)];
    nodes[0].type = "button";

    const galleryAfter = Math.min(4, Math.max(1, post.body.length - 1));
    post.body.forEach((paragraph, index) => {
      nodes.push(createElement("p", "", paragraph));
      if (index + 1 === galleryAfter) {
        const gallery = renderGallery(post.gallery);
        if (gallery) nodes.push(gallery);
      }
    });

    blogEntry.replaceChildren(...nodes);
  }

  setupRevealObserver();
  requestScrollMeterUpdate();
}

async function loadLatestPost() {
  if (!scrapbook && !blogEntry) return;

  try {
    const index = await fetchJson("posts/index.json");
    const latest = getLatestPostMeta(index);
    if (!latest) throw new Error("No published posts found");

    const post = await fetchJson(latest.path);
    renderPost(post);
  } catch (error) {
    console.warn(error);
    renderPost(FALLBACK_POST);
  }
}

function postSummary(post, meta) {
  const slug = normalizeText(post?.slug, normalizeText(meta?.slug));

  return {
    date: normalizeText(post?.date, normalizeText(meta?.date, "Undated")),
    title: normalizeText(post?.title, "Untitled damage report"),
    mood: normalizeText(post?.mood, "mood not filed"),
    heroLine: normalizeText(post?.heroLine, "Evidence pending."),
    href: slug ? `index.html?post=${encodeURIComponent(slug)}#daily` : "index.html#daily",
  };
}

async function loadArchive() {
  if (!archiveList) return;

  try {
    const index = await fetchJson("posts/index.json");
    const metas = (Array.isArray(index?.posts) ? index.posts : [])
      .filter((post) => post?.published !== false && post?.path)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (!metas.length) throw new Error("No posts found");

    const posts = await Promise.all(
      metas.map(async (meta) => {
        try {
          const post = await fetchJson(meta.path);
          return { meta, post: normalizePost(post) };
        } catch {
          return { meta, post: normalizePost(null) };
        }
      })
    );

    archiveList.replaceChildren(
      ...posts.map(({ meta, post }) => {
        const article = createElement("article", "archive-item");
        article.append(createElement("p", "kicker", post.kicker || meta.date || "Undated"));
        article.append(createElement("h2", "", post.title || normalizeText(meta.title, "Untitled")));

        // Full body paragraphs
        post.body.forEach((paragraph) => {
          article.append(createElement("p", "", paragraph));
        });

        // Gallery (if any)
        const gallery = renderGallery(post.gallery);
        if (gallery) article.append(gallery);

        // Small mood/hero line footnote
        if (post.heroLine) article.append(createElement("p", "", post.heroLine));
        if (post.mood) article.append(createElement("p", "", `Mood: ${post.mood}`));

        const link = createElement("a", "", "Open post");
        link.href = post.slug ? `index.html?post=${encodeURIComponent(post.slug)}#daily` : (meta?.path || "index.html#daily");
        article.append(link);
        return article;
      })
    );
  } catch (error) {
    console.warn(error);
    const article = createElement("article", "archive-item");
    article.append(createElement("p", "kicker", "archive error"));
    article.append(createElement("h2", "", "The evidence locker jammed."));
    article.append(createElement("p", "", "Check posts/index.json and published post paths."));
    archiveList.replaceChildren(article);
  }
}

function updateScrollMeter() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  const percent = Math.round(progress * 100);

  meter?.style.setProperty("--progress", `${percent}%`);
  if (meterText) meterText.textContent = `${percent}%`;
}

function requestScrollMeterUpdate() {
  if (scrollTicking) return;

  scrollTicking = true;
  window.requestAnimationFrame(() => {
    updateScrollMeter();
    scrollTicking = false;
  });
}

function addWobble(target) {
  if (prefersReducedMotion.matches) return;

  target.animate(
    [
      { transform: "translateY(0) rotate(0deg)" },
      { transform: "translateY(-4px) rotate(-2deg)" },
      { transform: "translateY(2px) rotate(2deg)" },
      { transform: "translateY(0) rotate(0deg)" },
    ],
    {
      duration: 420,
      easing: "cubic-bezier(.2,.8,.2,1)",
    }
  );
}

window.addEventListener("scroll", requestScrollMeterUpdate, { passive: true });
window.addEventListener("resize", requestScrollMeterUpdate);
window.addEventListener("orientationchange", requestScrollMeterUpdate);

panicButton?.addEventListener("click", () => {
  document.querySelector("#daily")?.scrollIntoView({
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    block: "start",
  });
  addWobble(panicButton);
});

meter?.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
  });
});

updateScrollMeter();
loadLatestPost();
loadArchive();
