'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import { warn } from '@base-ui/utils/warn';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  getFullscreenElement,
  isFullscreenEnabled,
  requestElementFullscreen,
  exitDocumentFullscreen,
  FULLSCREEN_CHANGE_EVENTS,
  FULLSCREEN_ERROR_EVENTS,
} from './fullscreenApi';
import type { FullscreenRoot } from './FullscreenRoot';

export function useFullscreenRoot(
  parameters: UseFullscreenRootParameters,
): UseFullscreenRootReturnValue {
  const { open: openParam, defaultOpen, onOpenChange, disabled, navigationUI } = parameters;

  const [open, setOpen] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'Fullscreen',
    state: 'open',
  });

  const containerRef = React.useRef<HTMLElement | null>(null);
  const [containerIdState, setContainerIdState] = React.useState<string | undefined>();
  const defaultContainerId = useBaseUiId();
  const containerId = containerIdState ?? defaultContainerId;

  // Default to `true` so the trigger doesn't briefly render as disabled before
  // the container mounts and reports the actual capability.
  const [supported, setSupported] = React.useState(true);

  // Tracks the reason currently driving a state change so the
  // `fullscreenchange` listener can label the resulting browser event with
  // the original cause (`trigger-press` / `close-press` / `escape-key`).
  const pendingReasonRef = React.useRef<FullscreenRoot.ChangeEventReason | null>(null);

  // Tracks the current request promise so we can ignore stale rejections from
  // a request superseded by a newer state change (e.g. user toggles rapidly).
  const requestPromiseRef = React.useRef<Promise<void> | null>(null);

  const handleTrigger = useStableCallback(
    (event: React.MouseEvent | React.KeyboardEvent | React.PointerEvent) => {
      if (disabled || !supported) {
        return;
      }
      const next = !open;
      const eventDetails = createChangeEventDetails(REASONS.triggerPress, event.nativeEvent);
      onOpenChange(next, eventDetails);
      if (eventDetails.isCanceled) {
        return;
      }
      pendingReasonRef.current = REASONS.triggerPress;
      setOpen(next);
    },
  );

  const handleClose = useStableCallback(
    (event: React.MouseEvent | React.KeyboardEvent | React.PointerEvent) => {
      if (!open) {
        return;
      }
      const eventDetails = createChangeEventDetails(REASONS.closePress, event.nativeEvent);
      onOpenChange(false, eventDetails);
      if (eventDetails.isCanceled) {
        return;
      }
      pendingReasonRef.current = REASONS.closePress;
      setOpen(false);
    },
  );

  // Reactive bridge between React state and the browser Fullscreen API.
  //
  // Running this as a layout effect (instead of a plain `useEffect`) is what
  // makes controlled mode work end-to-end. React commits a state update from a
  // user-initiated event handler synchronously in the same JS task as the
  // event, and the layout effect runs before the browser yields. As long as
  // the `open={true}` change is initiated from a user gesture, the document's
  // transient activation is still valid when `requestFullscreen()` is called
  // here, satisfying the spec's user-activation requirement.
  //
  // If the change is initiated outside of a user gesture (timer, network
  // response, programmatic `defaultOpen`, etc.), the browser will reject the
  // promise; we revert state via the `.catch` below so consumers see the
  // request fail through `onOpenChange(false, { reason: 'none' })`.
  useIsoLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const doc = ownerDocument(container);
    const isInFullscreen = getFullscreenElement(doc) === container;

    if (open && !isInFullscreen) {
      const promise = requestElementFullscreen(container, navigationUI);
      requestPromiseRef.current = promise;
      if (promise) {
        promise.catch(() => {
          // Ignore the rejection if the user changed state again before we
          // observed it (e.g. they toggled twice in quick succession).
          if (requestPromiseRef.current !== promise) {
            return;
          }
          if (process.env.NODE_ENV !== 'production') {
            warn(
              '`requestFullscreen()` was rejected. The browser may have blocked the request because it was not initiated by a user gesture, or because fullscreen is not supported.',
            );
          }
          pendingReasonRef.current = null;
          const failureDetails = createChangeEventDetails(REASONS.none);
          onOpenChange(false, failureDetails);
          if (failureDetails.isCanceled) {
            return;
          }
          setOpen(false);
        });
      }
    } else if (!open && isInFullscreen) {
      const promise = exitDocumentFullscreen(doc);
      requestPromiseRef.current = promise;
      if (promise) {
        promise.catch(() => {
          // Restoring fullscreen after a failed exit would be jarring. The
          // next `fullscreenchange` event will reconcile state if needed.
          pendingReasonRef.current = null;
        });
      }
    }
  }, [open, navigationUI, onOpenChange, setOpen]);

  // Handles browser-initiated state changes (most commonly the Esc key, but
  // also browser exit affordances or the active element being removed).
  const handleFullscreenChange = useStableCallback((event: Event) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const doc = ownerDocument(container);
    const isInFullscreen = getFullscreenElement(doc) === container;

    if (isInFullscreen === open) {
      pendingReasonRef.current = null;
      return;
    }

    const reason = pendingReasonRef.current ?? (isInFullscreen ? REASONS.none : REASONS.escapeKey);
    pendingReasonRef.current = null;

    const eventDetails = createChangeEventDetails(reason, event);
    onOpenChange(isInFullscreen, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setOpen(isInFullscreen);
  });

  const handleFullscreenError = useStableCallback(() => {
    if (process.env.NODE_ENV !== 'production') {
      warn(
        'A `fullscreenerror` event was dispatched on the document. The browser refused to enter fullscreen for the requested element.',
      );
    }
    // The promise rejection from `requestFullscreen()` is the source of truth
    // for reverting state, so this handler is informational only.
  });

  // Called when the container element unmounts. Per the Fullscreen spec, the
  // browser auto-exits fullscreen when the active element is removed, but the
  // `fullscreenchange` event fires after our document listeners are gone. We
  // sync state here so consumers (especially controlled mode) don't get stuck
  // with a stale `open: true`.
  const handleContainerUnmount = useStableCallback(() => {
    pendingReasonRef.current = null;
    requestPromiseRef.current = null;
    if (!open) {
      return;
    }
    const eventDetails = createChangeEventDetails(REASONS.none);
    onOpenChange(false, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setOpen(false);
  });

  return React.useMemo(
    () => ({
      containerId,
      containerRef,
      disabled,
      handleClose,
      handleContainerUnmount,
      handleFullscreenChange,
      handleFullscreenError,
      handleTrigger,
      navigationUI,
      open,
      setContainerIdState,
      setOpen,
      setSupported,
      supported,
    }),
    [
      containerId,
      disabled,
      handleClose,
      handleContainerUnmount,
      handleFullscreenChange,
      handleFullscreenError,
      handleTrigger,
      navigationUI,
      open,
      setOpen,
      supported,
    ],
  );
}

