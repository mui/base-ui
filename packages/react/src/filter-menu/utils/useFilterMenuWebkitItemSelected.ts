'use client';
import { platform } from '@base-ui/utils/platform';
import { useIsHydrating } from '../../utils/useIsHydrating';

/**
 * WebKit only follows a searchbox's `aria-activedescendant` into a menu when its items expose a
 * selection state. Delay the engine-specific markup until after hydration so server and client
 * output agree.
 */
export function useFilterMenuWebkitItemSelected() {
  const hydrating = useIsHydrating();
  return !hydrating && platform.engine.webkit;
}
