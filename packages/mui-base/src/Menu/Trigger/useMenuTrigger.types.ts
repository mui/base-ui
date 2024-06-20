import { GenericHTMLProps } from '../../utils/types';
import { MenuReducerAction, MenuReducerState } from '../Root/useMenuRoot.types';

export interface UseMenuTriggerParameters {
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * If `true`, allows a disabled button to receive focus.
   * @default false
   */
  focusableWhenDisabled?: boolean;
  /**
   * The ref to the root element.
   */
  rootRef?: React.Ref<HTMLElement>;

  menuState: MenuReducerState;
  dispatch: React.Dispatch<MenuReducerAction>;
}

export interface UseMenuTriggerReturnValue {
  /**
   * Resolver for the root slot's props.
   * @param externalProps props for the root slot
   * @returns props that should be spread on the root slot
   */
  getRootProps: <ExternalProps extends Record<string, unknown> = {}>(
    externalProps?: ExternalProps,
  ) => GenericHTMLProps;
  /**
   * The ref to the root element.
   */
  rootRef: React.RefCallback<Element> | null;
}
