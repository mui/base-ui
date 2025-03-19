'use client';
import * as React from 'react';
import {
  useEnhancedEffect,
  useTransitionStatus,
} from '@base-ui-components/react/utils';
import classes from './animation.module.css';
import { ExpandMoreIcon } from './_icons';

import { useAnimationsFinished } from '../../../../../../packages/react/src/utils/useAnimationsFinished';
import { useEventCallback } from '../../../../../../packages/react/src/utils/useEventCallback';
import { useForkRef } from '../../../../../../packages/react/src/utils/useForkRef';
import { useOnMount } from '../../../../../../packages/react/src/utils/useOnMount';
import { warn } from '../../../../../../packages/react/src/utils/warn';

const STARTING_HOOK = { 'data-starting-style': '' };
const ENDING_HOOK = { 'data-ending-style': '' };

type AnimationType = 'css-transition' | 'css-animation' | 'none' | null;

function Collapsible(props: {
  defaultOpen?: boolean;
  keepMounted?: boolean;
  id?: string;
  hiddenUntilFound?: boolean;
}) {
  const {
    keepMounted = true,
    defaultOpen = false,
    id,
    hiddenUntilFound: hiddenUntilFoundProp = false,
  } = props;

  const [open, setOpen] = React.useState(defaultOpen);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const [visible, setVisible] = React.useState(open);

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
  const latestAnimationNameRef = React.useRef<string>(null);
  const shouldCancelInitialOpenAnimationRef = React.useRef(open);

  const isBeforeMatchRef = React.useRef(false);

  const animationTypeRef = React.useRef<AnimationType>(null);

  const isHidden = React.useMemo(() => {
    if (animationTypeRef.current === 'css-animation') {
      return !visible;
    }

    if (keepMounted) {
      return !open;
    }

    return !open && !mounted;
  }, [keepMounted, open, mounted, visible]);

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
     * This ref is safe to read in render because it's only ever set once here
     * during the first render and never again.
     * https://react.dev/learn/referencing-values-with-refs#best-practices-for-refs
     */
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

    if (animationTypeRef.current !== 'css-transition') {
      return;
    }

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
        element.style.setProperty('transition-duration', '0s');
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

    const panel = panelRef.current;

    if (animationTypeRef.current === 'css-animation' && panel != null) {
      panel.style.removeProperty('animation-name');
    }

    if (!hiddenUntilFoundProp && !keepMounted) {
      if (animationTypeRef.current === 'css-transition') {
        if (!mounted && nextOpen) {
          setMounted(true);
        }
      }

      if (animationTypeRef.current === 'css-animation') {
        if (!visible && nextOpen) {
          setVisible(true);
        }
        if (!mounted && nextOpen) {
          setMounted(true);
        }
      }
    }
    setOpen(nextOpen);

    /**
     * When `keepMounted={false}` and when opening, the element isn't inserted
     * in the DOM at this point so bail out here and resume in an effect.
     */
    if (!panel || animationTypeRef.current !== 'css-transition') {
      return;
    }

    panel.style.setProperty('display', 'block', 'important');

    if (nextOpen) {
      /* opening */
      if (abortControllerRef.current != null) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      panel.style.removeProperty('display');
      panel.style.removeProperty('content-visibility');
      panel.style.setProperty('height', '0px');

      requestAnimationFrame(() => {
        panel.style.removeProperty('height');
        setHeight(panel.scrollHeight);
      });
    } else {
      if (hiddenUntilFoundProp) {
        panel.style.setProperty('content-visibility', 'visible');
      }
      /* closing */
      requestAnimationFrame(() => {
        setHeight(0);
      });

      abortControllerRef.current = new AbortController();

      runOnceAnimationsFinish(() => {
        panel.style.removeProperty('display');
        panel.style.removeProperty('content-visibility');
        abortControllerRef.current = null;
      }, abortControllerRef.current.signal);
    }
  });

  /**
   * This only handles CSS transitions when `keepMounted={false}` as we may not
   * have access to the panel element in the DOM in the trigger event handler.
   */
  useEnhancedEffect(() => {
    if (animationTypeRef.current !== 'css-transition' || keepMounted) {
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
        panel.style.removeProperty('content-visibility');
        setMounted(false);
        abortControllerRef.current = null;
      }, abortControllerRef.current.signal);
    }
  }, [
    keepMounted,
    open,
    mounted,
    setMounted,
    runOnceAnimationsFinish,
    hiddenUntilFoundProp,
  ]);

  useEnhancedEffect(() => {
    if (!hiddenUntilFoundProp) {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    if (open && isBeforeMatchRef.current) {
      panel.style.transitionDuration = '0s';
      setHeight(panel.scrollHeight);
      requestAnimationFrame(() => {
        isBeforeMatchRef.current = false;
        requestAnimationFrame(() => {
          setTimeout(() => {
            panel.style.removeProperty('transition-duration');
          });
        });
      });
    }
  }, [hiddenUntilFoundProp, open]);

  useEnhancedEffect(() => {
    if (animationTypeRef.current !== 'css-animation') {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    latestAnimationNameRef.current =
      panel.style.animationName || latestAnimationNameRef.current;

    panel.style.setProperty('animation-name', 'none');

    setHeight(panel.scrollHeight);

    if (!shouldCancelInitialOpenAnimationRef.current) {
      panel.style.removeProperty('animation-name');
    }

    if (open) {
      setMounted(true);
      setVisible(true);
    } else {
      runOnceAnimationsFinish(() => {
        setMounted(false);
        setVisible(false);
      });
    }
  }, [open, visible, runOnceAnimationsFinish, setMounted]);

  useOnMount(() => {
    const frame = requestAnimationFrame(() => {
      shouldCancelInitialOpenAnimationRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  });

  useEnhancedEffect(() => {
    const panel = panelRef.current;

    if (
      panel &&
      hiddenUntilFoundProp &&
      animationTypeRef.current === 'css-transition' &&
      isHidden
    ) {
      /**
       * React only supports a boolean for the `hidden` attribute and forces
       * legit string values to booleans so we have to force it back in the DOM
       * when necessary: https://github.com/facebook/react/issues/24740
       */
      panel.setAttribute('hidden', 'until-found');
      /**
       * Set data-starting-style here to persist the closed styles, this is to
       * prevent transitions from starting when the `hidden` attribute changes
       * to `'until-found'` as they could have different `display` properties:
       * https://github.com/tailwindlabs/tailwindcss/pull/14625
       */
      panel.setAttribute('data-starting-style', '');
    }
  }, [hiddenUntilFoundProp, isHidden]);

  React.useEffect(
    function registerBeforeMatchListener() {
      const panel = panelRef.current;
      if (!panel) {
        return undefined;
      }

      function handleBeforeMatch(event: Event) {
        // TODO: probably remove this because beforematch isn't cancellable anyway
        event.preventDefault();

        isBeforeMatchRef.current = true;
        setOpen(true);
      }

      panel.addEventListener('beforematch', handleBeforeMatch);

      return () => {
        panel.removeEventListener('beforematch', handleBeforeMatch);
      };
    },
    [setOpen],
  );

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

      {(keepMounted || hiddenUntilFoundProp || (!keepMounted && mounted)) && (
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
