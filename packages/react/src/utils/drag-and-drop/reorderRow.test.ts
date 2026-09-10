import { describe, it, expect } from 'vitest';
import { isReorderRowPayload, reorderRowBrand } from './reorderRow';

describe('isReorderRowPayload', () => {
  it('accepts a branded payload', () => {
    expect(isReorderRowPayload({ ...reorderRowBrand, role: 'item', itemId: 'a' })).toBe(true);
  });

  it('rejects a plain object payload that mimics the shape without the brand', () => {
    expect(isReorderRowPayload({ role: 'item', itemId: 'a' })).toBe(false);
  });

  it('rejects null', () => {
    expect(isReorderRowPayload(null)).toBe(false);
  });

  it('rejects a scalar payload', () => {
    expect(isReorderRowPayload('item-1')).toBe(false);
  });
});
