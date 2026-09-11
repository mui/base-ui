'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import styles from './view-transition.module.css';
import './view-transition.css';

/**
 * Popovers animated with React 19.3's `<ViewTransition>`.
 *
 * Setup:
 * - `open` is controlled and every change runs inside `React.startTransition`, because only
 *   Transitions activate `<ViewTransition>`.
 * - `<Popover.Portal keepMounted>` is always rendered so the portal node exists before the popup
 *   opens (the portal node is created in a layout effect, one commit after the Portal mounts).
 * - The positioner/popup are rendered conditionally so React removes them inside the Transition.
 *   Base UI's own delayed unmount (after CSS animations finish) runs outside the Transition.
 *
 * What to observe (Chrome, DevTools > Animations helps):
 * - Closing animates: the popup plays `pop-out`, and in the shared-element example the cover
 *   morphs back into the thumbnail in the trigger.
 * - Opening does not animate: on the opening commit the positioner is rendered with `hidden`
 *   (`hidden: !mounted` in PopoverPositioner) because `mounted` reaches the popup store through a
 *   layout effect, one commit late. The browser captures its "new" snapshot before the follow-up
 *   synchronous commit reveals it, so neither the positioner nor the shared cover inside it exists
 *   in the snapshot. Dialog behaves the same way (there it's the popup that is hidden).
 */
export default function PopoverViewTransitionExperiment() {
  return (
    <div className={styles.Page}>
      <section className={styles.Section}>
        <h2>Enter / exit</h2>
        <EnterExitPopover />
      </section>
      <section className={styles.Section}>
        <h2>Shared element</h2>
        <SharedElementPopover />
      </section>
    </div>
  );
}

function EnterExitPopover() {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        React.startTransition(() => {
          setOpen(nextOpen);
        });
      }}
    >
      <Popover.Trigger className={styles.Trigger}>Notifications</Popover.Trigger>
      <Popover.Portal keepMounted>
        {open && (
          <React.ViewTransition enter="pop-in" exit="pop-out">
            <Popover.Positioner className={styles.Positioner} sideOffset={8}>
              <Popover.Popup className={styles.Popup}>
                <Popover.Title className={styles.Title}>Notifications</Popover.Title>
                <Popover.Description className={styles.Description}>
                  You are all caught up. Good job!
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </React.ViewTransition>
        )}
      </Popover.Portal>
    </Popover.Root>
  );
}

function SharedElementPopover() {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        React.startTransition(() => {
          setOpen(nextOpen);
        });
      }}
    >
      <Popover.Trigger className={styles.Trigger}>
        <span className={styles.ThumbSlot}>
          {/* Only one `vt-cover` may be mounted at a time, so the thumbnail leaves while open. */}
          {!open && (
            <React.ViewTransition name="vt-cover">
              <span className={styles.Thumb} />
            </React.ViewTransition>
          )}
        </span>
        View cover
      </Popover.Trigger>
      <Popover.Portal keepMounted>
        {open && (
          <React.ViewTransition enter="pop-in" exit="pop-out">
            <Popover.Positioner className={styles.Positioner} sideOffset={8}>
              <Popover.Popup className={styles.Popup}>
                <React.ViewTransition name="vt-cover">
                  <div className={styles.Cover} />
                </React.ViewTransition>
                <Popover.Title className={styles.Title}>Cover</Popover.Title>
                <Popover.Description className={styles.Description}>
                  The thumbnail should morph into this cover when opening, and back when closing.
                </Popover.Description>
                <Popover.Close className={styles.Trigger}>Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </React.ViewTransition>
        )}
      </Popover.Portal>
    </Popover.Root>
  );
}
