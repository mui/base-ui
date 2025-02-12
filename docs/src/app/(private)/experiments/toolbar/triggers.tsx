'use client';
import * as React from 'react';
import { Toolbar } from '@base-ui-components/react/toolbar';
// import { Toggle } from '@base-ui-components/react/toggle';
import { Switch } from '@base-ui-components/react/switch';
import { Dialog } from '@base-ui-components/react/dialog';
import toolbarClasses from './toolbar.module.css';
import triggerToolbarClasses from './triggers.module.css';
import switchClasses from '../../../(public)/(content)/react/components/switch/demos/hero/css-modules/index.module.css';
import dialogClasses from '../../../(public)/(content)/react/components/alert-dialog/demos/hero/css-modules/index.module.css';
// import popoverClasses from '../../../(public)/(content)/react/components/popover/demos/hero/css-modules/index.module.css';
import { MessageCircleIcon } from './_icons';
import {
  SettingsMetadata,
  useExperimentSettings,
} from '../../../../components/Experiments/SettingsPanel';

interface Settings extends Record<string, boolean> {}

export const settingsMetadata: SettingsMetadata<Settings> = {
  dialogDisabled: {
    type: 'boolean',
    label: 'Dialog disabled',
  },
  switchDisabled: {
    type: 'boolean',
    label: 'Switch disabled',
  },
  toolbarDisabled: {
    type: 'boolean',
    label: 'Everything disabled',
  },
};

const styles = {
  demo: triggerToolbarClasses,
  toolbar: toolbarClasses,
  switch: switchClasses,
  dialog: dialogClasses,
};

const TEXT = `Shows toolbar buttons as various triggers:
- Menu.Trigger
- Dialog.Trigger
- Popover.Trigger
`;

const DISABLED = false;

function classNames(...c: Array<string | undefined | null | false>) {
  return c.filter(Boolean).join(' ');
}

export default function App() {
  const { settings } = useExperimentSettings<Settings>();
  return (
    <React.Fragment>
      <a
        className={styles.toolbar.a}
        href="https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/"
        target="_blank"
        rel="noreferrer"
      >
        <h3 className={styles.toolbar.h3}>Toolbar pattern</h3>
      </a>
      <div className={styles.toolbar.Wrapper}>
        <Toolbar.Root className={classNames(styles.toolbar.Root, styles.demo.Root)}>
          <Dialog.Root>
            <Toolbar.Button
              disabled={DISABLED}
              className={classNames(styles.toolbar.Toggle, styles.demo.Toggle)}
              render={
                <Dialog.Trigger>
                  <MessageCircleIcon className={styles.toolbar.Icon} />
                </Dialog.Trigger>
              }
            />

            <Dialog.Portal keepMounted>
              <Dialog.Backdrop className={styles.dialog.Backdrop} />
              <Dialog.Popup className={styles.dialog.Popup}>
                <Dialog.Title className={styles.dialog.Title}>
                  Write a comment
                </Dialog.Title>
                <textarea name="" id="" className={styles.toolbar.Textarea} />
                <div className={styles.dialog.Actions}>
                  <Dialog.Close data-color="red" className={styles.dialog.Button}>
                    Close
                  </Dialog.Close>
                  <Dialog.Close className={styles.dialog.Button}>
                    Submit
                  </Dialog.Close>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>

          <Toolbar.Separator className={styles.demo.Separator} />

          <Toolbar.Button
            disabled={settings.switchDisabled}
            className={classNames(styles.toolbar.Toggle, styles.demo.Toggle)}
            render={
              <Switch.Root defaultChecked className={styles.switch.Switch}>
                <Switch.Thumb
                  className={styles.switch.Thumb}
                  style={{ marginRight: 'auto' }}
                />
              </Switch.Root>
            }
          />
        </Toolbar.Root>

        <textarea
          className={styles.toolbar.Textarea}
          name=""
          id=""
          rows={8}
          defaultValue={TEXT}
        />
      </div>
    </React.Fragment>
  );
}
