import { ownerWindow } from '@base-ui/utils/owner';
import { WindowAnimationFrame } from '../../windowAnimationFrame';
import { getActivePreviewHandle } from '../activePreview';
import { getActiveDragLocation } from '../core/lifecycleManager';
import { dragSessionStore } from '../dragSessionStore';
import { createDragPreviewElement } from './cloneDragPreview';
import { updatePreviewContent } from './updatePreviewContent';
import type { SyntheticPreviewHandle } from './syntheticPreview';
import * as DraggableRootDataAttributes from '../../../draggable/root/DraggableRootDataAttributes';

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
  const handle = getActivePreviewHandle();
  const source = dragSessionStore.state?.source;
  if (!handle || !source || scheduled.has(handle)) {
    return;
  }
  scheduled.add(handle);
  new WindowAnimationFrame(ownerWindow(source.element)).request(() => {
    // Calls from the render function share this update.
    try {
      const location = getActiveDragLocation();
      const current = dragSessionStore.state?.source;
      if (getActivePreviewHandle() !== handle || !location || !current) {
        return;
      }
      const content = handle.getContent();
      if (!content) {
        refreshClone(handle, current.element);
        return;
      }
      content.update = () => {
        content.update = undefined;
        updatePreviewContent(content, {
          onRoot: handle.showContent,
          onRootChange(ownStyle) {
            handle.getPreviewElement()?.updateContentStyle(ownStyle);
          },
        });
      };
      content.render?.({ source: current, location });
    } finally {
      scheduled.delete(handle);
    }
  });
}

/**
 * Clone the source again. The clone is built while the source is marked as dragged, so
 * its drag-state attributes are lifted for the duration. Otherwise a `[data-dragging]`
 * rule, such as a dimmed source, would be copied into the clone's style snapshot.
 * Nothing renders in between.
 */
function refreshClone(handle: SyntheticPreviewHandle, source: HTMLElement): void {
  const current = handle.getPreviewElement();
  if (!current || !source.isConnected) {
    return;
  }
  const dragState = [DraggableRootDataAttributes.dragging, DraggableRootDataAttributes.settling]
    .map((name) => [name, source.getAttribute(name)] as const)
    .filter(([, value]) => value !== null);
  for (const [name] of dragState) {
    source.removeAttribute(name);
  }
  let next;
  try {
    next = createDragPreviewElement(source, current.anchor);
  } finally {
    for (const [name, value] of dragState) {
      source.setAttribute(name, value!);
    }
  }
  if (next && handle.getPreviewElement() === current) {
    handle.setPreviewElement(next);
  } else {
    next?.destroy();
  }
}
