import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { root, readJSON, hash, getPosts } from '../src/lib/content.mjs';
import { validateCV } from '../src/lib/cv.mjs';

const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
export function postPaths(slug, base = root) {
  if (!/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9_-]+$/.test(slug || '')) throw new Error('Use a filename such as 2026-11-04-research-note (without .md).');
  return {
    source: path.join(base, 'content/ko/posts', `${slug}.md`),
    translation: path.join(base, 'content/en/posts', `${slug}.md`),
    draft: path.join(base, '.review', slug, 'translation.md'),
    request: path.join(base, '.review', slug, 'request.json'),
    prompt: path.join(base, '.review', slug, 'prompt.md'),
    reviews: path.join(base, 'content/reviews.json'),
  };
}

export function prepare(slug, base = root) {
  const p = postPaths(slug, base);
  if (fs.existsSync(p.draft)) throw new Error('A review draft already exists. Keep or remove it explicitly before preparing again.');
  const source = fs.readFileSync(p.source, 'utf8');
  const { data } = matter(source);
  if (!data.title) throw new Error('The Korean source must have a title.');
  fs.mkdirSync(path.dirname(p.draft), { recursive: true });
  fs.writeFileSync(p.draft, source);
  writeJSON(p.request, { slug, sourceHash: hash(source), createdAt: new Date().toISOString() });
  fs.writeFileSync(p.prompt, `Translate the following Korean research blog post into clear, natural academic English.\nPreserve technical meaning, equations, citations, links, image paths, fenced code blocks, and YAML keys.\nTranslate title, subtitle, and prose. Do not invent claims or add explanations to the post.\nKeep category and tag identifiers unchanged. Return the complete Markdown file with front matter.\nWrite the result to .review/${slug}/translation.md. Do not publish or approve it.\nFlag ambiguous terms separately for the author's review.\n\n${source}`);
  return p;
}

export function approve(slug, reviewer, base = root) {
  if (!reviewer?.trim()) throw new Error('Name the human reviewer with --reviewer.');
  const p = postPaths(slug, base);
  const request = JSON.parse(fs.readFileSync(p.request, 'utf8'));
  const source = fs.readFileSync(p.source, 'utf8');
  const translation = fs.readFileSync(p.draft, 'utf8');
  if (hash(source) !== request.sourceHash) throw new Error('The Korean source changed after preparation. Prepare and review again.');
  const original = matter(source), draft = matter(translation);
  if (!draft.data.title || !draft.content.trim()) throw new Error('A translated title and body are required.');
  if (draft.content.trim() === original.content.trim()) throw new Error('The draft still contains the original Korean body. Translate and review it first.');
  const blocks = (body) => body.match(/^```[^\n]*\n[\s\S]*?^```/gm) || [];
  if (JSON.stringify(blocks(original.content)) !== JSON.stringify(blocks(draft.content))) throw new Error('Fenced code blocks changed. Restore the source code before approval.');
  const reviews = fs.existsSync(p.reviews) ? JSON.parse(fs.readFileSync(p.reviews, 'utf8')) : {};
  const review = { status: 'approved', sourceHash: hash(source), translationHash: hash(translation), reviewer: reviewer.trim(), reviewedAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(p.translation), { recursive: true });
  fs.writeFileSync(p.translation, translation);
  reviews[slug] = review;
  writeJSON(p.reviews, reviews);
  return review;
}

export async function translate(slug, { base = root, apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_TRANSLATION_MODEL, fetcher = fetch } = {}) {
  if (!apiKey || !model) throw new Error('Set OPENAI_API_KEY and OPENAI_TRANSLATION_MODEL, or use prepare and translate the draft in your editor.');
  const p = postPaths(slug, base);
  if (!fs.existsSync(p.request)) prepare(slug, base);
  const request = JSON.parse(fs.readFileSync(p.request, 'utf8'));
  const source = fs.readFileSync(p.source, 'utf8');
  if (request.sourceHash !== hash(source)) throw new Error('The source changed. Prepare a new review first.');
  if (fs.readFileSync(p.draft, 'utf8') !== source) throw new Error('The review draft has edits; refusing to overwrite it.');
  const response = await fetcher('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, store: false, instructions: 'Translate Korean research posts into natural academic English. Preserve YAML keys, categories, tags, code, formulas, links and image paths. Translate title, subtitle and prose. Output only the complete Markdown file, starting with YAML front matter. Do not wrap it in a code fence or add a review. Never invent claims.', input: source }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok) throw new Error(`Translation API returned HTTP ${response.status}. The existing review draft is unchanged.`);
  const result = await response.json();
  if (result.status !== 'completed') throw new Error('Translation was incomplete. The existing review draft is unchanged.');
  const text = (result.output || []).filter(item => item.type === 'message' && item.role === 'assistant').flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n');
  if (!text.startsWith('---') || !matter(text).data.title || !matter(text).content.trim()) throw new Error('Translation did not return a complete Markdown document.');
  if (hash(fs.readFileSync(p.source, 'utf8')) !== request.sourceHash) throw new Error('The source changed during translation. Prepare again.');
  fs.writeFileSync(p.draft, text.endsWith('\n') ? text : text + '\n');
  return p;
}

function check() {
  const site = readJSON('src/data/site.json'), cv = readJSON('src/data/cv.json');
  if (site.analytics.measurementId && !/^G-[A-Z0-9]+$/.test(site.analytics.measurementId)) throw new Error('Set a valid GA4 G- measurement ID, or leave it empty.');
  for (const [key, resource] of Object.entries(site.resources)) {
    if (!resource) continue;
    if (!resource.startsWith('/resources/') || resource.includes('..')) throw new Error(`Use a /resources/ URL for ${key}.`);
    if (!fs.existsSync(path.join(root, 'public', resource))) throw new Error(`Resource not found: ${resource}`);
  }
  for (const lang of ['ko', 'en']) {
    if (!site.copy[lang]?.footer) throw new Error(`Site copy is incomplete: ${lang}`);
    for (const key of Object.keys(site.copy.ko)) {
      if (!(key in site.copy[lang])) throw new Error(`Missing site copy: ${lang}.${key}`);
    }
  }
  validateCV(cv);
  const ko = getPosts('ko'), en = getPosts('en');
  for (const post of ko) if (['stale', 'pending'].includes(post.status)) console.warn(`${post.slug}: English ${post.status}; not published.`);
  console.log(`Content valid: ${ko.length} Korean posts, ${en.length} English posts, ${cv.sections.length} CV sections.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, slug, ...args] = process.argv.slice(2);
    if (command === 'prepare') console.log('Review files prepared:', prepare(slug).prompt);
    else if (command === 'translate') console.log('English draft generated for human review:', (await translate(slug)).draft);
    else if (command === 'approve') {
      const reviewerIndex = args.indexOf('--reviewer');
      approve(slug, reviewerIndex >= 0 ? args[reviewerIndex + 1] : undefined);
      console.log('Approved translation published to content/en/posts.');
    } else if (command === 'check') check();
    else if (command === 'status') for (const post of getPosts('ko')) console.log(`${post.status.padEnd(9)} ${post.slug}`);
    else throw new Error('Usage: node scripts/content.mjs prepare <slug> | translate <slug> | approve <slug> --reviewer <name> | check | status');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
