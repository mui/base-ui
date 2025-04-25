'use client';
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import { Select } from '@base-ui-components/react/select';
import { Radio } from '@base-ui-components/react/radio';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { Switch } from '@base-ui-components/react/switch';
import { NumberField } from '@base-ui-components/react/number-field';
import { Slider } from '@base-ui-components/react/slider';
import { z } from 'zod';
import styles from './form.module.css';

const schema = z.object({
  input: z.string().min(1, 'Input is required'),
  checkbox: z.enum(['on']),
  switch: z.enum(['on']),
  slider: z.number().min(0).max(100),
  'number-field': z.number().min(0).max(100),
  select: z.enum(['sans', 'serif', 'mono', 'cursive']),
  'radio-group': z.enum(['fuji-apple', 'gala-apple', 'granny-smith-apple']),
});

interface Values {
  numberField: number | null;
}

async function submitForm(event: React.FormEvent<HTMLFormElement>, values: Values) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);

  const entries = Object.fromEntries(formData as any);

  entries['number-field'] = values.numberField;
  entries.slider = Number(entries.slider);

  const result = schema.safeParse(entries);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  return {
    errors: {},
  };
}

export default function Page() {
  const [errors, setErrors] = React.useState({});
  const [native, setNative] = React.useState(true);
  const numberFieldValueRef = React.useRef<number | null>(null);

  return (
    <div>
      <h1>Form</h1>
      <label>
        Use native validation
        <Checkbox.Root
          checked={native}
          onCheckedChange={setNative}
          className={styles.Checkbox}
        >
          <Checkbox.Indicator className={styles.CheckboxIndicator}>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
      </label>

      <hr style={{ margin: '1rem 0' }} />

      <Form
        className={styles.Form}
        errors={errors}
        onClearErrors={setErrors}
        onSubmit={async (event) => {
          const response = await submitForm(event, {
            numberField: numberFieldValueRef.current,
          });
          setErrors(response.errors);
        }}
      >
        <Field.Root name="input" className={styles.Field}>
          <Field.Label className={styles.Label}>Input</Field.Label>
          <Field.Control
            required={native}
            placeholder="Enter input"
            className={styles.Input}
          />
          <Field.Error className={styles.Error} />
        </Field.Root>

        <Field.Root name="checkbox" className={styles.Field}>
          <Field.Label className={styles.Label}>Checkbox</Field.Label>
          <Checkbox.Root required={native} className={styles.Checkbox}>
            <Checkbox.Indicator className={styles.CheckboxIndicator}>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <Field.Error className={styles.Error} />
        </Field.Root>

        <Field.Root name="switch" className={styles.Field}>
          <Field.Label className={styles.Label}>Switch</Field.Label>
          <Switch.Root required={native} className={styles.Switch}>
            <Switch.Thumb className={styles.Thumb} />
          </Switch.Root>
          <Field.Error className={styles.Error} />
        </Field.Root>

        <Field.Root name="slider" className={styles.Field}>
          <Field.Label className={styles.Label}>Slider</Field.Label>
          <Slider.Root defaultValue={25}>
            <Slider.Control className={styles.SliderControl}>
              <Slider.Track className={styles.SliderTrack}>
                <Slider.Indicator className={styles.SliderIndicator} />
                <Slider.Thumb className={styles.SliderThumb} />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>
          <Field.Error className={styles.Error} />
        </Field.Root>

        <Field.Root name="number-field" className={styles.Field}>
          <Field.Label className={styles.Label}>Number Field</Field.Label>
          <NumberField.Root
            required={native}
            className={styles.Field}
            onValueChange={(value) => {
              numberFieldValueRef.current = value;
            }}
          >
            <NumberField.Group className={styles.Group}>
              <NumberField.Decrement className={styles.Decrement}>
                -
              </NumberField.Decrement>
              <NumberField.Input className={styles.Input} />
              <NumberField.Increment className={styles.Increment}>
                +
              </NumberField.Increment>
            </NumberField.Group>
          </NumberField.Root>
          <Field.Error className={styles.Error} />
        </Field.Root>

        <Field.Root name="select" className={styles.Field}>
          <Field.Label className={styles.Label}>Select</Field.Label>
          <Select.Root required={native}>
            <Select.Trigger className={styles.Select}>
              <Select.Value placeholder="Select value" />
              <Select.Icon className={styles.SelectIcon}>
                <ChevronUpDownIcon />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner className={styles.Positioner} sideOffset={8}>
                <Select.ScrollUpArrow className={styles.ScrollArrow} />
                <Select.Popup className={styles.Popup}>
                  <Select.Item className={styles.Item} value="sans">
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon className={styles.ItemIndicatorIcon} />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>
                      Sans-serif
                    </Select.ItemText>
                  </Select.Item>
                  <Select.Item className={styles.Item} value="serif">
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon className={styles.ItemIndicatorIcon} />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>
                      Serif
                    </Select.ItemText>
                  </Select.Item>
                  <Select.Item className={styles.Item} value="mono">
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon className={styles.ItemIndicatorIcon} />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>
                      Monospace
                    </Select.ItemText>
                  </Select.Item>
                  <Select.Item className={styles.Item} value="cursive">
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon className={styles.ItemIndicatorIcon} />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>
                      Cursive
                    </Select.ItemText>
                  </Select.Item>
                </Select.Popup>
                <Select.ScrollDownArrow className={styles.ScrollArrow} />
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <Field.Error className={styles.Error} />
        </Field.Root>

        <Field.Root name="radio-group" className={styles.Field}>
          <Field.Label className={styles.Label}>Radio Group</Field.Label>
          <RadioGroup required={native} className={styles.RadioGroup}>
            <label className={styles.Item}>
              <Radio.Root value="fuji-apple" className={styles.Radio}>
                <Radio.Indicator className={styles.Indicator} />
              </Radio.Root>
              Fuji
            </label>

            <label className={styles.Item}>
              <Radio.Root value="gala-apple" className={styles.Radio}>
                <Radio.Indicator className={styles.Indicator} />
              </Radio.Root>
              Gala
            </label>

            <label className={styles.Item}>
              <Radio.Root value="granny-smith-apple" className={styles.Radio}>
                <Radio.Indicator className={styles.Indicator} />
              </Radio.Root>
              Granny Smith
            </label>
          </RadioGroup>
          <Field.Error className={styles.Error} />
        </Field.Root>

        <button type="submit" className={styles.Button}>
          Submit
        </button>
      </Form>
    </div>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
