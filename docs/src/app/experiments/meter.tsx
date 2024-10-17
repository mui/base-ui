'use client';
import * as React from 'react';
import clsx from 'clsx';
import { NumberField } from '@base-ui-components/react/number-field';
import { Meter } from '@base-ui-components/react/meter';
import classes from './meter.module.css';

interface Range {
  value: number;
  min: number;
  max: number;
  high: number;
  low: number;
  optimum: number;
}

export default function MeterIntroduction() {
  const [range, setRange] = React.useState<Range>({
    value: 55,
    min: 0,
    max: 100,
    high: 70,
    low: 20,
    optimum: 80,
  });

  function setValue(name: string, value: number | null) {
    if (value != null) {
      setRange({
        ...range,
        [name]: value,
      });
    }
  }

  return (
    <div className={classes.grid}>
      <div className={classes.demo}>
        <Meter.Root
          className={classes.meter}
          aria-label="Battery Life"
          value={range.value}
          min={range.min}
          max={range.max}
          high={range.high}
          low={range.low}
          optimum={range.optimum}
        >
          <Meter.Track className={classes.track}>
            <Meter.Indicator className={classes.indicator} />
          </Meter.Track>
        </Meter.Root>
      </div>
      <div className={classes.controls}>
        {['value', 'min', 'max', 'high', 'low', 'optimum'].map((v) => {
          return (
            <Input
              key={v}
              name={v}
              label={v}
              value={range[v as keyof Range]}
              setValue={setValue}
            />
          );
        })}
      </div>
    </div>
  );
}

function Input(props: {
  name: string;
  label: string;
  value: number;
  setValue: (key: string, value: number | null) => void;
}) {
  const { name, label, value, setValue } = props;
  const id = `${name}-input`;
  return (
    <NumberField.Root
      id={id}
      aria-label="Basic number field, default value"
      value={value}
      onValueChange={(newValue) => setValue(name, newValue)}
      allowWheelScrub
    >
      <label htmlFor={id} className={classes.label}>
        {label}
      </label>
      <NumberField.Group className={classes.group}>
        <NumberField.Decrement className={clsx(classes.button, classes.decrement)}>
          &minus;
        </NumberField.Decrement>
        <NumberField.Input className={classes.input} placeholder="Enter value" />
        <NumberField.Increment className={clsx(classes.button, classes.increment)}>
          +
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}
