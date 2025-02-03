'use client';
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Switch as BaseSwitch } from '@base-ui-components/react/switch';
import classes from './Switch.module.css';

export function Switch(props: Switch.Props) {
  const { label, checked, onCheckedChange, defaultChecked, ...otherProps } = props;

  return (
    <Field.Root {...otherProps}>
      {label && <Field.Label className={classes.Label}>{label}</Field.Label>}
      <BaseSwitch.Root
        className={classes.Switch}
        checked={checked}
        onCheckedChange={onCheckedChange}
        defaultChecked={defaultChecked}
      >
        <BaseSwitch.Thumb className={classes.Thumb} />
      </BaseSwitch.Root>
    </Field.Root>
  );
}

export namespace Switch {
  export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    label?: string;
    checked?: boolean;
    onCheckedChange: (checked: boolean) => void;
    defaultChecked?: boolean;
  }
}
