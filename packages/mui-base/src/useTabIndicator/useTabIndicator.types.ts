import * as React from 'react';
import type { TabsDirection, TabsOrientation } from '../Tabs/Tabs.types';

export type TabSelectionMovementDirection = 1 | -1 | 0;

export interface ActiveTabPosition {
  left: number;
  right: number;
  top: number;
  bottom: number;
  movementDirection: TabSelectionMovementDirection;
}

export type UseTabIndicatorReturnValue = {
  getRootProps: (
    otherProps?: React.ComponentPropsWithoutRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
  orientation: TabsOrientation;
  direction: TabsDirection;
  activeTabPosition: ActiveTabPosition | null;
};
