'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useForcedRerendering } from '@base-ui/utils/useForcedRerendering';
import { useTransitionStatus } from './useTransitionStatus';
import { useOpenChangeComplete } from './useOpenChangeComplete';

export interface UseUnmountAfterCloseParameters {
  /**
   * Whether the popup is open.
   */
  open: boolean;
  /**
   * Ref to the element whose closing animations are awaited before unmounting.
   */
  ref: React.RefObject<HTMLElement | null>;
  /**
   * Reads the latest open state when it can run ahead of the rendered `open`, such as a store
   * that syncs a controlled `open` prop in a layout effect declared before this hook. An
   * `unmount` batched with a controlled close then takes effect in the commit that still renders
   * the popup open instead of being dropped.
   */
  getOpen?: (() => boolean) | undefined;
  /**
   * Whether the current close cycle asked to keep the popup mounted until the `unmount` action
   * is called. Ignored while `open`.
   */
  preventUnmountOnClose: boolean;
  /**
   * Writes `preventUnmountOnClose`. Opening starts a new close cycle, so the hook clears it
   * whenever `open` becomes `true`.
   */
  setPreventUnmountOnClose: (preventUnmountOnClose: boolean) => void;
  /**
   * Runs once per unmount, whether it completed automatically or through `forceUnmount`.
   */
  onUnmount: () => void;
  /**
   * Whether a popup that mounts already open should still play its enter transition.
   * See `useTransitionStatus`.
   */
  animateInitialOpen?: boolean | undefined;
}

/**
 * Keeps a popup mounted through its closing animation and unmounts it once the animation
 * finishes, unless the close cycle opted out through `preventUnmountOnClose`.
 * Store-agnostic: hosts sync `mounted` and `transitionStatus` wherever they need them.
 *
 * @returns `forceUnmount` unmounts the popup immediately. It is a no-op once the popup is already
 *   unmounted, so calling it after the automatic unmount doesn't repeat the completion callback,
 *   and a call while the popup is open only takes effect if a close commits in the same batch.
 */
export function useUnmountAfterClose(parameters: UseUnmountAfterCloseParameters) {
  const {
    open,
    getOpen,
    ref,
    preventUnmountOnClose,
    setPreventUnmountOnClose: setPreventUnmountOnCloseParam,
    onUnmount,
    animateInitialOpen,
  } = parameters;
  const setPreventUnmountOnClose = useStableCallback(setPreventUnmountOnCloseParam);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(
    open,
    false,
    false,
    animateInitialOpen,
  );

  // Opening starts a new close cycle. Derive during render so the close-completion hook below
  // reads the value on the same pass, and clear the stored value so it doesn't leak into the next
  // close. The effect only runs when `open` changes, so an opt-out recorded while a controlled
  // close is still pending (for example in a transition) is not cleared by the render that still
  // sees `open`.
  const preventUnmountingOnClose = open ? false : preventUnmountOnClose;
  useIsoLayoutEffect(() => {
    if (open) {
      setPreventUnmountOnClose(false);
    }
  }, [open, setPreventUnmountOnClose]);

  // Mirrors `mounted` synchronously so repeated `forceUnmount()` calls in one batch complete
  // closing once. Resynced on every commit unless `unmount` already ran in it (see below):
  // `setMounted(false)` while open re-mounts on the next render without changing the committed
  // `mounted`, so a `[mounted]` dependency would leave the mirror stale and block every later
  // unmount.
  const mountedRef = React.useRef(mounted);
  const pendingUnmountRef = React.useRef(false);
  const rerender = useForcedRerendering();

  // Set when `unmount` runs during this render's commit before the effect below, for example from
  // a descendant's layout effect. The committed `mounted` is stale then, and resyncing the mirror
  // to it would let the close completion unmount a second time.
  let unmountedInCommit = false;

  const unmount = () => {
    unmountedInCommit = true;
    mountedRef.current = false;
    setMounted(false);
    onUnmount();
  };

  useIsoLayoutEffect(() => {
    if (!unmountedInCommit) {
      mountedRef.current = mounted;
    }
    if (pendingUnmountRef.current) {
      pendingUnmountRef.current = false;
      // The mirror, not the committed `mounted`, so an `unmount` a descendant already ran in this
      // commit isn't repeated. `getOpen` catches a controlled close this commit doesn't render yet.
      if (mountedRef.current && (!open || getOpen?.() === false)) {
        unmount();
      }
    }
  });

  const forceUnmount = useStableCallback(() => {
    if (!mountedRef.current) {
      return;
    }
    if (open) {
      // The rendered `open` can't tell a stale exit-animation callback after a quick reopen from a
      // close batched with this call (`close(); unmount()`). Decide once the batch commits: unmount
      // if the popup closed, otherwise drop the call rather than run the host's unmount cleanup and
      // the close completion against a live popup.
      pendingUnmountRef.current = true;
      rerender();
      return;
    }
    unmount();
  });

  useOpenChangeComplete({
    enabled: mounted && !open && !preventUnmountingOnClose,
    open,
    ref,
    onComplete() {
      if (!open) {
        forceUnmount();
      }
    },
  });

  return { mounted, transitionStatus, preventUnmountingOnClose, forceUnmount };
}
