import { expect, it } from 'vitest';
import { resolveComboboxSelectedLabel } from './resolveValueLabel';

it('delegates identity labels to the shared resolver', () => {
  expect(resolveComboboxSelectedLabel('a', [{ value: 'a', label: 'Apple' }])).toBe('Apple');
});

it('prefers a mapped selected value label over the source item label', () => {
  expect(
    resolveComboboxSelectedLabel(
      { id: 1, label: 'Selected' },
      [{ id: 1, label: 'Source' }],
      undefined,
      [{ id: 1 }],
      (itemValue, value) => itemValue.id === value.id,
    ),
  ).toBe('Selected');
});

it('resolves a mapped source label with the configured comparator', () => {
  expect(
    resolveComboboxSelectedLabel(
      'ca',
      [{ code: 'CA', label: 'Canada' }],
      undefined,
      ['CA'],
      (itemValue, value) => itemValue.toLowerCase() === value.toLowerCase(),
    ),
  ).toBe('Canada');
});

it('retains a mapped label after its source item is removed', () => {
  expect(
    resolveComboboxSelectedLabel('CA', [], undefined, [], Object.is, [['CA'], ['Canada']]),
  ).toBe('Canada');
});

it('falls back to the mapped value when no label is known', () => {
  expect(resolveComboboxSelectedLabel('CA', [], undefined, [])).toBe('CA');
});
