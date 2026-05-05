'use client';
/* eslint-disable no-underscore-dangle */
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { ownerDocument } from '@base-ui/utils/owner';
import { Timeout } from '@base-ui/utils/useTimeout';
import {
  getComputedStyle,
  getParentNode,
  isElement,
  isHTMLElement,
  isLastTraversableNode,
  isShadowRoot,
  isWebKit,
} from '@floating-ui/utils/dom';
import { useFloatingTree } from '../components/FloatingTree';
import { FloatingTreeStore } from '../components/FloatingTreeStore';
import type { ElementProps, FloatingContext, FloatingRootContext } from '../types';
import { contains, getTarget, isEventTargetWithin, isRootElement } from '../utils/element';
import { isReactEvent } from '../utils/event';
import { getNodeChildren } from '../utils/nodes';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { HTMLProps } from '../../internals/types';
import { createAttribute } from '../utils/createAttribute';

type PressType = 'intentional' | 'sloppy';

const bubbleHandlerKeys = {
  intentional: 'onClick',
  sloppy: 'onPointerDown',
} as const;

function alwaysFalse() {
  return false;
}

export function normalizeProp(
  normalizable?: boolean | { escapeKey?: boolean | undefined; outsidePress?: boolean | undefined },
) {
  return {
    escapeKey:
      typeof normalizable === 'boolean' ? normalizable : (normalizable?.escapeKey ?? false),
    outsidePress:
      typeof normalizable === 'boolean' ? normalizable : (normalizable?.outsidePress ?? true),
  };
}

export interface UseDismissProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Whether to dismiss the floating element upon pressing the `esc` key.
   * @default true
   */
  escapeKey?: boolean | undefined;
  /**
   * Whether to dismiss the floating element upon pressing the reference
   * element. You likely want to ensure the `move` option in the `useHover()`
   * Hook has been disabled when this is in use.
   *
   * A lazy getter invoked when handling reference press events.
   * @default false
   */
  referencePress?: (() => boolean) | undefined;
  /**
   * The type of event to use to determine a "press".
   * - `down` is `pointerdown` on mouse input, but special iOS-like touch handling on touch input.
   * - `up` is lazy on both mouse + touch input (equivalent to `click`).
   * @default 'down'
   */
  referencePressEvent?: PressType | undefined;
  /**
   * Whether to dismiss the floating element upon pressing outside of the
   * floating element.
   * If you have another element, like a toast, that is rendered outside the
   * floating element's React tree and don't want the floating element to close
   * when pressing it, you can guard the check like so:
   * ```jsx
   * useDismiss(context, {
   *   outsidePress: (event) => !event.target.closest('.toast'),
   * });
   * ```
   * @default true
   */
  outsidePress?: boolean | ((event: MouseEvent | TouchEvent) => boolean) | undefined;
  /**
   * The type of event to use to determine an outside "press".
   * - `intentional` requires the user to click outside intentionally, firing on `pointerup` for mouse, and requiring minimal `touchmove`s for touch.
   * - `sloppy` fires on `pointerdown` for mouse, while for touch it fires on `touchend` (within 1 second) or while scrolling away after `touchstart`.
   */
  outsidePressEvent?:
    | PressType
    | {
        mouse: PressType;
        touch: PressType;
      }
    | (() =>
        | PressType
        | {
            mouse: PressType;
            touch: PressType;
          })
    | undefined;
  /**
   * Determines whether event listeners bubble upwards through a tree of
   * floating elements.
   */
  bubbles?:
    | boolean
    | { escapeKey?: boolean | undefined; outsidePress?: boolean | undefined }
    | undefined;
  /**
   * External FloatingTree to use when the one provided by context can't be used.
   */
  externalTree?: FloatingTreeStore | undefined;
}

type DismissInteractionControllerParameters = Omit<UseDismissProps, 'externalTree'> & {
  tree: FloatingTreeStore | null;
};

type DismissInteractionControllerSettings = Required<
  Omit<DismissInteractionControllerParameters, 'bubbles'>
> & {
  escapeKeyBubbles: boolean;
  outsidePressBubbles: boolean;
};

export class DismissInteractionController {
  private settings: DismissInteractionControllerSettings;

  private pressStartedInsideRef = false;

  private pressStartPreventedRef = false;

  // Ignore only the very next outside click after dragging from inside to outside.
  private suppressNextOutsideClickRef = false;

  private isComposingRef = false;

  private currentPointerTypeRef: PointerEvent['pointerType'] = '';

