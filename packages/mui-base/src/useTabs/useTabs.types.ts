import * as React from 'react';
import { TabsProviderValue } from './TabsProvider';

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
  onChange?: (event: React.SyntheticEvent | null, value: any | null) => void;
}

export interface UseTabsReturnValue {
  /**
   * Returns the values to be passed to the tabs provider.
   */
  contextValue: TabsProviderValue;
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
}
