'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { inertValue } from '@base-ui/utils/inertValue';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { usePreviousValue } from '@base-ui/utils/usePreviousValue';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { ownerDocument } from '@base-ui/utils/owner';
import type { ReactStore } from '@base-ui/utils/store';
import { activeElement, contains } from '../internals/shadowDom';
import { useAnimationsFinished } from '../internals/useAnimationsFinished';
import type { StateAttributesMapping } from '../internals/getStateAttributesProps';
import { usePopupAutoResize } from './usePopupAutoResize';
import { Dimensions } from '../floating-ui-react/types';
import { Side } from './useAnchorPositioning';
import { useDirection } from '../direction-provider';
import { adaptiveOrigin } from './adaptiveOriginMiddleware';

export const popupViewportStateMapping: StateAttributesMapping<{
  activationDirection: string | undefined;
}> = {
  activationDirection: (value) =>
    value
      ? {
          'data-activation-direction': value,
        }
      : null,
};

export interface PopupViewportState {
  /**
   * Direction from which the popup was activated, used for directional animations.
   */
  activationDirection: string | undefined;
  /**
   * Whether the viewport is currently transitioning between contents.
   */
  transitioning: boolean;
}

type PopupViewportStore = Pick<ReactStore<any, any, any>, 'useState' | 'set'>;

export interface UsePopupViewportParameters {
  /**
   * Popup store instance for accessing shared popup state.
   */
  store: PopupViewportStore;
  /**
   * Side of the positioner relative to the trigger.
   */
  side: Side;
  /**
   * Viewport children to render in the current container.
   */
  children?: React.ReactNode;
  /**
   * A key that identifies the current content and triggers a transition when it changes.
   */
  transitionKey?: React.Key | undefined;
  /**
   * Called when the rendered content is swapped for different content.
   * When provided, it replaces the default focus recovery entirely.
   * Must be a stable function reference.
   */
  onContentSwap?: ((details: { focusWasInside: boolean }) => void) | undefined;
  /**
   * Called to move focus when a content swap dropped it (focus was inside the previous
   * content and now sits on `<body>`). Defaults to focusing the popup element.
   * Must be a stable function reference.
   */
  onFocusRecovery?: ((container: HTMLElement) => void) | undefined;
}

export interface UsePopupViewportResult {
  /**
   * The viewport children wrapped in current/previous containers as needed.
   */
  children: React.ReactNode;
  /**
   * Viewport state used for data attributes and render prop styling.
   */
  state: PopupViewportState;
}

/**
 * Builds morphing viewport containers for popups that animate between trigger-based content.
 * Handles previous-content snapshots, auto-resize, and state attributes for transitions.
 */
