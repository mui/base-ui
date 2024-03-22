import * as React from 'react';
import { BaseUiComponentCommonProps } from '../utils/BaseUiComponentCommonProps';

type TabsOrientation = 'horizontal' | 'vertical';

type TabsDirection = 'ltr' | 'rtl';

export type TabsOwnerState = {
  orientation: TabsOrientation;
  direction: TabsDirection;
};

export interface TabsProps
  extends Omit<BaseUiComponentCommonProps<'div', TabsOwnerState>, 'defaultValue' | 'onChange'> {
  /**
   * The value of the currently selected `Tab`.
   * If you don't want any selected `Tab`, you can set this prop to `null`.
   */
  value?: string | number | null;
  /**
   * The default value. Use when the component is not controlled.
   */
  defaultValue?: string | number | null;
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
  onChange?: (event: React.SyntheticEvent | null, value: number | string | null) => void;
}
