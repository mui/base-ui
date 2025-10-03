import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { ScrollAreaRoot } from './ScrollAreaRoot';
import { ScrollAreaRootDataAttributes } from './ScrollAreaRootDataAttributes';

export const scrollAreaStateAttributesMapping: StateAttributesMapping<ScrollAreaRoot.State> = {
  hasOverflowX: (value) => (value ? { [ScrollAreaRootDataAttributes.hasOverflowX]: '' } : null),
  hasOverflowY: (value) => (value ? { [ScrollAreaRootDataAttributes.hasOverflowY]: '' } : null),
  overflowXStart: (value) => (value ? { [ScrollAreaRootDataAttributes.overflowXStart]: '' } : null),
  overflowXEnd: (value) => (value ? { [ScrollAreaRootDataAttributes.overflowXEnd]: '' } : null),
  overflowYStart: (value) => (value ? { [ScrollAreaRootDataAttributes.overflowYStart]: '' } : null),
  overflowYEnd: (value) => (value ? { [ScrollAreaRootDataAttributes.overflowYEnd]: '' } : null),
  cornerHidden: () => null,
};
