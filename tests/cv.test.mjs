import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateCV, cvText, cvPeriod } from '../src/lib/cv.mjs';

const currentCV = JSON.parse(fs.readFileSync(new URL('../src/data/cv.json', import.meta.url), 'utf8'));
const cv = { sections: [
  { id: 'education', type: 'education', title: 'Education', items: [
    { school: { ko: '대전과학고등학교', en: 'Daejeon Science High School' }, from: '2010.02', to: '2012.02' },
  ] },
  { id: 'publications', type: 'publications', title: 'Publications', groups: [{ id: 'journals', title: 'Journals' }], items: [
    { group: 'journals', year: 2025, title: 'Example paper', authorRole: '1st author', venue: 'Example journal' },
  ] },
] };
const clone = () => structuredClone(cv);

test('structured CV supports shared and bilingual fields', () => {
  validateCV(cv);

  const school = cv.sections[0].items[0];
  assert.equal(cvText(school.school, 'ko'), '대전과학고등학교');
  assert.equal(cvText(school.school, 'en'), 'Daejeon Science High School');
  assert.equal(cvPeriod(school), '2010.02 – 2012.02');
  assert.equal(cvPeriod({ from: '2020.03', to: null }), '2020.03 –');
  assert.equal(cvText('KAIST', 'en'), 'KAIST');
});

test('missing translations and invalid date ranges identify the edited entry', () => {
  const data = clone();
  delete data.sections[0].items[0].school.en;
  assert.throws(() => validateCV(data), /education.items\[0\].school/);
  data.sections[0].items[0].school = 'School';
  data.sections[0].items[0].from = '2010.13';
  assert.throws(() => validateCV(data), /education.items\[0\].from/);
  data.sections[0].items[0].from = '2013.01';
  assert.throws(() => validateCV(data), /end date must not precede/);
});

test('unknown publication groups and duplicate section ids fail validation', () => {
  const data = clone();
  data.sections[1].items[0].group = 'unknown';
  assert.throws(() => validateCV(data), /publications.items\[0\].group/);
  data.sections[1].items[0].group = 'journals';
  data.sections[1].id = 'education';
  assert.throws(() => validateCV(data), /unique lowercase id/);
});

test('current CV data validates without relying on a fixed entry order or count', () => {
  validateCV(currentCV);
});

test('patent metadata, year ranges and journal impact factors are validated', () => {
  const data = clone();
  data.sections.push({ id: 'patents', type: 'patents', title: 'Patents', items: [
    { year: 2025, title: 'Example patent', inventorRole: '2nd inventor', status: { ko: '출원', en: 'Application' }, jurisdiction: 'PCT' },
  ] });
  validateCV(data);
  delete data.sections[2].items[0].status.en;
  assert.throws(() => validateCV(data), /patents.items\[0\].status/);
  data.sections.pop();
  data.sections[1].items[0].impactFactor = { year: 2024, value: -1 };
  assert.throws(() => validateCV(data), /impactFactor.value/);
  data.sections.pop();
  data.sections.push({ id: 'awards', type: 'awards', title: 'Awards', items: [
    { year: 2007, toYear: 2006, event: 'Example institute', distinction: 'Education' },
  ] });
  assert.throws(() => validateCV(data), /end year must not precede/);
});
