import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepare, approve, translate, postPaths } from '../scripts/content.mjs';
import { hash, translationStatus, markdown } from '../src/lib/content.mjs';

const slug = '2026-11-04-research-note';
const source = '---\ntitle: 연구 노트\ncategories: Research\n---\n한국어 원문입니다.\n\n```python\nprint("hello")\n```\n';
const english = '---\ntitle: Research note\ncategories: Research\n---\nThis is the English translation.\n\n```python\nprint("hello")\n```\n';
function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'blest-editorial-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const paths = postPaths(slug, base);
  fs.mkdirSync(path.dirname(paths.source), { recursive: true });
  fs.writeFileSync(paths.source, source);
  return { base, paths };
}

test('pending drafts cannot publish; only reviewed content has a valid published hash', t => {
  const { base, paths } = fixture(t);
  prepare(slug, base);
  assert.equal(translationStatus(source, null, null), 'pending');
  assert.throws(() => approve(slug, 'Author', base), /original Korean/);
  fs.writeFileSync(paths.draft, english);
  assert.throws(() => approve(slug, '', base), /human reviewer/);
  const review = approve(slug, 'Author', base);
  assert.equal(fs.readFileSync(paths.translation, 'utf8'), english);
  assert.equal(translationStatus(source, english, review), 'approved');
  assert.equal(translationStatus(source + '\nEdited.', english, review), 'stale');
  assert.equal(translationStatus(source, english + '\nEdited.', review), 'stale');
});

test('source edits and changed code block prevent approval', t => {
  const { base, paths } = fixture(t);
  prepare(slug, base);
  fs.writeFileSync(paths.draft, english.replace('print("hello")', 'print("changed")'));
  assert.throws(() => approve(slug, 'Author', base), /code blocks changed/);
  fs.writeFileSync(paths.draft, english);
  fs.writeFileSync(paths.source, source + '\nUpdated Korean source.');
  assert.throws(() => approve(slug, 'Author', base), /Korean source changed/);
});

test('preparation refuses to overwrite drafts and rejects path traversal', t => {
  const { base } = fixture(t);
  prepare(slug, base);
  assert.throws(() => prepare(slug, base), /already exists/);
  assert.throws(() => postPaths('../../escape', base), /filename/);
});

test('archived translations are distinct from human approvals and expire on source changes', () => {
  const review = { status: 'legacy', sourceHash: hash(source), translationHash: hash(english) };
  assert.equal(translationStatus(source, english, review), 'legacy');
  assert.equal(translationStatus(source + 'edit', english, review), 'stale');
  assert.equal(translationStatus(source, english, { ...review, status: 'pending' }), 'pending');
});

test('review hashes survive Windows to GitHub Linux newline conversion', () => {
  assert.equal(hash(source), hash(source.replace(/\n/g, '\r\n')));
});

test('API translation creates only a draft, and never publishes or approves', async t => {
  const { base, paths } = fixture(t);
  let request;
  await translate(slug, { base, apiKey: 'test-key', model: 'test-model', fetcher: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: english }] }] }) };
  } });
  assert.equal(request.store, false);
  assert.equal(request.input, source);
  assert.equal(fs.readFileSync(paths.draft, 'utf8'), english);
  assert.equal(fs.existsSync(paths.translation), false);
  assert.equal(fs.existsSync(paths.reviews), false);
});

test('API failures leave a prepared draft intact', async t => {
  const { base, paths } = fixture(t);
  await assert.rejects(translate(slug, { base, apiKey: 'test', model: 'test', fetcher: async () => ({ ok: false, status: 429 }) }), /HTTP 429/);
  assert.equal(fs.readFileSync(paths.draft, 'utf8'), source);
  assert.equal(fs.existsSync(paths.translation), false);
});

test('archived images with spaces render as images without changing source files', () => {
  const source = '![Discovery plan](/assets/images/ICWE 2017/Requirement Processing.png)';
  assert.match(markdown(source), /<img src="\/resources\/images\/ICWE%202017\/Requirement%20Processing.png"/);
  assert.match(markdown('```markdown\n' + source + '\n```'), /\/assets\/images\/ICWE 2017\/Requirement Processing.png/);
  assert.match(markdown('![Experiment](/resources/images/my-post/experiment.jpg)'), /<img src="\/resources\/images\/my-post\/experiment.jpg"/);
});

test('Kramdown emphasis next to Korean particles renders without modifying fenced code', () => {
  assert.match(markdown('**서비스(service)**이다.'), /<strong>서비스\(service\)<\/strong>이다/);
  assert.match(markdown('```text\n**서비스(service)**이다.\n```'), /<code[^>]*>\*\*서비스\(service\)\*\*이다/);
});
