'use client';
import * as React from 'react';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';

/**
 * How long after the last scroll position change a gesture is considered finished. Refreshing the
 * estimate rewrites the height of every unmeasured row at once, so it is held back until then.
 */
export const SCROLL_IDLE_MS = 150;

/**
 * How recently a wheel or touch event must have occurred for a scroll event to be attributed to
 * it. Scroll bursts without such input while a mouse button is held are native scrollbar drags.
 */
const DIRECT_INPUT_WINDOW_MS = 250;

/**
 * What the input record says about a scroll position change, at the moment it arrives. A caller
 * that wrote a scroll position of its own decides from this whether the event is its own echo.
 */
export interface ScrollInputEvidence {
  /** Whether wheel or touch input landed on the scroller recently enough to explain the scroll. */
  hasDirectInput: boolean;
  /** Whether a pointer or mouse button is currently pressed. */
  isPointerDown: boolean;
}

export interface UseScrollGestureParameters {
  /**
   * Commits the row heights collected so far in one geometry update. Called once a scrollbar drag
   * releases, so the heights deferred during the drag land together rather than under the pointer.
   */
  settleGeometry: () => void;
  /**
   * Whether measurements are being held back for a drag, which a release then has to commit even
   * after the drag itself stopped counting as one.
   */
  hasDeferredRowHeights: () => boolean;
}

/**
 * What the rest of the virtualizer asks about the user's hands: whether a scroll is in progress,
 * whether it is a scrollbar drag, and when one has settled.
 */
export interface ScrollGesture {
  /**
   * Attributes a scroll position change, given a predicate that recognizes the caller's own
   * corrective writes. A change the predicate does not claim starts or extends a user gesture.
   * Returns whether the change was the user's.
   */
  noteScroll: (isProgrammaticEcho: (evidence: ScrollInputEvidence) => boolean) => boolean;
  /**
   * Whether a scroll position change happened recently enough to still count as one gesture.
   * Geometry rewrites are held back for its duration.
   */
  isScrolling: () => boolean;
  /**
   * Whether the current scroll burst is a native scrollbar drag. The user then dictates the
   * absolute scroll position, so anchoring corrections and estimate refreshes are suspended until
   * release.
   */
  isScrollbarDrag: () => boolean;
  /**
   * Bumped whenever a gesture settles: the idle timer elapses, or a scrollbar drag releases the
   * measurements it deferred.
   */
  settledRevision: number;
  /**
   * Binds the input listeners to the scroll element it is handed, and unbinds them when handed
   * `null`. Merged into the scroll element's ref, so the listeners follow the element the caller
   * renders, including a root the `render` prop replaces without the component remounting.
   */
  scrollElementRefCallback: (element: HTMLElement | null) => void;
}

/**
 * Tracks how the user is scrolling: whether a gesture is in progress, whether it is a native
 * scrollbar drag, and when one has settled. The row measurements held back during a drag are
 * committed in a single geometry update on release, so the scrollbar thumb never moves out from
 * under the pointer.
 */
