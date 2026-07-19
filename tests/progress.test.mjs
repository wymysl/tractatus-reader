import test from 'node:test';
import assert from 'node:assert/strict';
import { todayISO, daysBetween, currentDay } from '../site/progress.js';

test('daysBetween counts calendar days', () => {
  assert.equal(daysBetween('2026-07-19', '2026-07-19'), 0);
  assert.equal(daysBetween('2026-07-19', '2026-07-22'), 3);
  assert.equal(daysBetween('2026-01-31', '2026-02-01'), 1);
});

test('currentDay: day 1 on first day, advances daily, capped at frontier', () => {
  assert.equal(currentDay('2026-07-19', '2026-07-19', 30), 1);
  assert.equal(currentDay('2026-07-19', '2026-07-21', 30), 3);
  assert.equal(currentDay('2026-07-19', '2026-12-01', 30), 30);
});

test('currentDay: clock rolled back clamps to 1', () => {
  assert.equal(currentDay('2026-07-19', '2026-07-01', 30), 1);
});

test('todayISO formats a local date', () => {
  assert.equal(todayISO(new Date(2026, 6, 19, 23, 59)), '2026-07-19');
  assert.equal(todayISO(new Date(2026, 0, 2, 0, 0)), '2026-01-02');
});
