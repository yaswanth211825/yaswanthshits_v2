const origin = process.argv[2] || "http://localhost:4173";
const checks = [
  "/",
  "/archive.html",
  "/posts/index.json",
  "/posts/2026-06-15/post.json",
  "/posts/2026-06-16/post.json",
  "/posts/2026-06-15/gym-bill.webp",
  "/posts/2026-06-16/weight-65kg-scale.webp",
];

const failures = [];

for (const path of checks) {
  const url = new URL(path, origin).toString();
  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
      failures.push(`${url} returned ${response.status}`);
      continue;
    }

    const length = Number(response.headers.get("content-length") || 0);
    if (path.endsWith(".webp") && length === 0) {
      failures.push(`${url} returned an empty image response`);
    }
  } catch (error) {
    failures.push(`${url} failed: ${error.message}`);
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(`Error: ${failure}`));
  process.exit(1);
}

console.log(`Smoke test passed for ${origin}`);
