'use client';
import type * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { Timeout } from '@base-ui/utils/useTimeout';
import { closest, contains, getTarget } from '@base-ui/utils/shadowDom';
import { isElement } from '@floating-ui/utils/dom';
import { createChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import { REASONS } from '../../../internals/reasons';
import type {
  Delay,
  FloatingContext,
  FloatingRootContext,
  FloatingRootContextValues,
  FloatingTreeType,
} from '../floating-root/types';
import { isInteractiveElement } from '../element';
import { isMouseLikePointerType } from '../event';
import { getNodeChildren } from '../tree/nodes';
import type { HandleClose, HandleCloseContextBase, HandleCloseOptions } from './useHoverShared';
import {
  getDelay,
  getRestMs,
  isClickLikeOpenEvent,
  isHoverOpenEvent,
  isInsideEnabledTrigger,
} from './useHoverShared';

type Latest<T> = { readonly current: T };

/**
 * Options of one trigger. Several triggers can share a popup, so each trigger passes its own
 * options with every call. Values behind `Latest` are read when they are needed, so a timer or
 * the safe polygon that runs later sees the trigger's latest props.
 */
export interface HoverIntentTriggerOptions {
  delay: Latest<Delay | (() => Delay)>;
  restMs: Latest<number | (() => number)>;
  handleClose: Latest<HandleClose | null>;
  enabled: Latest<boolean>;
  /**
   * Whether the last close was caused by hovering out of a trigger.
   */
  isHoverCloseActive: Latest<boolean>;
  triggerElementRef: Latest<Element | null>;
  mouseOnly: boolean;
  tree: FloatingTreeType | null;
  shouldOpen: () => boolean;
  getHandleCloseContext?: (() => HandleCloseContextBase | null) | undefined;
}

type PointerEventsScopeElement = HTMLElement | SVGSVGElement;

export interface OutsidePointerEventsElements {
  /**
   * The element whose pointer events are blocked.
   */
  scopeElement: PointerEventsScopeElement;
  referenceElement: HTMLElement | SVGSVGElement;
  floatingElement: HTMLElement;
}

// Only one popup at a time can block pointer events within a scope element.
const pointerEventsOwnerByScopeElement = new WeakMap<PointerEventsScopeElement, HoverIntent>();

/**
 * Decides when hovering opens and closes one popup: the open and close delays, rest detection,
 * the safe polygon between the trigger and the popup, and blocking pointer events outside them.
 *
 * Every popup with hover interactions has one, shared by all its triggers and its popup.
 * Get it with `useHoverIntent()`.
 */
export class HoverIntent {
  private pointerType: string | undefined = undefined;

  private interactedInside = false;

  private safePolygonHandler: ((event: MouseEvent) => void) | undefined = undefined;

  private blockMouseMove = true;

  private blockedPointerEvents: OutsidePointerEventsElements | null = null;

  private restTimeoutPending = false;

  private readonly openChangeTimeout = new Timeout();

  private readonly restTimeout = new Timeout();

  private activeHandleCloseOptions: HandleCloseOptions | undefined = undefined;

  constructor(private readonly store: FloatingRootContext) {}

  /**
   * The safe polygon options of the active trigger.
   */
  get handleCloseOptions(): HandleCloseOptions | undefined {
    return this.activeHandleCloseOptions;
  }

  setHandleCloseOptions(options: HandleCloseOptions | undefined) {
    this.activeHandleCloseOptions = options;
  }

  setPointerType(pointerType: string) {
    this.pointerType = pointerType;
  }

  private isClickLikeOpen() {
    return isClickLikeOpenEvent(
      this.store.context.dataRef.current.openEvent?.type,
      this.interactedInside,
    );
  }

  private isHoverOpen() {
    return isHoverOpenEvent(this.store.context.dataRef.current.openEvent?.type);
  }

  /**
   * Cancels a pending hover open: the open delay and rest detection.
   */
  cancelPendingOpen() {
    this.openChangeTimeout.clear();
    this.restTimeout.clear();
    this.restTimeoutPending = false;
  }

  /**
   * Stops what the triggers have in flight when the popup closes: the safe polygon, both timers
   * and rest detection. Mouse movement can't open the popup until a trigger is entered again.
   */
  cancel() {
    this.stopSafePolygon();
    this.cancelPendingOpen();
    this.blockMouseMove = true;
  }

  /**
   * Forgets the interaction once the popup has closed.
   */
  reset() {
    this.pointerType = undefined;
    this.restTimeoutPending = false;
    this.interactedInside = false;
    this.restoreOutsidePointerEvents();
  }

  private dispose = () => {
    this.openChangeTimeout.clear();
    this.restTimeout.clear();
  };

  disposeEffect = () => {
    return this.dispose;
  };

  /**
   * Removes the safe polygon's `mousemove` listener.
   */
  stopSafePolygon = () => {
    if (!this.safePolygonHandler) {
      return;
    }

    const doc = ownerDocument(this.store.select('domReferenceElement'));
    doc.removeEventListener('mousemove', this.safePolygonHandler);
    this.safePolygonHandler = undefined;
  };

  /**
   * Blocks pointer events within `scopeElement`, except on the reference and floating elements,
   * so the pointer can travel to the popup without hovering anything else.
   * Takes over the scope element from another popup that blocks it.
   */
  blockOutsidePointerEvents(elements: OutsidePointerEventsElements) {
    const { scopeElement, referenceElement, floatingElement } = elements;

    const existingOwner = pointerEventsOwnerByScopeElement.get(scopeElement);
    if (existingOwner && existingOwner !== this) {
      existingOwner.restoreOutsidePointerEvents();
    }

    this.restoreOutsidePointerEvents();
    this.blockedPointerEvents = elements;
    pointerEventsOwnerByScopeElement.set(scopeElement, this);

    scopeElement.style.pointerEvents = 'none';
    referenceElement.style.pointerEvents = 'auto';
    floatingElement.style.pointerEvents = 'auto';
  }

  /**
   * Undoes `blockOutsidePointerEvents()`, unless another popup has taken over the scope element.
   */
  restoreOutsidePointerEvents = () => {
    const blocked = this.blockedPointerEvents;
    if (!blocked) {
      return;
    }

    const { scopeElement, referenceElement, floatingElement } = blocked;

    if (pointerEventsOwnerByScopeElement.get(scopeElement) === this) {
      scopeElement.style.removeProperty('pointer-events');
      referenceElement.style.removeProperty('pointer-events');
      floatingElement.style.removeProperty('pointer-events');
      pointerEventsOwnerByScopeElement.delete(scopeElement);
    }

    this.blockedPointerEvents = null;
  };

  onTriggerMouseEnter(event: MouseEvent, options: HoverIntentTriggerOptions) {
    const { store } = this;

    this.openChangeTimeout.clear();
    this.blockMouseMove = false;

    if (options.mouseOnly && !isMouseLikePointerType(this.pointerType)) {
      return;
    }

    // Only rest delay is set; there's no fallback delay.
    // This will be handled by `onTriggerMouseMove`.
    const restMsValue = getRestMs(options.restMs.current);
    const openDelay = getDelay(options.delay.current, 'open', this.pointerType);
    const eventTarget = getTarget(event);
    const currentTarget = (event.currentTarget as HTMLElement) ?? null;
    const currentDomReference = store.select('domReferenceElement');
    let triggerNode = currentTarget;

    // Wrapper/delegated mode: resolve the actual trigger from the event target.
    if (isElement(eventTarget) && !store.context.triggerElements.hasElement(eventTarget)) {
      for (const triggerElement of store.context.triggerElements.elements()) {
        if (contains(triggerElement, eventTarget)) {
          triggerNode = triggerElement as HTMLElement;
          break;
        }
      }
    }

    // Wrapper/delegated mode fallback: if the wrapper contains the active trigger,
    // treat this as re-entering that active trigger.
    if (
      isElement(currentTarget) &&
      isElement(currentDomReference) &&
      !store.context.triggerElements.hasElement(currentTarget) &&
      contains(currentTarget, currentDomReference)
    ) {
      triggerNode = currentDomReference as HTMLElement;
    }

    const isOverInactive =
      triggerNode == null
        ? false
        : this.isOverInactiveTrigger(currentDomReference, triggerNode, eventTarget);
    const isOpen = store.select('open');
    const isInClosingTransition = store.select('transitionStatus') === 'ending';
    const isHoverCloseTransition =
      !isOpen && isInClosingTransition && options.isHoverCloseActive.current;
    const isReenteringSameTriggerDuringCloseTransition =
      !isOverInactive &&
      isElement(triggerNode) &&
      isElement(currentDomReference) &&
      contains(currentDomReference, triggerNode) &&
      isHoverCloseTransition;
    const isRestOnlyDelay = restMsValue > 0 && !openDelay;
    const shouldOpenImmediately =
      (isOverInactive && (isOpen || isHoverCloseTransition)) ||
      isReenteringSameTriggerDuringCloseTransition;

    const shouldOpen = !isOpen || isOverInactive;

    // Open immediately when moving between triggers while open, or during
    // a hover-driven close transition (including same-trigger re-entry).
    if (shouldOpenImmediately) {
      if (options.shouldOpen()) {
        store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, event, triggerNode));
      }
      return;
    }

    if (isRestOnlyDelay) {
      return;
    }

    if (openDelay) {
      this.openChangeTimeout.start(openDelay, () => {
        if (shouldOpen && options.shouldOpen()) {
          store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, event, triggerNode));
        }
      });
    } else if (shouldOpen) {
      if (options.shouldOpen()) {
        store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, event, triggerNode));
      }
    }
  }

  onTriggerMouseLeave(event: MouseEvent, options: HoverIntentTriggerOptions) {
    const { store } = this;

    if (this.isClickLikeOpen()) {
      this.restoreOutsidePointerEvents();
      return;
    }

    this.stopSafePolygon();

    const domReferenceElement = store.select('domReferenceElement');
    const doc = ownerDocument(domReferenceElement);
    this.restTimeout.clear();
    this.restTimeoutPending = false;

    const handleCloseContextBase = this.getFloatingContext() ?? options.getHandleCloseContext?.();

    if (isInsideEnabledTrigger(event.relatedTarget, store.context.triggerElements)) {
      return;
    }

    const handleClose = options.handleClose.current;

    if (handleClose && handleCloseContextBase) {
      if (!store.select('open')) {
        this.openChangeTimeout.clear();
      }

      const currentTrigger = options.triggerElementRef.current;

      this.safePolygonHandler = handleClose({
        ...handleCloseContextBase,
        tree: options.tree,
        x: event.clientX,
        y: event.clientY,
        onClose: () => {
          this.restoreOutsidePointerEvents();
          this.stopSafePolygon();
          if (
            options.enabled.current &&
            !this.isClickLikeOpen() &&
            currentTrigger === store.select('domReferenceElement')
          ) {
            this.closeWithDelay(event, options.delay.current, options.tree);
          }
        },
      });

      doc.addEventListener('mousemove', this.safePolygonHandler);
      this.safePolygonHandler(event);

      return;
    }

    const shouldClose =
      this.pointerType === 'touch'
        ? !contains(store.select('floatingElement'), event.relatedTarget as Element | null)
        : true;

    if (shouldClose) {
      this.closeWithDelay(event, options.delay.current, options.tree);
    }
  }

  onTriggerMouseMove(
    event: React.MouseEvent,
    options: Pick<HoverIntentTriggerOptions, 'restMs' | 'mouseOnly' | 'shouldOpen'>,
  ) {
    const { store } = this;
    const { nativeEvent } = event;
    const trigger = event.currentTarget as HTMLElement;

    const currentDomReference = store.select('domReferenceElement');
    const currentOpen = store.select('open');
    const isOverInactive = this.isOverInactiveTrigger(currentDomReference, trigger, event.target);

    if (options.mouseOnly && !isMouseLikePointerType(this.pointerType)) {
      return;
    }

    if (currentOpen && isOverInactive && this.activeHandleCloseOptions?.blockPointerEvents) {
      const floatingElement = store.select('floatingElement');

      if (floatingElement) {
        const scopeElement =
          this.activeHandleCloseOptions?.getScope?.() ?? trigger.ownerDocument.body;

        this.blockOutsidePointerEvents({
          scopeElement,
          referenceElement: trigger,
          floatingElement,
        });
      }
    }

    const restMsValue = getRestMs(options.restMs.current);
    if ((currentOpen && !isOverInactive) || restMsValue === 0) {
      return;
    }

    if (
      !isOverInactive &&
      this.restTimeoutPending &&
      event.movementX ** 2 + event.movementY ** 2 < 2
    ) {
      return;
    }

    this.restTimeout.clear();

    const handleMouseMove = () => {
      this.restTimeoutPending = false;

      // A delayed hover open should not override a click-like open that happened
      // while the hover delay was pending.
      if (this.isClickLikeOpen()) {
        return;
      }

      const latestOpen = store.select('open');

      if (!this.blockMouseMove && (!latestOpen || isOverInactive) && options.shouldOpen()) {
        store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, nativeEvent, trigger));
      }
    };

    if (this.pointerType === 'touch') {
      ReactDOM.flushSync(() => {
        handleMouseMove();
      });
    } else if (isOverInactive && currentOpen) {
      handleMouseMove();
    } else {
      this.restTimeoutPending = true;
      this.restTimeout.start(restMsValue, handleMouseMove);
    }
  }

  /**
   * Blocks pointer events outside the popup and its trigger while a hover-opened popup is open,
   * if the active trigger's safe polygon asks for it.
   * Returns whether pointer events were blocked.
   */
  blockOutsidePointerEventsForPopup(
    referenceElement: HTMLElement | SVGSVGElement,
    floatingElement: HTMLElement,
    tree: FloatingTreeType | null,
    parentId: string | null,
  ): boolean {
    if (!this.activeHandleCloseOptions?.blockPointerEvents || !this.isHoverOpen()) {
      return false;
    }

    const doc = ownerDocument(floatingElement);

    const parentFloating = tree?.nodesRef.current.find((node) => node.id === parentId)?.context
      ?.elements.floating as HTMLElement | null;

    if (parentFloating) {
      parentFloating.style.pointerEvents = '';
    }

    // A keep-mounted submenu can appear in the tree before it opens, so a
    // cached scope or parent lookup may resolve to the submenu itself. That
    // would not shield sibling items in the parent menu.
    const previousScopeElement = this.blockedPointerEvents?.scopeElement ?? null;
    const cachedScopeElement =
      previousScopeElement !== floatingElement ? previousScopeElement : null;
    const parentScopeElement = parentFloating !== floatingElement ? parentFloating : null;
    const scopeElement =
      this.activeHandleCloseOptions?.getScope?.() ??
      cachedScopeElement ??
      parentScopeElement ??
      (closest(referenceElement, '[data-rootownerid]') as PointerEventsScopeElement | null) ??
      doc.body;

    this.blockOutsidePointerEvents({ scopeElement, referenceElement, floatingElement });

    return true;
  }

  onPopupMouseEnter() {
    this.openChangeTimeout.clear();
    this.restoreOutsidePointerEvents();
  }

  onPopupMouseLeave(
    event: MouseEvent,
    options: {
      closeDelay: number | (() => number);
      tree: FloatingTreeType | null;
      nodeId: string | undefined;
    },
  ) {
    const { store } = this;
    const { tree } = options;

    if (isInsideEnabledTrigger(event.relatedTarget, store.context.triggerElements)) {
      // If the mouse is leaving the reference element to another trigger, don't explicitly close the popup
      // as it will be moved.
      return;
    }

    const currentNodeId = this.getFloatingContext()?.nodeId ?? options.nodeId;
    const relatedTarget = event.relatedTarget;
    const isMovingIntoDescendantFloating =
      tree &&
      currentNodeId &&
      isElement(relatedTarget) &&
      getNodeChildren(tree.nodesRef.current, currentNodeId, false).some((node) =>
        contains(node.context?.elements.floating, relatedTarget),
      );

    if (isMovingIntoDescendantFloating) {
      return;
    }

    // If the safePolygon handler is active, let it handle the close logic.
    if (this.safePolygonHandler) {
      this.safePolygonHandler(event);
      return;
    }

    this.restoreOutsidePointerEvents();
    if (this.isHoverOpen() && !this.isClickLikeOpen()) {
      this.closeWithDelay(event, options.closeDelay, tree);
    }
  }

  onPopupPointerDown(event: PointerEvent) {
    const target = getTarget(event) as Element | null;
    if (!isInteractiveElement(target)) {
      this.interactedInside = false;
      return;
    }

    this.interactedInside = closest(target, '[aria-haspopup]') != null;
  }

  private closeWithDelay(
    event: MouseEvent,
    delay: Delay | (() => Delay) | undefined,
    tree: FloatingTreeType | null,
  ) {
    const close = () => {
      this.store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event));
      tree?.events.emit('floating.closed', event);
    };

    const closeDelay = getDelay(delay, 'close', this.pointerType);
    if (closeDelay) {
      this.openChangeTimeout.start(closeDelay, close);
    } else {
      this.openChangeTimeout.clear();
      close();
    }
  }

  private isOverInactiveTrigger(
    currentDomReference: Element | null,
    currentTarget: Element,
    target: EventTarget | null,
  ): boolean {
    const allTriggers = this.store.context.triggerElements;

    // Fast path for normal usage where handlers are attached directly to triggers.
    if (allTriggers.hasElement(currentTarget)) {
      return !currentDomReference || !contains(currentDomReference, currentTarget);
    }

    // Fallback for delegated/wrapper usage where currentTarget may be outside the trigger map.
    if (!isElement(target)) {
      return false;
    }

    const targetElement = target as Element;
    return (
      allTriggers.hasMatchingElement((trigger) => contains(trigger, targetElement)) &&
      (!currentDomReference || !contains(currentDomReference, targetElement))
    );
  }

  /**
   * The safe polygon reads the popup's placement and tree node id from the positioning context.
   * `useFloating()` keeps it up to date in a layout effect.
   */
  private getFloatingContext(): FloatingContext | undefined {
    return this.store.context.dataRef.current.floatingContext;
  }
}

const hoverIntents = new WeakMap<FloatingRootContextValues, HoverIntent>();

/**
 * Returns the popup's `HoverIntent`, creating it on first use.
 */
export function getHoverIntent(store: FloatingRootContext): HoverIntent {
  let intent = hoverIntents.get(store.context);
  if (!intent) {
    intent = new HoverIntent(store);
    hoverIntents.set(store.context, intent);
  }
  return intent;
}

/**
 * Returns the popup's `HoverIntent` and clears its timers when the calling component unmounts.
 */
export function useHoverIntent(store: FloatingRootContext): HoverIntent {
  const intent = getHoverIntent(store);
  useOnMount(intent.disposeEffect);
  return intent;
}
