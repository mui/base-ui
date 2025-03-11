'use client';
import * as React from 'react';
import {
  useEnhancedEffect,
  useTransitionStatus,
} from '@base-ui-components/react/utils';
import classes from './plain.module.css';

import { useAnimationsFinished } from '../../../../../../packages/react/src/utils/useAnimationsFinished';
import { useEventCallback } from '../../../../../../packages/react/src/utils/useEventCallback';
import { useForkRef } from '../../../../../../packages/react/src/utils/useForkRef';

const STARTING_HOOK = { 'data-starting-style': '' };
const ENDING_HOOK = { 'data-ending-style': '' };

// const DEFAULT_OPEN = false;
const KEEP_MOUNTED = true;

function PlainCollapsible(props: { defaultOpen?: boolean; keepMounted?: boolean }) {
  const { keepMounted = true, defaultOpen = false } = props;

  const [open, setOpen] = React.useState(defaultOpen);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, false);

  const styleHooks = React.useMemo(() => {
    if (transitionStatus === 'starting') {
      return STARTING_HOOK;
    }
    if (transitionStatus === 'ending') {
      return ENDING_HOOK;
    }
    return null;
  }, [transitionStatus]);

  const [height, setHeight] = React.useState<number | undefined>(undefined);

  const isInitiallyOpen = React.useRef(open);

  const isHidden = React.useMemo(() => {
    if (keepMounted) {
      return !open;
    }

    return !open && !mounted;
  }, [keepMounted, open, mounted]);

  const panelRef: React.RefObject<HTMLElement | null> = React.useRef(null);

  /**
   * When `keepMounted` is `true` this runs once as soon as it exists in the DOM
   * regardless of initial open state.
   *
   * When `keepMounted` is `false` this runs on every mount, typically every
   * time it opens. If the panel is in the middle of a close transition that is
   * interrupted and re-opens, this won't run as the panel was not unmounted.
   */
  const handlePanelRef = useEventCallback((element: HTMLElement) => {
    if (!element) {
      return;
    }
    /**
     * Explicitly set `display` to ensure the panel is actually rendered before
     * measuring anything. `!important` is to needed to override a conflicting
     * Tailwind v4 default that sets `display: none !important` on `[hidden]`:
     * https://github.com/tailwindlabs/tailwindcss/blame/main/packages/tailwindcss/preflight.css#L382
     */
    element.style.setProperty('display', 'block', 'important');

    // const panelStyles = getComputedStyle(element);

    if (height === undefined) {
      // console.log('here');
      // it's possible to read the values of all transition properties in their closed state
      // at the cost of a flash:
      // if (keepMounted) {
      //   if (isInitiallyOpen.current) {
      //     // initially open
      //     element.style.setProperty('transition', 'none', 'important');
      //     setOpen(false);
      //     requestAnimationFrame(() => {
      //       requestAnimationFrame(() => {
      //         requestAnimationFrame(() => {
      //           console.log('here 2');
      //           console.log(panelStyles.height, panelStyles.opacity);
      //           setOpen(true);
      //         });
      //       });
      //     });
      //   } else {
      //     // initially closed
      //     console.log('here 3');
      //     console.log(panelStyles.height, panelStyles.opacity);
      //   }
      // }
      // the closed transition styles must be set here to transition the first
      // opening transition when both:
      // 1 - the panel is initially closed
      // 2 - `keepMounted={false}`
      // element.style.opacity = '0';

      setHeight(element.scrollHeight);
      element.style.removeProperty('display');

      // after setHeight() all the transition properties need to be removed
      // element.style.removeProperty('opacity');
      if (isInitiallyOpen.current) {
        element.style.transitionDuration = '0s';

        requestAnimationFrame(() => {
          setTimeout(() => {
            element.style.removeProperty('transition-duration');
            if (!keepMounted) {
              isInitiallyOpen.current = false;
            }
          });
        });
      }
    }
  });

  const mergedRef = useForkRef(panelRef, handlePanelRef);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const runOnceAnimationsFinish = useAnimationsFinished(panelRef, false);

  const handleTrigger = useEventCallback(() => {
    const nextOpen = !open;

    if (!keepMounted) {
      // mount only
      if (!mounted && nextOpen) {
        setMounted(true);
      }
    }
    setOpen(nextOpen);

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    // // this is the safest opportunity to unset `transition: none !important`
    // // that was set in `handleRef` when initially open and `keepMounted={true}`
    // panel.style.removeProperty('transition');

    // const targetHeight = panel.clientHeight;
    panel.style.setProperty('display', 'block', 'important');

    if (nextOpen) {
      if (abortControllerRef.current != null) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      panel.style.removeProperty('display');

      /* opening */
      panel.style.height = '0px';

      requestAnimationFrame(() => {
        panel.style.removeProperty('height');
        setHeight(panel.scrollHeight);
      });
    } else {
      /* closing */
      requestAnimationFrame(() => {
        setHeight(0);
      });

      abortControllerRef.current = new AbortController();

      runOnceAnimationsFinish(() => {
        // TODO: !important may be needed
        panel.style.setProperty('display', 'none');
        abortControllerRef.current = null;
      }, abortControllerRef.current.signal);
    }
  });

  /**
   * This only handles `keepMounted={false}` as the state changes can't be done
   * in the event handler
   */
  useEnhancedEffect(() => {
    if (keepMounted) {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    if (open) {
      if (abortControllerRef.current != null) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      /* opening */
      panel.style.height = '0px';
      // the closed transition styles must be set here to transition all opening
      // transitions except the first one when both:
      // 1 - the panel is initially closed
      // 2 - `keepMounted={false}`
      panel.style.opacity = '0';

      requestAnimationFrame(() => {
        // this is the earliest opportunity to unset the `display` property
        // that was set in `handlePanelRef`
        panel.style.removeProperty('display');

        panel.style.removeProperty('height');
        // remove all the transition properties that were just manually applied
        panel.style.removeProperty('opacity');
        setHeight(panel.scrollHeight);
      });
    } else {
      /* closing */
      requestAnimationFrame(() => {
        setHeight(0);
      });

      abortControllerRef.current = new AbortController();

      runOnceAnimationsFinish(() => {
        setMounted(false);
        abortControllerRef.current = null;
      }, abortControllerRef.current.signal);
    }
  }, [keepMounted, open, mounted, setMounted, runOnceAnimationsFinish]);

  return (
    <div
      className={classes.Root}
      style={{
        // @ts-ignore
        '--collapsible-panel-height':
          height !== undefined ? `${height}px` : undefined,
      }}
    >
      <button
        type="button"
        className={classes.Trigger}
        data-panel-open={open || undefined}
        onClick={handleTrigger}
      >
        <ExpandMoreIcon className={classes.Icon} />
        Trigger (keepMounted {String(keepMounted)})
      </button>

      {(keepMounted || (!keepMounted && mounted)) && (
        <div
          // @ts-ignore
          ref={mergedRef}
          className={classes.Panel}
          {...{ [open ? 'data-open' : 'data-closed']: '' }}
          {...styleHooks}
          hidden={isHidden}
        >
          <div className={classes.Content}>
            <p>
              He rubbed his eyes, and came close to the picture, and examined it
              again. There were no signs of any change when he looked into the actual
              painting, and yet there was no doubt that the whole expression had
              altered. It was not a mere fancy of his own. The thing was horribly
              apparent.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <div className={classes.wrapper}>
      <PlainCollapsible keepMounted={KEEP_MOUNTED} defaultOpen={true} />

      <PlainCollapsible keepMounted={KEEP_MOUNTED} defaultOpen={false} />

      <small>———</small>
    </div>
  );
}

function ExpandMoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" fill="currentColor" />
    </svg>
  );
}