// Re-export so callers can detect support without reaching into internals.
export { isFullscreenEnabled, FULLSCREEN_CHANGE_EVENTS, FULLSCREEN_ERROR_EVENTS };

export interface UseFullscreenRootParameters {
  /**
   * Whether the container is currently displayed in fullscreen.
   *
   * To render an uncontrolled fullscreen, use the `defaultOpen` prop instead.
   */
  open?: boolean | undefined;
  /**
   * Whether the container is initially displayed in fullscreen.
   *
   * To render a controlled fullscreen, use the `open` prop instead.
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the container enters or exits fullscreen.
   */
  onOpenChange: (open: boolean, eventDetails: FullscreenRoot.ChangeEventDetails) => void;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Hint for the browser describing how the navigation UI should be presented
   * while the container is in fullscreen. Forwarded to `Element.requestFullscreen()`.
   */
  navigationUI: FullscreenNavigationUI;
}

export type FullscreenNavigationUI = 'auto' | 'show' | 'hide';

export interface UseFullscreenRootReturnValue {
  /**
   * The id of the container element. Used by the trigger's `aria-controls`.
   */
  containerId: string | undefined;
  /**
   * A ref to the container element that is requested to be displayed in fullscreen.
   */
  containerRef: React.MutableRefObject<HTMLElement | null>;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Exits fullscreen. Used by `Fullscreen.Close`.
   */
  handleClose: (event: React.MouseEvent | React.KeyboardEvent | React.PointerEvent) => void;
  /**
   * Called by the container when it unmounts. Resets state if we believe the
   * container is still in fullscreen so consumers stay in sync after the browser
   * auto-exits fullscreen on element removal.
   */
  handleContainerUnmount: () => void;
  /**
   * Handler for the document's `fullscreenchange` event. Called by the container.
   */
  handleFullscreenChange: (event: Event) => void;
  /**
   * Handler for the document's `fullscreenerror` event. Called by the container.
   */
  handleFullscreenError: (event: Event) => void;
  /**
   * Toggles fullscreen. Used by `Fullscreen.Trigger`.
   */
  handleTrigger: (event: React.MouseEvent | React.KeyboardEvent | React.PointerEvent) => void;
  /**
   * Forwarded to `Element.requestFullscreen()`.
   */
  navigationUI: FullscreenNavigationUI;
  /**
   * Whether the container is currently displayed in fullscreen.
   */
  open: boolean;
  setContainerIdState: (id: string | undefined) => void;
  setOpen: (nextOpen: boolean) => void;
  setSupported: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Whether the browser supports the Fullscreen API for the container's owner document.
   */
  supported: boolean;
}
