import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDepths } from '../site/tree-depth.js';

test('chapter numbers are depth 0', () => {
  const d = computeDepths(['1', '2', '3']);
  assert.equal(d.get('1'), 0);
  assert.equal(d.get('2'), 0);
});

test('plain nesting matches digit count', () => {
  const d = computeDepths(['1', '1.1', '1.11', '1.12', '1.13', '1.2']);
  assert.equal(d.get('1.1'), 1);
  assert.equal(d.get('1.11'), 2);
  assert.equal(d.get('1.2'), 1);
});

test('zero-padded first batch is level with the unpadded batch', () => {
  const d = computeDepths(['2', '2.01', '2.02', '2.06', '2.1', '2.2']);
  assert.equal(d.get('2.01'), 1);
  assert.equal(d.get('2.06'), 1);
  assert.equal(d.get('2.1'), 1);
  assert.equal(d.get('2.2'), 1);
});

test('children of a zero-padded number nest one level under it', () => {
  const d = computeDepths(['2', '2.06', '2.061', '2.062']);
  assert.equal(d.get('2.06'), 1);
  assert.equal(d.get('2.061'), 2);
  assert.equal(d.get('2.062'), 2);
});

test('a number whose padded intermediate is missing falls back to the nearest real ancestor', () => {
  // 2.0201 has no real "2.020" parent in the book; its nearest existing
  // ancestor is 2.02, so it lands one level under that, not three.
  const d = computeDepths(['2', '2.02', '2.0201']);
  assert.equal(d.get('2.02'), 1);
  assert.equal(d.get('2.0201'), 2);
});

test('double-zero padding (3.001, 4.001-4.003) resolves to a direct child of the chapter', () => {
  const d = computeDepths(['3', '3.001', '3.01', '4', '4.001', '4.002', '4.003', '4.0031']);
  assert.equal(d.get('3.001'), 1);
  assert.equal(d.get('3.01'), 1);
  assert.equal(d.get('4.003'), 1);
  assert.equal(d.get('4.0031'), 2);
});

test('the same padding trick one level down (2.2 / 2.201-2.203) still resolves correctly', () => {
  const d = computeDepths(['2', '2.2', '2.201', '2.202', '2.21']);
  assert.equal(d.get('2.2'), 1);
  assert.equal(d.get('2.201'), 2);
  assert.equal(d.get('2.21'), 2);
});
