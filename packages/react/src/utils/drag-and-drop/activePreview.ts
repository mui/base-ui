import { getSharedSlot } from './sharedState';
import type { SyntheticPreviewHandle } from './synthetic/syntheticPreview';

/**
 * Marks the element the engine positions: `"clone"` for the clone of the source, or
 * `"content"` for the copy of a custom preview's content. The engine finds the
 * preview through it in either mode, including a preview still settling after its
 * drag. The same element carries the public `data-drag-preview`. The
 * `data-base-ui-` prefix means this one is internal, not a styling hook.
 */
export const PREVIEW_ELEMENT_ATTRIBUTE = 'data-base-ui-drag-preview';

/**
 * The active drag's preview handle. The React layer reaches the engine-built
 * element, and any custom content, through it.
 */
interface ActivePreviewSlot {
  handle: SyntheticPreviewHandle | null;
}

const slot = getSharedSlot<ActivePreviewSlot>('activeDragPreview', () => ({
  handle: null,
}));

/**
 * Publish the active drag's preview handle. Only the sensor calls this. Released
 * with `clearActivePreviewHandle` when the pickup is undone or the drag ends.
 */
export function setActivePreviewHandle(handle: SyntheticPreviewHandle): void {
  slot.handle = handle;
}

/**
 * Release `handle` if it is still the published one, so a sensor tearing down its
 * own pickup cannot clear a slot another sensor has since taken. Only the sensor
 * calls this.
 */
export function clearActivePreviewHandle(handle: SyntheticPreviewHandle): void {
  if (slot.handle === handle) {
    slot.handle = null;
  }
}

/**
 * The active drag's preview handle. The React layer reads the custom content from it
 * (`getContent()`, `syncContent`). `retargetDragSource` in `dragSource.ts` retargets it
 * when a virtualizer remounts the source mid-drag, so `data-dragging` follows the live
 * element. `null` when no drag is active.
 */
export function getActivePreviewHandle(): SyntheticPreviewHandle | null {
  return slot.handle;
}
