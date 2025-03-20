'use client';
import * as React from 'react';
import {
  useEnhancedEffect,
  // useTransitionStatus,
} from '@base-ui-components/react/utils';
import classes from './animation.module.css';

import { useAnimationsFinished } from '../../../../../../packages/react/src/utils/useAnimationsFinished';
import { useEventCallback } from '../../../../../../packages/react/src/utils/useEventCallback';
import { useOnMount } from '../../../../../../packages/react/src/utils/useOnMount';
import { ExpandMoreIcon } from './_icons';

function Collapsible(props: {
  defaultOpen?: boolean;
  keepMounted?: boolean;
  id?: string;
}) {
  const { keepMounted = true, defaultOpen = false, id } = props;

  const [open, setOpen] = React.useState(defaultOpen);

  const [visible, setVisible] = React.useState(open);

  const [mounted, setMounted] = React.useState(open);

  const [height, setHeight] = React.useState<number | undefined>(0);

  const latestAnimationNameRef = React.useRef<string>(null);
  const shouldCancelInitialOpenAnimationRef = React.useRef(open);

  const isHidden = !visible;

  const panelRef: React.RefObject<HTMLElement | null> = React.useRef(null);

  const runOnceAnimationsFinish = useAnimationsFinished(panelRef, false);

  const handleTrigger = useEventCallback(() => {
    const nextOpen = !open;

    const panel = panelRef.current;

    if (panel) {
      panel.style.removeProperty('animation-name');
    }

    if (!keepMounted) {
      if (!visible && nextOpen) {
        setVisible(true);
      }
      if (!mounted && nextOpen) {
        setMounted(true);
      }
    }
    setOpen(nextOpen);
  });

  useEnhancedEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    latestAnimationNameRef.current =
      panel.style.animationName || latestAnimationNameRef.current;

    panel.style.animationName = 'none';

    setHeight(panel.scrollHeight);

    if (!shouldCancelInitialOpenAnimationRef.current) {
      panel.style.removeProperty('animation-name');
    }

    if (open) {
      setMounted(true);
    }

    runOnceAnimationsFinish(() => {
      setVisible(open);
    });
  }, [open, visible, runOnceAnimationsFinish]);

  useOnMount(() => {
    const frame = requestAnimationFrame(() => {
      shouldCancelInitialOpenAnimationRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  });

  return (
    <div
      className={classes.Root}
      style={{
        // @ts-ignore
        '--collapsible-panel-height': height ? `${height}px` : undefined,
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
          ref={panelRef}
          className={classes.Panel}
          {...{ [open ? 'data-open' : 'data-closed']: '' }}
          // {...styleHooks}
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
