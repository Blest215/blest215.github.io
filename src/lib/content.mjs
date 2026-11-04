import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
import { marked } from 'marked';

// Kramdown allowed emphasis before Korean particles (e.g. **term)**이다).
// Keep that archived formatting without rewriting code blocks or source files.
marked.use({ extensions: [{
  name: 'koreanStrong', level: 'inline',
  start: (source) => source.indexOf('**'),
  tokenizer(source) {
    const match = /^\*\*([^\n]+?)\*\*(?=[가-힣])/u.exec(source);
    if (match) return { type: 'koreanStrong', raw: match[0], tokens: this.lexer.inlineTokens(match[1]) };
  },
  renderer(token) { return `<strong>${this.parser.parseInline(token.tokens)}</strong>`; },
}, {
  name: 'resourceImage', level: 'inline',
  start: (source) => source.indexOf('!['),
  tokenizer(source) {
    const match = /^!\[([^\]\n]*)\]\((\/(?:assets|resources)\/[^)\n]+)\)/.exec(source);
    if (match) return {
      type: 'image', raw: match[0], text: match[1],
      tokens: this.lexer.inlineTokens(match[1]),
      href: match[2].replace(/^\/assets\//, '/resources/').replace(/ /g, '%20'),
    };
  },
}] });

// Astro bundles this module before prerendering; the source checkout is the cwd.
export const root = process.cwd();
export const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
// Review approval must survive Windows CRLF ↔ Linux LF checkout conversion.
export const hash = (value) => createHash('sha256').update(String(value).replace(/\r\n?/g, '\n')).digest('hex');
export const prefix = (lang) => lang === 'en' ? '/en' : '';
export const href = (lang, route = '') => `${prefix(lang)}/${route ? route + '/' : ''}`;
// The archived Kramdown posts contain image paths with unescaped spaces.
// Normalize only at render time so original files and review hashes stay intact.
export const markdown = (text) => marked.parse(text);
export const dateLabel = (date, lang) => new Date(`${date}T00:00:00Z`).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

export function translationStatus(source, translation, review) {
  if (!review || !translation) return 'pending';
  if (!['approved', 'legacy'].includes(review.status)) return 'pending';
  if (hash(source) !== review.sourceHash || hash(translation) !== review.translationHash) return 'stale';
  return review.status;
}

export function getPosts(lang) {
  const directory = path.join(root, 'content/ko/posts');
  const reviews = readJSON('content/reviews.json');
  return fs.readdirSync(directory).filter((name) => name.endsWith('.md')).map((filename) => {
    const slug = filename.slice(0, -3);
    const source = fs.readFileSync(path.join(directory, filename), 'utf8');
    const enPath = path.join(root, 'content/en/posts', filename);
    const translation = fs.existsSync(enPath) ? fs.readFileSync(enPath, 'utf8') : null;
    const status = translationStatus(source, translation, reviews[slug]);
    if (lang === 'en' && !['approved', 'legacy'].includes(status)) return null;
    const { data, content } = matter(lang === 'en' ? translation : source);
    if (!data.title || !/^\d{4}-\d{2}-\d{2}-.+/.test(slug)) throw new Error(`Invalid post: ${filename}`);
    return {
      slug, title: data.title, subtitle: data.subtitle || '',
      category: data.categories || '', date: slug.slice(0, 10),
      tags: Array.isArray(data.tags) ? data.tags : (data.tags || '').split(/\s+/).filter(Boolean),
      content, html: markdown(content), status,
      minutes: Math.max(1, Math.ceil(content.replace(/```[\s\S]*?```/g, '').length / (lang === 'ko' ? 600 : 1000))),
      url: href(lang, `posts/${slug}`),
    };
  }).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date));
}
