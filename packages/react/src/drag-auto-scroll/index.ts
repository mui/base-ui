export * as DragAutoScroll from './index.parts';

export type * from './root/DragAutoScrollRoot';

// The types a `DragAutoScroll.*` consumer needs to type extracted callbacks and
// props, re-exported so this entry point is self-sufficient (they also remain
// available from `@base-ui/react/types`; both resolve to the same
// declarations, so the star exports stay unambiguous).
export type {
  DragAutoScrollApply,
  DragAutoScrollApplyContext,
  DragAutoScrollAxis,
  DragAutoScrollFrameContext,
} from '../utils/drag-and-drop/autoScroller';
export type { DragInput, DragSource } from '../types/drag';
