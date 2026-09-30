import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeLine, parseValue, groupEffect } from '../src/js/lib/values.js';

const a = (label, old, neu, extra = {}) => analyzeLine({ label, old, new: neu, ...extra });

test('parse các dạng giá trị', () => {
  assert.deepEqual(parseValue('3.200').nums, [3200]);
  assert.deepEqual(parseValue('5,5').nums, [5.5]);
  assert.deepEqual(parseValue('50/75/100/125%').nums, [50, 75, 100, 125]);
  assert.deepEqual(parseValue('3,5%–10,5%').nums, [3.5, 10.5]);
  assert.equal(parseValue('22/20/18/16 giây').unit, 'giây');
  assert.equal(parseValue('Tốc đánh cộng thêm kém hiệu quả hơn').kind, 'text');
});

test('1 giá trị', () => {
  const r = a('Máu mỗi cấp', '128', '136');
  assert.equal(r.effect, 'buff');
  assert.equal(r.delta, '+8');
  assert.equal(a('Giáp', '45', '40').delta, '−5');
  assert.equal(a('Tỷ lệ AD', '110%', '125%').delta, '+15%');
});

test('chỉ số ngược: giảm là buff', () => {
  assert.equal(a('Hồi chiêu', '22/20/18/16 giây', '20/18/16/14 giây').effect, 'buff');
  assert.equal(a('Hồi chiêu', '22/20/18/16 giây', '20/18/16/14 giây').delta, '−2 giây mọi cấp');
  assert.equal(a('Hồi chiêu', '75/70/65 giây', '85/80/75 giây').effect, 'nerf');
  assert.equal(a('Giá', '3.200', '3.300').effect, 'nerf');
  assert.equal(a('Giáp mỗi cấp', '5', '5,5').effect, 'buff'); // "giáp" không phải "giá"
  assert.equal(a('Năng Lượng Tiêu Hao', '80', '70').effect, 'buff');
  assert.equal(a('Ngưỡng nâng cấp', '40/60/80/100/120', '50/75/100/125/150').effect, 'nerf');
});

test('theo cấp, lẫn lộn', () => {
  const r = a('Tốc độ đánh', '50/75/100/125%', '60/80/100/120%');
  assert.equal(r.effect, 'mixed');
  assert.deepEqual(r.cellEffects, ['buff', 'buff', 'neutral', 'nerf']);
  assert.equal(r.delta, '');
  assert.equal(a('Tốc độ đánh', '20/25/30/35%', '25/30/35/40%').delta, '+5% mọi cấp');
});

test('1 số áp cho mọi cấp', () => {
  const r = a('Làm chậm', '20/25/30/35%', '25%');
  assert.deepEqual(r.cellEffects, ['buff', 'neutral', 'nerf', 'nerf']);
  assert.equal(r.effect, 'mixed');
});

test('khoảng tối thiểu–tối đa', () => {
  const r = a('Tỷ lệ AD tối thiểu', '3,5%–10,5%', '5,8%–17%');
  assert.equal(r.effect, 'buff');
  assert.equal(r.delta, '×1,6');
  assert.equal(a('Hệ số theo cấp', '60%–100%', '60%–90%').effect, 'nerf');
  assert.equal(a('Sát thương theo cấp', '33–333', '40–285').effect, 'mixed');
});

test('effect ghi tay được ưu tiên, gom nhóm', () => {
  assert.equal(a('Máu tối đa', '5.500', '4.000', { effect: 'neutral' }).effect, 'neutral');
  assert.equal(groupEffect([{ label: 'Tốc độ đánh', old: '25%', new: '35%' }, { label: 'Hồi chiêu', old: '20 giây', new: '25 giây' }]), 'mixed');
});
