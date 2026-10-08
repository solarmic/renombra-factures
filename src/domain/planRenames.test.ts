import { describe, expect, it } from 'vitest';
import { planRenames, type PlanItem } from './planRenames';

const item = (name: string, date: PlanItem['date'], included = true): PlanItem => ({ name, date, included });
const opts = { template: '1/{yy}V/{n:2} {name}', start: 7, replacement: '-' };

describe('planRenames', () => {
  it('acceptance: reproduces the author format', () => {
    const plan = planRenames([item('Gener 05012026 Orange.pdf', { y: 2026, m: 1, d: 5 })], opts);
    expect(plan.planned[0]?.newName).toBe('1-26V-07 Gener 05012026 Orange.pdf');
  });

  it('numbers by ascending date regardless of input order', () => {
    const plan = planRenames(
      [item('b.pdf', { y: 2026, m: 3, d: 1 }), item('a.pdf', { y: 2026, m: 1, d: 1 }), item('c.pdf', { y: 2025, m: 12, d: 31 })],
      { template: '{n} {name}', start: 1, replacement: '-' },
    );
    expect(plan.planned.map((p) => p.newName)).toEqual(['1 c.pdf', '2 a.pdf', '3 b.pdf']);
  });

  it('breaks date ties by original name, case-insensitively', () => {
    const d = { y: 2026, m: 1, d: 1 };
    const plan = planRenames([item('beta.pdf', d), item('Alpha.pdf', d), item('alpine.pdf', d)], {
      template: '{n} {name}',
      start: 1,
      replacement: '-',
    });
    expect(plan.planned.map((p) => p.item.name)).toEqual(['Alpha.pdf', 'alpine.pdf', 'beta.pdf']);
  });

  it('orders numeric parts naturally', () => {
    const d = { y: 2026, m: 1, d: 1 };
    const plan = planRenames([item('f10.pdf', d), item('f2.pdf', d)], { template: '{n}', start: 1, replacement: '-' });
    expect(plan.planned.map((p) => p.item.name)).toEqual(['f2.pdf', 'f10.pdf']);
  });

  it('preserves the original extension case', () => {
    const plan = planRenames([item('Scan.JPG', { y: 2026, m: 1, d: 1 })], { template: '{n} {name}', start: 1, replacement: '-' });
    expect(plan.planned[0]?.newName).toBe('1 Scan.JPG');
  });

  it('handles names without extension', () => {
    const plan = planRenames([item('README', { y: 2026, m: 1, d: 1 })], { template: '{n} {name}', start: 1, replacement: '-' });
    expect(plan.planned[0]?.newName).toBe('1 README');
  });

  it('skips and reports excluded items and items without date', () => {
    const plan = planRenames(
      [item('a.pdf', { y: 2026, m: 1, d: 1 }), item('b.pdf', null), item('c.pdf', { y: 2026, m: 1, d: 2 }, false)],
      { template: '{n}', start: 1, replacement: '-' },
    );
    expect(plan.planned).toHaveLength(1);
    expect(plan.skipped.map((s) => [s.item.name, s.reason])).toEqual([
      ['b.pdf', 'no-date'],
      ['c.pdf', 'excluded'],
    ]);
    expect(plan.missingDate).toBe(1);
  });

  it('guarantees unique output names', () => {
    const d = { y: 2026, m: 1, d: 1 };
    const plan = planRenames([item('a.pdf', d), item('b.pdf', d), item('c.pdf', d)], {
      template: 'same',
      start: 1,
      replacement: '-',
    });
    expect(plan.planned.map((p) => p.newName)).toEqual(['same.pdf', 'same (2).pdf', 'same (3).pdf']);
  });

  it('treats collisions case-insensitively', () => {
    const d = { y: 2026, m: 1, d: 1 };
    const plan = planRenames([item('a.pdf', d), item('b.PDF', d)], { template: 'x', start: 1, replacement: '-' });
    expect(plan.planned.map((p) => p.newName)).toEqual(['x.pdf', 'x (2).PDF']);
  });

  it('records the assigned sequence number', () => {
    const plan = planRenames([item('a.pdf', { y: 2026, m: 1, d: 1 })], opts);
    expect(plan.planned[0]?.n).toBe(7);
  });
});
