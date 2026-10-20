// Lightweight SEO check of a running site: node scripts/check-seo.mjs [base URL]
// Checks title and description length, a single <h1>, canonical, robots, og:image and JSON-LD.
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const errors = [];
const warnings = [];

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

function meta(html, key, value) {
  const tag = html.match(new RegExp(`<meta[^>]*${key}="${value}"[^>]*>`))?.[0];
  return tag ? decode(attr(tag, "content") ?? "") : undefined;
}

async function get(url) {
  const res = await fetch(url, { redirect: "manual" });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.text();
}

async function checkPage(path, { lenientTitle = false } = {}) {
  const url = `${base}${path}`;
  const html = await get(url);
  const fail = (msg) => errors.push(`${path}: ${msg}`);

  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  if (!title) fail("missing <title>");
  else if (title.length > 60) (lenientTitle ? warnings : errors).push(`${path}: title is ${title.length} chars (max 60)`);

  const description = meta(html, "name", "description") ?? "";
  if (description.length < 70 || description.length > 160) {
    fail(`description is ${description.length} chars (want 70-160)`);
  }

  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) fail(`has ${h1} <h1> (want exactly 1)`);

  const canonicalTag = html.match(/<link[^>]*rel="canonical"[^>]*>/)?.[0];
  const canonical = canonicalTag && decode(attr(canonicalTag, "href") ?? "");
  if (!canonical) fail("missing canonical");
  else if (new URL(canonical).pathname.replace(/\/$/, "") !== new URL(url).pathname.replace(/\/$/, "")) {
    fail(`canonical ${canonical} does not match the page`);
  }

  if (/noindex/.test(meta(html, "name", "robots") ?? "")) fail("is noindex");
  if (!meta(html, "property", "og:image")) fail("missing og:image");

  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(json);
    } catch {
      fail("has invalid JSON-LD");
    }
  }
}

const sitemap = await get(`${base}/sitemap.xml`);
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(decode(loc)).pathname);
const category = paths.find((p) => p.startsWith("/categories/"));
const product = paths.find((p) => p.startsWith("/products/"));

for (const path of ["/", "/products", "/about", category]) {
  if (path) await checkPage(path);
}
if (product) await checkPage(product, { lenientTitle: true });

for (const warning of warnings) console.warn(`warning: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  process.exit(1);
}
console.log(`SEO check passed on ${base}`);
