'use client';
import type { FloatingTreeType } from '../../floating-ui-react';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import type { NavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import { isOutsideMenuEvent } from './isOutsideMenuEvent';

interface HandleNavigationMenuBlurParams {
  event: React.FocusEvent<HTMLElement>;
  popupElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
  rootRef: React.RefObject<HTMLDivElement | null>;
  tree: FloatingTreeType | null;
  nodeId: string | undefined;
  setValue: NavigationMenuRootContext['setValue'];
}

export function handleNavigationMenuBlur(params: HandleNavigationMenuBlurParams) {
  const { event, popupElement, positionerElement, rootRef, tree, nodeId, setValue } = params;

  if (!positionerElement || !popupElement) {
    return;
  }

  const currentTarget = event.currentTarget as HTMLElement;
  const target = event.target as Node | null;
  const relatedTarget = event.relatedTarget as HTMLElement | null;
  const nativeEvent = event.nativeEvent;

  // When `relatedTarget` is null, focus destination is indeterminate (common during pointer
  // presses). Let outside press and other dismissal paths handle those transitions.
  if (!relatedTarget) {
    return;
  }

  // React `focusout` events from portaled descendants bubble through the React tree
  // even when they are not DOM descendants. Ignore those for delegated blur handlers.
  if (target && !currentTarget.contains(target)) {
    return;
  }

  if (
    isOutsideMenuEvent(
      {
        currentTarget,
        relatedTarget,
      },
      { popupElement, rootRef, tree, nodeId },
    )
  ) {
    setValue(null, createChangeEventDetails(REASONS.focusOut, nativeEvent));
  }
}