  private touchStateRef: {
    startTime: number;
    startX: number;
    startY: number;
    dismissOnTouchEnd: boolean;
    dismissOnMouseDown: boolean;
  } | null = null;

  private cancelDismissOnEndTimeout = new Timeout();

  private clearInsideReactTreeTimeout = new Timeout();

  private preventedPressSuppressionTimeout = new Timeout();

  constructor(
    public rootStore: FloatingRootContext,
    settings: DismissInteractionControllerParameters,
  ) {
    this.settings = this.generateSettings(settings);
  }

  public updateSettings(settings: DismissInteractionControllerParameters) {
    this.settings = this.generateSettings(settings);
  }

  private generateSettings(
    settings: DismissInteractionControllerParameters,
  ): DismissInteractionControllerSettings {
    const { escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles } = normalizeProp(
      settings.bubbles,
    );

    return {
      enabled: settings.enabled ?? true,
      escapeKey: settings.escapeKey ?? true,
      referencePress: settings.referencePress ?? alwaysFalse,
      referencePressEvent: settings.referencePressEvent ?? 'sloppy',
      outsidePress: settings.outsidePress ?? true,
      outsidePressEvent: settings.outsidePressEvent ?? 'sloppy',
      tree: settings.tree,
      escapeKeyBubbles,
      outsidePressBubbles,
    };
  }

  private getOutsidePressEvent() {
    const type = this.currentPointerTypeRef as 'pen' | 'mouse' | 'touch' | '';
    const computedType = type === 'pen' || !type ? 'mouse' : type;

    const resolved =
      typeof this.settings.outsidePressEvent === 'function'
        ? this.settings.outsidePressEvent()
        : this.settings.outsidePressEvent;

    if (typeof resolved === 'string') {
      return resolved;
    }

    return resolved[computedType];
  }

  private shouldIgnoreEvent(event: Event) {
    const computedOutsidePressEvent = this.getOutsidePressEvent();
    return (
      (computedOutsidePressEvent === 'intentional' && event.type !== 'click') ||
      (computedOutsidePressEvent === 'sloppy' && event.type === 'click')
    );
  }

  private clearInsideReactTree = () => {
    this.clearInsideReactTreeTimeout.clear();
    this.rootStore.context.dataRef.current.insideReactTree = false;
  };

  private markInsideReactTree = () => {
    this.rootStore.context.dataRef.current.insideReactTree = true;
    this.clearInsideReactTreeTimeout.start(0, this.clearInsideReactTree);
  };

  private hasBlockingChild(bubbleKey: '__escapeKeyBubbles' | '__outsidePressBubbles') {
    const nodeId = this.rootStore.context.dataRef.current.floatingContext?.nodeId;
    const children = this.settings.tree
      ? getNodeChildren(this.settings.tree.nodesRef.current, nodeId)
      : [];

    return children.some(
      (child) => child.context?.open && !child.context.dataRef.current[bubbleKey],
    );
  }

  private isEventWithinOwnElements(event: Event) {
    return (
      isEventTargetWithin(event, this.rootStore.select('floatingElement')) ||
      isEventTargetWithin(event, this.rootStore.select('domReferenceElement'))
    );
  }

  private isEventWithinFloatingTree(event: Event) {
    const nodeId = this.rootStore.context.dataRef.current.floatingContext?.nodeId;
    const targetIsInsideChildren =
      this.settings.tree &&
      getNodeChildren(this.settings.tree.nodesRef.current, nodeId).some((node) =>
        isEventTargetWithin(event, node.context?.elements.floating),
      );

    return this.isEventWithinOwnElements(event) || targetIsInsideChildren;
  }

  private closeOnReferencePress = (event: React.SyntheticEvent) => {
    if (!this.settings.referencePress()) {
      return;
    }

    this.rootStore.setOpen(
      false,
      createChangeEventDetails(
        REASONS.triggerPress,
        event.nativeEvent as MouseEvent | PointerEvent | TouchEvent | KeyboardEvent,
      ),
    );
  };

