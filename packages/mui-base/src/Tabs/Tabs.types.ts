import * as React from 'react';
import { BaseUIComponentProps } from '../utils/BaseUI.types';
import { TabActivationDirection } from '../useTabs';

export type TabsOrientation = 'horizontal' | 'vertical';

export type TabsDirection = 'ltr' | 'rtl';

export type TabsRootOwnerState = {
  orientation: TabsOrientation;
  direction: TabsDirection;
  tabActivationDirection: TabActivationDirection;
};

export interface TabsRootProps
  extends Omit<BaseUIComponentProps<'div', TabsRootOwnerState>, 'defaultValue' | 'onChange'> {
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
  onChange?: (event: React.SyntheticEvent | null, value: any | null) => void;
}
