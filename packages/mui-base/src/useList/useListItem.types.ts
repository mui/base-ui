import { GenericHTMLProps } from '../utils/types';
import { ListAction } from './listActions.types';

export interface UseListItemParameters<ItemValue> {
  dispatch: (action: ListAction<ItemValue>) => void;
  focusable: boolean;
  highlighted: boolean;
  selected: boolean;
  /**
   * If `true`, the list item will dispatch the `itemHover` action on pointer over.
   * Since the use cases for it are rare, it's disabled by default.
   * It could be used to mimic the native `select` behavior, which highlights the hovered item.
   *
   * @default false
   */
  handlePointerOverEvents?: boolean;
  /**
   * The list item.
   */
  item: ItemValue;
}

export interface UseListItemReturnValue {
  /**
   * Resolver for the root slot's props.
   * @param externalProps additional props to be forwarded to the root slot
   * @returns props that should be spread on the root slot
   */
  getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * If `true`, the current item is highlighted.
   */
  highlighted: boolean;
  /**
   * If `true`, the current item is selected.
   */
  selected: boolean;
}
