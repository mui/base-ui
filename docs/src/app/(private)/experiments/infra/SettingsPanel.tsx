/* eslint-disable no-restricted-imports */
import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { useLatestRef } from '@base-ui-components/react/utils/useLatestRef';
import { useEventCallback } from '@base-ui-components/react/utils/useEventCallback';
import { Switch } from './Switch';
import classes from './SettingsPanel.module.css';

export function SettingsPanel<Settings>(props: SettingsPanel.Props<Settings>) {
  const { settings, onChange: onChangeProp } = props;

  const lastSettings = useLatestRef(settings);
  const onChange = useEventCallback(onChangeProp);

  const createChangeHandler = React.useCallback(
    (key: string) => (value: unknown) => {
      onChange?.({
        ...lastSettings.current,
        [key]: value,
      });
    },
    [lastSettings, onChange],
  );

  return (
    <Popover.Root>
      <Popover.Trigger className={classes.Trigger}>
        <SettingsIcon className={classes.Icon} />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          align="end"
          side="bottom"
          sideOffset={8}
          positionMethod="fixed"
        >
          <Popover.Popup className={classes.Popup}>
            {Object.keys(settings as Record<string, any>).map((key) => {
              const value = (settings as Record<string, unknown>)[key];
              switch (typeof value) {
                case 'boolean':
                  return renderSwitch(
                    key,
                    value as boolean,
                    createChangeHandler(key),
                  );
                case 'number':
                  return renderNumberInput(
                    key,
                    value as number,
                    createChangeHandler(key),
                  );
                case 'string':
                  return renderTextInput(
                    key,
                    value as string,
                    createChangeHandler(key),
                  );
                default:
                  return null;
              }
            })}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export namespace SettingsPanel {
  export interface Props<Settings> {
    children?: React.ReactNode;
    settings: Settings;
    onChange: (newSettings: Settings) => void;
  }
}

function renderSwitch(
  key: string,
  value: boolean,
  onChange: (value: boolean) => void,
) {
  return (
    <Switch
      key={key}
      checked={value}
      onCheckedChange={onChange}
      label={camelToSentenceCase(key)}
    />
  );
}

function renderTextInput(
  key: string,
  value: string,
  onChange: (value: string) => void,
) {
  return (
    <label key={key}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      {camelToSentenceCase(key)}
    </label>
  );
}

function renderNumberInput(
  key: string,
  value: number,
  onChange: (value: number) => void,
) {
  return (
    <label key={key}>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
      {camelToSentenceCase(key)}
    </label>
  );
}

function camelToSentenceCase(camel: string) {
  return camel
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .replace(/^./, (str) => str.toUpperCase());
}

function SettingsIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      enableBackground="new 0 0 24 24"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      {...props}
    >
      <g>
        <path d="M0,0h24v24H0V0z" fill="none" />
        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
      </g>
    </svg>
  );
}
