'use client';
import * as React from 'react';
import {
  useEnhancedEffect,
  useTransitionStatus,
} from '@base-ui-components/react/utils';
import classes from './animation.module.css';

import { useAnimationsFinished } from '../../../../../../packages/react/src/utils/useAnimationsFinished';
import { useEventCallback } from '../../../../../../packages/react/src/utils/useEventCallback';
import { useForkRef } from '../../../../../../packages/react/src/utils/useForkRef';
import { warn } from '../../../../../../packages/react/src/utils/warn';

type AnimationType = 'css-transition' | 'css-animation' | 'none' | null;

function Collapsible(props: {
  defaultOpen?: boolean;
  keepMounted?: boolean;
  id?: string;
}) {
  const { keepMounted = true, defaultOpen = false, id } = props;

  const [open, setOpen] = React.useState(defaultOpen);

  const { mounted, setMounted } = useTransitionStatus(open);

  // keyframe animations doesn't need data-starting/ending-style

  function initializeHeight() {
    return open ? undefined : 0;
  }
  const [height, setHeight] = React.useState<number | undefined>(initializeHeight);

  const latestAnimationNameRef = React.useRef<string>('none');
  // const shouldCancelInitialOpenTransitionRef = React.useRef(open);

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

    // element.style.animationDuration = '0s';
    const panelStyles = getComputedStyle(element);
    latestAnimationNameRef.current = panelStyles.animationName;

    if (height === undefined) {
      // set` display: block !important` here to force layout
      element.style.setProperty('display', 'block', 'important');
      // measure the height
      setHeight(element.scrollHeight);
      element.style.removeProperty('display');
    }

    // requestAnimationFrame(() => {
    //   shouldCancelInitialOpenTransitionRef.current = false;
    // });
  });

  const mergedRef = useForkRef(panelRef, handlePanelRef);

  // const runOnceAnimationsFinish = useAnimationsFinished(panelRef, false);

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

    if (nextOpen) {
      /* opening */

      panel.style.removeProperty('display');

      /* opening */
      panel.style.height = '0px';

      requestAnimationFrame(() => {
        panel.style.removeProperty('height');
        setHeight(panel.scrollHeight);
      });
    } else {
      /* closing */
      panel.style.height = `${panel.scrollHeight}px`;
      // panel.style.removeProperty('display');
      requestAnimationFrame(() => {
        panel.style.removeProperty('height');
        setHeight(0);
      });
    }
  });

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
          // {...styleHooks}
          hidden={!open}
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
        <Collapsible keepMounted defaultOpen id="1" />

        {/*<Collapsible keepMounted defaultOpen={false} id="2" />*/}

        <small>———</small>
      </div>
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
