'use client';
import * as React from 'react';
import { tabbable, isTabbable, focusable, type FocusableElement } from 'tabbable';
import { getComputedStyle, getNodeName, isHTMLElement } from '@floating-ui/utils/dom';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { ownerWindow } from '@base-ui/utils/owner';
import { FocusGuard } from '../../utils/FocusGuard';
import {
  activeElement,
  contains,
  getDocument,
  getTarget,
  isTypeableCombobox,
  isVirtualClick,
  isVirtualPointerEvent,
  stopEvent,
  getNodeAncestors,
  getNodeChildren,
  getFloatingFocusElement,
  getTabbableOptions,
  isOutsideEvent,
  getNextTabbable,
  getPreviousTabbable,
} from '../utils';
import type { FloatingContext, FloatingRootContext } from '../types';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { createAttribute } from '../utils/createAttribute';
import { enqueueFocus } from '../utils/enqueueFocus';
import { markOthers } from '../utils/markOthers';
import { usePortalContext } from './FloatingPortal';
import { useFloatingTree } from './FloatingTree';
import { FloatingTreeStore } from '../components/FloatingTreeStore';
import { CLICK_TRIGGER_IDENTIFIER } from '../../utils/constants';
import { FloatingUIOpenChangeDetails } from '../../utils/types';
import { resolveRef } from '../../utils/resolveRef';

function getEventType(event: Event, lastInteractionType?: InteractionType): InteractionType {
  const win = ownerWindow(event.target);
  if (event instanceof win.KeyboardEvent) {
    return 'keyboard';
  }
  if (event instanceof win.FocusEvent) {
    // Focus events can be caused by a preceding pointer interaction (e.g., focusout on outside press).
    // Prefer the last known pointer type if provided, else treat as keyboard.
    return lastInteractionType || 'keyboard';
  }
  if ('pointerType' in event) {
    return (event.pointerType as React.PointerEvent['pointerType']) || 'keyboard';
  }
  if ('touches' in event) {
    return 'touch';
  }
  if (event instanceof win.MouseEvent) {
    // onClick events may not contain pointer events, and will fall through to here
    return lastInteractionType || (event.detail === 0 ? 'keyboard' : 'mouse');
  }
  return '';
}

const LIST_LIMIT = 20;
let previouslyFocusedElements: Element[] = [];

function clearDisconnectedPreviouslyFocusedElements() {
  previouslyFocusedElements = previouslyFocusedElements.filter((el) => el.isConnected);
}

function addPreviouslyFocusedElement(element: Element | null) {
  clearDisconnectedPreviouslyFocusedElements();
  if (element && getNodeName(element) !== 'body') {
    previouslyFocusedElements.push(element);
    if (previouslyFocusedElements.length > LIST_LIMIT) {
      previouslyFocusedElements = previouslyFocusedElements.slice(-LIST_LIMIT);
    }
  }
}

function getPreviouslyFocusedElement() {
  clearDisconnectedPreviouslyFocusedElements();
  return previouslyFocusedElements[previouslyFocusedElements.length - 1];
}

function getFirstTabbableElement(container: Element | null) {
  if (!container) {
    return null;
  }

  const tabbableOptions = getTabbableOptions();
  if (isTabbable(container, tabbableOptions)) {
    return container;
  }

  return tabbable(container, tabbableOptions)[0] || container;
}

function isFocusable(element: Element | null) {
  if (!element || !element.isConnected) {
    return false;
  }

  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility();
  }

  return getComputedStyle(element).display !== 'none';
}

