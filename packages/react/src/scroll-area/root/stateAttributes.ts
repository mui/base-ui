import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { ScrollAreaRootState } from './ScrollAreaRoot';

// The data-attribute strings are inlined here instead of referencing
// `ScrollAreaRootDataAttributes` so that enum stays a docs-only, tree-shakeable
// object; a runtime reference would retain its whole IIFE in every bundle.
// `enumSync.test.tsx` pins these literals to the enum so the two can't drift.
const attr = (name: string) => (value: boolean) => (value ? { [name]: '' } : null);

export const scrollAreaStateAttributesMapping: StateAttributesMapping<ScrollAreaRootState> = {
  hasOverflowX: attr('data-has-overflow-x'),
  hasOverflowY: attr('data-has-overflow-y'),
  overflowXStart: attr('data-overflow-x-start'),
  overflowXEnd: attr('data-overflow-x-end'),
  overflowYStart: attr('data-overflow-y-start'),
  overflowYEnd: attr('data-overflow-y-end'),
  cornerHidden: () => null,
};
