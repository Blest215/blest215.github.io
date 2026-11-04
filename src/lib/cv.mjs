// Text may be shared (e.g. "KAIST") or translated within the same entry.
export const cvText = (value, lang) => typeof value === 'string' ? value : value?.[lang] || '';
export const cvPeriod = (entry) => entry.from ? `${entry.from} – ${entry.to || ''}`.trim() : '';

export function validateCV(cv) {
  const fail = (location, message) => { throw new Error(`CV ${location}: ${message}`); };
  const text = (value, location) => {
    if (typeof value === 'string' && value.trim()) return;
    if (value && typeof value === 'object' && ['ko', 'en'].every(lang => typeof value[lang] === 'string' && value[lang].trim())) return;
    fail(location, 'use a nonempty string or an object with ko and en text.');
  };
  const month = (value, location) => {
    if (typeof value !== 'string' || !/^\d{4}\.(0[1-9]|1[0-2])$/.test(value)) fail(location, 'use YYYY.MM.');
  };
  const year = (value, location) => {
    if (!Number.isInteger(value) || value < 1000 || value > 9999) fail(location, 'use a four-digit year as a number.');
  };
  if (!Array.isArray(cv.sections) || !cv.sections.length) fail('sections', 'at least one section is required.');
  if (cv.lastReviewed != null && (typeof cv.lastReviewed !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(cv.lastReviewed))) fail('lastReviewed', 'use YYYY-MM-DD or null.');
  const ids = new Set();
  for (const section of cv.sections) {
    const location = `sections.${section.id || '?'}`;
    if (typeof section.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(section.id) || ids.has(section.id)) fail(location, 'use a unique lowercase id.');
    ids.add(section.id);
    text(section.title, `${location}.title`);
    if (!['education', 'publications', 'experience', 'skills', 'awards', 'patents', 'service'].includes(section.type)) fail(location, 'unsupported section type.');
    if ('body' in section) fail(location, 'replace body with an items array.');
    if (!Array.isArray(section.items)) fail(`${location}.items`, 'use an array of entry objects.');
    const groups = new Set();
    if (section.type === 'publications') {
      if (!Array.isArray(section.groups) || !section.groups.length) fail(`${location}.groups`, 'define publication groups.');
      for (const group of section.groups) {
        if (typeof group.id !== 'string' || !group.id.trim() || groups.has(group.id)) fail(`${location}.groups`, 'use unique group ids.');
        groups.add(group.id);
        text(group.title, `${location}.groups.${group.id}.title`);
      }
    }
    section.items.forEach((item, index) => {
      const at = `${location}.items[${index}]`;
      if (!item || typeof item !== 'object' || Array.isArray(item)) fail(at, 'use an entry object.');
      if (section.type === 'education' || section.type === 'experience') {
        for (const key of section.type === 'education' ? ['school'] : ['organization', 'role']) text(item[key], `${at}.${key}`);
        for (const key of ['department', 'degree', 'lab', 'course', 'project']) if (key in item) text(item[key], `${at}.${key}`);
        month(item.from, `${at}.from`);
        if (item.to != null) {
          month(item.to, `${at}.to`);
          if (item.to < item.from) fail(`${at}.to`, 'end date must not precede start date.');
        }
      } else if (section.type === 'publications') {
        year(item.year, `${at}.year`);
        for (const key of ['title', 'authorRole', 'venue']) text(item[key], `${at}.${key}`);
        if (!groups.has(item.group)) fail(`${at}.group`, 'choose an id from this section’s groups.');
        for (const key of ['publicationType', 'award']) if (key in item) text(item[key], `${at}.${key}`);
        if ('impactFactor' in item) {
          year(item.impactFactor?.year, `${at}.impactFactor.year`);
          if (typeof item.impactFactor?.value !== 'number' || !Number.isFinite(item.impactFactor.value) || item.impactFactor.value < 0) fail(`${at}.impactFactor.value`, 'use a nonnegative number.');
        }
      } else if (section.type === 'skills') {
        text(item.category, `${at}.category`);
        if (!Array.isArray(item.values) || !item.values.length) fail(`${at}.values`, 'use a nonempty array.');
        item.values.forEach((value, i) => text(value, `${at}.values[${i}]`));
      } else if (section.type === 'awards') {
        year(item.year, `${at}.year`);
        text(item.event, `${at}.event`);
        text(item.distinction, `${at}.distinction`);
        if ('toYear' in item) {
          year(item.toYear, `${at}.toYear`);
          if (item.toYear < item.year) fail(`${at}.toYear`, 'end year must not precede start year.');
        }
      } else if (section.type === 'patents') {
        year(item.year, `${at}.year`);
        for (const key of ['inventorRole', 'status', 'title', 'jurisdiction']) text(item[key], `${at}.${key}`);
      } else if (section.type === 'service') {
        year(item.year, `${at}.year`);
        for (const key of ['organization', 'event', 'role']) text(item[key], `${at}.${key}`);
      }
      if ('featured' in item && typeof item.featured !== 'boolean') fail(`${at}.featured`, 'use true or false.');
      if ('url' in item && (typeof item.url !== 'string' || !/^https?:\/\//.test(item.url))) fail(`${at}.url`, 'use an http(s) URL.');
      if ('details' in item) {
        if (!Array.isArray(item.details)) fail(`${at}.details`, 'use an array of text values.');
        item.details.forEach((detail, i) => text(detail, `${at}.details[${i}]`));
      }
    });
  }
  return cv;
}
