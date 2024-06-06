import { GenericHTMLProps } from '../../utils/BaseUI.types';

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
}

export interface UseMenuTriggerReturnValue {
  /**
   * If `true`, the component is active (pressed).
   */
  active: boolean;
  /**
   * Resolver for the root slot's props.
   * @param externalProps props for the root slot
   * @returns props that should be spread on the root slot
   */
  getRootProps: <ExternalProps extends Record<string, unknown> = {}>(
    externalProps?: ExternalProps,
  ) => GenericHTMLProps;
  /*
   * If `true`, the menu is open.
   */
  open: boolean;
  /**
   * The ref to the root element.
   */
  rootRef: React.RefCallback<Element> | null;
}
