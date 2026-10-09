'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { contains } from '@base-ui/utils/shadowDom';
import { isElement } from '@floating-ui/utils/dom';
import { REASONS } from '../../../internals/reasons';
import type { FloatingUIOpenChangeDetails, HTMLProps } from '../../../internals/types';
import { useFloatingTree } from '../tree/FloatingTree';
import type { FloatingTreeStore } from '../tree/FloatingTreeStore';
import type { Delay, FloatingRootContext } from '../floating-root/types';
import { useHoverIntent } from './hoverIntent';
import type { HoverIntentTriggerOptions } from './hoverIntent';
import type { HandleClose, HandleCloseContextBase } from './useHoverShared';

export interface UseHoverReferenceInteractionProps {
  enabled?: boolean | undefined;
  handleClose?: HandleClose | null | undefined;
  restMs?: number | (() => number) | undefined;
  delay?: Delay | (() => Delay) | undefined;
  move?: boolean | undefined;
  mouseOnly?: boolean | undefined;
  externalTree?: FloatingTreeStore | undefined;
  /**
   * Whether the hook controls the active trigger. When false, the props are
   * returned under the `trigger` key so they can be applied to inactive
   * triggers via `getTriggerProps`.
   * @default true
   */
  isActiveTrigger?: boolean | undefined;
  triggerElementRef?: Readonly<React.RefObject<Element | null>> | undefined;
  getHandleCloseContext?: (() => HandleCloseContextBase | null) | undefined;
  /**
   * Called before each hover-driven open attempt (immediate, delayed, and rest-ms
   * paths). Return `false` to veto; any other return value permits the open.
   */
  shouldOpen?: (() => boolean) | undefined;
  /**
   * Regression workaround (#5152): also cancels a pending hover-open from the
   * trigger's `mouseout`, backing up a `mouseleave` that Chrome can drop during
   * a fast pointer sweep and leave a submenu stuck open.
   *
   * WARNING: only enable on single-trigger, hover-driven roots (e.g.
   * `Menu.SubmenuTrigger`). It skips the `isClickLikeOpenEvent()` and
   * `isInsideEnabledTrigger()` checks `mouseleave` applies, so on a
   * multi-trigger or click-driven root it cancels legitimate opens/closes.
   * @default false
   */
  guardStaleOpen?: boolean | undefined;
}

const EMPTY_REF: Readonly<React.RefObject<Element | null>> = { current: null };

/**
 * Provides hover interactions that should be attached to reference or trigger
 * elements.
 */
export function useHoverReferenceInteraction(
  store: FloatingRootContext,
  props: UseHoverReferenceInteractionProps = {},
): HTMLProps | undefined {
  const {
    enabled = true,
    delay = 0,
    handleClose = null,
    mouseOnly = false,
    restMs = 0,
    move = true,
    triggerElementRef = EMPTY_REF,
    externalTree,
    isActiveTrigger = true,
    getHandleCloseContext,
    shouldOpen: shouldOpenProp,
    guardStaleOpen = false,
  } = props;

  const { events } = store.context;

  const tree = useFloatingTree(externalTree);

  const intent = useHoverIntent(store);
  const isHoverCloseActiveRef = React.useRef(false);

  const handleCloseRef = useValueAsRef(handleClose);
  const delayRef = useValueAsRef(delay);
  const restMsRef = useValueAsRef(restMs);
  const enabledRef = useValueAsRef(enabled);
  const shouldOpenRef = useValueAsRef(shouldOpenProp);

  const checkShouldOpen = useStableCallback(() => {
    return shouldOpenRef.current?.() !== false;
  });

  if (isActiveTrigger) {
    // eslint-disable-next-line no-underscore-dangle
    intent.setHandleCloseOptions(handleClose?.__options);
  }

  React.useEffect(() => intent.stopSafePolygon, [intent]);

  // When closing before opening, clear the delay timeouts to cancel it
  // from showing.
  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    function onOpenChangeLocal(details: FloatingUIOpenChangeDetails) {
      if (!details.open) {
        isHoverCloseActiveRef.current = details.reason === REASONS.triggerHover;
        intent.cancel();
      } else {
        isHoverCloseActiveRef.current = false;
      }
    }

    events.on('openchange', onOpenChangeLocal);
    return () => {
      events.off('openchange', onOpenChangeLocal);
    };
  }, [enabled, events, intent]);

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const trigger =
      (triggerElementRef.current as HTMLElement | null) ??
      (isActiveTrigger ? (store.select('domReferenceElement') as HTMLElement | null) : null);

    if (!isElement(trigger)) {
      return undefined;
    }

    const options: HoverIntentTriggerOptions = {
      delay: delayRef,
      restMs: restMsRef,
      handleClose: handleCloseRef,
      enabled: enabledRef,
      isHoverCloseActive: isHoverCloseActiveRef,
      triggerElementRef,
      mouseOnly,
      tree,
      shouldOpen: checkShouldOpen,
      getHandleCloseContext,
    };

    function onMouseEnter(event: MouseEvent) {
      intent.onTriggerMouseEnter(event, options);
    }

    function onMouseLeave(event: MouseEvent) {
      intent.onTriggerMouseLeave(event, options);
    }

    // Backup cancellation for Chrome's dropped `mouseleave` — see `guardStaleOpen`.
    function onMouseOut(event: MouseEvent) {
      if (contains(trigger, event.relatedTarget as Element | null)) {
        return; // moved within the trigger's own subtree
      }
      intent.cancelPendingOpen();
    }

    const staleOpenGuard = guardStaleOpen
      ? addEventListener(trigger, 'mouseout', onMouseOut)
      : undefined;

    if (move) {
      return mergeCleanups(
        addEventListener(trigger, 'mousemove', onMouseEnter, { once: true }),
        addEventListener(trigger, 'mouseenter', onMouseEnter),
        addEventListener(trigger, 'mouseleave', onMouseLeave),
        staleOpenGuard,
      );
    }

    return mergeCleanups(
      addEventListener(trigger, 'mouseenter', onMouseEnter),
      addEventListener(trigger, 'mouseleave', onMouseLeave),
      staleOpenGuard,
    );
  }, [
    delayRef,
    store,
    enabled,
    handleCloseRef,
    intent,
    isActiveTrigger,
    mouseOnly,
    move,
    restMsRef,
    triggerElementRef,
    tree,
    enabledRef,
    getHandleCloseContext,
    checkShouldOpen,
    guardStaleOpen,
  ]);

  return React.useMemo<HTMLProps | undefined>(() => {
    if (!enabled) {
      return undefined;
    }

    function setPointerRef(event: React.PointerEvent) {
      intent.setPointerType(event.pointerType);
    }

    return {
      onPointerDown: setPointerRef,
      onPointerEnter: setPointerRef,
      onMouseMove(event) {
        intent.onTriggerMouseMove(event, {
          restMs: restMsRef,
          mouseOnly,
          shouldOpen: checkShouldOpen,
        });
      },
    };
  }, [enabled, intent, mouseOnly, restMsRef, checkShouldOpen]);
}
