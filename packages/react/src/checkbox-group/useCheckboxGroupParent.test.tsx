import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Checkbox } from '@base-ui/react/checkbox';

describe('useCheckboxGroupParent', () => {
  const { render } = createRenderer();
  const allValues = ['a', 'b', 'c'];

  it('should control child checkboxes', async () => {
    const parentCheckedChange = vi.fn();
    const childCheckedChange = vi.fn();
    function App() {
      const [value, setValue] = React.useState<string[]>([]);
      return (
        <CheckboxGroup value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" onCheckedChange={parentCheckedChange} />
          <Checkbox.Root value="a" />
          <Checkbox.Root value="b" onCheckedChange={childCheckedChange} />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      );
    }

    await render(<App />);

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((v) => v.getAttribute('data-parent') == null);
    const parent = screen.getByTestId('parent');

    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });

    fireEvent.click(parent);
    expect(parent).toHaveAttribute('aria-checked', 'true');

    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    expect(parentCheckedChange.mock.calls.length).toBe(1);
    expect(childCheckedChange.mock.calls.length).toBe(0);

    fireEvent.click(parent);
    expect(parent).toHaveAttribute('aria-checked', 'false');

    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });

    expect(parentCheckedChange.mock.calls.length).toBe(2);
    expect(childCheckedChange.mock.calls.length).toBe(0);
  });

  it('parent should be marked as mixed if some children are checked', async () => {
    const childCheckedChange = vi.fn();
    function App() {
      const [value, setValue] = React.useState<string[]>([]);
      return (
        <CheckboxGroup value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" onCheckedChange={childCheckedChange} />
          <Checkbox.Root value="b" />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      );
    }

    await render(<App />);

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((v) => v.getAttribute('data-parent') == null);

    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });
    fireEvent.click(checkboxes[0]);
    expect(childCheckedChange.mock.calls.length).toBe(1);

    expect(screen.getByTestId('parent')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('updates uncontrolled parent-enabled groups from child clicks without duplicate callbacks', async () => {
    const handleValueChange = vi.fn();

    await render(
      <CheckboxGroup allValues={allValues} onValueChange={handleValueChange}>
        <Checkbox.Root parent data-testid="parent" />
        <Checkbox.Root value="a" data-testid="checkboxA" />
        <Checkbox.Root value="b" data-testid="checkboxB" />
        <Checkbox.Root value="c" data-testid="checkboxC" />
      </CheckboxGroup>,
    );

    const parent = screen.getByTestId('parent');
    const checkboxA = screen.getByTestId('checkboxA');
    const checkboxB = screen.getByTestId('checkboxB');
    const checkboxC = screen.getByTestId('checkboxC');

    fireEvent.click(checkboxA);

    expect(handleValueChange.mock.calls.length).toBe(1);
    expect(handleValueChange.mock.calls[0][0]).toEqual(['a']);
    expect(parent).toHaveAttribute('aria-checked', 'mixed');
    expect(checkboxA).toHaveAttribute('aria-checked', 'true');
    expect(checkboxB).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(parent);

    expect(handleValueChange.mock.calls.length).toBe(2);
    expect(handleValueChange.mock.calls[1][0]).toEqual(['a', 'b', 'c']);
    expect(parent).toHaveAttribute('aria-checked', 'true');
    expect(checkboxA).toHaveAttribute('aria-checked', 'true');
    expect(checkboxB).toHaveAttribute('aria-checked', 'true');
    expect(checkboxC).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(parent);

    expect(handleValueChange.mock.calls.length).toBe(3);
    expect(handleValueChange.mock.calls[2][0]).toEqual([]);
    expect(parent).toHaveAttribute('aria-checked', 'false');
    expect(checkboxA).toHaveAttribute('aria-checked', 'false');
    expect(checkboxB).toHaveAttribute('aria-checked', 'false');
    expect(checkboxC).toHaveAttribute('aria-checked', 'false');
  });

  it('should correctly initialize the values array', async () => {
    function App() {
      const [value, setValue] = React.useState<string[]>(['a']);
      return (
        <CheckboxGroup value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" data-testid="checkboxA" />
          <Checkbox.Root value="b" />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      );
    }

    await render(<App />);

    expect(screen.getByTestId('parent')).toHaveAttribute('aria-checked', 'mixed');

    expect(screen.getByTestId('checkboxA')).toHaveAttribute('aria-checked', 'true');
  });

  it('should update the values array when a child checkbox is clicked', async () => {
    function App() {
      const [value, setValue] = React.useState<string[]>(['a']);
      return (
        <CheckboxGroup value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" data-testid="checkboxA" />
          <Checkbox.Root value="b" />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      );
    }

    await render(<App />);

    expect(screen.getByTestId('parent')).toHaveAttribute('aria-checked', 'mixed');

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((v) => v.getAttribute('data-parent') == null);

    const checkboxA = screen.getByTestId('checkboxA');
    expect(checkboxA).toHaveAttribute('aria-checked', 'true');

    checkboxes.forEach((checkbox) => {
      if (checkbox !== checkboxA) {
        fireEvent.click(checkbox);
      }
    });

    expect(screen.getByTestId('parent')).toHaveAttribute('aria-checked', 'true');
  });

  it('should apply space-separated aria-controls attribute with child names', async () => {
    function App() {
      const [value, setValue] = React.useState<string[]>([]);
      return (
        <CheckboxGroup value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          {allValues.map((v) => (
            <Checkbox.Root key={v} value={v} data-testid={v} />
          ))}
        </CheckboxGroup>
      );
    }

    await render(<App />);

    expect(screen.getByTestId('parent')).toHaveAttribute(
      'aria-controls',
      allValues.map((v) => screen.getByTestId(v).id).join(' '),
    );
  });

  it('keeps a custom child id in aria-controls', async () => {
    await render(
      <CheckboxGroup allValues={['a']}>
        <Checkbox.Root parent data-testid="parent" nativeButton render={<button />} />
        <Checkbox.Root id="custom" value="a" data-testid="a" nativeButton render={<button />} />
      </CheckboxGroup>,
    );

    expect(screen.getByTestId('a')).toHaveAttribute('id', 'custom');
    expect(screen.getByTestId('parent')).toHaveAttribute('aria-controls', 'custom');
  });

  it.each([false, true])(
    'keeps a rendered child id in aria-controls (nativeButton=%s)',
    async (nativeButton) => {
      await render(
        <CheckboxGroup allValues={['a']}>
          <Checkbox.Root
            parent
            data-testid="parent"
            nativeButton={nativeButton}
            render={nativeButton ? <button /> : undefined}
          />
          <Checkbox.Root
            value="a"
            nativeButton={nativeButton}
            render={nativeButton ? <button id="rendered" /> : <span id="rendered" />}
          />
        </CheckboxGroup>,
      );

      expect(screen.getByTestId('parent')).toHaveAttribute('aria-controls', 'rendered');
    },
  );

  it('references the exposed child rather than its custom-id input without nativeButton', async () => {
    await render(
      <CheckboxGroup allValues={['a']}>
        <Checkbox.Root parent data-testid="parent" />
        <Checkbox.Root id="custom" value="a" data-testid="a" />
      </CheckboxGroup>,
    );

    // The custom `id` lands on the hidden input, so `aria-controls` has to name the exposed
    // element instead.
    expect(document.querySelector('input[type="checkbox"][id="custom"]')).not.toBe(null);
    expect(screen.getByTestId('a').id).not.toBe('custom');
    expect(screen.getByTestId('parent')).toHaveAttribute(
      'aria-controls',
      screen.getByTestId('a').id,
    );
  });

  it('does not read aria-controls ids off Object.prototype', async () => {
    await render(
      <CheckboxGroup allValues={['a', 'constructor']}>
        <Checkbox.Root parent data-testid="parent" />
        <Checkbox.Root value="a" data-testid="a" />
      </CheckboxGroup>,
    );

    expect(screen.getByTestId('parent')).toHaveAttribute(
      'aria-controls',
      screen.getByTestId('a').id,
    );
  });

  it('drops an unmounted child from aria-controls', async () => {
    function App(props: { showB: boolean }) {
      return (
        <CheckboxGroup allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" data-testid="a" />
          {props.showB && <Checkbox.Root value="b" data-testid="b" />}
        </CheckboxGroup>
      );
    }

    const { rerender } = await render(<App showB />);
    await rerender(<App showB={false} />);

    expect(screen.getByTestId('parent')).toHaveAttribute(
      'aria-controls',
      screen.getByTestId('a').id,
    );
  });

  it('keeps both ids for checkboxes sharing a value and retains the survivor', async () => {
    function App(props: { showSecondB: boolean }) {
      return (
        <CheckboxGroup allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" data-testid="a" />
          <Checkbox.Root value="b" data-testid="b" />
          {props.showSecondB && <Checkbox.Root value="b" data-testid="second-b" />}
        </CheckboxGroup>
      );
    }

    const { rerender } = await render(<App showSecondB />);

    expect(screen.getByTestId('parent')).toHaveAttribute(
      'aria-controls',
      `${screen.getByTestId('a').id} ${screen.getByTestId('b').id} ${screen.getByTestId('second-b').id}`,
    );

    await rerender(<App showSecondB={false} />);

    expect(screen.getByTestId('parent')).toHaveAttribute(
      'aria-controls',
      `${screen.getByTestId('a').id} ${screen.getByTestId('b').id}`,
    );
  });

  it('does not select a child without an identifying value', async () => {
    await render(
      <CheckboxGroup allValues={['a']}>
        <Checkbox.Root parent data-testid="parent" />
        <Checkbox.Root id="standalone" data-testid="no-value" />
        <Checkbox.Root value="a" data-testid="checkbox-a" />
      </CheckboxGroup>,
    );

    const parent = screen.getByTestId('parent');
    const noValue = screen.getByTestId('no-value');
    const checkboxA = screen.getByTestId('checkbox-a');

    fireEvent.click(parent);

    expect(parent).toHaveAttribute('aria-checked', 'true');
    expect(checkboxA).toHaveAttribute('aria-checked', 'true');
    expect(noValue).toHaveAttribute('aria-checked', 'false');
    expect(noValue.nextElementSibling).toHaveAttribute('id', 'standalone');
  });

  it('preserves initial state if mixed when parent is clicked', async () => {
    function App() {
      const [value, setValue] = React.useState<string[]>([]);
      return (
        <CheckboxGroup value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" data-testid="checkboxA" />
          <Checkbox.Root value="b" />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      );
    }

    await render(<App />);

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((v) => v.getAttribute('data-parent') == null);
    const checkboxA = screen.getByTestId('checkboxA');
    const parent = screen.getByTestId('parent');

    fireEvent.click(checkboxA);

    expect(screen.getByTestId('parent')).toHaveAttribute('aria-checked', 'mixed');

    fireEvent.click(parent);

    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    fireEvent.click(parent);

    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });

    fireEvent.click(parent);

    expect(parent).toHaveAttribute('aria-checked', 'mixed');
    expect(checkboxA).toHaveAttribute('aria-checked', 'true');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAttribute('aria-checked', checkbox === checkboxA ? 'true' : 'false');
    });
  });

  it('lets a parent checkbox cancel a parent-enabled group change', async () => {
    const handleValueChange = vi.fn();
    const handleParentChange = vi.fn((_, eventDetails: Checkbox.Root.ChangeEventDetails) => {
      eventDetails.cancel();
    });

    await render(
      <CheckboxGroup allValues={allValues} onValueChange={handleValueChange}>
        <Checkbox.Root parent data-testid="parent" onCheckedChange={handleParentChange} />
        <Checkbox.Root value="a" data-testid="checkboxA" />
        <Checkbox.Root value="b" data-testid="checkboxB" />
        <Checkbox.Root value="c" data-testid="checkboxC" />
      </CheckboxGroup>,
    );

    fireEvent.click(screen.getByTestId('parent'));

    expect(handleParentChange.mock.calls.length).toBe(1);
    expect(handleValueChange.mock.calls.length).toBe(0);
    expect(screen.getByTestId('parent')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('checkboxA')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('checkboxB')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('checkboxC')).toHaveAttribute('aria-checked', 'false');
  });

  it('lets a child checkbox cancel a parent-enabled group change', async () => {
    const handleValueChange = vi.fn();
    const handleChildChange = vi.fn((_, eventDetails: Checkbox.Root.ChangeEventDetails) => {
      eventDetails.cancel();
    });

    await render(
      <CheckboxGroup allValues={allValues} onValueChange={handleValueChange}>
        <Checkbox.Root parent data-testid="parent" />
        <Checkbox.Root value="a" data-testid="checkboxA" onCheckedChange={handleChildChange} />
        <Checkbox.Root value="b" />
        <Checkbox.Root value="c" />
      </CheckboxGroup>,
    );

    fireEvent.click(screen.getByTestId('checkboxA'));

    expect(handleChildChange.mock.calls.length).toBe(1);
    expect(handleValueChange.mock.calls.length).toBe(0);
    expect(screen.getByTestId('parent')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('checkboxA')).toHaveAttribute('aria-checked', 'false');
  });

  it('does not advance the parent toggle cycle when the group cancels a parent change', async () => {
    const handleValueChange = vi.fn((_, eventDetails: CheckboxGroup.ChangeEventDetails) => {
      eventDetails.cancel();
    });

    await render(
      <CheckboxGroup value={['a']} allValues={allValues} onValueChange={handleValueChange}>
        <Checkbox.Root parent data-testid="parent" />
        <Checkbox.Root value="a" />
        <Checkbox.Root value="b" />
        <Checkbox.Root value="c" />
      </CheckboxGroup>,
    );

    const parent = screen.getByTestId('parent');

    // From a mixed state the parent attempts to check all. The group cancels, so
    // the internal status must not advance to 'on'.
    fireEvent.click(parent);
    // A second click must retry the same 'mixed -> on' transition instead of
    // skipping ahead to 'on -> off' and proposing an empty value.
    fireEvent.click(parent);

    expect(handleValueChange).toHaveBeenCalledTimes(2);
    expect(handleValueChange.mock.calls[0][0]).toEqual(allValues);
    expect(handleValueChange.mock.calls[1][0]).toEqual(allValues);
  });

  it('does not pollute the parent snapshot when the group cancels a child change', async () => {
    const handleValueChange = vi.fn((_, eventDetails: CheckboxGroup.ChangeEventDetails) => {
      eventDetails.cancel();
    });

    await render(
      <CheckboxGroup value={allValues} allValues={allValues} onValueChange={handleValueChange}>
        <Checkbox.Root parent data-testid="parent" />
        <Checkbox.Root value="a" data-testid="checkboxA" />
        <Checkbox.Root value="b" />
        <Checkbox.Root value="c" />
      </CheckboxGroup>,
    );

    // Unchecking a child is canceled, so the parent's snapshot of checked
    // children must stay intact.
    fireEvent.click(screen.getByTestId('checkboxA'));
    // The parent still sees an all-checked group and toggles to none. A polluted
    // snapshot would make it propose checking everything again.
    fireEvent.click(screen.getByTestId('parent'));

    expect(handleValueChange).toHaveBeenCalledTimes(2);
    expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'c']);
    expect(handleValueChange.mock.calls[1][0]).toEqual([]);
  });

  it('handles unchecked disabled checkboxes', async () => {
    function App() {
      const [value, setValue] = React.useState<string[]>([]);
      return (
        <CheckboxGroup value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" disabled data-testid="checkboxA" />
          <Checkbox.Root value="b" />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      );
    }

    await render(<App />);

    const parent = screen.getByTestId('parent');
    fireEvent.click(parent);

    expect(parent).toHaveAttribute('aria-checked', 'mixed');
    expect(screen.getByTestId('checkboxA')).toHaveAttribute('aria-checked', 'false');
  });

  it('handles checked disabled checkboxes', async () => {
    function App() {
      const [value, setValue] = React.useState<string[]>(['a']);
      return (
        <CheckboxGroup value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" data-testid="checkboxA" disabled />
          <Checkbox.Root value="b" data-testid="checkboxB" />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      );
    }

    await render(<App />);

    const checkboxA = screen.getByTestId('checkboxA');
    const checkboxB = screen.getByTestId('checkboxB');
    const parent = screen.getByTestId('parent');

    fireEvent.click(parent);
    expect(checkboxA).toHaveAttribute('aria-checked', 'true');
    expect(checkboxB).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(parent);
    expect(checkboxA).toHaveAttribute('aria-checked', 'true');
    expect(checkboxB).toHaveAttribute('aria-checked', 'false');

    // Only the disabled checkbox is checked, which is as unchecked as the group gets.
    fireEvent.click(parent);
    expect(checkboxA).toHaveAttribute('aria-checked', 'true');
    expect(checkboxB).toHaveAttribute('aria-checked', 'true');
  });

  function getCheckedValues(values = allValues) {
    return values.filter(
      (value) => screen.getByTestId(value).getAttribute('aria-checked') === 'true',
    );
  }

  describe('value changed from outside', () => {
    function App(props: {
      outsideValue?: string[];
      otherOutsideValue?: string[];
      disabledValues?: string[];
      onValueChange?: (value: string[]) => void;
    }) {
      const [value, setValue] = React.useState<string[]>([]);
      const [canceling, setCanceling] = React.useState(false);
      const [enabled, setEnabled] = React.useState(false);
      return (
        <div>
          <button onClick={() => setValue(props.outsideValue ?? [])}>set outside</button>
          <button onClick={() => setValue(props.otherOutsideValue ?? [])}>set other outside</button>
          <button onClick={() => setValue([])}>clear outside</button>
          <button onClick={() => setCanceling((prev) => !prev)}>toggle canceling</button>
          <button onClick={() => setEnabled(true)}>enable all</button>
          <CheckboxGroup
            value={value}
            onValueChange={(nextValue, eventDetails) => {
              props.onValueChange?.(nextValue);
              if (canceling) {
                eventDetails.cancel();
              } else {
                setValue(nextValue);
              }
            }}
            allValues={allValues}
          >
            <Checkbox.Root parent data-testid="parent" />
            {allValues.map((v) => (
              <Checkbox.Root
                key={v}
                value={v}
                disabled={!enabled && props.disabledValues?.includes(v)}
                data-testid={v}
              />
            ))}
          </CheckboxGroup>
        </div>
      );
    }

    it.each([
      { name: 'with nothing clicked', clicked: [], before: [], outsideValue: ['a'] },
      {
        name: 'after another child was clicked',
        clicked: ['a'],
        before: ['a'],
        outsideValue: ['b'],
      },
      {
        name: 'after the parent checked all',
        clicked: ['a', 'parent'],
        before: allValues,
        outsideValue: ['b'],
      },
      {
        name: 'after the parent unchecked all',
        clicked: ['a', 'parent', 'parent'],
        before: [],
        outsideValue: ['b'],
      },
    ])('returns to a mixed value set $name', async ({ clicked, before, outsideValue }) => {
      const { user } = await render(<App outsideValue={outsideValue} />);

      const parent = screen.getByTestId('parent');

      for (const id of clicked) {
        // eslint-disable-next-line no-await-in-loop
        await user.click(screen.getByTestId(id));
      }
      expect(getCheckedValues()).toEqual(before);

      await user.click(screen.getByRole('button', { name: 'set outside' }));
      expect(parent).toHaveAttribute('aria-checked', 'mixed');
      expect(getCheckedValues()).toEqual(outsideValue);

      await user.click(parent);
      expect(getCheckedValues()).toEqual(allValues);

      await user.click(parent);
      expect(getCheckedValues()).toEqual([]);

      await user.click(parent);
      expect(parent).toHaveAttribute('aria-checked', 'mixed');
      expect(getCheckedValues()).toEqual(outsideValue);
    });

    it('unchecks every child after all of them were checked from outside', async () => {
      const { user } = await render(<App outsideValue={allValues} />);

      const parent = screen.getByTestId('parent');

      await user.click(screen.getByTestId('a'));
      expect(parent).toHaveAttribute('aria-checked', 'mixed');

      await user.click(screen.getByRole('button', { name: 'set outside' }));
      expect(parent).toHaveAttribute('aria-checked', 'true');
      expect(getCheckedValues()).toEqual(allValues);

      await user.click(parent);
      expect(parent).toHaveAttribute('aria-checked', 'false');
      expect(getCheckedValues()).toEqual([]);
    });

    it('keeps the cycle when the same values are set from outside in another order', async () => {
      const { user } = await render(<App outsideValue={['c', 'b', 'a']} />);

      const parent = screen.getByTestId('parent');

      await user.click(screen.getByTestId('a'));
      await user.click(parent);
      expect(getCheckedValues()).toEqual(allValues);

      await user.click(screen.getByRole('button', { name: 'set outside' }));
      await user.click(parent);
      expect(getCheckedValues()).toEqual([]);

      await user.click(parent);
      expect(getCheckedValues()).toEqual(['a']);
    });

    it('returns to the second of two mixed values set from outside', async () => {
      const { user } = await render(<App outsideValue={['b']} otherOutsideValue={['c']} />);

      const parent = screen.getByTestId('parent');

      await user.click(screen.getByTestId('a'));
      await user.click(parent);
      await user.click(screen.getByRole('button', { name: 'set outside' }));
      await user.click(parent);
      expect(getCheckedValues()).toEqual(allValues);

      await user.click(screen.getByRole('button', { name: 'set other outside' }));
      expect(getCheckedValues()).toEqual(['c']);

      await user.click(parent);
      expect(getCheckedValues()).toEqual(allValues);

      await user.click(parent);
      expect(getCheckedValues()).toEqual([]);

      await user.click(parent);
      expect(getCheckedValues()).toEqual(['c']);
    });

    it('checks every child once a child is enabled after checking all from an empty group', async () => {
      const { user } = await render(<App disabledValues={['c']} />);

      const parent = screen.getByTestId('parent');

      await user.click(parent);
      expect(getCheckedValues()).toEqual(['a', 'b']);

      await user.click(screen.getByRole('button', { name: 'enable all' }));
      expect(parent).toHaveAttribute('aria-checked', 'mixed');

      await user.click(parent);
      expect(getCheckedValues()).toEqual(allValues);
    });

    it.each([
      { name: 'returns to that value', toggled: 1, before: [], expected: ['a', 'b'] },
      { name: 'checks every child', toggled: 2, before: ['a', 'b'], expected: allValues },
    ])(
      'parent $name once a child is enabled after toggling an outside value of every enabled child',
      async ({ toggled, before, expected }) => {
        const { user } = await render(<App outsideValue={['a', 'b']} disabledValues={['c']} />);

        const parent = screen.getByTestId('parent');

        // There is nothing mixed to return to, so the parent toggles all and none.
        await user.click(screen.getByRole('button', { name: 'set outside' }));
        expect(parent).toHaveAttribute('aria-checked', 'mixed');
        expect(getCheckedValues()).toEqual(['a', 'b']);

        for (let i = 0; i < toggled; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await user.click(parent);
        }
        expect(getCheckedValues()).toEqual(before);

        await user.click(screen.getByRole('button', { name: 'enable all' }));
        expect(screen.getByTestId('c')).not.toHaveAttribute('data-disabled');

        await user.click(parent);
        expect(getCheckedValues()).toEqual(expected);
      },
    );

    it('does not return to a mixed value that was cleared from outside', async () => {
      const { user } = await render(<App />);

      const parent = screen.getByTestId('parent');

      await user.click(screen.getByTestId('a'));
      expect(getCheckedValues()).toEqual(['a']);

      await user.click(screen.getByRole('button', { name: 'clear outside' }));
      expect(getCheckedValues()).toEqual([]);

      await user.click(parent);
      expect(getCheckedValues()).toEqual(allValues);

      await user.click(parent);
      expect(getCheckedValues()).toEqual([]);

      await user.click(parent);
      expect(getCheckedValues()).toEqual(allValues);
    });

    describe('with a canceled change', () => {
      it('proposes checking all from an outside value until the change is accepted', async () => {
        const handleValueChange = vi.fn();
        const { user } = await render(
          <App outsideValue={['b']} onValueChange={handleValueChange} />,
        );

        const parent = screen.getByTestId('parent');

        await user.click(screen.getByTestId('a'));
        await user.click(parent);
        expect(getCheckedValues()).toEqual(allValues);

        await user.click(screen.getByRole('button', { name: 'set outside' }));
        await user.click(screen.getByRole('button', { name: 'toggle canceling' }));
        expect(getCheckedValues()).toEqual(['b']);
        handleValueChange.mockClear();

        await user.click(parent);
        await user.click(parent);
        expect(getCheckedValues()).toEqual(['b']);
        expect(handleValueChange.mock.calls).toEqual([[allValues], [allValues]]);

        await user.click(screen.getByRole('button', { name: 'toggle canceling' }));
        await user.click(parent);
        expect(getCheckedValues()).toEqual(allValues);

        await user.click(parent);
        expect(getCheckedValues()).toEqual([]);

        await user.click(parent);
        expect(getCheckedValues()).toEqual(['b']);
      });

      it('keeps the mixed value to return to when the change after an outside value is canceled', async () => {
        const { user } = await render(<App outsideValue={['b']} />);

        const parent = screen.getByTestId('parent');

        await user.click(screen.getByTestId('a'));
        await user.click(parent);
        await user.click(parent);
        expect(getCheckedValues()).toEqual([]);

        await user.click(screen.getByRole('button', { name: 'set outside' }));
        await user.click(screen.getByRole('button', { name: 'toggle canceling' }));
        await user.click(parent);
        expect(getCheckedValues()).toEqual(['b']);

        // Back to the value the parent produced, so its cycle is valid again.
        await user.click(screen.getByRole('button', { name: 'toggle canceling' }));
        await user.click(screen.getByRole('button', { name: 'clear outside' }));
        expect(getCheckedValues()).toEqual([]);

        await user.click(parent);
        expect(getCheckedValues()).toEqual(['a']);
      });

      it.each([
        { name: 'parent', canceled: 'parent' },
        { name: 'child', canceled: 'b' },
      ])(
        'treats an outside value after a canceled $name change as a new mixed value',
        async ({ canceled }) => {
          const { user } = await render(<App outsideValue={['b']} />);

          const parent = screen.getByTestId('parent');

          await user.click(screen.getByTestId('a'));
          await user.click(parent);
          expect(getCheckedValues()).toEqual(allValues);

          await user.click(screen.getByRole('button', { name: 'toggle canceling' }));
          await user.click(screen.getByTestId(canceled));
          expect(getCheckedValues()).toEqual(allValues);

          await user.click(screen.getByRole('button', { name: 'toggle canceling' }));
          await user.click(screen.getByRole('button', { name: 'set outside' }));
          expect(getCheckedValues()).toEqual(['b']);

          await user.click(parent);
          expect(getCheckedValues()).toEqual(allValues);

          await user.click(parent);
          expect(getCheckedValues()).toEqual([]);

          await user.click(parent);
          expect(getCheckedValues()).toEqual(['b']);
        },
      );
    });
  });

  describe('value stored by onValueChange', () => {
    function App(props: {
      defaultValue?: string[];
      store?: (value: string[]) => string[] | null;
      sync?: boolean;
      deferred?: boolean;
      derived?: boolean;
    }) {
      const [value, setValue] = React.useState<string[]>(props.defaultValue ?? []);
      const [canceling, setCanceling] = React.useState(false);
      const [, rerender] = React.useReducer((count: number) => count + 1, 0);
      const deferredRef = React.useRef<string[]>([]);
      return (
        <div>
          <button onClick={() => setValue(deferredRef.current)}>land</button>
          <button onClick={rerender}>rerender</button>
          <button onClick={() => setCanceling((prev) => !prev)}>toggle canceling</button>
          <CheckboxGroup
            value={props.derived ? [...value] : value}
            onValueChange={(nextValue, eventDetails) => {
              if (canceling) {
                eventDetails.cancel();
                return;
              }
              const stored = props.store ? props.store(nextValue) : nextValue;
              if (stored === null) {
                return;
              }
              if (props.deferred) {
                deferredRef.current = stored;
              } else if (props.sync) {
                ReactDOM.flushSync(() => setValue(stored));
              } else {
                setValue(stored);
              }
            }}
            allValues={allValues}
          >
            <Checkbox.Root parent data-testid="parent" />
            <Checkbox.Root value="a" data-testid="a" />
            <Checkbox.Root value="b" data-testid="b" />
            <Checkbox.Root value="c" data-testid="c" />
          </CheckboxGroup>
        </div>
      );
    }

    it('continues the cycle from a change stored without one of the values', async () => {
      const { user } = await render(
        <App store={(nextValue) => nextValue.filter((v) => v !== 'c')} />,
      );

      const parent = screen.getByTestId('parent');

      await user.click(screen.getByTestId('a'));
      expect(getCheckedValues()).toEqual(['a']);

      for (const checkedValues of [['a', 'b'], [], ['a'], ['a', 'b']]) {
        // eslint-disable-next-line no-await-in-loop
        await user.click(parent);
        expect(getCheckedValues()).toEqual(checkedValues);
      }
    });

    it('advances the cycle past a change ignored without canceling', async () => {
      const { user } = await render(
        <App store={(nextValue) => (nextValue.length > 0 ? nextValue : null)} />,
      );

      const parent = screen.getByTestId('parent');

      await user.click(screen.getByTestId('a'));
      await user.click(parent);
      expect(getCheckedValues()).toEqual(allValues);

      await user.click(parent);
      expect(getCheckedValues()).toEqual(allValues);

      await user.click(parent);
      expect(getCheckedValues()).toEqual(['a']);
    });

    it('keeps the cycle when a change is landed synchronously', async () => {
      const { user } = await render(<App sync defaultValue={['a']} />);

      const parent = screen.getByTestId('parent');

      await user.click(parent);
      expect(getCheckedValues()).toEqual(allValues);

      await user.click(parent);
      expect(getCheckedValues()).toEqual([]);

      await user.click(parent);
      expect(getCheckedValues()).toEqual(['a']);
    });

    it('keeps the cycle when a change is canceled before a deferred one lands', async () => {
      const { user } = await render(<App deferred defaultValue={['a']} />);

      const parent = screen.getByTestId('parent');
      const land = screen.getByRole('button', { name: 'land' });
      const toggleCanceling = screen.getByRole('button', { name: 'toggle canceling' });

      await user.click(parent);
      await user.click(toggleCanceling);
      await user.click(parent);
      await user.click(toggleCanceling);
      expect(getCheckedValues()).toEqual(['a']);

      await user.click(land);
      expect(getCheckedValues()).toEqual(allValues);

      await user.click(parent);
      await user.click(land);
      expect(getCheckedValues()).toEqual([]);

      await user.click(parent);
      await user.click(land);
      expect(getCheckedValues()).toEqual(['a']);
    });

    it('keeps the cycle when a derived value rerenders before a deferred change lands', async () => {
      const { user } = await render(<App deferred derived />);

      const parent = screen.getByTestId('parent');
      const land = screen.getByRole('button', { name: 'land' });
      const rerender = screen.getByRole('button', { name: 'rerender' });

      await user.click(screen.getByTestId('a'));
      await user.click(land);
      expect(getCheckedValues()).toEqual(['a']);

      for (const checkedValues of [allValues, [], ['a']]) {
        // eslint-disable-next-line no-await-in-loop
        await user.click(parent);
        // eslint-disable-next-line no-await-in-loop
        await user.click(rerender);
        // eslint-disable-next-line no-await-in-loop
        await user.click(land);
        expect(getCheckedValues()).toEqual(checkedValues);
      }
    });
  });

  describe('nested group', () => {
    const nestedValues = ['n1', 'n2'];
    const leaves = ['x', 'y', 'n1', 'n2'];

    // The nested group's parent stands for the outer group's `nested` value, as in the docs demo.
    function App() {
      const [outerValue, setOuterValue] = React.useState<string[]>([]);
      const [nestedValue, setNestedValue] = React.useState<string[]>([]);
      return (
        <CheckboxGroup
          value={outerValue}
          onValueChange={(value) => {
            if (value.includes('nested')) {
              setNestedValue(nestedValues);
            } else if (nestedValue.length === nestedValues.length) {
              setNestedValue([]);
            }
            setOuterValue(value);
          }}
          allValues={['x', 'nested', 'y']}
        >
          <Checkbox.Root
            parent
            indeterminate={nestedValue.length > 0 && nestedValue.length !== nestedValues.length}
            data-testid="outer-parent"
          />
          <Checkbox.Root value="x" data-testid="x" />
          <Checkbox.Root value="y" data-testid="y" />
          <CheckboxGroup
            value={nestedValue}
            onValueChange={(value) => {
              if (value.length === nestedValues.length) {
                setOuterValue((prev) => Array.from(new Set([...prev, 'nested'])));
              } else {
                setOuterValue((prev) => prev.filter((v) => v !== 'nested'));
              }
              setNestedValue(value);
            }}
            allValues={nestedValues}
          >
            <Checkbox.Root parent data-testid="nested-parent" />
            <Checkbox.Root value="n1" data-testid="n1" />
            <Checkbox.Root value="n2" data-testid="n2" />
          </CheckboxGroup>
        </CheckboxGroup>
      );
    }

    it.each([
      {
        name: 'outer parent returns to the value set by the nested parent',
        clicked: ['nested-parent'],
        before: ['n1', 'n2'],
        expected: [leaves, [], ['n1', 'n2']],
      },
      {
        // The nested group appends its value, so the outer value comes back in another order.
        name: 'outer parent checks all after a nested child is unchecked twice',
        clicked: ['outer-parent', 'n1', 'outer-parent', 'n1'],
        before: ['x', 'y', 'n2'],
        expected: [leaves],
      },
      {
        name: 'outer parent checks all after a nested child is checked following a full cycle',
        clicked: ['x', 'outer-parent', 'outer-parent', 'n1'],
        before: ['n1'],
        expected: [leaves, [], leaves],
      },
    ])('$name', async ({ clicked, before, expected }) => {
      const { user } = await render(<App />);

      for (const id of clicked) {
        // eslint-disable-next-line no-await-in-loop
        await user.click(screen.getByTestId(id));
      }
      expect(getCheckedValues(leaves)).toEqual(before);

      for (const checkedLeaves of expected) {
        // eslint-disable-next-line no-await-in-loop
        await user.click(screen.getByTestId('outer-parent'));
        expect(getCheckedValues(leaves)).toEqual(checkedLeaves);
      }
    });
  });
});
