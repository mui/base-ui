'use client';
import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { ownerWindow } from '@base-ui/utils/owner';
import { activeElement, contains, getTarget } from '../../floating-ui-react/utils';
import { type ScrollAxis } from '../../utils/scrollable';
import { type SwipeDirection } from '../../utils/useSwipeDismiss';
import { BASE_UI_SWIPE_IGNORE_SELECTOR } from '../../utils/constants';
import { DRAWER_CONTENT_ATTRIBUTE } from '../content/DrawerContentDataAttributes';

const DRAWER_CONTENT_SELECTOR = `[${DRAWER_CONTENT_ATTRIBUTE}]`;

export interface DrawerTouchScrollState {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  scrollTarget: HTMLElement | null;
  hasCrossAxisScrollableContent: boolean;
  allowSwipe: boolean | null;
  preserveNativeCrossAxisScroll: boolean;
}

export function isSwipeIgnoredTarget(target: Element | null): boolean {
  return Boolean(target?.closest(BASE_UI_SWIPE_IGNORE_SELECTOR));
}

export function isDrawerContentTarget(target: Element | null): boolean {
  return Boolean(target?.closest(DRAWER_CONTENT_SELECTOR));
}

export function shouldIgnoreSwipeForTextSelection(
  doc: Document,
  rootElement: HTMLElement,
): boolean {
  const activeEl = activeElement(doc);
  const activeElementWithinRoot = Boolean(activeEl && contains(rootElement, activeEl));

  if (activeElementWithinRoot && isTextSelectionControl(activeEl)) {
    const { selectionStart, selectionEnd } = activeEl;
    if (selectionStart != null && selectionEnd != null && selectionStart < selectionEnd) {
      return true;
    }
  }

  const selection = doc.getSelection?.();
  if (!selection || selection.isCollapsed) {
    return false;
  }

  return hasExpandedSelectionWithinTarget(selection, rootElement);
}

export function isEventOnRangeInput(
  event: TouchEvent,
  win: ReturnType<typeof ownerWindow>,
): boolean {
  const composedPath = event.composedPath();
  if (composedPath) {
    return composedPath.some((pathTarget) => isRangeInput(pathTarget, win));
  }

  return isRangeInput(getTarget(event), win);
}

export function isReactTouchEventOnRangeInput(event: React.TouchEvent<Element>): boolean {
  return isEventOnRangeInput(event.nativeEvent, ownerWindow(event.currentTarget));
}

export function updateTouchScrollPosition(touchState: DrawerTouchScrollState, touch: Touch): void {
  touchState.lastX = touch.clientX;
  touchState.lastY = touch.clientY;
}

export function preserveNativeCrossAxisScrollOnMove(
  touchState: DrawerTouchScrollState,
  touch: Touch,
  isVerticalScrollAxis: boolean,
): boolean {
  if (touchState.preserveNativeCrossAxisScroll) {
    return true;
  }

  if (touchState.allowSwipe === true || !touchState.hasCrossAxisScrollableContent) {
    return false;
  }

  const drawerAxisGestureDelta = isVerticalScrollAxis
    ? touch.clientY - touchState.startY
    : touch.clientX - touchState.startX;
  const crossAxisGestureDelta = isVerticalScrollAxis
    ? touch.clientX - touchState.startX
    : touch.clientY - touchState.startY;
  const absDrawerAxisGestureDelta = Math.abs(drawerAxisGestureDelta);
  const absCrossAxisGestureDelta = Math.abs(crossAxisGestureDelta);

  if (absCrossAxisGestureDelta < 6 || absCrossAxisGestureDelta <= absDrawerAxisGestureDelta + 2) {
    return false;
  }

  touchState.preserveNativeCrossAxisScroll = true;
  return true;
}

export function hasScrollableContentOnAxis(scrollTarget: HTMLElement, axis: ScrollAxis): boolean {
  return axis === 'vertical'
    ? scrollTarget.scrollHeight > scrollTarget.clientHeight
    : scrollTarget.scrollWidth > scrollTarget.clientWidth;
}

export function isAtSwipeStartEdge(
  scrollTarget: HTMLElement,
  axis: ScrollAxis,
  direction: SwipeDirection,
): boolean {
  const { offset, max } = getScrollMetrics(scrollTarget, axis);
  const dismissFromStartEdge = shouldDismissFromStartEdge(direction, axis);
  if (dismissFromStartEdge === null) {
    return false;
  }

  return dismissFromStartEdge ? offset <= 0 : offset >= max;
}

export function canSwipeFromScrollEdgeOnMove(
  scrollTarget: HTMLElement,
  axis: ScrollAxis,
  direction: SwipeDirection,
  delta: number,
): boolean {
  const { offset, max } = getScrollMetrics(scrollTarget, axis);
  const dismissFromStartEdge = shouldDismissFromStartEdge(direction, axis);
  if (dismissFromStartEdge === null) {
    return false;
  }

  const movingTowardDismiss = dismissFromStartEdge ? delta > 0 : delta < 0;
  if (!movingTowardDismiss) {
    return false;
  }

  return dismissFromStartEdge ? offset <= 0 : offset >= max;
}

function isRangeInput(
  target: EventTarget | null,
  win: ReturnType<typeof ownerWindow>,
): target is HTMLInputElement {
  return target instanceof win.HTMLInputElement && target.type === 'range';
}

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
    contains(target, anchorElement) ||
    contains(target, focusElement)
  );
}

function getScrollMetrics(scrollTarget: HTMLElement, axis: ScrollAxis) {
  if (axis === 'vertical') {
    const max = Math.max(0, scrollTarget.scrollHeight - scrollTarget.clientHeight);
    return { offset: scrollTarget.scrollTop, max };
  }

  const max = Math.max(0, scrollTarget.scrollWidth - scrollTarget.clientWidth);
  return { offset: scrollTarget.scrollLeft, max };
}

function shouldDismissFromStartEdge(direction: SwipeDirection, axis: ScrollAxis): boolean | null {
  if (axis === 'vertical') {
    if (direction === 'down') {
      return true;
    }
    if (direction === 'up') {
      return false;
    }
    return null;
  }

  if (direction === 'right') {
    return true;
  }
  if (direction === 'left') {
    return false;
  }

  return null;
}
