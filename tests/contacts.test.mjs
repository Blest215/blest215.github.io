import test from 'node:test';
import assert from 'node:assert/strict';
import { cvContacts } from '../src/lib/contacts.mjs';

test('CV contacts tolerate missing and blank optional profile links', () => {
  const contacts = cvContacts({
    email: ' name@example.com ',
    github: 'https://github.com/example/',
    linkedin: null,
    scholar: ' ',
  });
  assert.deepEqual(contacts, [
    { key: 'email', href: 'mailto:name@example.com', value: 'name@example.com' },
    { key: 'github', href: 'https://github.com/example/', value: 'github.com/example' },
  ]);
  assert.deepEqual(cvContacts({}), []);
});
