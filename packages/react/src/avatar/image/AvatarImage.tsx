'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { makeEventPreventable } from '../../merge-props';
import type { BaseUIEvent } from '../../types';
import { BaseUIComponentProps } from '../../internals/types';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { useRenderElement } from '../../internals/useRenderElement';
import { useIsHydrating } from '../../utils/useIsHydrating';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import type { AvatarRootState, ImageLoadingStatus } from '../root/AvatarRoot';
import { AvatarImageDataAttributes } from './AvatarImageDataAttributes';

function toBaseUiImgEvent(event: React.SyntheticEvent<HTMLImageElement>) {
  return makeEventPreventable(event as BaseUIEvent<React.SyntheticEvent<HTMLImageElement>>);
}

function resolveImageLoadingStatus(
  src: string | undefined,
  intrinsicDecodeFailed: boolean,
  intrinsicSettled: boolean,
): ImageLoadingStatus {
  if (!src || intrinsicDecodeFailed) {
    return 'error';
  }
  if (!intrinsicSettled) {
    return 'loading';
  }
  return 'loaded';
}

const LOADING_HOOK = { [AvatarImageDataAttributes.loading]: '' };
const LOADED_HOOK = { [AvatarImageDataAttributes.loaded]: '' };
const ERROR_HOOK = { [AvatarImageDataAttributes.error]: '' };

/**
 * Emit one boolean data attribute per discrete bitmap state. The image is always mounted, so the
 * usual `[data-starting-style]` / `[data-ending-style]` (which signal mount/unmount transitions)
 * would be misleading here — `[data-loading]` / `[data-loaded]` / `[data-error]` describe the
 * image's actual lifecycle and are stable across the entire phase, so consumers can hold a CSS
 * "from" state for the whole loading window and animate when it flips to `[data-loaded]`.
 *
 * Hiding the `<img>` while loading or errored is the consumer's responsibility — the simplest
 * recipe is `[data-loading], [data-error] { visibility: hidden }` (or `opacity: 0`), which
 * prevents the browser's broken-image glyph and the unstyled bitmap from painting. We
 * deliberately don't apply this as an inline style: it would force consumers into specificity
 * wars when they want different hiding behaviour, and Base UI is unstyled by design. Note: avoid
 * the `hidden` attribute (`display: none`) because `loading="lazy"` requires the element to be
 * in the layout tree for the IntersectionObserver to track it.
 */
const stateAttributesMapping: StateAttributesMapping<AvatarImageState> = {
  imageLoadingStatus(value): Record<string, string> | null {
    if (value === 'loading') {
      return LOADING_HOOK;
    }
    if (value === 'loaded') {
      return LOADED_HOOK;
    }
    if (value === 'error') {
      return ERROR_HOOK;
    }
    return null;
  },
};

