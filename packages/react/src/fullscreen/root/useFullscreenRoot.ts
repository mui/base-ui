'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import { warn } from '@base-ui/utils/warn';
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
import { installFullscreenEscapeBridge } from '../escapeBridge';
import type { FullscreenStore } from '../store/FullscreenStore';

/**
 * Wires the Fullscreen store to the browser Fullscreen API.
 *
 * Subscribes to `open` from the store and reactively calls
 * `requestFullscreen()` / `exitFullscreen()` from a layout effect so that the
 * call lands in the same JS task as the user gesture that originated the
 * state change (preserving the document's transient activation).
 *
 * Returns the handlers that the Container component must attach to the
 * document and to its lifecycle so the store stays in sync with the browser.
 */
export function useFullscreenRoot(
  parameters: UseFullscreenRootParameters,
): UseFullscreenRootReturnValue {
  const { store, onOpenChange } = parameters;

  // Installed lazily from a layout effect (rather than at module evaluation
  // time) because the package declares `sideEffects: false`; bundlers would
  // otherwise drop a top-level install call from the namespace re-export.
  // The function itself is idempotent and SSR-safe, so calling it from every
  // `<Fullscreen.Root>` mount is a no-op after the first one.
  useIsoLayoutEffect(() => {
    installFullscreenEscapeBridge();
  }, []);

  store.useContextCallback('onOpenChange', onOpenChange);

  const open = store.useState('open');
  const navigationUI = store.useState('navigationUI');
  const containerRef = store.context.containerRef;

  // Tracks the latest in-flight request promise so we can ignore stale
  // rejections from a request that was superseded by a newer state change
  // (e.g. the user toggled twice in quick succession).
  const requestPromiseRef = React.useRef<Promise<void> | null>(null);

  // Tracks the owner document we last observed a container in. Used when
  // closing a fullscreen view whose container has already been unmounted (for
  // example because `<Fullscreen.Portal>` returned `null` on the same commit
  // that flipped `open` to `false`); we still need to call `exitFullscreen()`
  // on the right document.
  const ownerDocumentRef = React.useRef<Document | null>(null);

  // Reactive bridge between the store's `open` and the browser Fullscreen API.
  //
  // Running this as a layout effect (instead of a plain `useEffect`) is what
  // makes controlled mode and detached/imperative triggers work end-to-end.
  // React commits a state update from a user-initiated event handler
  // synchronously in the same JS task as the event, and the layout effect runs
  // before the browser yields. As long as the `open={true}` change is initiated
  // from a user gesture (or a timer that still inherits transient activation),
  // the document's transient activation is still valid when
  // `requestFullscreen()` is called here, satisfying the spec's user-activation
  // requirement.
  //
  // If the change is initiated outside of a user gesture (timer beyond the
  // activation window, network response, programmatic `defaultOpen`, etc.),
  // the browser will reject the promise; we revert state via the `.catch`
  // below so consumers see the request fail through
  // `onOpenChange(false, { reason: 'none' })`.
  useIsoLayoutEffect(() => {
    const container = containerRef.current;
    if (container) {
      ownerDocumentRef.current = ownerDocument(container);
    }
    const doc = ownerDocumentRef.current;

    if (open) {
      // Need a live container to enter fullscreen. If `<Fullscreen.Portal>`
      // hasn't mounted it yet (or it was conditionally rendered out), bail
      // and let the next commit (with the container present) drive the call.
      if (!container) {
        return;
      }
      const isInFullscreen = doc ? getFullscreenElement(doc) === container : false;
      if (isInFullscreen) {
        return;
      }
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
          store.setOpen(false, createChangeEventDetails(REASONS.none));
        });
      }
    } else if (doc && getFullscreenElement(doc)) {
      // Exiting only depends on the document, not the container. This lets
      // us close cleanly even when the container has just unmounted (e.g.
      // because `<Fullscreen.Portal>` re-rendered to `null` on the same
      // commit that flipped `open` to `false`).
      const promise = exitDocumentFullscreen(doc);
      requestPromiseRef.current = promise;
      if (promise) {
        promise.catch(() => {
          // Restoring fullscreen after a failed exit would be jarring. The
          // next `fullscreenchange` event will reconcile state if needed.
        });
      }
    }
  }, [open, navigationUI, store, containerRef]);

  // Handles browser-initiated state changes (most commonly the Esc key, but
  // also browser exit affordances or the active element being removed). When
  // the browser state and our state already match, the event is a no-op (it
  // fired in response to one of our own request/exit calls). The document-
  // level Esc bridge in `escapeBridge.ts` ensures Esc reaches popup handlers
  // first; this listener only reconciles the React state with the browser.
  const handleFullscreenChange = useStableCallback((event: Event) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const doc = ownerDocument(container);
    const isInFullscreen = getFullscreenElement(doc) === container;
    const currentOpen = store.select('open');

    if (isInFullscreen === currentOpen) {
      return;
    }

    const reason = isInFullscreen ? REASONS.none : REASONS.escapeKey;
    store.setOpen(isInFullscreen, createChangeEventDetails(reason, event));
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
    requestPromiseRef.current = null;
    if (!store.select('open')) {
      return;
    }
    store.setOpen(false, createChangeEventDetails(REASONS.none));
  });

  return React.useMemo(
    () => ({
      handleFullscreenChange,
      handleFullscreenError,
      handleContainerUnmount,
    }),
    [handleFullscreenChange, handleFullscreenError, handleContainerUnmount],
  );
}

// Re-export so callers can detect support without reaching into internals.
export { isFullscreenEnabled, FULLSCREEN_CHANGE_EVENTS, FULLSCREEN_ERROR_EVENTS };

export type FullscreenNavigationUI = 'auto' | 'show' | 'hide';

export interface UseFullscreenRootParameters {
  /**
   * The store managing the fullscreen state. Created by `<Fullscreen.Root>`
   * (or shared via a `Fullscreen.Handle`).
   */
  store: FullscreenStore;
  /**
   * Stable callback invoked when the open state changes.
   */
  onOpenChange: (
    open: boolean,
    eventDetails: import('./FullscreenRoot').FullscreenRoot.ChangeEventDetails,
  ) => void;
}

export interface UseFullscreenRootReturnValue {
  /**
   * Handler for the document's `fullscreenchange` event. Called by the container.
   */
  handleFullscreenChange: (event: Event) => void;
  /**
   * Handler for the document's `fullscreenerror` event. Called by the container.
   */
  handleFullscreenError: (event: Event) => void;
  /**
   * Called by the container when it unmounts. Resets state if we believe the
   * container is still in fullscreen so consumers stay in sync after the
   * browser auto-exits fullscreen on element removal.
   */
  handleContainerUnmount: () => void;
}
