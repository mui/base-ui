import * as React from 'react';
import { getOverflowAncestors } from '@floating-ui/react-dom';
import {
  getComputedStyle,
  getParentNode,
  isElement,
  isHTMLElement,
  isLastTraversableNode,
  isWebKit,
} from '@floating-ui/utils/dom';
import { Timeout } from '@base-ui/utils/useTimeout';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import {
  contains,
  getDocument,
  getTarget,
  isEventTargetWithin,
  isReactEvent,
  isRootElement,
  getNodeChildren,
} from '../utils';

/* eslint-disable no-underscore-dangle */

import { useFloatingTree } from '../components/FloatingTree';
import { FloatingTreeStore } from '../components/FloatingTreeStore';
import type { ElementProps, FloatingContext, FloatingRootContext } from '../types';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { createAttribute } from '../utils/createAttribute';
import { HTMLProps } from '../../utils/types';

type PressType = 'intentional' | 'sloppy';

const bubbleHandlerKeys = {
  intentional: 'onClick',
  sloppy: 'onPointerDown',
} as const;

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
   * @default false
   */
  referencePress?: boolean | undefined;
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
  outsidePress?: (boolean | ((event: MouseEvent | TouchEvent) => boolean)) | undefined;
  /**
   * The type of event to use to determine an outside "press".
   * - `intentional` requires the user to click outside intentionally, firing on `pointerup` for mouse, and requiring minimal `touchmove`s for touch.
   * - `sloppy` fires on `pointerdown` for mouse, while for touch it fires on `touchend` (within 1 second) or while scrolling away after `touchstart`.
   */
  outsidePressEvent?:
    | (
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
      )
    | undefined;
  /**
   * Whether to dismiss the floating element upon scrolling an overflow
   * ancestor.
   * @default false
   */
  ancestorScroll?: boolean | undefined;
  /**
   * Determines whether event listeners bubble upwards through a tree of
   * floating elements.
   */
  bubbles?:
    | (boolean | { escapeKey?: boolean | undefined; outsidePress?: boolean | undefined })
    | undefined;
  /**
   * External FlatingTree to use when the one provided by context can't be used.
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

  public onPropsChange?: () => void;

  constructor(
    public rootStore: FloatingRootContext,
    settings: DismissInteractionControllerParameters,
  ) {
    this.settings = this.generateSettings(settings);
  }

  public updateSettings(settings: DismissInteractionControllerParameters) {
    const nextSettings = this.generateSettings(settings);
    const shouldUpdateProps =
      this.settings.enabled !== nextSettings.enabled ||
      this.settings.referencePress !== nextSettings.referencePress ||
      this.settings.referencePressEvent !== nextSettings.referencePressEvent;

    this.settings = nextSettings;

    if (shouldUpdateProps) {
      this.onPropsChange?.();
    }
  }

  private generateSettings(
    settings: DismissInteractionControllerParameters,
  ): DismissInteractionControllerSettings {
    const { escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles } = normalizeProp(
      settings.bubbles,
    );

    const outsidePressFn =
      typeof settings.outsidePress === 'function' ? settings.outsidePress : () => false;

    this.outsidePress =
      typeof settings.outsidePress === 'function'
        ? outsidePressFn
        : (settings.outsidePress ?? true);

    return {
      enabled: settings.enabled ?? true,
      escapeKey: settings.escapeKey ?? true,
      referencePress: settings.referencePress ?? false,
      referencePressEvent: settings.referencePressEvent ?? 'sloppy',
      outsidePress: settings.outsidePress ?? true,
      outsidePressEvent: settings.outsidePressEvent ?? 'sloppy',
      ancestorScroll: settings.ancestorScroll ?? false,
      tree: settings.tree,
      escapeKeyBubbles,
      outsidePressBubbles,
    };
  }

  private outsidePress: boolean | ((event: MouseEvent | TouchEvent) => boolean) = () => false;

  private endedOrStartedInsideRef = false;

  private touchStateRef: {
    startTime: number;
    startX: number;
    startY: number;
    dismissOnTouchEnd: boolean;
    dismissOnMouseDown: boolean;
  } | null = null;

  private cancelDismissOnEndTimeout = new Timeout();

  private clearInsideReactTreeTimeout = new Timeout();

  private isComposingRef = false;

  private currentPointerTypeRef: PointerEvent['pointerType'] = '';

  private trackPointerType = (event: PointerEvent) => {
    this.currentPointerTypeRef = event.pointerType;
  };

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

    const nodeId = this.rootStore.context.dataRef.current.floatingContext?.nodeId;

    const children = this.settings.tree
      ? getNodeChildren(this.settings.tree.nodesRef.current, nodeId)
      : [];

    if (!this.settings.escapeKeyBubbles) {
      if (children.length > 0) {
        let shouldDismiss = true;

        children.forEach((child) => {
          if (child.context?.open && !child.context.dataRef.current.__escapeKeyBubbles) {
            shouldDismiss = false;
          }
        });

        if (!shouldDismiss) {
          return;
        }
      }
    }

    const native = isReactEvent(event) ? event.nativeEvent : event;
    const eventDetails = createChangeEventDetails(REASONS.escapeKey, native);

    this.rootStore.setOpen(false, eventDetails);

    if (!this.settings.escapeKeyBubbles && !eventDetails.isPropagationAllowed) {
      event.stopPropagation();
    }
  };

  private shouldIgnoreEvent(event: Event) {
    const computedOutsidePressEvent = this.getOutsidePressEvent();
    return (
      (computedOutsidePressEvent === 'intentional' && event.type !== 'click') ||
      (computedOutsidePressEvent === 'sloppy' && event.type === 'click')
    );
  }

  private markInsideReactTree = () => {
    this.rootStore.context.dataRef.current.insideReactTree = true;
    this.clearInsideReactTreeTimeout.start(0, this.clearInsideReactTree);
  };

  private clearInsideReactTree = () => {
    this.clearInsideReactTreeTimeout.clear();
    this.rootStore.context.dataRef.current.insideReactTree = false;
  };

  private closeOnPressOutside = (
    event: MouseEvent | PointerEvent | TouchEvent,
    endedOrStartedInside = false,
  ) => {
    if (this.shouldIgnoreEvent(event)) {
      this.clearInsideReactTree();
      return;
    }

    if (this.rootStore.context.dataRef.current.insideReactTree) {
      this.clearInsideReactTree();
      return;
    }

    if (this.getOutsidePressEvent() === 'intentional' && endedOrStartedInside) {
      return;
    }

    if (typeof this.outsidePress === 'function' && !this.outsidePress(event)) {
      return;
    }

    const target = getTarget(event);
    const inertSelector = `[${createAttribute('inert')}]`;
    const markers = getDocument(this.rootStore.select('floatingElement')).querySelectorAll(
      inertSelector,
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
      Array.from(markers).every((marker) => !contains(targetRootAncestor, marker))
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

    const nodeId = this.rootStore.context.dataRef.current.floatingContext?.nodeId;

    const targetIsInsideChildren =
      this.settings.tree &&
      getNodeChildren(this.settings.tree.nodesRef.current, nodeId).some((node) =>
        isEventTargetWithin(event, node.context?.elements.floating),
      );

    if (
      isEventTargetWithin(event, this.rootStore.select('floatingElement')) ||
      isEventTargetWithin(event, this.rootStore.select('domReferenceElement')) ||
      targetIsInsideChildren
    ) {
      return;
    }

    const children = this.settings.tree
      ? getNodeChildren(this.settings.tree.nodesRef.current, nodeId)
      : [];
    if (children.length > 0) {
      let shouldDismiss = true;

      children.forEach((child) => {
        if (child.context?.open && !child.context.dataRef.current.__outsidePressBubbles) {
          shouldDismiss = false;
        }
      });

      if (!shouldDismiss) {
        return;
      }
    }

    this.rootStore.setOpen(false, createChangeEventDetails(REASONS.outsidePress, event));
    this.clearInsideReactTree();
  };

  private handlePointerDown(event: PointerEvent) {
    if (
      this.getOutsidePressEvent() !== 'sloppy' ||
      event.pointerType === 'touch' ||
      !this.rootStore.select('open') ||
      !this.settings.enabled ||
      isEventTargetWithin(event, this.rootStore.select('floatingElement')) ||
      isEventTargetWithin(event, this.rootStore.select('domReferenceElement'))
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
      isEventTargetWithin(event, this.rootStore.select('floatingElement')) ||
      isEventTargetWithin(event, this.rootStore.select('domReferenceElement'))
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

  private handleTouchStartCapture = (event: TouchEvent) => {
    const target = getTarget(event);
    const callback = () => {
      this.handleTouchStart(event);
      target?.removeEventListener(event.type, callback);
    };

    target?.addEventListener(event.type, callback);
  };

  private closeOnPressOutsideCapture = (event: PointerEvent | MouseEvent) => {
    // When click outside is lazy (`up` event), handle dragging.
    // Don't close if:
    // - The click started inside the floating element.
    // - The click ended inside the floating element.
    const endedOrStartedInside = this.endedOrStartedInsideRef;
    this.endedOrStartedInsideRef = false;

    this.cancelDismissOnEndTimeout.clear();

    if (
      event.type === 'mousedown' &&
      this.touchStateRef &&
      !this.touchStateRef.dismissOnMouseDown
    ) {
      return;
    }

    const target = getTarget(event);

    const callback = () => {
      if (event.type === 'pointerdown') {
        this.handlePointerDown(event as PointerEvent);
      } else {
        this.closeOnPressOutside(event as MouseEvent, endedOrStartedInside);
      }
      target?.removeEventListener(event.type, callback);
    };
    target?.addEventListener(event.type, callback);
  };

  private handleTouchMove(event: TouchEvent) {
    if (
      this.getOutsidePressEvent() !== 'sloppy' ||
      !this.touchStateRef ||
      isEventTargetWithin(event, this.rootStore.select('floatingElement')) ||
      isEventTargetWithin(event, this.rootStore.select('domReferenceElement'))
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
    const target = getTarget(event);
    const callback = () => {
      this.handleTouchMove(event);
      target?.removeEventListener(event.type, callback);
    };
    target?.addEventListener(event.type, callback);
  };

  private handleTouchEnd(event: TouchEvent) {
    if (
      this.getOutsidePressEvent() !== 'sloppy' ||
      !this.touchStateRef ||
      isEventTargetWithin(event, this.rootStore.select('floatingElement')) ||
      isEventTargetWithin(event, this.rootStore.select('domReferenceElement'))
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
    const target = getTarget(event);
    const callback = () => {
      this.handleTouchEnd(event);
      target?.removeEventListener(event.type, callback);
    };
    target?.addEventListener(event.type, callback);
  };

  private handleAncestorScroll = (event: Event) => {
    this.rootStore.setOpen(false, createChangeEventDetails(REASONS.none, event));
  };

  private handlePressedInside = (event: React.MouseEvent) => {
    const target = getTarget(event.nativeEvent) as Element | null;
    if (!contains(this.rootStore.select('floatingElement'), target) || event.button !== 0) {
      return;
    }
    this.endedOrStartedInsideRef = true;
  };

  public useSetup() {
    const open = this.rootStore.useState('open');
    const floatingElement = this.rootStore.useState('floatingElement');
    const referenceElement = this.rootStore.useState('referenceElement');
    const domReferenceElement = this.rootStore.useState('domReferenceElement');

    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      const escapeKey = this.settings.escapeKey;
      const outsidePress = this.settings.outsidePress;

      if (!open || !this.settings.enabled) {
        return undefined;
      }

      this.rootStore.context.dataRef.current.__escapeKeyBubbles = this.settings.escapeKeyBubbles;
      this.rootStore.context.dataRef.current.__outsidePressBubbles =
        this.settings.outsidePressBubbles;

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

      const doc = getDocument(floatingElement);

      doc.addEventListener('pointerdown', this.trackPointerType, true);

      if (escapeKey) {
        doc.addEventListener('keydown', this.closeOnEscapeKeyDown);
        doc.addEventListener('compositionstart', handleCompositionStart);
        doc.addEventListener('compositionend', handleCompositionEnd);
      }

      if (outsidePress) {
        doc.addEventListener('click', this.closeOnPressOutsideCapture, true);
        doc.addEventListener('pointerdown', this.closeOnPressOutsideCapture, true);
        doc.addEventListener('touchstart', this.handleTouchStartCapture, true);
        doc.addEventListener('touchmove', this.handleTouchMoveCapture, true);
        doc.addEventListener('touchend', this.handleTouchEndCapture, true);
        doc.addEventListener('mousedown', this.closeOnPressOutsideCapture, true);
      }

      let ancestors: (Element | Window | VisualViewport)[] = [];

      if (this.settings.ancestorScroll) {
        if (isElement(domReferenceElement)) {
          ancestors = getOverflowAncestors(domReferenceElement);
        }

        if (isElement(floatingElement)) {
          ancestors = ancestors.concat(getOverflowAncestors(floatingElement));
        }

        if (!isElement(referenceElement) && referenceElement && referenceElement.contextElement) {
          ancestors = ancestors.concat(getOverflowAncestors(referenceElement.contextElement));
        }
      }

      // Ignore the visual viewport for scrolling dismissal (allow pinch-zoom)
      ancestors = ancestors.filter((ancestor) => ancestor !== doc.defaultView?.visualViewport);

      ancestors.forEach((ancestor) => {
        ancestor.addEventListener('scroll', this.handleAncestorScroll, { passive: true });
      });

      return () => {
        doc.removeEventListener('pointerdown', this.trackPointerType, true);

        if (escapeKey) {
          doc.removeEventListener('keydown', this.closeOnEscapeKeyDown);
          doc.removeEventListener('compositionstart', handleCompositionStart);
          doc.removeEventListener('compositionend', handleCompositionEnd);
        }

        if (outsidePress) {
          doc.removeEventListener('click', this.closeOnPressOutsideCapture, true);
          doc.removeEventListener('pointerdown', this.closeOnPressOutsideCapture, true);
          doc.removeEventListener('touchstart', this.handleTouchStartCapture, true);
          doc.removeEventListener('touchmove', this.handleTouchMoveCapture, true);
          doc.removeEventListener('touchend', this.handleTouchEndCapture, true);
          doc.removeEventListener('mousedown', this.closeOnPressOutsideCapture, true);
        }

        ancestors.forEach((ancestor) => {
          ancestor.removeEventListener('scroll', this.handleAncestorScroll);
        });

        compositionTimeout.clear();
        this.endedOrStartedInsideRef = false;
      };
    }, [floatingElement, open, referenceElement, domReferenceElement]);

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/rules-of-hooks
    React.useEffect(this.clearInsideReactTree, [
      this.settings.outsidePress,
      this.clearInsideReactTree,
    ]);
  }

  public getReferenceProps(): HTMLProps {
    if (!this.settings.enabled) {
      return EMPTY_OBJECT;
    }

    return {
      onKeyDown: this.closeOnEscapeKeyDown,
      ...(this.settings.referencePress && {
        [bubbleHandlerKeys[this.settings.referencePressEvent]]: (event: React.SyntheticEvent) => {
          this.rootStore.setOpen(
            false,
            createChangeEventDetails(REASONS.triggerPress, event.nativeEvent as any),
          );
        },
        ...(this.settings.referencePressEvent !== 'intentional' && {
          onClick: (event) => {
            this.rootStore.setOpen(
              false,
              createChangeEventDetails(REASONS.triggerPress, event.nativeEvent),
            );
          },
        }),
      }),
    };
  }

  markPressStartedInsideReactTree = (event: React.PointerEvent | React.MouseEvent) => {
    if (!this.rootStore.select('open') || !this.settings.enabled || event.button !== 0) {
      return;
    }
    this.endedOrStartedInsideRef = true;
  };

  public getFloatingProps(): HTMLProps {
    if (!this.settings.enabled) {
      return EMPTY_OBJECT;
    }

    return {
      onKeyDown: this.closeOnEscapeKeyDown,
      onPointerDown: this.handlePressedInside,
      onMouseDown: this.handlePressedInside,
      onMouseUp: this.handlePressedInside,
      onMouseDownCapture: (event) => {
        this.markInsideReactTree();
        this.markPressStartedInsideReactTree(event);
      },
      onPointerDownCapture: (event) => {
        this.markInsideReactTree();
        this.markPressStartedInsideReactTree(event);
      },
      onClickCapture: this.markInsideReactTree,
      onMouseUpCapture: this.markInsideReactTree,
      onTouchEndCapture: this.markInsideReactTree,
      onTouchMoveCapture: this.markInsideReactTree,
    };
  }

  public dispose() {
    this.cancelDismissOnEndTimeout.clear();
    this.clearInsideReactTreeTimeout.clear();
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

  const [referenceProps, setReferenceProps] = React.useState<HTMLProps>(
    controller.getReferenceProps(),
  );
  const [floatingProps, setFloatingProps] = React.useState<HTMLProps>(
    controller.getFloatingProps(),
  );

  // Update controller settings on each render
  useIsoLayoutEffect(() => {
    controller.updateSettings(controllerParameters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, Object.values(controllerParameters));

  controller.onPropsChange = () => {
    setReferenceProps(controller.getReferenceProps());
    setFloatingProps(controller.getFloatingProps());
  };

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
