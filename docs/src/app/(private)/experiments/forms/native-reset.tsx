'use client';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { Input } from '@base-ui/react/input';
import { Checkbox } from '@base-ui/react/checkbox';
import { Select } from '@base-ui/react/select';
import { NumberField } from '@base-ui/react/number-field';

export default function NativeResetExperiment() {
  const [controlledText, setControlledText] = React.useState('controlled');
  const [controlledChecked, setControlledChecked] = React.useState(false);
  const [cancel, setCancel] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);

  function record(name: string, value: unknown, reason: string) {
    setLog((prev) => [...prev, `${name}: ${JSON.stringify(value)} (${reason})`]);
  }

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16, maxWidth: 480 }}>
      <label>
        <input
          type="checkbox"
          checked={cancel}
          onChange={(event) => setCancel(event.target.checked)}
        />{' '}
        Cancel the reset in Form onReset
      </label>
      <Form
        data-testid="form"
        style={{ display: 'grid', gap: 12 }}
        onReset={(event) => {
          if (cancel) {
            event.preventDefault();
          }
        }}
      >
        <Field.Root name="uncontrolled" data-testid="field-uncontrolled">
          <Field.Label>Uncontrolled input</Field.Label>
          <Input
            defaultValue="initial"
            onValueChange={(v, d) => record('uncontrolled', v, d.reason)}
          />
        </Field.Root>
        <Field.Root name="controlled" data-testid="field-controlled">
          <Field.Label>Controlled input</Field.Label>
          <Input
            value={controlledText}
            onValueChange={(v, d) => {
              record('controlled', v, d.reason);
              setControlledText(v);
            }}
          />
        </Field.Root>
        <Field.Root name="terms" data-testid="field-checkbox">
          <Field.Label>
            <Checkbox.Root
              name="terms"
              data-testid="checkbox"
              onCheckedChange={(v, d) => record('checkbox', v, d.reason)}
              style={{ width: 16, height: 16, border: '1px solid' }}
            >
              <Checkbox.Indicator>✓</Checkbox.Indicator>
            </Checkbox.Root>
            Uncontrolled checkbox
          </Field.Label>
        </Field.Root>
        <Field.Root name="controlledTerms">
          <Field.Label>
            <Checkbox.Root
              name="controlledTerms"
              data-testid="controlled-checkbox"
              checked={controlledChecked}
              onCheckedChange={(v, d) => {
                record('controlled checkbox', v, d.reason);
                setControlledChecked(v);
              }}
              style={{ width: 16, height: 16, border: '1px solid' }}
            >
              <Checkbox.Indicator>✓</Checkbox.Indicator>
            </Checkbox.Root>
            Controlled checkbox
          </Field.Label>
        </Field.Root>
        <Field.Root name="fruit" data-testid="field-select">
          <Field.Label>Select</Field.Label>
          <Select.Root
            name="fruit"
            defaultValue="apple"
            onValueChange={(v, d) => record('select', v, d.reason)}
          >
            <Select.Trigger data-testid="select-trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup style={{ background: 'canvas', border: '1px solid' }}>
                  <Select.Item value="apple">
                    <Select.ItemText>apple</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="banana">
                    <Select.ItemText>banana</Select.ItemText>
                  </Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Field.Root>
        <Field.Root name="quantity" data-testid="field-number">
          <Field.Label>Number field</Field.Label>
          <NumberField.Root
            name="quantity"
            defaultValue={5}
            onValueChange={(v, d) => record('number', v, d.reason)}
          >
            <NumberField.Group>
              <NumberField.Decrement>-</NumberField.Decrement>
              <NumberField.Input data-testid="number-input" />
              <NumberField.Increment data-testid="number-increment">+</NumberField.Increment>
            </NumberField.Group>
          </NumberField.Root>
        </Field.Root>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* eslint-disable-next-line react/button-has-type */}
          <button type="reset">Reset</button>
          <button type="button" onClick={() => setLog([])}>
            Clear log
          </button>
        </div>
      </Form>
      <pre data-testid="log">{log.join('\n')}</pre>
    </div>
  );
}
