import type { TabsDirection, TabsOrientation } from '../Tabs/Tabs.types';

export type TabSelectionMovementDirection = 1 | -1 | 0;

export interface SelectedTabPosition {
  left: number;
  right: number;
  top: number;
  bottom: number;
  movementDirection: TabSelectionMovementDirection;
}

export type UseTabBubbleRootElementProps<OtherProps = {}> = {
  style: React.CSSProperties | undefined;
  role: React.AriaRole;
} & OtherProps;

export type UseTabBubbleReturnValue = {
  getRootProps: (
    otherProps?: React.HTMLAttributes<HTMLSpanElement>,
  ) => UseTabBubbleRootElementProps;
  orientation: TabsOrientation;
  direction: TabsDirection;
  selectedTabPosition: SelectedTabPosition | null;
};
