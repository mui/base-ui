import { isReactVersionAtLeast } from '@base-ui/utils/reactVersion';
import { useIsHydrating } from './useIsHydrating';

function useFormatLocaleModern(locale: Intl.LocalesArgument | undefined) {
  const isHydrating = useIsHydrating();
  return locale ?? (isHydrating ? 'en-US' : undefined);
}

function useFormatLocaleLegacy(locale: Intl.LocalesArgument | undefined) {
  return locale;
}

/**
 * The server can't know the visitor's locale, so format with a fixed one until hydration finishes.
 * The server markup then matches the hydration render, and the visitor's locale is applied after.
 * React 17 can't tell hydration from a client-only mount, so it keeps the runtime locale.
 */
export const useFormatLocale = isReactVersionAtLeast(18)
  ? useFormatLocaleModern
  : useFormatLocaleLegacy;
