'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { Dialog } from '@base-ui/react/dialog';
import styles from './on-initially-focused.module.css';

/**
 * `onInitiallyFocused` on popups. Nothing is selected by default; selecting the initially focused
 * input's contents is opt-in, and can be applied per-popup or once inside a design-system wrapper.
 */

function selectContents(element: HTMLElement | SVGElement) {
  if (element.tagName === 'INPUT') {
    (element as HTMLInputElement).select();
  }
}

export default function OnInitiallyFocusedExperiment() {
  return (
    <div className={styles.Page}>
      <h1>onInitiallyFocused</h1>
      <p className={styles.Intro}>
        Open each popup with the mouse and look at the initially focused input. Only the ones that
        opt in should have their contents selected.
      </p>

      <h2>1. Popover — opted in (share link)</h2>
      <p className={styles.Note}>The whole URL should be selected, ready to copy.</p>
      <div className={styles.Container}>
        <Popover.Root>
          <Popover.Trigger className={styles.Button}>Share</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup className={styles.Popup} onInitiallyFocused={selectContents}>
                <Popover.Title className={styles.Title}>Share link</Popover.Title>
                <input
                  className={styles.Input}
                  defaultValue="https://base-ui.com/react/components/popover"
                  readOnly
                />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <h2>2. Popover — default (edit form)</h2>
      <p className={styles.Note}>
        Nothing is passed, so the caret sits in the name field without selecting it and typing
        appends rather than replaces.
      </p>
      <div className={styles.Container}>
        <Popover.Root>
          <Popover.Trigger className={styles.Button}>Edit profile</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup className={styles.Popup}>
                <Popover.Title className={styles.Title}>Edit profile</Popover.Title>
                <label className={styles.Label}>
                  Name
                  <input className={styles.Input} defaultValue="Ada Lovelace" />
                </label>
                <label className={styles.Label}>
                  Email
                  <input className={styles.Input} defaultValue="ada@example.com" />
                </label>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <h2>3. Design-system wrapper — the reusable case</h2>
      <p className={styles.Note}>
        <code>SelectingDialog</code> below applies the behavior once, for every dialog built on it.
        Its consumers pass arbitrary children and never hold a ref into them.
      </p>
      <div className={styles.Container}>
        <SelectingDialog trigger="Rename file">
          <input className={styles.Input} defaultValue="quarterly-report.pdf" />
        </SelectingDialog>
        <SelectingDialog trigger="Set API key">
          <input className={styles.Input} defaultValue="sk-live-8f4a2c9e1b7d" />
        </SelectingDialog>
      </div>
    </div>
  );
}

/**
 * A design-system Dialog that selects the initially focused input's contents. Consumers get the
 * behavior without knowing which element ends up focused.
 */
function SelectingDialog(props: { trigger: string; children: React.ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className={styles.Button}>{props.trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.Dialog} onInitiallyFocused={selectContents}>
          <Dialog.Title className={styles.Title}>{props.trigger}</Dialog.Title>
          {props.children}
          <div className={styles.Actions}>
            <Dialog.Close className={styles.Button}>Cancel</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
