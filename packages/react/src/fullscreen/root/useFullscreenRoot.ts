'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
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

  // We default to `true` so the component does not flicker into a "disabled"
  // state during the very first render. The real value is determined the moment
  // the container element mounts, via `setSupported`.
  const [supported, setSupported] = React.useState(true);

  // The active reason for the next state change. We set this synchronously
  // before invoking `requestFullscreen` / `exitFullscreen` so that the
  // `fullscreenchange` listener can surface the correct reason to consumers.
  // When the listener observes a change with no pending reason, the change
  // came from outside our control (Esc key, ancestor exit, etc.).
  const pendingReasonRef = React.useRef<FullscreenRoot.ChangeEventReason | null>(null);

  const handleEnter = useStableCallback(
    (event: React.MouseEvent | React.KeyboardEvent | React.PointerEvent) => {
      const container = containerRef.current;
      if (!container || disabled || !supported) {
        return;
      }

      const eventDetails = createChangeEventDetails(REASONS.triggerPress, event.nativeEvent);
      onOpenChange(true, eventDetails);
      if (eventDetails.isCanceled) {
        return;
      }

      pendingReasonRef.current = REASONS.triggerPress;
      setOpen(true);

      const promise = requestElementFullscreen(container, navigationUI);
      if (promise) {
        promise.catch(() => {
          // The browser denied the request. Roll the optimistic update back
          // and let consumers know via the change handler.
          pendingReasonRef.current = null;
          setOpen(false);
          if (process.env.NODE_ENV !== 'production') {
            warn(
              '`requestFullscreen()` was rejected. The browser may have blocked the request because it was not initiated by a user gesture, or because fullscreen is not supported.',
            );
          }
          const failureDetails = createChangeEventDetails(REASONS.none, event.nativeEvent);
          onOpenChange(false, failureDetails);
        });
      }
    },
  );

  const handleExit = useStableCallback(
    (
      event: React.MouseEvent | React.KeyboardEvent | React.PointerEvent,
      reason: typeof REASONS.triggerPress | typeof REASONS.closePress,
    ) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const doc = ownerDocument(container);
      if (getFullscreenElement(doc) !== container) {
        return;
      }

      const eventDetails = createChangeEventDetails(reason, event.nativeEvent);
      onOpenChange(false, eventDetails);
      if (eventDetails.isCanceled) {
        return;
      }

      pendingReasonRef.current = reason;
      setOpen(false);

      const promise = exitDocumentFullscreen(doc);
      if (promise) {
        promise.catch(() => {
          // Restoring fullscreen after a failed exit would be jarring, so we
          // simply clear the pending reason. The next `fullscreenchange` event
          // (if any) will reconcile state.
          pendingReasonRef.current = null;
        });
      }
    },
  );

  const handleTrigger = useStableCallback(
    (event: React.MouseEvent | React.KeyboardEvent | React.PointerEvent) => {
      if (open) {
        handleExit(event, REASONS.triggerPress);
      } else {
        handleEnter(event);
      }
    },
  );

  const handleClose = useStableCallback(
    (event: React.MouseEvent | React.KeyboardEvent | React.PointerEvent) => {
      handleExit(event, REASONS.closePress);
    },
  );

  // Reconcile state with the browser. Called by the `fullscreenchange` listener
  // attached to the container's owner document.
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

  const handleFullscreenError = useStableCallback((event: Event) => {
    if (process.env.NODE_ENV !== 'production') {
      warn(
        'A `fullscreenerror` event was dispatched on the document. The browser refused to enter fullscreen for the requested element.',
      );
    }
    if (pendingReasonRef.current != null) {
      pendingReasonRef.current = null;
      const eventDetails = createChangeEventDetails(REASONS.none, event);
      onOpenChange(false, eventDetails);
      if (eventDetails.isCanceled) {
        return;
      }
      setOpen(false);
    }
  });

  return React.useMemo(
    () => ({
      containerId,
      containerRef,
      disabled,
      handleClose,
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
