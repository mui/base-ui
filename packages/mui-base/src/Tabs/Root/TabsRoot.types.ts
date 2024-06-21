import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { TabsContextValue } from './TabsContext';

export type TabsRootOwnerState = {
  orientation: TabsOrientation;
  direction: TabsDirection;
  tabActivationDirection: TabActivationDirection;
};

export interface TabsRootProps extends BaseUIComponentProps<'div', TabsRootOwnerState> {
  /**
   * The value of the currently selected `Tab`.
   * If you don't want any selected `Tab`, you can set this prop to `null`.
   */
  value?: any | null;
  /**
   * The default value. Use when the component is not controlled.
   */
  defaultValue?: any | null;
  /**
   * The component orientation (layout flow direction).
   * @default 'horizontal'
   */
  orientation?: TabsOrientation;
  /**
   * The direction of the text.
   * @default 'ltr'
   */
  direction?: TabsDirection;
  /**
   * Callback invoked when new value is being set.
   */
  onValueChange?: (value: any | null, event: React.SyntheticEvent | null) => void;
}

export type TabActivationDirection = 'left' | 'right' | 'up' | 'down' | 'none';

export type TabsOrientation = 'horizontal' | 'vertical';

export type TabsDirection = 'ltr' | 'rtl';

export interface UseTabsParameters {
  /**
   * The value of the currently selected `Tab`.
   * If you don't want any selected `Tab`, you can set this prop to `false`.
   */
  value?: any | null;
  /**
   * The default value. Use when the component is not controlled.
   */
  defaultValue?: any | null;
  /**
   * The component orientation (layout flow direction).
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * The direction of the text.
   * @default 'ltr'
   */
  direction?: 'ltr' | 'rtl';
  /**
   * Callback invoked when new value is being set.
   */
  onValueChange?: (value: any | null, event: React.SyntheticEvent | null) => void;
}

export interface UseTabsReturnValue {
  /**
   * Returns the values to be passed to the tabs provider.
   */
  contextValue: TabsContextValue;
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
  tabActivationDirection: TabActivationDirection;
}