export function usePopupViewport(parameters: UsePopupViewportParameters): UsePopupViewportResult {
  const { store, side, children, transitionKey, onContentSwap, onFocusRecovery } = parameters;

  const direction = useDirection();

  const activeTrigger = store.useState('activeTriggerElement');
  const activeTriggerId = store.useState('activeTriggerId');
  const open = store.useState('open');
  const payload = store.useState('payload');
  const mounted = store.useState('mounted');
  const popupElement = store.useState('popupElement');
  const positionerElement = store.useState('positionerElement');

  const previousActiveTrigger = usePreviousValue(open ? activeTrigger : null);
  // Remount current content on trigger changes (and once more when payload lags) to avoid DOM reuse flashes.
  // The key bumps immediately on trigger switches, then again if the payload arrives on a later render.
  // `transitionKey` is appended directly since it always changes in the same render as its content;
  // it is only appended when present so that an empty string remains distinct from no key at all.
  const contentKey = usePopupContentKey(activeTriggerId, payload);
  const currentContentKey = transitionKey == null ? contentKey : `${contentKey}-${transitionKey}`;

  const capturedNodeRef = React.useRef<HTMLElement | null>(null);
  const [previousContentNode, setPreviousContentNode] = React.useState<HTMLElement | null>(null);

  const [newTriggerOffset, setNewTriggerOffset] = React.useState<Offset | null>(null);

  const currentContainerRef = React.useRef<HTMLDivElement>(null);
  const previousContainerRef = React.useRef<HTMLDivElement>(null);
  const focusWasInsideRef = React.useRef(false);

  const onAnimationsFinished = useAnimationsFinished(currentContainerRef, true, false);
  const cleanupFrame = useAnimationFrame();

  const [previousContentDimensions, setPreviousContentDimensions] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  const [showStartingStyleAttribute, setShowStartingStyleAttribute] = React.useState(false);

  const handleFocusCapture = useStableCallback(() => {
    focusWasInsideRef.current = true;
  });

  const handleBlurCapture = useStableCallback((event: React.FocusEvent<HTMLDivElement>) => {
    focusWasInsideRef.current = contains(
      event.currentTarget,
      event.relatedTarget as Element | null,
    );
  });

  useIsoLayoutEffect(() => {
    store.set('adaptiveOrigin', adaptiveOrigin);
    return () => {
      store.set('adaptiveOrigin', undefined);
    };
  }, [store]);

  const handleMeasureLayout = useStableCallback(() => {
    currentContainerRef.current?.style.setProperty('animation', 'none');
    currentContainerRef.current?.style.setProperty('transition', 'none');

    previousContainerRef.current?.style.setProperty('display', 'none');
  });

  const handleMeasureLayoutComplete = useStableCallback((previousDimensions: Dimensions | null) => {
    currentContainerRef.current?.style.removeProperty('animation');
    currentContainerRef.current?.style.removeProperty('transition');

    previousContainerRef.current?.style.removeProperty('display');

    if (previousDimensions) {
      setPreviousContentDimensions(previousDimensions);
    }
  });

  const lastHandledTriggerRef = React.useRef<Element | null>(null);
  const lastTransitionKeyRef = React.useRef(transitionKey);
  const transitionGenerationRef = React.useRef(0);

  useIsoLayoutEffect(() => {
    if (!open || !mounted) {
      lastHandledTriggerRef.current = null;
      focusWasInsideRef.current = false;
    }

    if (!mounted) {
      // A transition interrupted by closing cannot finish once the popup is hidden; reset it.
      cleanupFrame.cancel();
      setPreviousContentNode(null);
      setPreviousContentDimensions(null);
      setShowStartingStyleAttribute(false);
      capturedNodeRef.current = null;
    }
  }, [open, mounted, cleanupFrame]);

  useIsoLayoutEffect(() => {
    const triggerChanged =
      activeTrigger != null &&
      previousActiveTrigger != null &&
      activeTrigger !== previousActiveTrigger &&
      lastHandledTriggerRef.current !== activeTrigger;

    // Only while open, so a key change committed together with closing doesn't morph during exit.
    const transitionKeyChanged =
      open && !triggerChanged && transitionKey !== lastTransitionKeyRef.current;

    lastTransitionKeyRef.current = transitionKey;

    if (triggerChanged || transitionKeyChanged) {
      onContentSwap?.({ focusWasInside: focusWasInsideRef.current });
    }

    // When a trigger or the transition key changes, set the captured children HTML to state,
    // so we can render both new and old content.
    if ((triggerChanged || transitionKeyChanged) && capturedNodeRef.current) {
      setPreviousContentNode(capturedNodeRef.current);
      setShowStartingStyleAttribute(true);

      // Calculate the relative position between the previous and new trigger,
      // so we can pass it to the style hook for animation purposes.
      setNewTriggerOffset(
        triggerChanged ? calculateRelativePosition(previousActiveTrigger, activeTrigger) : null,
      );

      // Invalidate the cleanup of any transition this one interrupts: its container is already
      // detached, so its animations resolve immediately and would clear this transition early.
      transitionGenerationRef.current += 1;
      const generation = transitionGenerationRef.current;

      cleanupFrame.request(() => {
        // The containers mounted after the last paint, so they have no computed style yet.
        // Force a style recalc to commit their starting styles before the flip below;
        // otherwise their first computed style is the final state and no transition starts.
        currentContainerRef.current?.getBoundingClientRect();
        ReactDOM.flushSync(() => {
          setShowStartingStyleAttribute(false);
        });
        onAnimationsFinished(() => {
          if (generation === transitionGenerationRef.current) {
            setPreviousContentNode(null);
            setPreviousContentDimensions(null);
            capturedNodeRef.current = null;
          }
        });
      });

      if (triggerChanged) {
        lastHandledTriggerRef.current = activeTrigger;
      }
    }
  }, [
    activeTrigger,
    previousActiveTrigger,
    open,
    transitionKey,
    previousContentNode,
    onAnimationsFinished,
    cleanupFrame,
    onContentSwap,
  ]);

  // Remounting the current container drops focus to `<body>` when it was inside the previous
  // content. Move it to the new content (or the popup itself) in that case; if focus is alive
  // elsewhere (e.g. placed by the new content via `autoFocus`), leave it alone.
  // Skipped when `onContentSwap` is provided, as it owns focus recovery.
  useIsoLayoutEffect(() => {
    const container = currentContainerRef.current;
    if (onContentSwap || !container || !focusWasInsideRef.current) {
      return;
    }

    const focusedElement = activeElement(ownerDocument(container));
    const focusWasLost = focusedElement == null || focusedElement === ownerDocument(container).body;

    if (!focusWasLost) {
      return;
    }

    if (onFocusRecovery) {
      onFocusRecovery(container);
    } else {
      popupElement?.focus();
    }
  }, [currentContentKey, popupElement, onContentSwap, onFocusRecovery]);

  // Capture a clone of the current content DOM subtree when not transitioning.
  // We can't store previous React nodes as they may be stateful; instead we capture DOM clones for visual continuity.
  useIsoLayoutEffect(() => {
    // When a transition is in progress, we store the next content in capturedNodeRef.
    // This handles the case where the trigger changes multiple times before the transition finishes.
    // We want to always capture the latest content for the previous snapshot.
    // So clicking quickly on T1, T2, T3 will result in the following sequence:
    // 1. T1 -> T2: previousContent = T1, currentContent = T2
    // 2. T2 -> T3: previousContent = T2, currentContent = T3
    const source = currentContainerRef.current;
    if (!source) {
      return;
    }

    const wrapper = ownerDocument(source).createElement('div');
    for (const child of Array.from(source.childNodes)) {
      wrapper.appendChild(child.cloneNode(true));
    }

    capturedNodeRef.current = wrapper;
  });

  const isTransitioning = previousContentNode != null;
  // `showStartingStyleAttribute` is only ever true while transitioning.
  const childrenToRender = (
    <React.Fragment>
      {isTransitioning && (
        <div
          data-previous
          inert={inertValue(true)}
          ref={previousContainerRef}
          style={
            {
              ...(previousContentDimensions
                ? {
                    '--popup-width': `${previousContentDimensions.width}px`,
                    '--popup-height': `${previousContentDimensions.height}px`,
                  }
                : null),
              position: 'absolute',
            } as React.CSSProperties
          }
          key="previous"
          data-ending-style={showStartingStyleAttribute ? undefined : ''}
        />
      )}
      <div
        data-current
        ref={currentContainerRef}
        key={currentContentKey}
        data-starting-style={showStartingStyleAttribute ? '' : undefined}
        // Suppress transitions while the starting styles are applied: the container mounts a
        // commit before they are, so its baseline style is computed without them, and applying
        // them would start an inverse transition that the flip then reverses almost instantly.
        style={showStartingStyleAttribute ? { transition: 'none' } : undefined}
        onFocusCapture={handleFocusCapture}
        onBlurCapture={handleBlurCapture}
      >
        {children}
      </div>
    </React.Fragment>
  );

  // When previousContentNode is present, imperatively populate the previous container with the cloned children.
  useIsoLayoutEffect(() => {
    const container = previousContainerRef.current;
    if (!container || !previousContentNode) {
      return;
    }

    container.replaceChildren(...Array.from(previousContentNode.childNodes));
  }, [previousContentNode]);

  const resizeContent = React.useMemo(() => ({ payload, transitionKey }), [payload, transitionKey]);

  usePopupAutoResize({
    popupElement,
    positionerElement,
    mounted,
    content: resizeContent,
    onMeasureLayout: handleMeasureLayout,
    onMeasureLayoutComplete: handleMeasureLayoutComplete,
    side,
    direction,
  });

  const state: PopupViewportState = {
    activationDirection: getActivationDirection(newTriggerOffset),
    transitioning: isTransitioning,
  };

  return { children: childrenToRender, state };
}

