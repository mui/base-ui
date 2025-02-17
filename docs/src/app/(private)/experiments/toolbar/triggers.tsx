'use client';
import * as React from 'react';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { Switch } from '@base-ui-components/react/switch';
import { NumberField } from '@base-ui-components/react/number-field';
import { Slider } from '@base-ui-components/react/slider';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Popover } from '@base-ui-components/react/popover';
import { Dialog } from '@base-ui-components/react/dialog';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import toolbarClasses from './toolbar.module.css';
import triggerToolbarClasses from './triggers.module.css';
import tooltipClasses from '../../../(public)/(content)/react/components/tooltip/demos/hero/css-modules/index.module.css';
import switchClasses from '../../../(public)/(content)/react/components/switch/demos/hero/css-modules/index.module.css';
import dialogClasses from '../../../(public)/(content)/react/components/alert-dialog/demos/hero/css-modules/index.module.css';
import popoverClasses from '../../../(public)/(content)/react/components/popover/demos/hero/css-modules/index.module.css';
import comboSliderClasses from './slider.module.css';
import {
  SlidersIcon,
  TrashIcon,
  MessageCircleIcon,
  ArrowSvg,
  BellIcon,
} from './_icons';
import {
  SettingsMetadata,
  useExperimentSettings,
} from '../../../../components/Experiments/SettingsPanel';

interface Settings extends Record<string, boolean> {}

export const settingsMetadata: SettingsMetadata<Settings> = {
  verticalOrientation: {
    type: 'boolean',
    label: 'Vertical',
    default: false,
  },
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
  popover: popoverClasses,
  slider: comboSliderClasses,
  tooltip: tooltipClasses,
};

const TEXT = `Shows toolbar buttons as various triggers:
- Menu.Trigger
- Dialog.Trigger / AlertDialog.Trigger
- Popover.Trigger
- Tooltip.Trigger
- and a Switch
`;

function classNames(...c: Array<string | undefined | null | false>) {
  return c.filter(Boolean).join(' ');
}

