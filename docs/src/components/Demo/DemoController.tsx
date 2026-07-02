'use client';

import * as React from 'react';
import { useDemoController } from '@mui/internal-docs-infra/useDemoController';
import { CodeControllerContext } from '@mui/internal-docs-infra/CodeControllerContext';

const TAILWIND_SRC = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';

let tailwindPromise: Promise<void> | undefined;

/**
 * Loads the Tailwind CSS browser build, sharing a single promise (and therefore a
 * single `<script>` / request) across every `DemoController` on the page. The script
 * is injected imperatively rather than rendered by React: React never executes script
 * tags it renders on the client, so a portaled `<script>` would never run.
 *
 * The browser build watches the DOM for class names and injects the generated styles,
 * so live-edited Tailwind variants are styled without a build step.
 */
function loadTailwind(): Promise<void> {
  if (tailwindPromise) {
    return tailwindPromise;
  }
  tailwindPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TAILWIND_SRC;
    script.async = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => {
      tailwindPromise = undefined;
      reject(new Error('Base UI: Failed to load the Tailwind CSS browser build.'));
    });
    document.head.appendChild(script);
  });
  return tailwindPromise;
}

export function DemoController({ children }: { children: React.ReactNode }) {
  const value = useDemoController();
  const needsTailwind = value.code != null && 'Tailwind' in value.code;

  const [tailwindReady, setTailwindReady] = React.useState(false);

  React.useEffect(() => {
    if (!needsTailwind || tailwindReady) {
      return undefined;
    }
    let active = true;
    loadTailwind().then(
      () => {
        if (active) {
          setTailwindReady(true);
        }
      },
      () => {},
    );
    return () => {
      active = false;
    };
  }, [needsTailwind, tailwindReady]);

  // Hold back the live preview components until Tailwind has loaded, so a Tailwind
  // variant isn't shown unstyled. Other variants pass straight through.
  const contextValue = React.useMemo<typeof value>(() => {
    if (needsTailwind && !tailwindReady) {
      return { ...value, components: undefined };
    }
    return value;
  }, [value, needsTailwind, tailwindReady]);

  return (
    <CodeControllerContext.Provider value={contextValue}>{children}</CodeControllerContext.Provider>
  );
}
