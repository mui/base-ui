import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { ScrollAreaRootState } from './ScrollAreaRoot';
import * as ScrollAreaRootDataAttributes from './ScrollAreaRootDataAttributes';

const attr = (name: string) => (value: boolean) => (value ? { [name]: '' } : null);

export const scrollAreaStateAttributesMapping: StateAttributesMapping<ScrollAreaRootState> = {
  hasOverflowX: attr(ScrollAreaRootDataAttributes.hasOverflowX),
  hasOverflowY: attr(ScrollAreaRootDataAttributes.hasOverflowY),
  overflowXStart: attr(ScrollAreaRootDataAttributes.overflowXStart),
  overflowXEnd: attr(ScrollAreaRootDataAttributes.overflowXEnd),
  overflowYStart: attr(ScrollAreaRootDataAttributes.overflowYStart),
  overflowYEnd: attr(ScrollAreaRootDataAttributes.overflowYEnd),
  cornerHidden: () => null,
};