function renderTriggerWithTooltip(args: {
  render: any;
  key: string;
  label: string;
  disabled?: boolean;
}) {
  const { render, key, label, disabled = false } = args;
  return (
    <Tooltip.Root key={key}>
      <Tooltip.Trigger
        render={
          <Toolbar.Button
            className={classNames(styles.toolbar.Toggle, styles.demo.Toggle)}
            disabled={disabled}
            render={render}
          />
        }
      />
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={10}>
          <Tooltip.Popup className={styles.tooltip.Popup}>
            <Tooltip.Arrow
              className={classNames(
                styles.tooltip.Arrow,
                styles.toolbar.TooltipArrow,
              )}
            >
              <ArrowSvg className={styles.toolbar.ArrowSvg} />
            </Tooltip.Arrow>
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
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
        <Toolbar.Root
          className={classNames(styles.toolbar.Root, styles.demo.Root)}
          orientation={settings.verticalOrientation ? 'vertical' : 'horizontal'}
        >
          <Dialog.Root>
            {renderTriggerWithTooltip({
              render: (
                <Dialog.Trigger>
                  <MessageCircleIcon className={styles.toolbar.Icon} />
                </Dialog.Trigger>
              ),
              key: 'comment-dialog',
              label: 'Add a comment',
            })}

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

          <Popover.Root>
            <Tooltip.Root>
              {renderTriggerWithTooltip({
                render: (
                  <Popover.Trigger>
                    <SlidersIcon
                      aria-label="RGB color picker"
                      className={styles.popover.Icon}
                    />
                  </Popover.Trigger>
                ),
                key: 'rgb-color-picker',
                label: 'RGB color picker',
              })}

              <Tooltip.Portal>
                <Tooltip.Positioner sideOffset={10}>
                  <Tooltip.Popup className={styles.tooltip.Popup}>
                    <Tooltip.Arrow
                      className={classNames(
                        styles.tooltip.Arrow,
                        styles.toolbar.TooltipArrow,
                      )}
                    >
                      <ArrowSvg className={styles.toolbar.ArrowSvg} />
                    </Tooltip.Arrow>
                    RGB color picker
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Popover.Portal>
              <Popover.Positioner sideOffset={8}>
                <Popover.Popup className={styles.popover.Popup}>
                  <Popover.Arrow className={styles.popover.Arrow}>
                    <ArrowSvg />
                  </Popover.Arrow>
                  <Popover.Title
                    className={styles.popover.Title}
                    style={{ marginBottom: '1rem' }}
                  >
                    RGB Color Picker
                  </Popover.Title>
                  <ComboSlider color="r" />
                  <ComboSlider color="g" />
                  <ComboSlider color="b" />
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>

          <Toolbar.Separator className={styles.demo.Separator} />

          <Popover.Root>
            {renderTriggerWithTooltip({
              render: (
                <Popover.Trigger>
                  <BellIcon
                    aria-label="Notifications"
                    className={styles.popover.Icon}
                  />
                </Popover.Trigger>
              ),
              key: 'notifications',
              label: 'Notifications',
            })}

            <Popover.Portal>
              <Popover.Positioner sideOffset={8}>
                <Popover.Popup className={styles.popover.Popup}>
                  <Popover.Arrow className={styles.popover.Arrow}>
                    <ArrowSvg />
                  </Popover.Arrow>
                  <Popover.Title className={styles.popover.Title}>
                    Notifications
                  </Popover.Title>
                  <Popover.Description className={styles.popover.Description}>
                    You are all caught up. Good job!
                  </Popover.Description>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>

          <Toolbar.Separator className={styles.demo.Separator} />

          <AlertDialog.Root>
            {renderTriggerWithTooltip({
              render: (
                <AlertDialog.Trigger>
                  <TrashIcon className={styles.toolbar.Icon} />
                </AlertDialog.Trigger>
              ),
              key: 'delete',
              label: 'Delete',
            })}

            <AlertDialog.Portal keepMounted>
              <AlertDialog.Backdrop className={styles.dialog.Backdrop} />
              <AlertDialog.Popup className={styles.dialog.Popup}>
                <AlertDialog.Title className={styles.dialog.Title}>
                  Delete everything
                </AlertDialog.Title>
                <AlertDialog.Description className={styles.dialog.Description}>
                  Are you sure? You cannot undo this.
                </AlertDialog.Description>
                <div className={styles.dialog.Actions}>
                  <AlertDialog.Close className={styles.dialog.Button}>
                    No, Cancel
                  </AlertDialog.Close>
                  <AlertDialog.Close
                    data-color="red"
                    className={styles.dialog.Button}
                  >
                    Yes, Delete
                  </AlertDialog.Close>
                </div>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>

          <Toolbar.Separator className={styles.demo.Separator} />

          <Toolbar.Button
            disabled={settings.switchDisabled}
            className={classNames(
              styles.toolbar.Toggle,
              styles.demo.Toggle,
              styles.demo.Switch,
            )}
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

function ComboSlider({ color }: { color: 'r' | 'g' | 'b' }) {
  const id = React.useId();
  const [val, setVal] = React.useState(20);
  return (
    <div className={styles.slider.Row}>
      <Slider.Root
        value={val}
        onValueChange={(newValue, event) => {
          if (color === 'r') {
            event.preventDefault();
          }
          setVal(newValue as number);
        }}
        className={styles.slider.Slider}
        min={0}
        max={255}
      >
        <Slider.Value className={styles.slider.Value} />
        <Slider.Control className={styles.slider.Control}>
          <Slider.Track className={styles.slider.Track}>
            <Slider.Indicator
              className={classNames(styles.slider.Indicator, styles.slider[color])}
            />
            <Slider.Thumb className={styles.slider.Thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <NumberField.Root
        id={id}
        value={val}
        onValueChange={(newValue) => {
          if (newValue != null) {
            setVal(newValue);
          }
        }}
        className={styles.slider.Field}
      >
        <NumberField.Group className={styles.slider.Group}>
          <NumberField.Input className={styles.slider.Input} />
        </NumberField.Group>
      </NumberField.Root>
    </div>
  );
}