export function useScrollGesture(parameters: UseScrollGestureParameters): ScrollGesture {
  const { hasDeferredRowHeights, settleGeometry } = parameters;

  // Scrolling is treated as ongoing until this long without a scroll position change, so that
  // geometry rewrites can be held back for the duration of a gesture.
  const scrollIdleTimeout = useTimeout();
  const isScrollingRef = React.useRef(false);
  const [settledRevision, bumpSettledRevision] = React.useReducer((value) => value + 1, 0);

  /** Timestamp of the last wheel/touch input on the scroller. */
  const lastDirectInputTimeRef = React.useRef(Number.NEGATIVE_INFINITY);
  /** Whether a pointer or mouse button is currently pressed, tracked on the owner document. */
  const pointerDownRef = React.useRef(false);
  /**
   * Whether the current scroll burst arrives without wheel/touch input while a mouse button is
   * held — a native scrollbar drag.
   */
  const isScrollbarDragRef = React.useRef(false);
  const releaseScrollbarDragFrame = useAnimationFrame();

  const noteScroll = useStableCallback(
    (isProgrammaticEcho: (evidence: ScrollInputEvidence) => boolean) => {
      const evidence: ScrollInputEvidence = {
        hasDirectInput:
          performance.now() - lastDirectInputTimeRef.current <= DIRECT_INPUT_WINDOW_MS,
        isPointerDown: pointerDownRef.current,
      };

      if (isProgrammaticEcho(evidence)) {
        return false;
      }

      isScrollingRef.current = true;
      scrollIdleTimeout.start(SCROLL_IDLE_MS, () => {
        isScrollingRef.current = false;
        bumpSettledRevision();
      });

      isScrollbarDragRef.current = evidence.isPointerDown && !evidence.hasDirectInput;
      return true;
    },
  );

  const commitScrollbarDrag = useStableCallback(() => {
    if (!isScrollbarDragRef.current && !hasDeferredRowHeights()) {
      return;
    }

    isScrollbarDragRef.current = false;
    releaseScrollbarDragFrame.request(() => {
      // Commit real heights collected during the drag in one geometry update after release.
      settleGeometry();
      bumpSettledRevision();
    });
  });

  const bindScrollElement = useStableCallback((scrollElement: HTMLElement) => {
    const doc = ownerDocument(scrollElement);
    const win = ownerWindow(scrollElement);
    const onDirectInput = () => {
      lastDirectInputTimeRef.current = performance.now();
      commitScrollbarDrag();
    };
    const onPressStart = () => {
      pointerDownRef.current = true;
    };
    const endScrollbarDrag = () => {
      pointerDownRef.current = false;
      commitScrollbarDrag();
    };

    const options: AddEventListenerOptions = { passive: true };
    scrollElement.addEventListener('wheel', onDirectInput, options);
    scrollElement.addEventListener('touchmove', onDirectInput, options);
    // Pointer and compat mouse events complement each other: list items cancel `pointerdown` to
    // protect the anchor's focus, which suppresses the compat `mousedown`/`mouseup` for that
    // press, while native scrollbar presses may dispatch only mouse events. Setting the shared
    // flag twice for the same press is harmless.
    doc.addEventListener('pointerdown', onPressStart, options);
    doc.addEventListener('mousedown', onPressStart, options);
    doc.addEventListener('pointerup', endScrollbarDrag, options);
    doc.addEventListener('pointercancel', endScrollbarDrag, options);
    doc.addEventListener('mouseup', endScrollbarDrag, options);
    // A drag can end outside the window; treat losing focus as releasing the button.
    win.addEventListener('blur', endScrollbarDrag);
    return () => {
      scrollElement.removeEventListener('wheel', onDirectInput, options);
      scrollElement.removeEventListener('touchmove', onDirectInput, options);
      doc.removeEventListener('pointerdown', onPressStart, options);
      doc.removeEventListener('mousedown', onPressStart, options);
      doc.removeEventListener('pointerup', endScrollbarDrag, options);
      doc.removeEventListener('pointercancel', endScrollbarDrag, options);
      doc.removeEventListener('mouseup', endScrollbarDrag, options);
      win.removeEventListener('blur', endScrollbarDrag);
    };
  });

  // Bound through the element's ref rather than an effect keyed on the ref object, so a root the
  // `render` prop replaces gets the listeners and the detached one loses them. The previous
  // binding is released on every call, which covers the `null` pass React makes on detach when a
  // ref returns no cleanup (17, 18, and 19 alike).
  const unbindScrollElementRef = React.useRef<(() => void) | undefined>(undefined);
  const scrollElementRefCallback = useStableCallback((scrollElement: HTMLElement | null) => {
    unbindScrollElementRef.current?.();
    unbindScrollElementRef.current = scrollElement ? bindScrollElement(scrollElement) : undefined;
  });

  // The window computation reads the gesture during render, so these must stay callable there:
  // they only read refs.
  const isScrolling = React.useCallback(() => isScrollingRef.current, []);
  const isScrollbarDrag = React.useCallback(() => isScrollbarDragRef.current, []);

  return React.useMemo(
    () => ({
      isScrollbarDrag,
      isScrolling,
      noteScroll,
      scrollElementRefCallback,
      settledRevision,
    }),
    [isScrollbarDrag, isScrolling, noteScroll, settledRevision, scrollElementRefCallback],
  );
}
