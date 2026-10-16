import { isReactVersionAtLeast } from '@base-ui/utils/reactVersion';
import { SafeReact } from '@base-ui/utils/safeReact';
import { NOOP } from '../internals/noop';

function subscribe() {
  return NOOP;
}

function useFormatLocaleModern(locale: Intl.LocalesArgument | undefined) {
  // React renders with the server snapshot while hydrating, then re-renders only if the client
  // snapshot differs, so a passed `locale` never causes a re-render.
  return SafeReact.useSyncExternalStore(
    subscribe,
    () => locale,
    () => locale ?? 'en-US',
  );
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