  private closeOnEscapeKeyDown = (event: React.KeyboardEvent<Element> | KeyboardEvent) => {
    if (
      !this.rootStore.select('open') ||
      !this.settings.enabled ||
      !this.settings.escapeKey ||
      event.key !== 'Escape'
    ) {
      return;
    }

    // Wait until IME is settled. Pressing `Escape` while composing should
    // close the compose menu, but not the floating element.
    if (this.isComposingRef) {
      return;
    }

    if (!this.settings.escapeKeyBubbles && this.hasBlockingChild('__escapeKeyBubbles')) {
      return;
    }

    const native = isReactEvent(event) ? event.nativeEvent : event;
    const eventDetails = createChangeEventDetails(REASONS.escapeKey, native);

    this.rootStore.setOpen(false, eventDetails);

    if (!eventDetails.isCanceled) {
      event.preventDefault();
    }

    if (!this.settings.escapeKeyBubbles && !eventDetails.isPropagationAllowed) {
      event.stopPropagation();
    }
  };

  private suppressImmediateOutsideClickAfterPreventedStart() {
    this.suppressNextOutsideClickRef = true;
    // Firefox can emit the synthetic outside click in a later task after
    // pointer lock exit, so microtask clearing is too early here.
    this.preventedPressSuppressionTimeout.start(0, () => {
      this.suppressNextOutsideClickRef = false;
    });
  }

  private resetPressStartState() {
    this.pressStartedInsideRef = false;
    this.pressStartPreventedRef = false;
  }

  private closeOnPressOutside(event: MouseEvent | PointerEvent | TouchEvent) {
    if (this.shouldIgnoreEvent(event)) {
      this.clearInsideReactTree();
      return;
    }

    if (this.rootStore.context.dataRef.current.insideReactTree) {
      this.clearInsideReactTree();
      return;
    }

    const target = getTarget(event);
    const inertSelector = `[${createAttribute('inert')}]`;
    const targetRoot = isElement(target) ? target.getRootNode() : null;
    const markers = Array.from(
      (isShadowRoot(targetRoot)
        ? targetRoot
        : ownerDocument(this.rootStore.select('floatingElement'))
      ).querySelectorAll(inertSelector),
    );

    const triggers = this.rootStore.context.triggerElements;

    // If another trigger is clicked, don't close the floating element.
    if (
      target &&
      (triggers.hasElement(target as Element) ||
        triggers.hasMatchingElement((trigger) => contains(trigger, target as Element)))
    ) {
      return;
    }

    let targetRootAncestor = isElement(target) ? target : null;
    while (targetRootAncestor && !isLastTraversableNode(targetRootAncestor)) {
      const nextParent = getParentNode(targetRootAncestor);
      if (isLastTraversableNode(nextParent) || !isElement(nextParent)) {
        break;
      }

      targetRootAncestor = nextParent;
    }

    // Check if the click occurred on a third-party element injected after the
    // floating element rendered.
    if (
      markers.length &&
      isElement(target) &&
      !isRootElement(target) &&
      // Clicked on a direct ancestor (e.g. FloatingOverlay).
      !contains(target, this.rootStore.select('floatingElement')) &&
      // If the target root element contains none of the markers, then the
      // element was injected after the floating element rendered.
      markers.every((marker) => !contains(targetRootAncestor, marker))
    ) {
      return;
    }

    // Check if the click occurred on the scrollbar
    // Skip for touch events: scrollbars don't receive touch events on most platforms
    if (isHTMLElement(target) && !('touches' in event)) {
      const lastTraversableNode = isLastTraversableNode(target);
      const style = getComputedStyle(target);
      const scrollRe = /auto|scroll/;
      const isScrollableX = lastTraversableNode || scrollRe.test(style.overflowX);
      const isScrollableY = lastTraversableNode || scrollRe.test(style.overflowY);

      const canScrollX =
        isScrollableX && target.clientWidth > 0 && target.scrollWidth > target.clientWidth;
      const canScrollY =
        isScrollableY && target.clientHeight > 0 && target.scrollHeight > target.clientHeight;

      const isRTL = style.direction === 'rtl';

      // Check click position relative to scrollbar.
      // In some browsers it is possible to change the <body> (or window)
      // scrollbar to the left side, but is very rare and is difficult to
      // check for. Plus, for modal dialogs with backdrops, it is more
      // important that the backdrop is checked but not so much the window.
      const pressedVerticalScrollbar =
        canScrollY &&
        (isRTL
          ? event.offsetX <= target.offsetWidth - target.clientWidth
          : event.offsetX > target.clientWidth);

      const pressedHorizontalScrollbar = canScrollX && event.offsetY > target.clientHeight;

      if (pressedVerticalScrollbar || pressedHorizontalScrollbar) {
        return;
      }
    }

    if (this.isEventWithinFloatingTree(event)) {
      return;
    }

    // In intentional mode, a press that starts inside and ends outside gets
    // one suppressed outside click. Run this after inside-target checks so
    // inside clicks don't consume the one-shot suppression.
    if (this.getOutsidePressEvent() === 'intentional' && this.suppressNextOutsideClickRef) {
      this.preventedPressSuppressionTimeout.clear();
      this.suppressNextOutsideClickRef = false;
      return;
    }

    if (typeof this.settings.outsidePress === 'function' && !this.settings.outsidePress(event)) {
      return;
    }

    if (this.hasBlockingChild('__outsidePressBubbles')) {
      return;
    }

    this.rootStore.setOpen(false, createChangeEventDetails(REASONS.outsidePress, event));
    this.clearInsideReactTree();
  }

