import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexPath = path.join(root, "posts", "index.json");
const errors = [];
const warnings = [];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON: ${path.relative(root, filePath)} (${error.message})`);
    return null;
  }
}

function isText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveNumber(value) {
  return Number.isFinite(value) && value > 0;
}

function checkImage(image, context) {
  if (!image || typeof image !== "object") {
    errors.push(`${context}: image must be an object`);
    return;
  }

  if (!isText(image.src)) {
    errors.push(`${context}: image.src is required`);
    return;
  }

  const imagePath = path.join(root, image.src);
  if (!fs.existsSync(imagePath)) {
    errors.push(`${context}: missing file ${image.src}`);
  } else if (fs.statSync(imagePath).size === 0) {
    errors.push(`${context}: empty file ${image.src}`);
  }

  if (!isText(image.alt)) warnings.push(`${context}: image.alt should describe the image`);
  if (!isPositiveNumber(image.width)) errors.push(`${context}: image.width must be a positive number`);
  if (!isPositiveNumber(image.height)) errors.push(`${context}: image.height must be a positive number`);
  if (image.fit && !["cover", "contain"].includes(image.fit)) {
    errors.push(`${context}: image.fit must be "cover" or "contain"`);
  }
}

function checkPost(post, meta, postPath) {
  const label = path.relative(root, postPath);

  ["date", "slug", "title", "kicker", "body", "scraps"].forEach((field) => {
    if (field === "body" || field === "scraps") return;
    if (!isText(post[field])) errors.push(`${label}: ${field} is required`);
  });

  if (post.slug !== meta.slug) errors.push(`${label}: slug must match posts/index.json`);
  if (post.date !== meta.date) errors.push(`${label}: date must match posts/index.json`);
  if (!Array.isArray(post.body) || post.body.filter(isText).length === 0) {
    errors.push(`${label}: body must contain at least one paragraph`);
  }
  if (!Array.isArray(post.scraps) || post.scraps.length === 0) {
    errors.push(`${label}: scraps must contain at least one scrap`);
  }

  (post.scraps || []).forEach((scrap, index) => {
    const context = `${label}: scraps[${index}]`;
    if (!["image", "note", "list"].includes(scrap.type)) {
      errors.push(`${context}: type must be image, note, or list`);
    }
    if (!isText(scrap.title)) errors.push(`${context}: title is required`);
    if (scrap.type === "image") checkImage(scrap.image, `${context}.image`);
    if (scrap.type === "list" && (!Array.isArray(scrap.items) || scrap.items.filter(isText).length === 0)) {
      errors.push(`${context}: list scraps need items`);
    }
    if (scrap.type === "note" && !isText(scrap.text)) {
      warnings.push(`${context}: note scraps should have text`);
    }
  });

  (post.gallery || []).forEach((image, index) => {
    checkImage(image, `${label}: gallery[${index}]`);
    if (!isText(image.caption)) warnings.push(`${label}: gallery[${index}] should have a caption`);
  });
}

const index = readJson(indexPath);
if (!index || !Array.isArray(index.posts)) {
  errors.push("posts/index.json must contain a posts array");
} else {
  const slugs = new Set();
  const dates = new Set();

  index.posts.forEach((meta, indexNumber) => {
    const context = `posts/index.json: posts[${indexNumber}]`;
    if (!isText(meta.date)) errors.push(`${context}: date is required`);
    if (!isText(meta.slug)) errors.push(`${context}: slug is required`);
    if (!isText(meta.path)) errors.push(`${context}: path is required`);
    if (slugs.has(meta.slug)) errors.push(`${context}: duplicate slug ${meta.slug}`);
    if (dates.has(meta.date)) warnings.push(`${context}: multiple posts share date ${meta.date}`);
    slugs.add(meta.slug);
    dates.add(meta.date);

    if (!meta.path) return;
    const postPath = path.join(root, meta.path);
    if (!fs.existsSync(postPath)) {
      errors.push(`${context}: missing post file ${meta.path}`);
      return;
    }

    const post = readJson(postPath);
    if (post) checkPost(post, meta, postPath);
  });
}

warnings.forEach((warning) => console.warn(`Warning: ${warning}`));

if (errors.length) {
  errors.forEach((error) => console.error(`Error: ${error}`));
  process.exit(1);
}

console.log("Content validation passed.");
