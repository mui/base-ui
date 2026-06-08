'use client';
import * as React from 'react';

/**
 * Provided by `<Fullscreen.Portal>` so that descendants — chiefly
 * `<Fullscreen.Container>` — can detect they are mounted inside a portal and
 * adapt their behavior (for example, hiding themselves while not in
 * fullscreen so `keepMounted` content does not leak into the page layout).
 *
 * The value is the resolved `keepMounted` flag for parity with
 * `DialogPortalContext`, even though the Fullscreen container does not need
 * the value today.
 *
 * Returns `undefined` when the consumer is not inside a `<Fullscreen.Portal>`.
 */
export const FullscreenPortalContext = React.createContext<boolean | undefined>(undefined);
