import { isElement } from '@floating-ui/utils/dom';
import type { ScrollAxis } from './scrollable';

const TOUCH_AXIS_COMMIT_THRESHOLD = 6;
const TOUCH_AXIS_COMMIT_MARGIN = 2;

function isTextSelectionControl(
  target: EventTarget | null,
): target is HTMLInputElement | HTMLTextAreaElement {
  if (!isElement(target)) {
    return false;
  }

  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
}

function hasExpandedSelectionWithinTarget(selection: Selection, target: Element): boolean {
  const anchorElement = isElement(selection.anchorNode)
    ? selection.anchorNode
    : selection.anchorNode?.parentElement;
  const focusElement = isElement(selection.focusNode)
    ? selection.focusNode
    : selection.focusNode?.parentElement;

  return (
    selection.containsNode(target, true) ||
    target.contains(anchorElement ?? null) ||
    target.contains(focusElement ?? null)
  );
}

export function shouldIgnoreTouchMoveForSelection(doc: Document, target: Element): boolean {
  const activeElement = doc.activeElement;

  if (target.contains(activeElement) && isTextSelectionControl(activeElement)) {
    const { selectionStart, selectionEnd } = activeElement;
    if (selectionStart != null && selectionEnd != null && selectionStart < selectionEnd) {
      return true;
    }
  }

  const selection = doc.getSelection?.();
  if (!selection || selection.isCollapsed) {
    return false;
  }

  return hasExpandedSelectionWithinTarget(selection, target);
}

function isRangeInput(
  target: EventTarget | null,
  win: Window & typeof globalThis,
): target is HTMLInputElement {
  return target instanceof win.HTMLInputElement && target.type === 'range';
}

export function isEventOnRangeInput(event: TouchEvent, win: Window & typeof globalThis): boolean {
  const composedPath = event.composedPath();
  if (composedPath) {
    return composedPath.some((pathTarget) => isRangeInput(pathTarget, win));
  }

  return isRangeInput(event.target, win);
}

export function getTouchMoveAxis(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
): ScrollAxis | null {
  const deltaX = Math.abs(currentX - startX);
  const deltaY = Math.abs(currentY - startY);

  if (deltaX >= TOUCH_AXIS_COMMIT_THRESHOLD && deltaX > deltaY + TOUCH_AXIS_COMMIT_MARGIN) {
    return 'horizontal';
  }

  if (deltaY >= TOUCH_AXIS_COMMIT_THRESHOLD && deltaY > deltaX + TOUCH_AXIS_COMMIT_MARGIN) {
    return 'vertical';
  }

  return null;
}
