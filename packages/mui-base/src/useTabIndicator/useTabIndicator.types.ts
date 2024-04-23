import * as React from 'react';
import type { TabsDirection, TabsOrientation } from '../Tabs/Tabs.types';

export interface ActiveTabPosition {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export type UseTabIndicatorReturnValue = {
  getRootProps: (
    otherProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
  activeTabPosition: ActiveTabPosition | null;
  direction: TabsDirection;
  orientation: TabsOrientation;
};
