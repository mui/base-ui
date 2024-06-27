import type { SelectAction } from '../useSelect';
import { CompoundParentContextValue } from '../../useCompound';
import { GenericHTMLProps } from '../../utils/types';
import { ListItemMetadata } from '../../useList';

export interface SelectOption<Value> extends ListItemMetadata {
  value: Value;
}

export interface UseOptionParameters<Value> {
  disabled: boolean;
  id?: string;
  label: string | React.ReactNode;
  rootRef?: React.Ref<Element>;
  value: Value;
  highlighted: boolean;
  selected: boolean;
  dispatch: React.Dispatch<SelectAction<Value>>;
  compoundParentContext: CompoundParentContextValue<Value, SelectOption<Value>>;
  keyExtractor: (value: Value) => any;
}

export interface UseOptionReturnValue {
  /**
   * Resolver for the root slot's props.
   * @param externalProps props for the root slot
   * @returns props that should be spread on the root slot
   */
  getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * Ref to the root slot DOM node.
   */
  rootRef: React.RefCallback<Element> | null;
}