  private handlePointerDown(event: PointerEvent) {
    if (
      this.getOutsidePressEvent() !== 'sloppy' ||
      event.pointerType === 'touch' ||
      !this.rootStore.select('open') ||
      !this.settings.enabled ||
      this.isEventWithinOwnElements(event)
    ) {
      return;
    }

    this.closeOnPressOutside(event);
  }

  private handleTouchStart(event: TouchEvent) {
    if (
      this.getOutsidePressEvent() !== 'sloppy' ||
      !this.rootStore.select('open') ||
      !this.settings.enabled ||
      this.isEventWithinOwnElements(event)
    ) {
      return;
    }

    const touch = event.touches[0];
    if (touch) {
      this.touchStateRef = {
        startTime: Date.now(),
        startX: touch.clientX,
        startY: touch.clientY,
        dismissOnTouchEnd: false,
        dismissOnMouseDown: true,
      };

      this.cancelDismissOnEndTimeout.start(1000, () => {
        if (this.touchStateRef) {
          this.touchStateRef.dismissOnTouchEnd = false;
          this.touchStateRef.dismissOnMouseDown = false;
        }
      });
    }
  }

  private addTargetEventListenerOnce<EventType extends Event>(
    event: EventType,
    listener: (event: EventType) => void,
  ) {
    const target = getTarget(event);

    if (!target) {
      return;
    }

    const unsubscribe = addEventListener(target, event.type, () => {
      listener(event);
      unsubscribe();
    });
  }

  private handleTouchStartCapture = (event: TouchEvent) => {
    this.currentPointerTypeRef = 'touch';
    this.addTargetEventListenerOnce(event, this.handleTouchStart.bind(this));
  };

  private closeOnPressOutsideCapture = (event: PointerEvent | MouseEvent) => {
    this.cancelDismissOnEndTimeout.clear();

    if (event.type === 'pointerdown') {
      this.currentPointerTypeRef = (event as PointerEvent).pointerType;
    }

    if (
      event.type === 'mousedown' &&
      this.touchStateRef &&
      !this.touchStateRef.dismissOnMouseDown
    ) {
      return;
    }

    this.addTargetEventListenerOnce(event, (targetEvent) => {
      if (targetEvent.type === 'pointerdown') {
        this.handlePointerDown(targetEvent as PointerEvent);
      } else {
        this.closeOnPressOutside(targetEvent as MouseEvent);
      }
    });
  };

  private handlePressEndCapture = (event: PointerEvent | MouseEvent) => {
    if (!this.pressStartedInsideRef) {
      return;
    }

    const pressStartedInsideDefaultPrevented = this.pressStartPreventedRef;
    this.resetPressStartState();

    if (this.getOutsidePressEvent() !== 'intentional') {
      return;
    }

    if (event.type === 'pointercancel') {
      if (pressStartedInsideDefaultPrevented) {
        this.suppressImmediateOutsideClickAfterPreventedStart();
      }
      return;
    }

    if (this.isEventWithinFloatingTree(event)) {
      return;
    }

    // If pointerdown was prevented, no click may be generated for that
    // interaction. However, Firefox may still emit an immediate click after
    // pointerup (e.g. NumberField scrub with pointer lock), so suppress for
    // one tick to absorb that synthetic click only.
    if (pressStartedInsideDefaultPrevented) {
      this.suppressImmediateOutsideClickAfterPreventedStart();
      return;
    }

    // Avoid suppressing when outsidePress explicitly ignores this target.
    if (
      typeof this.settings.outsidePress === 'function' &&
      !this.settings.outsidePress(event as MouseEvent)
    ) {
      return;
    }

    this.preventedPressSuppressionTimeout.clear();
    this.suppressNextOutsideClickRef = true;
    this.clearInsideReactTree();
  };

