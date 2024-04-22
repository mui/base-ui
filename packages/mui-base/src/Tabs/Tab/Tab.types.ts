import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/BaseUI.types';
import { TabsOrientation } from '../Tabs.types';

export type TabOwnerState = {
  disabled: boolean;
  selected: boolean;
  orientation: TabsOrientation;
};

export interface TabProps extends Omit<BaseUIComponentProps<'button', TabOwnerState>, 'onChange'> {
  /**
   * You can provide your own value. Otherwise, it falls back to the child position index.
   */
  value?: any;
  /**
   * Callback invoked when new value is being set.
   */
  onChange?: (event: React.SyntheticEvent, value: any) => void;
}
