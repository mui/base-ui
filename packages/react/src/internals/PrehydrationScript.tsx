'use client';
import * as React from 'react';
import { useIsHydrating } from '../utils/useIsHydrating';
import { useCSPContext } from './csp-context/CSPContext';

/**
 * Renders an inline script that runs before React hydrates, used by components that need
 * to position server-rendered content ahead of hydration (e.g. `Tabs.Indicator`,
 * `Slider.Thumb`).
 *
 * The `script` source is imported by the caller through the package's `#prehydration/*`
 * subpath import, whose `browser` condition resolves to a stub module exporting an empty
 * string — so the script body is excluded from client bundles. It only ever executes from
 * server-rendered HTML.
 *
 * Render this only when the script should be emitted (i.e. gate `renderBeforeHydration`
 * and any structural conditions at the call site). The element is still rendered (with
 * empty content) on the client during the hydration pass so the React tree matches the
 * server markup; `suppressHydrationWarning` bridges the content difference and React keeps
 * the already-executed server script. Once `isHydrating` flips to `false` the element
 * unmounts.
 *
 * The component must stay in client bundles: returning `null` on the client (e.g. by
 * stubbing the whole component) would drop an element the server emitted and trigger a
 * recoverable hydration error (React #418) in consumers' apps. Only the script body is
 * excluded from client bundles, via the `#prehydration/*` `browser` condition.
 *
 * When adding a new consumer, register a matching `#prehydration/*` entry (with `browser`
 * and `default` conditions) in `packages/react/package.json` `imports`; the `browser`
 * condition reuses the shared `internals/prehydrationScript.stub.ts`.
 */
export function PrehydrationScript(props: PrehydrationScript.Props) {
  const { script } = props;
  const { nonce } = useCSPContext();
  const isHydrating = useIsHydrating();

  if (!isHydrating) {
    return null;
  }

  return (
    <script
      nonce={nonce}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}

export namespace PrehydrationScript {
  export interface Props {
    /**
     * The script source, imported through the `#prehydration/*` subpath import.
     * Empty in client bundles.
     */
    script: string;
  }
}