  private handleTouchMove(event: TouchEvent) {
    if (
      this.getOutsidePressEvent() !== 'sloppy' ||
      !this.touchStateRef ||
      this.isEventWithinOwnElements(event)
    ) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    const deltaX = Math.abs(touch.clientX - this.touchStateRef.startX);
    const deltaY = Math.abs(touch.clientY - this.touchStateRef.startY);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 5) {
      this.touchStateRef.dismissOnTouchEnd = true;
    }

    if (distance > 10) {
      this.closeOnPressOutside(event);
      this.cancelDismissOnEndTimeout.clear();
      this.touchStateRef = null;
    }
  }

  private handleTouchMoveCapture = (event: TouchEvent) => {
    this.addTargetEventListenerOnce(event, this.handleTouchMove.bind(this));
  };

  private handleTouchEnd(event: TouchEvent) {
    if (
      this.getOutsidePressEvent() !== 'sloppy' ||
      !this.touchStateRef ||
      this.isEventWithinOwnElements(event)
    ) {
      return;
    }

    if (this.touchStateRef.dismissOnTouchEnd) {
      this.closeOnPressOutside(event);
    }

    this.cancelDismissOnEndTimeout.clear();
    this.touchStateRef = null;
  }

  private handleTouchEndCapture = (event: TouchEvent) => {
    this.addTargetEventListenerOnce(event, this.handleTouchEnd.bind(this));
  };

  public useSetup() {
    const open = this.rootStore.useState('open');
    const floatingElement = this.rootStore.useState('floatingElement');
    const enabled = this.settings.enabled;
    const escapeKey = this.settings.escapeKey;
    const outsidePress = this.settings.outsidePress;
    const outsidePressEnabled = outsidePress !== false;
    const escapeKeyBubbles = this.settings.escapeKeyBubbles;
    const outsidePressBubbles = this.settings.outsidePressBubbles;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (!open || !enabled) {
        return undefined;
      }

      this.rootStore.context.dataRef.current.__escapeKeyBubbles = escapeKeyBubbles;
      this.rootStore.context.dataRef.current.__outsidePressBubbles = outsidePressBubbles;

      const compositionTimeout = new Timeout();

      const handleCompositionStart = () => {
        compositionTimeout.clear();
        this.isComposingRef = true;
      };

      const handleCompositionEnd = () => {
        // Safari fires `compositionend` before `keydown`, so we need to wait
        // until the next tick to set `isComposing` to `false`.
        // https://bugs.webkit.org/show_bug.cgi?id=165004
        compositionTimeout.start(
          // 0ms or 1ms don't work in Safari. 5ms appears to consistently work.
          // Only apply to WebKit for the test to remain 0ms.
          isWebKit() ? 5 : 0,
          () => {
            this.isComposingRef = false;
          },
        );
      };

      const doc = ownerDocument(floatingElement);
      const unsubscribe = mergeCleanups(
        escapeKey &&
          mergeCleanups(
            addEventListener(doc, 'keydown', this.closeOnEscapeKeyDown),
            addEventListener(doc, 'compositionstart', handleCompositionStart),
            addEventListener(doc, 'compositionend', handleCompositionEnd),
          ),
        outsidePressEnabled &&
          mergeCleanups(
            addEventListener(doc, 'click', this.closeOnPressOutsideCapture, true),
            addEventListener(doc, 'pointerdown', this.closeOnPressOutsideCapture, true),
            addEventListener(doc, 'pointerup', this.handlePressEndCapture, true),
            addEventListener(doc, 'pointercancel', this.handlePressEndCapture, true),
            addEventListener(doc, 'mousedown', this.closeOnPressOutsideCapture, true),
            addEventListener(doc, 'mouseup', this.handlePressEndCapture, true),
            addEventListener(doc, 'touchstart', this.handleTouchStartCapture, true),
            addEventListener(doc, 'touchmove', this.handleTouchMoveCapture, true),
            addEventListener(doc, 'touchend', this.handleTouchEndCapture, true),
          ),
      );

      return () => {
        unsubscribe();
        compositionTimeout.clear();
        this.preventedPressSuppressionTimeout.clear();
        this.resetPressStartState();
        this.suppressNextOutsideClickRef = false;
      };
    }, [
      enabled,
      escapeKey,
      escapeKeyBubbles,
      floatingElement,
      open,
      outsidePressBubbles,
      outsidePressEnabled,
    ]);

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/rules-of-hooks
    React.useEffect(this.clearInsideReactTree, [outsidePress, this.clearInsideReactTree]);
  }

  public getReferenceProps(
    enabled = this.settings.enabled,
    referencePressEvent = this.settings.referencePressEvent,
  ): HTMLProps {
    if (!enabled) {
      return EMPTY_OBJECT;
    }

    return {
      onKeyDown: this.closeOnEscapeKeyDown,
      [bubbleHandlerKeys[referencePressEvent]]: this.closeOnReferencePress,
      ...(referencePressEvent !== 'intentional' && {
        onClick: this.closeOnReferencePress,
      }),
    };
  }

  private markPressStartedInsideReactTree = (event: React.PointerEvent | React.MouseEvent) => {
    if (!this.rootStore.select('open') || !this.settings.enabled || event.button !== 0) {
      return;
    }

    const target = getTarget(event.nativeEvent) as Element | null;

    // Only treat presses that start within the floating DOM subtree as inside.
    // This avoids suppressing parent dismissal when interacting with nested portals.
    if (!contains(this.rootStore.select('floatingElement'), target)) {
      return;
    }

    if (!this.pressStartedInsideRef) {
      this.pressStartedInsideRef = true;
      this.pressStartPreventedRef = false;
    }
  };

  private markInsidePressStartPrevented = (event: React.PointerEvent | React.MouseEvent) => {
    if (!this.rootStore.select('open') || !this.settings.enabled) {
      return;
    }

    if (!(event.defaultPrevented || event.nativeEvent.defaultPrevented)) {
      return;
    }

    if (this.pressStartedInsideRef) {
      this.pressStartPreventedRef = true;
    }
  };

  public getFloatingProps(enabled = this.settings.enabled): HTMLProps {
    if (!enabled) {
      return EMPTY_OBJECT;
    }

    return {
      onKeyDown: this.closeOnEscapeKeyDown,
      // `onMouseDown` may be blocked if `event.preventDefault()` is called in
      // `onPointerDown`, such as with <NumberField.ScrubArea>.
      // See https://github.com/mui/base-ui/pull/3379
      onPointerDown: this.markInsidePressStartPrevented,
      onMouseDown: this.markInsidePressStartPrevented,
      onClickCapture: this.markInsideReactTree,
      onMouseDownCapture: (event) => {
        this.markInsideReactTree();
        this.markPressStartedInsideReactTree(event);
      },
      onPointerDownCapture: (event) => {
        this.markInsideReactTree();
        this.markPressStartedInsideReactTree(event);
      },
      onMouseUpCapture: this.markInsideReactTree,
      onTouchEndCapture: this.markInsideReactTree,
      onTouchMoveCapture: this.markInsideReactTree,
    };
  }

  public dispose() {
    this.cancelDismissOnEndTimeout.clear();
    this.clearInsideReactTreeTimeout.clear();
    this.preventedPressSuppressionTimeout.clear();
  }
}

