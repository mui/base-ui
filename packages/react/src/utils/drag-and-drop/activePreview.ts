import { getSharedSlot } from './sharedState';
import type { SyntheticPreviewHandle } from './synthetic/syntheticPreview';
import type { ResolvedDragPreview } from './synthetic/pickupPreview';

/**
 * The active drag's preview handle and the settings the sensor resolved it from.
 * The React layer reaches the engine-built element through the handle, and reuses
 * the settings instead of resolving them again.
 */
interface ActivePreviewSlot {
  handle: SyntheticPreviewHandle | null;
  settings: ResolvedDragPreview | null;
}

const slot = getSharedSlot<ActivePreviewSlot>('activeDragPreview', () => ({
  handle: null,
  settings: null,
}));

/**
 * Publish the active drag's preview handle and its settings. Only the sensor calls
 * this. Released with `clearActivePreviewHandle` when the pickup is undone or the
 * drag ends.
 */
export function setActivePreviewHandle(
  handle: SyntheticPreviewHandle,
  settings: ResolvedDragPreview,
): void {
  slot.handle = handle;
  slot.settings = settings;
}

/**
 * Release `handle` if it is still the published one, so a sensor tearing down its
 * own pickup cannot clear a slot another sensor has since taken. Only the sensor
 * calls this.
 */
export function clearActivePreviewHandle(handle: SyntheticPreviewHandle): void {
  if (slot.handle === handle) {
    slot.handle = null;
    slot.settings = null;
  }
}

/**
 * The settings the active drag's preview was built from. The React layer reads them
 * to decide whether it has any content to render at all.
 */
export function getActiveDragPreviewSettings(): ResolvedDragPreview | null {
  return slot.settings;
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
