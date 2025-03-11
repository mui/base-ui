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

const DEFAULT_OPEN = false;

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

  const handlePanelRef = useEventCallback((element: HTMLElement) => {
    if (!element) {
      return;
    }

    // override potential `display: none` set on `[hidden]`
    // to ensure the panel is actually rendered before measuring
    element.style.setProperty('display', 'block', 'important');

    if (height === undefined) {
      // element.style.opacity = '0';

      setHeight(element.scrollHeight);
      element.style.removeProperty('display');
      element.style.removeProperty('opacity');
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

    // const targetHeight = panel.clientHeight;
    panel.style.setProperty('display', 'block', 'important');

    if (nextOpen) {
      if (abortControllerRef.current != null) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      /* opening */
      // panel.style.opacity = '0';
      panel.style.height = '0px';

      requestAnimationFrame(() => {
        panel.style.removeProperty('opacity');
        panel.style.height = '';
        setHeight(panel.scrollHeight);
      });
    } else {
      /* closing */
      requestAnimationFrame(() => {
        setHeight(0);
      });

      abortControllerRef.current = new AbortController();

      runOnceAnimationsFinish(() => {
        panel.style.setProperty('display', 'none');
        abortControllerRef.current = null;
      }, abortControllerRef.current.signal);
    }
  });

  useEnhancedEffect(() => {
    // This only matters when `keepMounted={false}`
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
      panel.style.opacity = '0';
      panel.style.height = '0px';

      requestAnimationFrame(() => {
        panel.style.removeProperty('opacity');
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
      <PlainCollapsible defaultOpen={DEFAULT_OPEN} />

      <PlainCollapsible keepMounted={false} defaultOpen={DEFAULT_OPEN} />

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
