'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { Virtualizer as MuiVirtualizer } from '@mui/x-virtualizer';

export interface UseEngineModeParameters {
  api: MuiVirtualizer['api'];
  /**
   * Whether the engine windows the collection. `false` mounts every row, which is what a list
   * asks for while it temporarily needs the whole collection in the DOM.
   */
  enabled: boolean;
  /**
   * Called when the engine begins windowing again after mounting the whole collection. The
   * viewport it measured meanwhile describes an unconstrained layout, so whoever owns that
   * measurement has to take it again.
   */
  onWindowingResumed: () => void;
  /**
   * Called on every synchronization while windowing is off, not only on the transition out of it,
   * so nothing can stay armed across a suspension that never ends.
   */
  onWindowingSuspended: () => void;
  store: MuiVirtualizer['store'];
}

/**
 * Publishes the windowing mode to the engine, and announces the transitions of it that invalidate
 * a measured viewport.
 *
 * The engine consumes the mode in two places, so switching it takes two commits: the store flag
 * alone does not recompute the rendered range, and the hook that reads the flag has to re-run
 * before the render context can be forced against the new mode.
 */
export function useEngineMode(parameters: UseEngineModeParameters) {
  const { api, enabled, onWindowingResumed, onWindowingSuspended, store } = parameters;

  // The revision is read as a dependency below, so it stays a counter rather than a bare
  // re-render trigger.
  const [revision, bumpRevision] = React.useReducer((value: number) => value + 1, 0);
  const pendingUpdateRef = React.useRef(false);

  useIsoLayoutEffect(() => {
    const virtualization = store.state.virtualization;

    if (!enabled) {
      onWindowingSuspended();
    }

    if (
      virtualization.enabled === enabled &&
      virtualization.enabledForRows === enabled &&
      virtualization.enabledForColumns === false
    ) {
      return;
    }

    if (enabled) {
      onWindowingResumed();
    }

    // Updating the store flag alone does not recompute the rendered range. Schedule the MUI Virtualizer
    // render-context update before publishing the new virtualization mode.
    pendingUpdateRef.current = true;
    api.scheduleUpdateRenderContext();
    store.set('virtualization', {
      ...virtualization,
      enabled,
      enabledForColumns: false,
      enabledForRows: enabled,
    });
    // The mode fields are consumed inside the MUI Virtualizer hook. Guarantee another render before forcing
    // the update so the API closes over the new enabled state.
    bumpRevision();
  }, [api, enabled, onWindowingResumed, onWindowingSuspended, store]);

  useIsoLayoutEffect(() => {
    if (!pendingUpdateRef.current) {
      return;
    }

    pendingUpdateRef.current = false;
    api.forceUpdateRenderContext();
  }, [api, revision]);
}
