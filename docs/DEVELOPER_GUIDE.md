# yaswanthshits.com Developer Guide

## What This Site Is

This is a static, data-driven scrapbook blog. There is no database and no backend.

The site is made of:

- `index.html`: homepage shell and latest/full post renderer target.
- `archive.html`: archive shell for all published posts.
- `styles.css`: scrapbook visual system and responsive layout.
- `script.js`: content loading, post routing, renderers, archive behavior, scroll UI.
- `posts/index.json`: source of truth for published posts.
- `posts/YYYY-MM-DD/post.json`: one complete blog post.
- `posts/YYYY-MM-DD/*.webp`: images owned by that post.

## Routes

- `index.html`: renders the latest published post from `posts/index.json`.
- `index.html?post=<slug>#daily`: renders a specific post by slug.
- `archive.html`: renders all published posts as expandable full-blog cards.

Example:

```txt
index.html?post=day-02-gym-fauda-snack-betrayal#daily
```

## Daily Publishing Workflow

1. Create a new folder:

```txt
posts/2026-06-17/
```

2. Add edited/compressed WebP images into that folder.

Use readable names:

```txt
posts/2026-06-17/gym-proof.webp
posts/2026-06-17/snack-crime-scene.webp
posts/2026-06-17/mirror-selfie.webp
```

3. Copy `posts/POST_TEMPLATE.json` to:

```txt
posts/2026-06-17/post.json
```

4. Fill out the post fields.

5. Add the post to `posts/index.json`:

```json
{
  "date": "2026-06-17",
  "slug": "day-03-your-slug-here",
  "path": "posts/2026-06-17/post.json",
  "published": true
}
```

6. Run validation:

```bash
node tools/validate-content.mjs
```

7. Preview locally:

```bash
python3 -m http.server 4173
```

Then open:

```txt
http://localhost:4173
http://localhost:4173/archive.html
http://localhost:4173/index.html?post=day-03-your-slug-here#daily
```

8. Run a local HTTP smoke test while the server is running:

```bash
node tools/smoke-test.mjs http://localhost:4173
```

## Post JSON Contract

Required:

- `date`: `YYYY-MM-DD`
- `slug`: unique stable URL id
- `title`: visible blog title
- `kicker`: small date/day label
- `body`: array of full paragraphs
- `scraps`: array of scrapbook cards

Recommended:

- `mood`
- `heroLine`
- `gallery`

## Scrap Types

### Image Scrap

```json
{
  "type": "image",
  "stamp": "01",
  "size": "big",
  "tone": "photo",
  "title": "Title",
  "text": "Caption",
  "image": {
    "src": "posts/2026-06-17/image.webp",
    "alt": "Accessible image description",
    "width": 1200,
    "height": 900,
    "fit": "cover"
  }
}
```

### Note Scrap

```json
{
  "type": "note",
  "stamp": "02",
  "tone": "note",
  "title": "Title",
  "text": "Short note"
}
```

### List Scrap

```json
{
  "type": "list",
  "stamp": "03",
  "tone": "receipt",
  "title": "Audit",
  "items": ["Item one", "Item two"]
}
```

## Image Behavior

Frames auto-size from each image's `width` and `height`.

The renderer sets:

```css
--image-ratio: width / height;
```

So future images do not need custom CSS for every ratio.

Use:

- `"fit": "cover"` for normal photo cards. It fills the frame and may crop edges.
- `"fit": "contain"` for bills, screenshots, documents, or anything where text must remain visible.

`tone` is optional. It is used for styling hooks:

```json
"tone": "weight"
```

## Archive Behavior

Archive cards include the full blog body and gallery. They start collapsed for readability and expand with `Read full blog`.

Day 1 and every older post stays available through:

```txt
archive.html
index.html?post=<slug>#daily
```

## Content Rules

- One day = one folder.
- Do not put future post images in `assets/`; use that post's own folder.
- Convert photos to `.webp` before publishing.
- Keep original/private photos outside the site folder unless they are safe to publish.
- Do not expose phone numbers, addresses, invoices, private chats, or payment data.
- Use `published: false` for drafts.

## Edge Cases Handled

- Missing/broken JSON falls back to a safe post.
- Unpublished posts are ignored.
- Duplicate or missing slugs are caught by validation.
- Missing image files are caught by validation.
- Missing image dimensions are caught by validation.
- Unknown `fit` values are rejected by validation.
- Archive still renders even if one post fails.
- Images are lazy-loaded and decoded asynchronously.
- Layout is mobile-first and tested for horizontal overflow.
