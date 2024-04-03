import * as React from 'react';
import type { TabsDirection, TabsOrientation } from '../Tabs';

export interface UseTabPanelParameters {
  /**
   * The id of the TabPanel.
   */
  id?: string;
  /**
   * The ref of the TabPanel.
   */
  rootRef?: React.Ref<HTMLElement>;
  /**
   * The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.
   */
  value?: number | string;
}

export interface UseTabPanelReturnValue {
  /**
   * If `true`, it indicates that the tab panel will be hidden.
   */
  hidden: boolean;
  /**
   * Resolver for the root slot's props.
   * @param externalProps additional props for the root slot
   * @returns props that should be spread on the root slot
   */
  getRootProps: (
    externalProps?: React.ComponentPropsWithoutRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
  rootRef: React.RefCallback<HTMLElement> | null;
  orientation: TabsOrientation;
  direction: TabsDirection;
}
