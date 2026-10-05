import { getSharedSlot } from './sharedState';
import type { SyntheticPreviewHandle } from './synthetic/syntheticPreview';

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
 * The active drag's preview handle. The React layer reads the host from it, re-anchors
 * the host once its content has rendered, and tears it down when the content resolves
 * to nothing. The session store retargets it when a virtualizer remounts the source
 * mid-drag, so `data-dragging` follows the live element. `null` when no drag is active.
 */
export function getActivePreviewHandle(): SyntheticPreviewHandle | null {
  return slot.handle;
}