function handleTabIndex(
  floatingFocusElement: HTMLElement,
  orderRef: React.RefObject<Array<'reference' | 'floating' | 'content'>>,
) {
  if (
    !orderRef.current.includes('floating') &&
    !floatingFocusElement.getAttribute('role')?.includes('dialog')
  ) {
    return;
  }

  const options = getTabbableOptions();
  const focusableElements = focusable(floatingFocusElement, options);
  const tabbableContent = focusableElements.filter((element) => {
    const dataTabIndex = element.getAttribute('data-tabindex') || '';
    return (
      isTabbable(element, options) ||
      (element.hasAttribute('data-tabindex') && !dataTabIndex.startsWith('-'))
    );
  });
  const tabIndex = floatingFocusElement.getAttribute('tabindex');

  if (orderRef.current.includes('floating') || tabbableContent.length === 0) {
    if (tabIndex !== '0') {
      floatingFocusElement.setAttribute('tabindex', '0');
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
  context: FloatingRootContext | FloatingContext;
  /**
   * The interaction type used to open the floating element.
   */
  openInteractionType?: (InteractionType | null) | undefined;
  /**
   * Whether or not the focus manager should be disabled. Useful to delay focus
   * management until after a transition completes or some other conditional
   * state.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * The order in which focus cycles.
   * @default ['content']
   */
  order?: Array<'reference' | 'floating' | 'content'> | undefined;
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
    | (
        | boolean
        | React.RefObject<HTMLElement | null>
        | ((openType: InteractionType) => boolean | HTMLElement | null | void)
      )
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
    | (
        | boolean
        | React.RefObject<HTMLElement | null>
        | ((closeType: InteractionType) => boolean | HTMLElement | null | void)
      )
    | undefined;
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
  restoreFocus?: (boolean | 'popup') | undefined;
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
   * Returns a list of elements that should be considered part of the
   * floating element.
   */
  getInsideElements?: (() => Element[]) | undefined;
  /**
   * Overrides the element to focus when tabbing forward out of the floating element.
   */
  nextFocusableElement?: (HTMLElement | React.RefObject<HTMLElement | null> | null) | undefined;
  /**
   * Overrides the element to focus when tabbing backward out of the floating element.
   */
  previousFocusableElement?: (HTMLElement | React.RefObject<HTMLElement | null> | null) | undefined;
  /**
   * Ref to the focus guard preceding the floating element content.
   * Can be useful to focus the popup progammatically.
   */
  beforeContentFocusGuardRef?: React.RefObject<HTMLSpanElement | null> | undefined;
  /**
   * External FlatingTree to use when the one provided by context can't be used.
   */
  externalTree?: FloatingTreeStore | undefined;
}

/**
 * Provides focus management for the floating element.
 * @see https://floating-ui.com/docs/FloatingFocusManager
 * @internal
 */
export function FloatingFocusManager(props: FloatingFocusManagerProps): React.JSX.Element {
  const {
    context,
    children,
    disabled = false,
    order = ['content'],
    initialFocus = true,
    returnFocus = true,
    restoreFocus = false,
    modal = true,
    closeOnFocusOut = true,
    openInteractionType = '',
    getInsideElements: getInsideElementsProp = () => [],
    nextFocusableElement,
    previousFocusableElement,
    beforeContentFocusGuardRef,
    externalTree,
  } = props;

  const store = 'rootStore' in context ? context.rootStore : context;

  const open = store.useState('open');
  const domReference = store.useState('domReferenceElement');
  const floating = store.useState('floatingElement');
  const { events, dataRef } = store.context;

  const getNodeId = useStableCallback(() => dataRef.current.floatingContext?.nodeId);
  const getInsideElements = useStableCallback(getInsideElementsProp);

  const ignoreInitialFocus = initialFocus === false;
  // If the reference is a combobox and is typeable (e.g. input/textarea),
  // there are different focus semantics. The guards should not be rendered, but
  // aria-hidden should be applied to all nodes still. Further, the visually
  // hidden dismiss button should only appear at the end of the list, not the
  // start.
  const isUntrappedTypeableCombobox = isTypeableCombobox(domReference) && ignoreInitialFocus;

  const orderRef = useValueAsRef(order);
  const initialFocusRef = useValueAsRef(initialFocus);
  const returnFocusRef = useValueAsRef(returnFocus);
  const openInteractionTypeRef = useValueAsRef(openInteractionType);

  const tree = useFloatingTree(externalTree);
  const portalContext = usePortalContext();

  const startDismissButtonRef = React.useRef<HTMLButtonElement>(null);
  const endDismissButtonRef = React.useRef<HTMLButtonElement>(null);
  const preventReturnFocusRef = React.useRef(false);
  const isPointerDownRef = React.useRef(false);
  const pointerDownOutsideRef = React.useRef(false);
  const tabbableIndexRef = React.useRef(-1);
  const closeTypeRef = React.useRef<InteractionType>('');
  const lastInteractionTypeRef = React.useRef<InteractionType>('');

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
      return container ? tabbable(container, getTabbableOptions()) : [];
    },
  );

  const getTabbableElements = useStableCallback((container?: Element) => {
    const content = getTabbableContent(container);

    return orderRef.current
      .map(() => content)
      .filter(Boolean)
      .flat() as Array<FocusableElement>;
  });

  React.useEffect(() => {
    if (disabled) {
      return undefined;
    }
    if (!modal) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        // The focus guards have nothing to focus, so we need to stop the event.
        if (
          contains(floatingFocusElement, activeElement(getDocument(floatingFocusElement))) &&
          getTabbableContent().length === 0 &&
          !isUntrappedTypeableCombobox
        ) {
          stopEvent(event);
        }
      }
    }

    const doc = getDocument(floatingFocusElement);
    doc.addEventListener('keydown', onKeyDown);
    return () => {
      doc.removeEventListener('keydown', onKeyDown);
    };
  }, [
    disabled,
    domReference,
    floatingFocusElement,
    modal,
    orderRef,
    isUntrappedTypeableCombobox,
    getTabbableContent,
    getTabbableElements,
  ]);

  React.useEffect(() => {
    if (disabled) {
      return undefined;
    }
    if (!floating) {
      return undefined;
    }

    function handleFocusIn(event: FocusEvent) {
      const target = getTarget(event) as Element | null;
      const tabbableContent = getTabbableContent() as Array<Element | null>;
      const tabbableIndex = tabbableContent.indexOf(target);
      if (tabbableIndex !== -1) {
        tabbableIndexRef.current = tabbableIndex;
      }
    }

    floating.addEventListener('focusin', handleFocusIn);

    return () => {
      floating.removeEventListener('focusin', handleFocusIn);
    };
  }, [disabled, floating, getTabbableContent]);

  // Track the last interaction type at the document level to disambiguate focus events
  React.useEffect(() => {
    if (disabled || !open) {
      return undefined;
    }

    const doc = getDocument(floatingFocusElement);

    function clearPointerDownOutside() {
      pointerDownOutsideRef.current = false;
    }

    function onPointerDown(event: PointerEvent) {
      const target = getTarget(event) as Element | null;
      const pointerTargetInside =
        contains(floating, target) ||
        contains(domReference, target) ||
        contains(portalContext?.portalNode, target);
      pointerDownOutsideRef.current = !pointerTargetInside;
      lastInteractionTypeRef.current =
        (event.pointerType as React.PointerEvent['pointerType']) || 'keyboard';
    }

    function onKeyDown() {
      lastInteractionTypeRef.current = 'keyboard';
    }

    doc.addEventListener('pointerdown', onPointerDown, true);
    doc.addEventListener('pointerup', clearPointerDownOutside, true);
    doc.addEventListener('pointercancel', clearPointerDownOutside, true);
    doc.addEventListener('keydown', onKeyDown, true);
    return () => {
      doc.removeEventListener('pointerdown', onPointerDown, true);
      doc.removeEventListener('pointerup', clearPointerDownOutside, true);
      doc.removeEventListener('pointercancel', clearPointerDownOutside, true);
      doc.removeEventListener('keydown', onKeyDown, true);
    };
  }, [disabled, floating, domReference, floatingFocusElement, open, portalContext]);

  React.useEffect(() => {
    if (disabled) {
      return undefined;
    }
    if (!closeOnFocusOut) {
      return undefined;
    }

    // In Safari, buttons lose focus when pressing them.
    function handlePointerDown() {
      isPointerDownRef.current = true;
      pointerDownTimeout.start(0, () => {
        isPointerDownRef.current = false;
      });
    }

    function handleFocusOutside(event: FocusEvent) {
      const relatedTarget = event.relatedTarget as HTMLElement | null;
      const currentTarget = event.currentTarget;
      const target = getTarget(event) as HTMLElement | null;

      queueMicrotask(() => {
        const nodeId = getNodeId();
        const triggers = store.context.triggerElements;
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
          (relatedTarget != null && triggers.hasElement(relatedTarget)) ||
          triggers.hasMatchingElement((trigger) => contains(trigger, relatedTarget)) ||
          isRelatedFocusGuard ||
          (tree &&
            (getNodeChildren(tree.nodesRef.current, nodeId).find(
              (node) =>
                contains(node.context?.elements.floating, relatedTarget) ||
                contains(node.context?.elements.domReference, relatedTarget),
            ) ||
              getNodeAncestors(tree.nodesRef.current, nodeId).find(
                (node) =>
                  [
                    node.context?.elements.floating,
                    getFloatingFocusElement(node.context?.elements.floating),
                  ].includes(relatedTarget) ||
                  node.context?.elements.domReference === relatedTarget,
              )))
        );

        if (currentTarget === domReference && floatingFocusElement) {
          handleTabIndex(floatingFocusElement, orderRef);
        }

        // Restore focus to the previous tabbable element index to prevent
        // focus from being lost outside the floating tree.
        if (
          restoreFocus &&
          currentTarget !== domReference &&
          !isFocusable(target) &&
          activeElement(getDocument(floatingFocusElement)) ===
            getDocument(floatingFocusElement).body
        ) {
          // Let `FloatingPortal` effect knows that focus is still inside the
          // floating tree.
          if (isHTMLElement(floatingFocusElement)) {
            floatingFocusElement.focus();
            // If explicitly requested to restore focus to the popup container, do not search
            // for the next/previous tabbable element.
            if (restoreFocus === 'popup') {
              // If the element is removed on pointerdown, focus tries to move it,
              // but since it's removed at the same time, focus gets lost as it
              // happens after the .focus() call above.
              // In this case, focus needs to be moved asynchronously.
              restoreFocusFrame.request(() => {
                floatingFocusElement.focus();
              });
              return;
            }
          }

          const prevTabbableIndex = tabbableIndexRef.current;
          const tabbableContent = getTabbableContent() as Array<Element | null>;
          const nodeToFocus =
            tabbableContent[prevTabbableIndex] ||
            tabbableContent[tabbableContent.length - 1] ||
            floatingFocusElement;

          if (isHTMLElement(nodeToFocus)) {
            nodeToFocus.focus();
          }
        }

        // https://github.com/floating-ui/floating-ui/issues/3060
        if (dataRef.current.insideReactTree) {
          dataRef.current.insideReactTree = false;
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
          preventReturnFocusRef.current = true;
          store.setOpen(false, createChangeEventDetails(REASONS.focusOut, event));
        }
      });
    }

    function markInsideReactTree() {
      if (pointerDownOutsideRef.current) {
        return;
      }
      dataRef.current.insideReactTree = true;
      blurTimeout.start(0, () => {
        dataRef.current.insideReactTree = false;
      });
    }

    const domReferenceElement = isHTMLElement(domReference) ? domReference : null;
    const cleanups: Array<() => void> = [];

    if (!floating && !domReferenceElement) {
      return undefined;
    }

    if (domReferenceElement) {
      domReferenceElement.addEventListener('focusout', handleFocusOutside);
      domReferenceElement.addEventListener('pointerdown', handlePointerDown);
      cleanups.push(() => {
        domReferenceElement.removeEventListener('focusout', handleFocusOutside);
        domReferenceElement.removeEventListener('pointerdown', handlePointerDown);
      });
    }

    if (floating) {
      floating.addEventListener('focusout', handleFocusOutside);

      if (portalContext) {
        floating.addEventListener('focusout', markInsideReactTree, true);
        cleanups.push(() => {
          floating.removeEventListener('focusout', markInsideReactTree, true);
        });
      }

      cleanups.push(() => {
        floating.removeEventListener('focusout', handleFocusOutside);
      });
    }

    return () => {
      cleanups.forEach((cleanup) => {
        cleanup();
      });
    };
  }, [
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
    orderRef,
    dataRef,
    blurTimeout,
    pointerDownTimeout,
    restoreFocusFrame,
    nextFocusableElement,
    previousFocusableElement,
  ]);

  React.useEffect(() => {
    if (disabled || !floating || !open) {
      return undefined;
    }

    // Don't hide portals nested within the parent portal.
    const portalNodes = Array.from(
      portalContext?.portalNode?.querySelectorAll(`[${createAttribute('portal')}]`) || [],
    );

    const ancestors = tree ? getNodeAncestors(tree.nodesRef.current, getNodeId()) : [];
    const rootAncestorComboboxDomReference = ancestors.find((node) =>
      isTypeableCombobox(node.context?.elements.domReference || null),
    )?.context?.elements.domReference;

    const insideElements = [
      floating,
      rootAncestorComboboxDomReference,
      ...portalNodes,
      ...getInsideElements(),
      startDismissButtonRef.current,
      endDismissButtonRef.current,
      beforeGuardRef.current,
      afterGuardRef.current,
      portalContext?.beforeOutsideRef.current,
      portalContext?.afterOutsideRef.current,
      resolveRef(previousFocusableElement),
      resolveRef(nextFocusableElement),
      isUntrappedTypeableCombobox ? domReference : null,
    ].filter((x): x is Element => x != null);

    const cleanup = markOthers(insideElements, modal || isUntrappedTypeableCombobox);

    return () => {
      cleanup();
    };
  }, [
    open,
    disabled,
    domReference,
    floating,
    modal,
    orderRef,
    portalContext,
    isUntrappedTypeableCombobox,
    tree,
    getNodeId,
    getInsideElements,
    nextFocusableElement,
    previousFocusableElement,
  ]);

  useIsoLayoutEffect(() => {
    if (!open || disabled || !isHTMLElement(floatingFocusElement)) {
      return;
    }

    const doc = getDocument(floatingFocusElement);
    const previouslyFocusedElement = activeElement(doc);

    // Wait for any layout effect state setters to execute to set `tabIndex`.
    queueMicrotask(() => {
      const focusableElements = getTabbableElements(floatingFocusElement);
      const initialFocusValueOrFn = initialFocusRef.current;
      const resolvedInitialFocus =
        typeof initialFocusValueOrFn === 'function'
          ? initialFocusValueOrFn(openInteractionTypeRef.current || '')
          : initialFocusValueOrFn;

      // `null` should fallback to default behavior in case of an empty ref.
      if (resolvedInitialFocus === undefined || resolvedInitialFocus === false) {
        return;
      }

      let elToFocus: FocusableElement | null | undefined;
      if (resolvedInitialFocus === true || resolvedInitialFocus === null) {
        elToFocus = focusableElements[0] || floatingFocusElement;
      } else {
        elToFocus = resolveRef(resolvedInitialFocus);
      }
      elToFocus = elToFocus || focusableElements[0] || floatingFocusElement;

      const focusAlreadyInsideFloatingEl = contains(floatingFocusElement, previouslyFocusedElement);

      if (focusAlreadyInsideFloatingEl) {
        return;
      }

      enqueueFocus(elToFocus, {
        preventScroll: elToFocus === floatingFocusElement,
      });
    });
  }, [
    disabled,
    open,
    floatingFocusElement,
    ignoreInitialFocus,
    getTabbableElements,
    initialFocusRef,
    openInteractionTypeRef,
  ]);

  useIsoLayoutEffect(() => {
    if (disabled || !floatingFocusElement) {
      return undefined;
    }

    const doc = getDocument(floatingFocusElement);
    const previouslyFocusedElement = activeElement(doc);

    addPreviouslyFocusedElement(previouslyFocusedElement);

    // Dismissing via outside press should always ignore `returnFocus` to
    // prevent unwanted scrolling.
    function onOpenChangeLocal(details: FloatingUIOpenChangeDetails) {
      if (!details.open) {
        closeTypeRef.current = getEventType(details.nativeEvent, lastInteractionTypeRef.current);
      }

      if (details.reason === REASONS.triggerHover && details.nativeEvent.type === 'mouseleave') {
        preventReturnFocusRef.current = true;
      }

      if (details.reason !== REASONS.outsidePress) {
        return;
      }

      if (details.nested) {
        preventReturnFocusRef.current = false;
      } else if (
        isVirtualClick(details.nativeEvent as MouseEvent) ||
        isVirtualPointerEvent(details.nativeEvent as PointerEvent)
      ) {
        preventReturnFocusRef.current = false;
      } else {
        let isPreventScrollSupported = false;
        document.createElement('div').focus({
          get preventScroll() {
            isPreventScrollSupported = true;
            return false;
          },
        });

        if (isPreventScrollSupported) {
          preventReturnFocusRef.current = false;
        } else {
          preventReturnFocusRef.current = true;
        }
      }
    }

    events.on('openchange', onOpenChangeLocal);

    const fallbackEl = doc.createElement('span');
    fallbackEl.setAttribute('tabindex', '-1');
    fallbackEl.setAttribute('aria-hidden', 'true');
    Object.assign(fallbackEl.style, visuallyHidden);

    if (isInsidePortal && domReference) {
      domReference.insertAdjacentElement('afterend', fallbackEl);
    }

    function getReturnElement() {
      const returnFocusValueOrFn = returnFocusRef.current;
      let resolvedReturnFocusValue =
        typeof returnFocusValueOrFn === 'function'
          ? returnFocusValueOrFn(closeTypeRef.current)
          : returnFocusValueOrFn;

      // `null` should fallback to default behavior in case of an empty ref.
      if (resolvedReturnFocusValue === undefined || resolvedReturnFocusValue === false) {
        return null;
      }

      if (resolvedReturnFocusValue === null) {
        resolvedReturnFocusValue = true;
      }

      if (typeof resolvedReturnFocusValue === 'boolean') {
        const el = domReference || getPreviouslyFocusedElement();
        return el && el.isConnected ? el : fallbackEl;
      }

      const fallback = domReference || getPreviouslyFocusedElement() || fallbackEl;

      return resolveRef(resolvedReturnFocusValue) || fallback;
    }

    return () => {
      events.off('openchange', onOpenChangeLocal);

      const activeEl = activeElement(doc);
      const isFocusInsideFloatingTree =
        contains(floating, activeEl) ||
        (tree &&
          getNodeChildren(tree.nodesRef.current, getNodeId(), false).some((node) =>
            contains(node.context?.elements.floating, activeEl),
          ));

      const returnElement = getReturnElement();

      queueMicrotask(() => {
        // This is `returnElement`, if it's tabbable, or its first tabbable child.
        const tabbableReturnElement = getFirstTabbableElement(returnElement);
        const hasExplicitReturnFocus = typeof returnFocusRef.current !== 'boolean';

        if (
          // eslint-disable-next-line react-hooks/exhaustive-deps
          returnFocusRef.current &&
          !preventReturnFocusRef.current &&
          isHTMLElement(tabbableReturnElement) &&
          // If the focus moved somewhere else after mount, avoid returning focus
          // since it likely entered a different element which should be
          // respected: https://github.com/floating-ui/floating-ui/issues/2607
          (!hasExplicitReturnFocus && tabbableReturnElement !== activeEl && activeEl !== doc.body
            ? isFocusInsideFloatingTree
            : true)
        ) {
          tabbableReturnElement.focus({ preventScroll: true });
        }

        fallbackEl.remove();
      });
    };
  }, [
    disabled,
    floating,
    floatingFocusElement,
    returnFocusRef,
    dataRef,
    events,
    tree,
    isInsidePortal,
    domReference,
    getNodeId,
  ]);

  React.useEffect(() => {
    // The `returnFocus` cleanup behavior is inside a microtask; ensure we
    // wait for it to complete before resetting the flag.
    queueMicrotask(() => {
      preventReturnFocusRef.current = false;
    });
  }, [disabled]);

  React.useEffect(() => {
    if (disabled || !open) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = getTarget(event) as Element | null;
      if (target?.closest(`[${CLICK_TRIGGER_IDENTIFIER}]`)) {
        isPointerDownRef.current = true;
      }
    }

    const doc = getDocument(floatingFocusElement);
    doc.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      doc.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [disabled, open, floatingFocusElement]);

  // Synchronize the `context` & `modal` value to the FloatingPortal context.
  // It will decide whether or not it needs to render its own guards.
  useIsoLayoutEffect(() => {
    if (disabled) {
      return undefined;
    }
    if (!portalContext) {
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

  useIsoLayoutEffect(() => {
    if (disabled || !floatingFocusElement) {
      return undefined;
    }
    handleTabIndex(floatingFocusElement, orderRef);
    return () => {
      queueMicrotask(clearDisconnectedPreviouslyFocusedElements);
    };
  }, [disabled, floatingFocusElement, orderRef]);

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
              const els = getTabbableElements();
              enqueueFocus(els[els.length - 1]);
            } else if (portalContext?.portalNode) {
              preventReturnFocusRef.current = false;
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
              enqueueFocus(getTabbableElements()[0]);
            } else if (portalContext?.portalNode) {
              if (closeOnFocusOut) {
                preventReturnFocusRef.current = true;
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
