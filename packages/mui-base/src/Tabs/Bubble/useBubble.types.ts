import type { TabsDirection, TabsOrientation } from '../Tabs.types';

export type TabSelectionMovementDirection = 1 | -1 | 0;

export interface SelectedTabPosition {
  left: number;
  right: number;
  top: number;
  bottom: number;
  movementDirection: TabSelectionMovementDirection;
}

export type UseBubbleRootElementProps<OtherProps = {}> = {
  style: React.CSSProperties | undefined;
  role: React.AriaRole;
} & OtherProps;

export type UseBubbleReturnValue = {
  getRootProps: (otherProps?: React.HTMLAttributes<HTMLSpanElement>) => UseBubbleRootElementProps;
  orientation: TabsOrientation;
  direction: TabsDirection;
  selectedTabPosition: SelectedTabPosition | null;
};
