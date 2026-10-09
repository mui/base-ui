'use client';
import * as React from 'react';
import { getNodeName, isHTMLElement } from '@floating-ui/utils/dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { platform } from '@base-ui/utils/platform';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { ownerDocument } from '@base-ui/utils/owner';
import { activeElement, closest, contains, getTarget } from '@base-ui/utils/shadowDom';
import { FocusGuard } from './FocusGuard';
import { isTypeableCombobox, getFloatingFocusElement, isTypeableElement } from '../element';
import { isVirtualClick, stopEvent } from '../event';
import {
  tabbable,
  focusable,
  isOutsideEvent,
  isTabbable,
  getNextTabbable,
  getPreviousTabbable,
} from './tabbable';
import type { FocusableElement } from './tabbable';
import { isElementVisible } from '../../../internals/composite/listIndex';
import type { FloatingRootContext } from '../floating-root/types';
import { createChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import { REASONS } from '../../../internals/reasons';
import { createAttribute } from '../createAttribute';
import { enqueueFocus } from './enqueueFocus';
import { markOthers } from './markOthers';
import { usePortalContext } from '../portal/FloatingPortal';
import { useFloatingTree } from '../tree/FloatingTree';
import type { FloatingTreeStore } from '../tree/FloatingTreeStore';
import { CLICK_TRIGGER_IDENTIFIER } from '../../../internals/constants';
import { resolveRef } from '../../resolveRef';
import {
  getPopupDismissal,
  recordCloseForReturnFocus,
  resolveReturnFocusElement,
  returnFocusOnClose,
} from '../interactions/popupDismissal';

const LIST_LIMIT = 20;
let previouslyFocusedElements: WeakRef<Element>[] = [];

function clearDisconnectedPreviouslyFocusedElements() {
  previouslyFocusedElements = previouslyFocusedElements.filter((entry) => {
    return entry.deref()?.isConnected;
  });
}

function addPreviouslyFocusedElement(element: Element | null | undefined) {
  clearDisconnectedPreviouslyFocusedElements();
  if (element && getNodeName(element) !== 'body') {
    previouslyFocusedElements.push(new WeakRef(element));
    if (previouslyFocusedElements.length > LIST_LIMIT) {
      previouslyFocusedElements = previouslyFocusedElements.slice(-LIST_LIMIT);
    }
  }
}

function getPreviouslyFocusedElement() {
  clearDisconnectedPreviouslyFocusedElements();
  return previouslyFocusedElements[previouslyFocusedElements.length - 1]?.deref();
}

function getFirstTabbableElement(container: Element | null) {
  if (!container) {
    return null;
  }

  if (isTabbable(container)) {
    return container;
  }

  return tabbable(container)[0] || container;
}

function handleTabIndex(floatingFocusElement: HTMLElement) {
  if (
    floatingFocusElement.hasAttribute('tabindex') &&
    !floatingFocusElement.hasAttribute('data-tabindex')
  ) {
    return;
  }

  if (!floatingFocusElement.getAttribute('role')?.includes('dialog')) {
    return;
  }

  const focusableElements = focusable(floatingFocusElement);
  const tabbableContent = focusableElements.filter((element) => {
    const dataTabIndex = element.getAttribute('data-tabindex') || '';
    return (
      isTabbable(element) ||
      (element.hasAttribute('data-tabindex') && !dataTabIndex.startsWith('-'))
    );
  });
  const tabIndex = floatingFocusElement.getAttribute('tabindex');

  if (tabbableContent.length === 0) {
    if (tabIndex !== '0') {
      floatingFocusElement.setAttribute('tabindex', '0');
      // Mark our own write so the externally-managed early-return above doesn't
      // mistake it for a user-authored `tabindex` and freeze management.
      floatingFocusElement.setAttribute('data-tabindex', '0');
    }
  } else if (
    tabIndex !== '-1' ||
    (floatingFocusElement.hasAttribute('data-tabindex') &&
      floatingFocusElement.getAttribute('data-tabindex') !== '-1')
  ) {
    floatingFocusElement.setAttribute('tabindex', '-1');
    floatingFocusElement.setAttribute('data-tabindex', '-1');
  }
}

export interface FloatingFocusManagerProps {
  children: React.JSX.Element;
  /**
   * The floating context returned from `useFloatingRootContext`.
   */
  context: FloatingRootContext;
  /**
   * The interaction type used to open the floating element.
   */
  openInteractionType?: InteractionType | null | undefined;
  /**
   * Whether or not the focus manager should be disabled. Useful to delay focus
   * management until after a transition completes or some other conditional
   * state.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Determines the element to focus when the floating element is opened.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (first tabbable element or floating element).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use default behavior, `null` to fallback to default behavior,
   *   or `false`/`undefined` to do nothing.
   * @default true
   */
  initialFocus?:
    | boolean
    | React.RefObject<HTMLElement | null>
    | ((openType: InteractionType) => boolean | HTMLElement | null | void)
    | undefined;
  /**
   * Determines the element to focus when the floating element is closed.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (reference or previously focused element).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, `null` to fallback to default behavior,
   *   or `false`/`undefined` to do nothing.
   * @default true
   */
  returnFocus?:
    | boolean
    | React.RefObject<HTMLElement | null>
    | ((closeType: InteractionType) => boolean | HTMLElement | null | void)
    | undefined;
  /**
   * Whether `returnFocus` is an explicit consumer target. Internal dynamic defaults use `false`
   * so focus that has already moved outside the floating tree is respected.
   * @internal
   */
  explicitReturnFocus?: boolean | undefined;
  /**
   * Determines where focus should be restored if focus inside the floating element is lost
   * (such as due to the removal of the currently focused element from the DOM).
   *
   * - `true`: restore to the nearest tabbable element inside the floating tree (previous
   *   tabbable if possible, otherwise the last tabbable, then the floating element itself)
   * - `'popup'`: restore directly to the floating element (container) itself
   * - `false`: do not restore focus
   * @default false
   */
  restoreFocus?: boolean | 'popup' | undefined;
  /**
   * Determines if focus is “modal”, meaning focus is fully trapped inside the
   * floating element and outside content cannot be accessed. This includes
   * screen reader virtual cursors.
   * @default true
   */
  modal?: boolean | undefined;
  /**
   * Determines whether `focusout` event listeners that control whether the
   * floating element should be closed if the focus moves outside of it are
   * attached to the reference and floating elements. This affects non-modal
   * focus management.
   * @default true
   */
  closeOnFocusOut?: boolean | undefined;
  /**
   * Overrides the element to focus when tabbing forward out of the floating element.
   */
  nextFocusableElement?: HTMLElement | React.RefObject<HTMLElement | null> | null | undefined;
  /**
   * Overrides the element to focus when tabbing backward out of the floating element.
   */
  previousFocusableElement?: HTMLElement | React.RefObject<HTMLElement | null> | null | undefined;
  /**
   * Ref to the focus guard preceding the floating element content.
   * Can be useful to focus the popup programmatically.
   */
  beforeContentFocusGuardRef?: React.RefObject<HTMLSpanElement | null> | undefined;
  /**
   * External FloatingTree to use when the one provided by context can't be used.
   */
  externalTree?: FloatingTreeStore | undefined;
  /**
   * Additional elements that should be treated as part of the floating subtree
   * even if they are rendered outside the floating element itself.
   */
  getInsideElements?: (() => Array<Element | null | undefined>) | undefined;
}

/**
 * Provides focus management for the floating element.
 * @see https://floating-ui.com/docs/FloatingFocusManager
 * @internal
 */
export function FloatingFocusManager(props: FloatingFocusManagerProps): React.JSX.Element {
  const {
    context: store,
    children,
    disabled = false,
    initialFocus = true,
    returnFocus = true,
    explicitReturnFocus,
    restoreFocus = false,
    modal = true,
    closeOnFocusOut = true,
    openInteractionType = '',
    nextFocusableElement,
    previousFocusableElement,
    beforeContentFocusGuardRef,
    externalTree,
    getInsideElements,
  } = props;

  const open = store.useState('open');
  const domReference = store.useState('domReferenceElement');
  const lastTrigger = store.useState('lastTriggerElement');
  const floating = store.useState('floatingElement');

  const { dataRef } = store.context;
  const dismissal = getPopupDismissal(store);

  const getNodeId = useStableCallback(() => dataRef.current.positioning?.nodeId);

  const ignoreInitialFocus = initialFocus === false;
  // A typeable combobox reference (e.g. input/textarea) with `initialFocus={false}`
  // has different focus semantics: focus is not trapped inside the floating element,
  // so in the modal case the guards are not rendered, but `aria-hidden` is still
  // applied to the outside nodes.
  const isUntrappedTypeableCombobox = isTypeableCombobox(domReference) && ignoreInitialFocus;

  const initialFocusRef = useValueAsRef(initialFocus);
  const returnFocusRef = useValueAsRef(returnFocus);
  // Read through a ref so a mid-open change can't re-run the return-focus effect, whose cleanup
  // would move focus while the floating element is still open.
  const explicitReturnFocusRef = useValueAsRef(explicitReturnFocus);
  const openInteractionTypeRef = useValueAsRef(openInteractionType);
  const openRef = useValueAsRef(open);

  const tree = useFloatingTree(externalTree);
  const portalContext = usePortalContext();

  // The interaction and return focus state of this instance.
  const session = useRefWithInit(() => dismissal.createFocusReturnSession()).current;
  const isPointerDownRef = React.useRef(false);
  const lastFocusedTabbableRef = React.useRef<FocusableElement | null>(null);

  const beforeGuardRef = React.useRef<HTMLSpanElement | null>(null);
  const afterGuardRef = React.useRef<HTMLSpanElement | null>(null);

  const mergedBeforeGuardRef = useMergedRefs(
    beforeGuardRef,
    beforeContentFocusGuardRef,
    portalContext?.beforeInsideRef,
  );
  const mergedAfterGuardRef = useMergedRefs(afterGuardRef, portalContext?.afterInsideRef);

  const blurTimeout = useTimeout();
  const pointerDownTimeout = useTimeout();
  const restoreFocusFrame = useAnimationFrame();

  const isInsidePortal = portalContext != null;
  const floatingFocusElement = getFloatingFocusElement(floating);

  const getTabbableContent = useStableCallback(
    (container: Element | null = floatingFocusElement) => {
      return container ? tabbable(container) : [];
    },
  );

  const getResolvedInsideElements = useStableCallback(
    () => getInsideElements?.().filter((element): element is Element => element != null) ?? [],
  );

  // Prevent Tab from escaping the modal when there are no tabbable elements.
  React.useEffect(() => {
    if (disabled || !modal) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        // The focus guards have nothing to focus, so we need to stop the event.
        if (
          contains(floatingFocusElement, activeElement(ownerDocument(floatingFocusElement))) &&
          getTabbableContent().length === 0 &&
          !isUntrappedTypeableCombobox
        ) {
          stopEvent(event);
        }
      }
    }

    const doc = ownerDocument(floatingFocusElement);
    return addEventListener(doc, 'keydown', onKeyDown);
  }, [disabled, floatingFocusElement, modal, isUntrappedTypeableCombobox, getTabbableContent]);

  // Track pointer/keyboard interactions to disambiguate focus and outside presses.
  React.useEffect(() => {
    if (disabled || !open) {
      return undefined;
    }

    const doc = ownerDocument(floatingFocusElement);

    function clearPointerDownOutside() {
      session.pointerDownOutside = false;
    }

    function onPointerDown(event: PointerEvent) {
      const target = getTarget(event) as Element | null;
      const insideElements = getResolvedInsideElements();
      const pointerTargetInside =
        contains(floating, target) ||
        contains(domReference, target) ||
        contains(portalContext?.portalNode, target) ||
        insideElements.some((element) => element === target || contains(element, target));
      session.pointerDownOutside = !pointerTargetInside;
      session.lastInteractionType =
        (event.pointerType as React.PointerEvent['pointerType']) || 'keyboard';

      if (closest(target, `[${CLICK_TRIGGER_IDENTIFIER}]`)) {
        isPointerDownRef.current = true;
        // Reset on the next tick so a single click on a click-trigger doesn't
        // permanently suppress focus-out closing for the lifetime of the instance.
        pointerDownTimeout.start(0, () => {
          isPointerDownRef.current = false;
        });
      }
    }

    function onKeyDown() {
      session.lastInteractionType = 'keyboard';
    }

    return mergeCleanups(
      addEventListener(doc, 'pointerdown', onPointerDown, true),
      addEventListener(doc, 'pointerup', clearPointerDownOutside, true),
      addEventListener(doc, 'pointercancel', clearPointerDownOutside, true),
      addEventListener(doc, 'keydown', onKeyDown, true),
      // Avoid a stale `true` leaking into the next open (e.g. keep-mounted popups)
      // if the popup dismissed between pointerdown and pointerup.
      clearPointerDownOutside,
    );
  }, [
    session,
    disabled,
    floating,
    domReference,
    floatingFocusElement,
    open,
    portalContext,
    pointerDownTimeout,
    getResolvedInsideElements,
  ]);

  // Close on focus out and restore focus within the floating tree when needed.
  React.useEffect(() => {
    if (disabled || !closeOnFocusOut) {
      return undefined;
    }

    const doc = ownerDocument(floatingFocusElement);

    // In Safari, buttons lose focus when pressing them.
    function handlePointerDown() {
      isPointerDownRef.current = true;
      pointerDownTimeout.start(0, () => {
        isPointerDownRef.current = false;
      });
    }

    function handleFocusIn(event: FocusEvent) {
      const target = getTarget(event) as FocusableElement | null;
      if (isTabbable(target)) {
        lastFocusedTabbableRef.current = target;
      }
    }

    function handleFocusOutside(event: FocusEvent) {
      const relatedTarget = event.relatedTarget as HTMLElement | null;
      const currentTarget = event.currentTarget;
      const target = getTarget(event) as HTMLElement | null;

      // When focus is lost to the body (e.g. on a backdrop press), record the element that
      // had focus so a confirmation dialog opened while the body is focused can return focus
      // to it. Scoped to `modal` to avoid non-modal popups polluting the shared stack.
      if (modal && relatedTarget == null && target != null && contains(floating, target)) {
        addPreviouslyFocusedElement(target);
      }

      queueMicrotask(() => {
        const nodeId = getNodeId();
        const triggers = store.context.triggerElements;
        const insideElements = getResolvedInsideElements();
        const isRelatedFocusGuard =
          relatedTarget?.hasAttribute(createAttribute('focus-guard')) &&
          [
            beforeGuardRef.current,
            afterGuardRef.current,
            portalContext?.beforeInsideRef.current,
            portalContext?.afterInsideRef.current,
            portalContext?.beforeOutsideRef.current,
            portalContext?.afterOutsideRef.current,
            resolveRef(previousFocusableElement),
            resolveRef(nextFocusableElement),
          ].includes(relatedTarget);

        const movedToUnrelatedNode = !(
          contains(domReference, relatedTarget) ||
          contains(floating, relatedTarget) ||
          contains(relatedTarget, floating) ||
          contains(portalContext?.portalNode, relatedTarget) ||
          insideElements.some(
            (element) => element === relatedTarget || contains(element, relatedTarget),
          ) ||
          triggers.hasMatchingElement((trigger) => contains(trigger, relatedTarget)) ||
          isRelatedFocusGuard ||
          (tree &&
            (tree
              .descendants(nodeId)
              .find(
                (node) =>
                  contains(node.context?.elements.floating, relatedTarget) ||
                  contains(node.context?.elements.domReference, relatedTarget),
              ) ||
              tree
                .ancestors(nodeId)
                .find(
                  (node) =>
                    [
                      node.context?.elements.floating,
                      getFloatingFocusElement(node.context?.elements.floating),
                    ].includes(relatedTarget) ||
                    node.context?.elements.domReference === relatedTarget,
                )))
        );

        if (currentTarget === domReference && floatingFocusElement) {
          handleTabIndex(floatingFocusElement);
        }

        // Restore focus to the previously focused tabbable element to prevent
        // focus from being lost outside the floating tree.
        if (
          restoreFocus &&
          currentTarget !== domReference &&
          !isElementVisible(target) &&
          activeElement(doc) === doc.body
        ) {
          // Let `FloatingPortal` effect knows that focus is still inside the
          // floating tree.
          if (isHTMLElement(floatingFocusElement)) {
            floatingFocusElement.focus();
            // If explicitly requested to restore focus to the popup container, do not search
            // for the next/previous tabbable element.
            if (restoreFocus === 'popup') {
              // If the focused element is removed on pointerdown, the browser
              // tries to move focus to it right after the `.focus()` call above,
              // but because it's removed in the same tick, focus is lost instead.
              // Re-focusing asynchronously (next frame) wins that race.
              restoreFocusFrame.request(() => {
                floatingFocusElement.focus();
              });
              return;
            }
          }

          const tabbableContent = getTabbableContent() as Array<Element | null>;
          const prevTabbable = lastFocusedTabbableRef.current;
          const nodeToFocus =
            (prevTabbable && tabbableContent.includes(prevTabbable) ? prevTabbable : null) ||
            tabbableContent[tabbableContent.length - 1] ||
            floatingFocusElement;

          if (isHTMLElement(nodeToFocus)) {
            nodeToFocus.focus();
          }
        }

        // https://github.com/floating-ui/floating-ui/issues/3060
        if (dismissal.isInsideReactTree()) {
          dismissal.setInsideReactTree(false);
          return;
        }

        // Focus did not move inside the floating tree, and there are no tabbable
        // portal guards to handle closing.
        if (
          (isUntrappedTypeableCombobox ? true : !modal) &&
          relatedTarget &&
          movedToUnrelatedNode &&
          !isPointerDownRef.current &&
          // Fix React 18 Strict Mode returnFocus due to double rendering.
          // For an "untrapped" typeable combobox (input role=combobox with
          // initialFocus=false), re-opening the popup and tabbing out should still close it even
          // when the previously focused element (e.g. the next tabbable outside the popup) is
          // focused again. Otherwise, the popup remains open on the second Tab sequence:
          // click input -> Tab (closes) -> click input -> Tab.
          // Allow closing when `isUntrappedTypeableCombobox` regardless of the previously focused element.
          (isUntrappedTypeableCombobox || relatedTarget !== getPreviouslyFocusedElement())
        ) {
          session.preventReturnFocus = true;
          store.setOpen(false, createChangeEventDetails(REASONS.focusOut, event));
        }
      });
    }

    function markInsideReactTree() {
      if (session.pointerDownOutside) {
        return;
      }
      dismissal.setInsideReactTree(true);
      blurTimeout.start(0, () => {
        dismissal.setInsideReactTree(false);
      });
    }

    const domReferenceElement = isHTMLElement(domReference) ? domReference : null;
    if (!floating && !domReferenceElement) {
      return undefined;
    }

    return mergeCleanups(
      domReferenceElement && addEventListener(domReferenceElement, 'focusout', handleFocusOutside),
      domReferenceElement &&
        addEventListener(domReferenceElement, 'pointerdown', handlePointerDown),
      floating && addEventListener(floating, 'focusin', handleFocusIn),
      floating && addEventListener(floating, 'focusout', handleFocusOutside),
      floating &&
        portalContext &&
        addEventListener(floating, 'focusout', markInsideReactTree, true),
    );
  }, [
    session,
    disabled,
    domReference,
    floating,
    floatingFocusElement,
    modal,
    tree,
    portalContext,
    store,
    closeOnFocusOut,
    restoreFocus,
    getTabbableContent,
    isUntrappedTypeableCombobox,
    getNodeId,
    dataRef,
    dismissal,
    blurTimeout,
    pointerDownTimeout,
    restoreFocusFrame,
    nextFocusableElement,
    previousFocusableElement,
    getResolvedInsideElements,
  ]);

  // Hide everything outside the floating tree from assistive tech while open.
  React.useEffect(() => {
    if (disabled || !floating || !open) {
      return undefined;
    }

    // Don't hide portals nested within the parent portal.
    const portalNodes = Array.from(
      portalContext?.portalNode?.querySelectorAll(`[${createAttribute('portal')}]`) || [],
    );

    const ancestors = tree ? tree.ancestors(getNodeId()) : [];
    const rootAncestorComboboxDomReference = ancestors.find((node) =>
      isTypeableCombobox(node.context?.elements.domReference || null),
    )?.context?.elements.domReference;

    const controlInsideElements = [
      floating,
      ...portalNodes,
      beforeGuardRef.current,
      afterGuardRef.current,
      portalContext?.beforeOutsideRef.current,
      portalContext?.afterOutsideRef.current,
      ...getResolvedInsideElements(),
    ];
    const insideElements = [
      ...controlInsideElements,
      rootAncestorComboboxDomReference,
      resolveRef(previousFocusableElement),
      resolveRef(nextFocusableElement),
      isUntrappedTypeableCombobox ? domReference : null,
    ].filter((x): x is Element => x != null);

    const ariaHiddenCleanup = markOthers(insideElements, {
      ariaHidden: modal || isUntrappedTypeableCombobox,
      mark: false,
    });

    const markerInsideElements = [floating, ...portalNodes].filter((x): x is Element => x != null);
    const markerCleanup = markOthers(markerInsideElements);

    return () => {
      markerCleanup();
      ariaHiddenCleanup();
    };
  }, [
    open,
    disabled,
    domReference,
    floating,
    modal,
    portalContext,
    isUntrappedTypeableCombobox,
    tree,
    getNodeId,
    nextFocusableElement,
    previousFocusableElement,
    getResolvedInsideElements,
  ]);

  // Focus the initial element when the floating element opens.
  useIsoLayoutEffect(() => {
    if (!open || disabled || !isHTMLElement(floatingFocusElement)) {
      return;
    }

    session.closeType = '';
    session.lastInteractionType = '';

    const doc = ownerDocument(floatingFocusElement);
    const previouslyFocusedElement = activeElement(doc);

    // Wait for any layout effect state setters to execute to set `tabIndex`.
    queueMicrotask(() => {
      const initialFocusValueOrFn = initialFocusRef.current;
      const resolvedInitialFocus =
        typeof initialFocusValueOrFn === 'function'
          ? initialFocusValueOrFn(openInteractionTypeRef.current || '')
          : initialFocusValueOrFn;

      // `null` should fallback to default behavior in case of an empty ref.
      if (resolvedInitialFocus === undefined || resolvedInitialFocus === false) {
        return;
      }

      const focusAlreadyInsideFloatingEl = contains(floatingFocusElement, previouslyFocusedElement);

      if (focusAlreadyInsideFloatingEl) {
        return;
      }

      let focusableElements: Array<FocusableElement> | null = null;
      const getDefaultFocusElement = () => {
        if (focusableElements == null) {
          focusableElements = getTabbableContent(floatingFocusElement);
        }

        return focusableElements[0] || floatingFocusElement;
      };

      let elToFocus: FocusableElement | null | undefined;
      if (resolvedInitialFocus === true || resolvedInitialFocus === null) {
        elToFocus = getDefaultFocusElement();
      } else {
        elToFocus = resolveRef(resolvedInitialFocus);
      }
      elToFocus = elToFocus || getDefaultFocusElement();

      const hadFocusInside = contains(floatingFocusElement, activeElement(doc));

      // Screen readers re-sync focus to their cursor right after a synthesized press. A focus
      // that lands a frame later reads as a stray move and gets pulled back to the reference.
      const openEvent = dataRef.current.openEvent;
      const openedByVirtualPress =
        openEvent?.type === 'mousedown' && isVirtualClick(openEvent as MouseEvent);

      // enqueueFocus returns a rAF-cancel function; we intentionally don't cancel this focus.
      void enqueueFocus(elToFocus, {
        sync: openedByVirtualPress,
        preventScroll: elToFocus === floatingFocusElement,
        shouldFocus() {
          // If the floating element has closed before this runs — e.g. tabbing out of a
          // kept-mounted popup — don't pull focus back onto the initial element after it has
          // legitimately moved elsewhere.
          if (!openRef.current) {
            return false;
          }

          if (hadFocusInside) {
            return true;
          }

          const currentActiveElement = activeElement(doc);
          const focusMovedInside =
            currentActiveElement !== elToFocus &&
            contains(floatingFocusElement, currentActiveElement);

          return !focusMovedInside;
        },
      });
    });
  }, [
    session,
    disabled,
    open,
    floatingFocusElement,
    getTabbableContent,
    initialFocusRef,
    openInteractionTypeRef,
    openRef,
    dataRef,
  ]);

  // Track return focus targets and restore focus on unmount/close.
  useIsoLayoutEffect(() => {
    if (disabled || !floatingFocusElement) {
      session.pendingReturnFocus = null;
      return undefined;
    }

    if (session.pendingReturnFocus) {
      session.pendingReturnFocus.cancelled = true;
      session.pendingReturnFocus = null;
    }

    const doc = ownerDocument(floatingFocusElement);
    const elementFocusedBeforeOpen = activeElement(doc);
    // Only an explicit `null` interaction type represents a programmatic open.
    // `undefined` is normalized to `''` by the prop default, so it never reaches
    // here as nullish and is intentionally not treated as programmatic.
    const preferPreviousFocus = openInteractionTypeRef.current == null;

    addPreviouslyFocusedElement(elementFocusedBeforeOpen);

    const removeOpenChangeListener = dismissal.onOpenChange((details) =>
      recordCloseForReturnFocus(session, details, doc),
    );

    return () => {
      removeOpenChangeListener();

      const activeEl = activeElement(doc);
      const insideElements = getResolvedInsideElements();
      const isFocusInsideFloatingTree =
        contains(floating, activeEl) ||
        insideElements.some((element) => element === activeEl || contains(element, activeEl)) ||
        (tree && tree.descendantContains(getNodeId(), activeEl, false));

      // eslint-disable-next-line react-hooks/exhaustive-deps
      const returnFocusValueOrFn = returnFocusRef.current;
      const closeType = session.closeType;
      const returnElement = resolveReturnFocusElement({
        returnFocus: returnFocusValueOrFn,
        closeType,
        lastTrigger,
        elementFocusedBeforeOpen,
        preferPreviousFocus,
        getPreviouslyFocusedElement,
      });

      const job = { cancelled: false };
      session.pendingReturnFocus = job;

      queueMicrotask(() => {
        if (session.pendingReturnFocus === job) {
          session.pendingReturnFocus = null;
        }
        // `returnElement` if it is tabbable, otherwise its first tabbable child,
        // otherwise `returnElement` itself (which may not be tabbable at all).
        const tabbableReturnElement = getFirstTabbableElement(returnElement);
        const returnTarget = returnFocusOnClose(session, job, {
          returnFocus: returnFocusValueOrFn,
          // Read when the return runs, not in the cleanup: the latest `explicitReturnFocus` decides.
          // eslint-disable-next-line react-hooks/exhaustive-deps
          explicitReturnFocus: explicitReturnFocusRef.current,
          returnElement: tabbableReturnElement,
          activeElement: activeEl,
          body: doc.body,
          isFocusInsideFloatingTree: Boolean(isFocusInsideFloatingTree),
          closeType,
        });

        if (returnTarget) {
          returnTarget.element.focus(returnTarget.options);
        }

        // A cancelled return must also clear suppression before the next close.
        session.preventReturnFocus = false;
      });
    };
  }, [
    dismissal,
    session,
    disabled,
    floating,
    floatingFocusElement,
    returnFocusRef,
    explicitReturnFocusRef,
    openInteractionTypeRef,
    tree,
    lastTrigger,
    getNodeId,
    getResolvedInsideElements,
  ]);

  // Safari may randomly scroll to the bottom of the page if an input inside a popup has focus
  // when the popup unmounts from the DOM.
  // By blurring it before the popup unmounts, we can prevent this behavior.
  useIsoLayoutEffect(() => {
    if (!platform.engine.webkit || open || !floating) {
      return;
    }

    const activeEl = activeElement(ownerDocument(floating));
    if (!isHTMLElement(activeEl) || !isTypeableElement(activeEl)) {
      return;
    }

    if (contains(floating, activeEl)) {
      activeEl.blur();
    }
  }, [open, floating]);

  // Synchronize the focus manager state (modal, closeOnFocusOut, open, etc.) to the
  // FloatingPortal context, which uses it to decide whether to render its own guards.
  useIsoLayoutEffect(() => {
    if (disabled || !portalContext) {
      return undefined;
    }

    portalContext.setFocusManagerState({
      modal,
      closeOnFocusOut,
      open,
      onOpenChange: store.setOpen,
      domReference,
    });

    return () => {
      portalContext.setFocusManagerState(null);
    };
  }, [disabled, portalContext, modal, open, store, closeOnFocusOut, domReference]);

  // Keep the floating element tabIndex in sync and clear stale focus records.
  useIsoLayoutEffect(() => {
    if (disabled || !floatingFocusElement) {
      return undefined;
    }
    handleTabIndex(floatingFocusElement);
    return () => {
      queueMicrotask(clearDisconnectedPreviouslyFocusedElements);
    };
  }, [disabled, floatingFocusElement]);

  const shouldRenderGuards =
    !disabled && (modal ? !isUntrappedTypeableCombobox : true) && (isInsidePortal || modal);

  return (
    <React.Fragment>
      {shouldRenderGuards && (
        <FocusGuard
          data-type="inside"
          ref={mergedBeforeGuardRef}
          onFocus={(event) => {
            if (modal) {
              const els = getTabbableContent();
              // enqueueFocus returns a rAF-cancel function we don't need here.
              void enqueueFocus(els[els.length - 1]);
            } else if (portalContext?.portalNode) {
              session.preventReturnFocus = false;
              if (isOutsideEvent(event, portalContext.portalNode)) {
                const nextTabbable = getNextTabbable(domReference);
                nextTabbable?.focus();
              } else {
                resolveRef(previousFocusableElement ?? portalContext.beforeOutsideRef)?.focus();
              }
            }
          }}
        />
      )}
      {children}
      {shouldRenderGuards && (
        <FocusGuard
          data-type="inside"
          ref={mergedAfterGuardRef}
          onFocus={(event) => {
            if (modal) {
              // enqueueFocus returns a rAF-cancel function we don't need here.
              void enqueueFocus(getTabbableContent()[0]);
            } else if (portalContext?.portalNode) {
              if (closeOnFocusOut) {
                session.preventReturnFocus = true;
              }

              if (isOutsideEvent(event, portalContext.portalNode)) {
                const prevTabbable = getPreviousTabbable(domReference);
                prevTabbable?.focus();
              } else {
                resolveRef(nextFocusableElement ?? portalContext.afterOutsideRef)?.focus();
              }
            }
          }}
        />
      )}
    </React.Fragment>
  );
}