/**
 * The image to be displayed in the avatar.
 * Renders an `<img>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export const AvatarImage = React.forwardRef(function AvatarImage(
  componentProps: AvatarImage.Props,
  forwardedRef: React.ForwardedRef<HTMLImageElement>,
) {
  const {
    className,
    render,
    style,
    onLoadingStatusChange: onLoadingStatusChangeProp,
    hidden: hiddenProp,
    onLoad: onLoadProp,
    onError: onErrorProp,
    ...elementProps
  } = componentProps;

  const context = useAvatarRootContext();

  const [intrinsicDecodeFailed, setIntrinsicDecodeFailed] = React.useState(false);

  /**
   * `true` while React is rendering server markup or running the very first client render that
   * hydrates that markup. Goes to `false` on every subsequent client render (SPA navigations,
   * Remounts, prop changes that re-mount the subtree). We use it to gate the in-render cache
   * probe below: server can't know browser-cache state, so the probe must stay off during
   * hydration to avoid mismatching the server's `[data-loading]` HTML.
   */
  const isHydrating = useIsHydrating();

  /**
   * Initialise `intrinsicSettled` from a synchronous in-render cache probe so cached URLs commit
   * straight to `[data-loaded]` on the very first paint. Without this, the component would render
   * once with `[data-loading]`, then a layout effect would detect the cache and re-render with
   * `[data-loaded]` — both before paint (so consumers never see a fallback flash), but the
   * browser's CSS engine still observes the attribute flip on an existing element and fires any
   * `transition` declared on the loading-state styles, producing a stray fade-in for images that
   * were supposed to appear instantly. This is the entry-animation regression users hit when they
   * return to a page in an SPA (the `<img>` URL is in cache, no real load happens, but the
   * browser still animates between the two computed styles).
   *
   * Why a phantom `<img>` is safe and narrow:
   * - It only runs once per mount (the lazy initializer), so there's no per-render overhead.
   * - For cached URLs the browser short-circuits to the in-memory bitmap synchronously, so
   *   `complete && naturalWidth > 0` is reliable here. Same check we run later against the real
   *   `<img>` for the layout-effect fast-path, just hoisted up to render time so the first
   *   commit can already be `[data-loaded]`.
   * - For uncached URLs the browser deduplicates the probe against the real `<img>`'s subsequent
   *   request (same URL within the same task), so there's no extra network round-trip in
   *   practice — it just falls through to the normal `loading → loaded` path.
   * - During SSR (or React hydrating server-rendered HTML on the client), `isHydrating` is
   *   `true` and we skip the probe entirely. Any `data-loaded` we returned here would either
   *   need to be reconciled against the server's `data-loading` (mismatch + attribute flip on
   *   an existing element → transition fires), or land in HTML the server can't actually
   *   guarantee. Layout-effect cache fast-path below catches the cached case post-hydration —
   *   identical behavior to before this fix on the SSR path, fixed on every other path.
   */
  const [intrinsicSettled, setIntrinsicSettled] = React.useState(() => {
    if (!componentProps.src) {
      return true;
    }
    if (typeof window === 'undefined' || isHydrating) {
      return false;
    }
    const probe = new window.Image();
    probe.src = componentProps.src;
    return probe.complete && probe.naturalWidth > 0;
  });

  /**
   * Set when the image was already in the browser cache at mount and we resolved it synchronously
   * (either via the `useState` cache probe above or via the `useIsoLayoutEffect` fast-path
   * below). Used to suppress the transient `'loading'` fire to consumer's `onLoadingStatusChange`
   * — for cached images there's no real "loading" phase consumers should observe.
   */
  const cachedAtMountRef = React.useRef(false);

  /**
   * Reset intrinsic load state synchronously during render when `src` changes. Doing this in a
   * layout effect would let one commit slip through with stale state — a stale `intrinsicSettled`
   * from a prior `src` would make `imageLoadingStatus` flip to the wrong value for a single
   * render before the effect could correct it. The conditional setState here is React's
   * recommended pattern for resetting state on prop change — React discards the in-flight
   * render output and re-renders with the new state before any commit, so no DOM/effect ever
   * observes the stale value. Strictly cheaper than the effect-based alternative (one commit
   * instead of two).
   * https://react.dev/reference/react/useState#storing-information-from-previous-renders
   *
   * For src → src swaps where the previous bitmap had loaded successfully we deliberately
   * preserve `intrinsicSettled = true`. Browsers keep painting the previously-decoded bitmap on
   * the `<img>` until the new src finishes decoding (the "stale-image" behaviour), and forcing
   * status back through `'loading'` would pop the fallback on top of that still-visible old
   * bitmap for a frame — exactly the flash users are reporting. By keeping status at `'loaded'`
   * the swap is invisible to `Avatar.Fallback`; if the new src eventually errors, the `<img>`'s
   * `onError` flips `intrinsicDecodeFailed` and we fall through to `'error'` then.
   */
  const [previousSrc, setPreviousSrc] = React.useState(componentProps.src);
  if (previousSrc !== componentProps.src) {
    setPreviousSrc(componentProps.src);
    setIntrinsicDecodeFailed(false);
    cachedAtMountRef.current = false;

    const hasSettledBitmap = intrinsicSettled && !intrinsicDecodeFailed;
    const isSrcSwap = Boolean(previousSrc) && Boolean(componentProps.src);
    if (!hasSettledBitmap || !isSrcSwap) {
      // Initial load (was empty), error recovery, or clearing src — start fresh.
      setIntrinsicSettled(!componentProps.src);
    }
  }

  /**
   * Status reflects the rendered `<img>`'s actual load/decode lifecycle — not an optimistic
   * `'loaded'` on `src` alone — so `Avatar.Fallback` shows during slow networks (`'loading'`).
   */
  const imageLoadingStatus = resolveImageLoadingStatus(
    componentProps.src,
    intrinsicDecodeFailed,
    intrinsicSettled,
  );

  context.transientImageLoadingStatusRef.current = imageLoadingStatus;

  const handleIntrinsicLoad = useStableCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    onLoadProp?.(toBaseUiImgEvent(event));
    setIntrinsicSettled(true);
  });

  const handleIntrinsicError = useStableCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    onErrorProp?.(toBaseUiImgEvent(event));
    setIntrinsicSettled(true);
    setIntrinsicDecodeFailed(true);
  });

  const imageRef = React.useRef<HTMLImageElement | null>(null);

  /**
   * Reconcile state with the real `<img>`'s already-settled load result on first commit (and after
   * any `src` swap that re-enters the loading phase). `img.complete` flips to `true` for both
   * outcomes — successful decode (`naturalWidth > 0`) and decode failure (`naturalWidth === 0`,
   * e.g. 404, non-image response, blocked request). We have to handle both branches here because:
   *
   * 1. **Cached success.** Disk/memory-cached imgs expose `complete + naturalWidth > 0` before
   *    `load` bubbles, so flipping straight to `'loaded'` here keeps cached renders glitch-free.
   *    `decode()` resolves in a microtask and runs **after** the first paint, which would emit a
   *    stale `[data-loading]` for one visible frame and force consumers' loading-state CSS (e.g.
   *    `visibility: hidden`) to apply on what should be an instant render.
   *
   * 2. **Pre-hydration error.** During SSR the server emits `<img src=...>` into HTML; the browser
   *    starts the fetch immediately and may dispatch `error` *before* React hydrates and attaches
   *    `onError`, so the handler never runs. After hydration the `<img>` reports
   *    `complete: true, naturalWidth: 0`, but without this branch we'd stay at `'loading'`
   *    indefinitely — the user-reported "broken src stuck at loading" regression on hard refresh.
   *    Mirror the failure into both `intrinsicSettled` and `intrinsicDecodeFailed` so status
   *    flows through to `'error'` exactly like a normal `onError` would.
   *
   * Must settle synchronously in this layout effect — both branches drive the very next paint.
   */
  useIsoLayoutEffect(() => {
    if (intrinsicSettled || intrinsicDecodeFailed) {
      return;
    }
    const img = imageRef.current;
    if (!img?.complete) {
      return;
    }
    if (img.naturalWidth > 0) {
      cachedAtMountRef.current = true;
      setIntrinsicSettled(true);
      return;
    }
    setIntrinsicSettled(true);
    setIntrinsicDecodeFailed(true);
  }, [intrinsicSettled, intrinsicDecodeFailed, componentProps.src]);

  const setLiftedImageLoadingStatus = context.setImageLoadingStatus;

  /**
   * Always mirror the local status into `Avatar.Root`'s lifted state so `Avatar.Fallback`
   * re-renders whenever the bitmap state changes — including the transient `'loading'` frame
   * for cached `src` swaps. The transient ref short-circuits Fallback's render decision to
   * the up-to-date status, but Fallback only consults it when it actually re-renders, and a
   * re-render only happens when the context value (i.e. lifted state) flips. Coupling this
   * to the consumer callback's dedupe/suppression caused stuck-fallback bugs on cached →
   * cached swaps where the lifted status was already `'loaded'` (last fired value).
   * `setState` to the same value is a cheap no-op, so unconditional sync is safe.
   */
  useIsoLayoutEffect(() => {
    setLiftedImageLoadingStatus(imageLoadingStatus);
  }, [imageLoadingStatus, setLiftedImageLoadingStatus]);

  const handleLoadingStatusChange = useStableCallback((status: ImageLoadingStatus) => {
    onLoadingStatusChangeProp?.(status);
  });

  /**
   * Tracks the last status we surfaced to consumers. Refs survive StrictMode's simulated
   * unmount/remount, so this dedupes the duplicate `'loading'` fire that would otherwise
   * happen when React intentionally double-invokes effects on mount in dev — the second
   * invocation observes the same `imageLoadingStatus` and is short-circuited here. Real
   * status transitions ('loading' -> 'loaded' / 'error') still fire exactly once.
   */
  const lastFiredStatusRef = React.useRef<ImageLoadingStatus | undefined>(undefined);

  useIsoLayoutEffect(() => {
    // Suppress the transient `'loading'` fire when the cache fast-path is about to flip
    // straight to `'loaded'` on the next render. Layout effects run in declaration order, so
    // by the time this effect runs, the cache fast-path effect above has already populated
    // `cachedAtMountRef.current` for this commit — when it's true we know the image was
    // resolved synchronously from the browser cache and never went through a real loading
    // phase, so consumers shouldn't observe a `'loading'` status at all.
    if (cachedAtMountRef.current && imageLoadingStatus === 'loading') {
      return;
    }
    if (lastFiredStatusRef.current === imageLoadingStatus) {
      return;
    }
    lastFiredStatusRef.current = imageLoadingStatus;
    handleLoadingStatusChange(imageLoadingStatus);
  }, [imageLoadingStatus, handleLoadingStatusChange]);

  const state: AvatarImageState = {
    imageLoadingStatus,
  };

  return useRenderElement('img', componentProps, {
    state,
    ref: [forwardedRef, imageRef],
    props: {
      ...elementProps,
      hidden: hiddenProp,
      onLoad: handleIntrinsicLoad,
      onError: handleIntrinsicError,
    },
    stateAttributesMapping,
  });
});

export interface AvatarImageState extends AvatarRootState {}

export interface AvatarImageProps extends BaseUIComponentProps<'img', AvatarImageState> {
  /**
   * Callback fired when the loading status changes.
   */
  onLoadingStatusChange?: ((status: ImageLoadingStatus) => void) | undefined;
}

export namespace AvatarImage {
  export type State = AvatarImageState;
  export type Props = AvatarImageProps;
}
