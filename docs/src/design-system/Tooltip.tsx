'use client';

import * as React from 'react';
import * as BaseTooltip from '@base_ui/react/Tooltip';
import classes from './Tooltip.module.css';

export function Tooltip(props: Tooltip.Props) {
  const { label, children } = props;

  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger
        render={(triggerProps: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
          React.cloneElement(children, triggerProps)
        }
      />
      <BaseTooltip.Positioner sideOffset={5} className={classes.popup}>
        <BaseTooltip.Popup>
          {label}
          <BaseTooltip.Arrow className={classes.arrow} />
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Root>
  );
}

export namespace Tooltip {
  export interface Props {
    label: string;
    children: React.ReactElement;
  }
}
