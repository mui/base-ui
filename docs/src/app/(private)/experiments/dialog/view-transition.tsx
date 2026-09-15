'use client';
import * as React from 'react';
import type {} from 'react/canary';
import { Dialog } from '@base-ui/react/dialog';
import { Popover } from '@base-ui/react/popover';
import './view-transition.css';

/**
 * Run with React 19.3 to compare dialog and anchored popup snapshots.
 * Keep the portal node mounted, and insert/remove the ViewTransition boundary
 * in the same React Transition as `open` instead of waiting for CSS exit animations.
 * Dialog captures the shared cover at both sizes. Popover still captures an invisible
 * positioner until its asynchronous positioning completes.
 */
export default function ViewTransitionExperiment() {
  if (!React.ViewTransition) {
    return <p>This experiment requires React 19.3.</p>;
  }

  return (
    <div className="view-transition-experiment">
      <h1>Popup view transitions</h1>
      <DialogExample />
      <PopoverExample />
    </div>
  );
}

function Cover() {
  return <span className="view-transition-cover" />;
}

function DialogExample() {
  const [open, setOpen] = React.useState(false);
  const coverName = React.useId();

  function changeOpen(nextOpen: boolean) {
    React.startTransition(() => setOpen(nextOpen));
  }

  return (
    <section>
      <h2>Dialog</h2>
      <Dialog.Root open={open} onOpenChange={changeOpen}>
        <Dialog.Trigger className="view-transition-trigger">
          <span className="view-transition-thumb-slot">
            {!open && (
              <React.ViewTransition name={coverName} share="view-transition-cover">
                <Cover />
              </React.ViewTransition>
            )}
          </span>
          Open dialog
        </Dialog.Trigger>
        <Dialog.Portal keepMounted>
          {open && (
            <React.ViewTransition>
              <Dialog.Popup className="view-transition-dialog">
                <React.ViewTransition name={coverName} share="view-transition-cover">
                  <Cover />
                </React.ViewTransition>
                <Dialog.Title>Dialog</Dialog.Title>
                <Dialog.Description>The cover expands into the popup.</Dialog.Description>
                <Dialog.Close>Close dialog</Dialog.Close>
              </Dialog.Popup>
            </React.ViewTransition>
          )}
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}

function PopoverExample() {
  const [open, setOpen] = React.useState(false);
  const coverName = React.useId();

  function changeOpen(nextOpen: boolean) {
    React.startTransition(() => setOpen(nextOpen));
  }

  return (
    <section>
      <h2>Popover</h2>
      <Popover.Root open={open} onOpenChange={changeOpen}>
        <Popover.Trigger className="view-transition-trigger">
          <span className="view-transition-thumb-slot">
            {!open && (
              <React.ViewTransition name={coverName} share="view-transition-cover">
                <Cover />
              </React.ViewTransition>
            )}
          </span>
          Open popover
        </Popover.Trigger>
        <Popover.Portal keepMounted>
          {open && (
            <React.ViewTransition>
              <Popover.Positioner sideOffset={8}>
                <Popover.Popup className="view-transition-popover">
                  <React.ViewTransition name={coverName} share="view-transition-cover">
                    <Cover />
                  </React.ViewTransition>
                  <Popover.Title>Popover</Popover.Title>
                  <Popover.Description>The cover expands into the popup.</Popover.Description>
                  <Popover.Close>Close popover</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </React.ViewTransition>
          )}
        </Popover.Portal>
      </Popover.Root>
    </section>
  );
}
