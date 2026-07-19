import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDay, firstLine, shouldSend } from '../src/helpers.mjs';

test('shouldSend: skip only when the same day was already sent', () => {
  assert.equal(shouldSend({ startDate: '2026-07-19' }, 1), true);            // never sent
  assert.equal(shouldSend({ startDate: '2026-07-19', lastSentDay: 1 }, 1), false); // frontier stalled
  assert.equal(shouldSend({ startDate: '2026-07-19', lastSentDay: 1 }, 2), true);  // new day
});

test('computeDay mirrors site progression', () => {
  assert.equal(computeDay('2026-07-19', '2026-07-19', 30), 1);
  assert.equal(computeDay('2026-07-19', '2026-07-21', 30), 3);
  assert.equal(computeDay('2026-07-19', '2027-07-19', 30), 30);
  assert.equal(computeDay('2026-07-19', '2026-07-01', 30), 1);
});

test('firstLine strips tags and truncates', () => {
  assert.equal(firstLine('<p>The world is everything that is the case.</p>'), 'The world is everything that is the case.');
  assert.equal(firstLine('<p>a</p><p class="footnote">b</p>'), 'a');
  assert.ok(firstLine(`<p>${'x'.repeat(300)}</p>`).length <= 140);
});
