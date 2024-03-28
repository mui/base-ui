import * as React from 'react';
import { BaseUiComponentCommonProps } from '../../utils/BaseUiComponentCommonProps';

export type TabOwnerState = {
  active: boolean;
  disabled: boolean;
  highlighted: boolean;
  selected: boolean;
};

export interface TabProps
  extends Omit<BaseUiComponentCommonProps<'button', TabOwnerState>, 'onChange'> {
  /**
   * You can provide your own value. Otherwise, it falls back to the child position index.
   */
  value?: number | string;
  /**
   * Callback invoked when new value is being set.
   */
  onChange?: (event: React.SyntheticEvent, value: number | string) => void;
}