type Offset = {
  horizontal: number;
  vertical: number;
};

/**
 * Returns a string describing the provided offset.
 * It describes both the horizontal and vertical offset, separated by a space.
 *
 * @param offset
 */
function getActivationDirection(offset: Offset | null): string | undefined {
  if (!offset) {
    return undefined;
  }

  return `${getValueWithTolerance(offset.horizontal, 5, 'right', 'left')} ${getValueWithTolerance(offset.vertical, 5, 'down', 'up')}`;
}

/**
 * Returns a label describing the value (positive/negative) treating values
 * within tolerance as zero.
 *
 * @param value Value to check
 * @param tolerance Tolerance to treat the value as zero.
 * @param positiveLabel
 * @param negativeLabel
 * @returns If 0 < abs(value) < tolerance, returns an empty string. Otherwise returns positiveLabel or negativeLabel.
 */
function getValueWithTolerance(
  value: number,
  tolerance: number,
  positiveLabel: string,
  negativeLabel: string,
) {
  if (value > tolerance) {
    return positiveLabel;
  }

  if (value < -tolerance) {
    return negativeLabel;
  }

  return '';
}

/**
 * Calculates the relative position between centers of two elements.
 */
function calculateRelativePosition(from: Element, to: Element): Offset {
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();

  const fromCenter = {
    x: fromRect.left + fromRect.width / 2,
    y: fromRect.top + fromRect.height / 2,
  };
  const toCenter = {
    x: toRect.left + toRect.width / 2,
    y: toRect.top + toRect.height / 2,
  };

  return {
    horizontal: toCenter.x - fromCenter.x,
    vertical: toCenter.y - fromCenter.y,
  };
}