/**
 * Closes the floating element when a dismissal is requested — by default, when
 * the user presses the `escape` key or outside of the floating element.
 * @see https://floating-ui.com/docs/useDismiss
 */
export function useDismiss(
  context: FloatingRootContext | FloatingContext,
  props: UseDismissProps = {},
): ElementProps {
  const store = 'rootStore' in context ? context.rootStore : context;
  const tree = useFloatingTree(props.externalTree);

  const controllerParameters = {
    ...props,
    tree,
  };

  const controllerRef = React.useRef<DismissInteractionController | null>(null);

  if (controllerRef.current === null || controllerRef.current.rootStore !== store) {
    controllerRef.current = new DismissInteractionController(store, controllerParameters);
  }

  const controller = controllerRef.current;
  controller.updateSettings(controllerParameters);

  const enabled = props.enabled ?? true;
  const referencePressEvent = props.referencePressEvent ?? 'sloppy';

  const referenceProps = React.useMemo<HTMLProps>(
    () => controller.getReferenceProps(enabled, referencePressEvent),
    [controller, enabled, referencePressEvent],
  );
  const floatingProps = React.useMemo<HTMLProps>(
    () => controller.getFloatingProps(enabled),
    [controller, enabled],
  );

  controller.useSetup();

  React.useEffect(() => {
    return () => {
      controller.dispose();
    };
  }, [controller]);

  return React.useMemo(
    () => ({
      reference: referenceProps,
      trigger: referenceProps,
      floating: floatingProps,
    }),
    [referenceProps, floatingProps],
  );
}
