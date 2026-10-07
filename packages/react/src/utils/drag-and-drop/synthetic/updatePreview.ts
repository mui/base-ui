import { ownerWindow } from '@base-ui/utils/owner';
import { WindowAnimationFrame } from '../../windowAnimationFrame';
import { getActiveSession } from '../core/dragSession';
import type { SyntheticPreviewHandle } from './syntheticPreview';

// The previews with an update scheduled, so calls in one frame share it.
const scheduled = new WeakSet<SyntheticPreviewHandle>();

/**
 * Updates the preview of the drag in progress. A custom preview renders again with the
 * current `source` and `location`, and the copy on screen takes what changed. Without
 * custom content, the source is cloned again. Does nothing when no drag is in progress.
 *
 * The update runs before the next paint, after React has rendered the updates already
 * scheduled, so state set right before the call shows. Calls in the same frame share
 * one update.
 */
export function updatePreview(): void {
  const session = getActiveSession();
  const handle = session?.preview;
  if (!session || !handle || scheduled.has(handle)) {
    return;
  }
  scheduled.add(handle);
  new WindowAnimationFrame(ownerWindow(session.source.element)).request(() => {
    // Calls from the render function share this update.
    try {
      // The drag may have ended, or reached its end sequence, since the request.
      if (getActiveSession() === session && session.preview === handle) {
        handle.refresh({ source: session.source, location: session.getLocation() });
      }
    } finally {
      scheduled.delete(handle);
    }
  });
}
