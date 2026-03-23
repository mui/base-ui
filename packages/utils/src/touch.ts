import { isElement } from '@floating-ui/utils/dom';

export function isTextSelectionControl(
  target: EventTarget | null,
): target is HTMLInputElement | HTMLTextAreaElement {
  if (!isElement(target)) {
    return false;
  }

  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
}

export function hasExpandedSelectionWithinTarget(selection: Selection, target: Element): boolean {
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
  const activeElementWithinTarget = Boolean(activeElement && target.contains(activeElement));

  if (activeElementWithinTarget && isTextSelectionControl(activeElement)) {
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

export function isRangeInput(
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
