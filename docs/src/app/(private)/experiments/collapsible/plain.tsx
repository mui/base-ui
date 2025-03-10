'use client';
import * as React from 'react';
import { useEnhancedEffect } from '@base-ui-components/react/utils';
import classes from './plain.module.css';

import { useAnimationsFinished } from '../../../../../../packages/react/src/utils/useAnimationsFinished';
import { useEventCallback } from '../../../../../../packages/react/src/utils/useEventCallback';

function PlainCollapsible(props: { keepMounted?: boolean }) {
  const { keepMounted = true } = props;

  const [open, setOpen] = React.useState(false);

  const [mounted, setMounted] = React.useState(open);

  const panelRef: React.RefObject<HTMLElement | null> = React.useRef(null);

  const [height, setHeight] = React.useState(0);

  const handleTrigger = useEventCallback(() => {
    const nextOpen = !open;

    if (!keepMounted) {
      // mount only
      if (!mounted) {
        setMounted(true);
      }
    }
    setOpen(nextOpen);

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    panel.style.display = 'block';
    // const targetHeight = panel.clientHeight;

    if (nextOpen) {
      /* opening */
      panel.style.opacity = '0';
      panel.style.height = '0px';

      requestAnimationFrame(() => {
        panel.style.opacity = '1';
        panel.style.height = '';
        setHeight(panel.scrollHeight);
      });
    } else {
      /* closing */
      requestAnimationFrame(() => {
        // console.log('closing, scrollHeight', panel.scrollHeight);
        panel.style.opacity = '0';
        setHeight(0);
      });
    }
  });

  const runOnceAnimationsFinish = useAnimationsFinished(panelRef);

  useEnhancedEffect(() => {
    // This only matters when `keepMounted={false}`
    if (keepMounted) {
      return;
    }
    // console.log('useEnhancedEffect open', open, 'mounted', mounted);

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    if (open) {
      /* opening */
      panel.style.opacity = '0';
      panel.style.height = '0px';

      requestAnimationFrame(() => {
        panel.style.opacity = '1';
        panel.style.height = '';
        setHeight(panel.scrollHeight);
      });
    } else {
      /* closing */
      requestAnimationFrame(() => {
        console.log('closing, scrollHeight', panel.scrollHeight);
        panel.style.opacity = '0';
        setHeight(0);
      });

      runOnceAnimationsFinish(() => {
        setMounted(false);
      });
    }
  }, [keepMounted, open, mounted, setMounted, runOnceAnimationsFinish]);

  return (
    <div
      className={classes.Root}
      style={{
        // @ts-ignore
        '--collapsible-panel-height': `${height}px`,
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
          ref={panelRef}
          className={classes.Panel}
          {...{ [open ? 'data-open' : 'data-closed']: '' }}
          // hidden={!open}
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
      <PlainCollapsible />

      <PlainCollapsible keepMounted={false} />
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