/**
 * Returns a key that forces remounting content when triggers change or a payload is updated.
 */
function usePopupContentKey(activeTriggerId: string | null, payload: unknown): string {
  const [contentKey, setContentKey] = React.useState(0);
  const previousActiveTriggerIdRef = React.useRef(activeTriggerId);
  const previousPayloadRef = React.useRef(payload);
  const pendingPayloadUpdateRef = React.useRef(false);

  useIsoLayoutEffect(() => {
    // Compare against the last committed values to decide whether we need a new DOM subtree.
    const previousActiveTriggerId = previousActiveTriggerIdRef.current;
    const previousPayload = previousPayloadRef.current;
    const triggerIdChanged = activeTriggerId !== previousActiveTriggerId;
    const payloadChanged = payload !== previousPayload;

    if (triggerIdChanged) {
      // Remount immediately on trigger change; remember if payload hasn't caught up yet.
      setContentKey((value) => value + 1);
      pendingPayloadUpdateRef.current = !payloadChanged;
    } else if (pendingPayloadUpdateRef.current && payloadChanged) {
      // Payload arrived a render later, so remount once more to avoid reusing the old <img>.
      setContentKey((value) => value + 1);
      pendingPayloadUpdateRef.current = false;
    }

    // Persist current values for the next render's comparison.
    previousActiveTriggerIdRef.current = activeTriggerId;
    previousPayloadRef.current = payload;
  }, [activeTriggerId, payload]);

  return `${activeTriggerId ?? 'current'}-${contentKey}`;
}
