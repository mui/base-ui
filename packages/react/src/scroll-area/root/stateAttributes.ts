import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { ScrollAreaRootState } from './ScrollAreaRoot';

// Data-attribute strings inlined so `ScrollAreaRootDataAttributes` tree-shakes out.
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
