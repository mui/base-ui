'use client';
import * as React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui-components/react/tooltip';
import classes from './Tooltip.module.css';

export function Tooltip(props: Tooltip.Props) {
  const { label, children, side = 'top' } = props;

  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger
        render={(triggerProps: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
          React.cloneElement(children, triggerProps)
        }
      />
      <BaseTooltip.Positioner side={side} sideOffset={8} className={classes.popup}>
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
    children: React.ReactElement<unknown>;
    side?: 'top' | 'right' | 'bottom' | 'left';
  }
}
