import type { BaseUIComponentProps } from '../../utils/types';
import type { TabsDirection, TabsOrientation, TabsRootOwnerState } from '../Root/TabsRoot.types';

export type TabIndicatorOwnerState = TabsRootOwnerState & {
  selectedTabPosition: ActiveTabPosition | null;
  orientation: TabsOrientation;
  direction: TabsDirection;
};

export interface TabIndicatorProps extends BaseUIComponentProps<'span', TabIndicatorOwnerState> {
  /**
   * If `true`, the indicator will include code to render itself before React hydrates.
   * This will minimize the time the indicator is not visible after the SSR-generated content is downloaded.
   *
   * @default false
   */
  renderBeforeHydration?: boolean;
}

export interface ActiveTabPosition {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface UseTabIndicatorParameters {
  tabsListRef: React.RefObject<HTMLElement>;
  getTabElement: (value: any) => HTMLElement | null;
  selectedValue: any;
}

export type UseTabIndicatorReturnValue = {
  getRootProps: (
    otherProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
  activeTabPosition: ActiveTabPosition | null;
};
