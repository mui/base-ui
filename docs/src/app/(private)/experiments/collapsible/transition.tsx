'use client';
import * as React from 'react';
import {
  useEnhancedEffect,
  useTransitionStatus,
} from '@base-ui-components/react/utils';
import classes from './transition.module.css';

import { useAnimationsFinished } from '../../../../../../packages/react/src/utils/useAnimationsFinished';
import { useEventCallback } from '../../../../../../packages/react/src/utils/useEventCallback';
import { useForkRef } from '../../../../../../packages/react/src/utils/useForkRef';
import { warn } from '../../../../../../packages/react/src/utils/warn';
import { ExpandMoreIcon } from './_icons';

const STARTING_HOOK = { 'data-starting-style': '' };
const ENDING_HOOK = { 'data-ending-style': '' };

type AnimationType = 'css-transition' | 'css-animation' | 'none' | null;

function Collapsible(props: {
  defaultOpen?: boolean;
  keepMounted?: boolean;
  id?: string;
}) {
  const { keepMounted = true, defaultOpen = false, id } = props;

  const [open, setOpen] = React.useState(defaultOpen);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

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

  const shouldCancelInitialOpenTransitionRef = React.useRef(open);

  const isHidden = React.useMemo(() => {
    if (keepMounted) {
      return !open;
    }

    return !open && !mounted;
  }, [keepMounted, open, mounted]);

  const animationTypeRef = React.useRef<AnimationType>(null);
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
    if (animationTypeRef.current == null) {
      const panelStyles = getComputedStyle(element);
      if (
        panelStyles.animationName !== 'none' &&
        panelStyles.transitionDelay !== '0s'
      ) {
        warn('CSS transitions and CSS animations both detected');
      } else if (
        panelStyles.animationName === 'none' &&
        panelStyles.transitionDuration !== '0s'
      ) {
        animationTypeRef.current = 'css-transition';
      } else if (
        panelStyles.animationName !== 'none' &&
        panelStyles.transitionDuration === '0s'
      ) {
        animationTypeRef.current = 'css-animation';
      } else {
        animationTypeRef.current = 'none';
      }
    }
    // console.log('animationType', animationTypeRef.current);

    /**
     * Explicitly set `display` to ensure the panel is actually rendered before
     * measuring anything. `!important` is to needed to override a conflicting
     * Tailwind v4 default that sets `display: none !important` on `[hidden]`:
     * https://github.com/tailwindlabs/tailwindcss/blob/cd154a4f471e7a63cc27cad15dada650de89d52b/packages/tailwindcss/preflight.css#L320-L326
     */
    element.style.setProperty('display', 'block', 'important'); // TODO: maybe this can be set more conditionally

    if (height === undefined) {
      /**
       * When `keepMounted={false}` and the panel is initially closed, the very
       * first time it opens (not any subsequent opens) `data-starting-style` is
       * off or missing by a frame so we need to set it manually. Otherwise any
       * CSS properties expected to transition using [data-starting-style] may
       * be mis-timed and appear to be complete skipped.
       */
      if (!shouldCancelInitialOpenTransitionRef.current && !keepMounted) {
        element.setAttribute('data-starting-style', '');
      }

      setHeight(element.scrollHeight);
      element.style.removeProperty('display');

      if (shouldCancelInitialOpenTransitionRef.current) {
        element.style.transitionDuration = '0s';
      }
    }

    requestAnimationFrame(() => {
      shouldCancelInitialOpenTransitionRef.current = false;
      requestAnimationFrame(() => {
        /**
         * This is slightly faster than another RAF and is the earliest
         * opportunity to remove the temporary `transition-duration: 0s` that
         * was applied to cancel opening transitions of initially open panels.
         * https://nolanlawson.com/2018/09/25/accurately-measuring-layout-on-the-web/
         */
        setTimeout(() => {
          element.style.removeProperty('transition-duration');
        });
      });
    });
  });

  const mergedRef = useForkRef(panelRef, handlePanelRef);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const runOnceAnimationsFinish = useAnimationsFinished(panelRef, false);

  const handleTrigger = useEventCallback(() => {
    const nextOpen = !open;

    if (!keepMounted) {
      if (!mounted && nextOpen) {
        setMounted(true);
      }
    }
    setOpen(nextOpen);

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

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

      requestAnimationFrame(() => {
        /**
         * When `keepMounted={false}` this is the earliest opportunity to unset
         * the temporary `display` property that was set in `handlePanelRef`
         */
        panel.style.removeProperty('display');

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
        Trigger {id}
      </button>

      {(keepMounted || (!keepMounted && mounted)) && (
        <div
          // @ts-ignore
          ref={mergedRef}
          className={classes.Panel}
          {...{ [open ? 'data-open' : 'data-closed']: '' }}
          {...styleHooks}
          hidden={isHidden}
          id={id}
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
    <div className={classes.grid}>
      <div className={classes.wrapper}>
        <pre>keepMounted: true</pre>
        <Collapsible keepMounted defaultOpen id="1" />

        <Collapsible keepMounted defaultOpen={false} id="2" />

        <small>———</small>
      </div>
      <div className={classes.wrapper}>
        <pre>keepMounted: false</pre>
        <Collapsible keepMounted={false} defaultOpen id="3" />

        <Collapsible keepMounted={false} defaultOpen={false} id="4" />
        <small>———</small>
      </div>
    </div>
  );
}
