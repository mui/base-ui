import { expect, vi } from 'vitest';
import * as React from 'react';
import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Checkbox } from '@base-ui/react/checkbox';

describe('useCheckboxGroupParent', () => {
  const { render } = createRenderer();
  const allValues = ['a', 'b', 'c'];

  it('should control child checkboxes', () => {
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

    render(<App />);

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

  it('parent should be marked as mixed if some children are checked', () => {
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

    render(<App />);

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

  it('updates uncontrolled parent-enabled groups from child clicks without duplicate callbacks', () => {
    const handleValueChange = vi.fn();

    render(
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

  it('should correctly initialize the values array', () => {
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

    render(<App />);

    expect(screen.getByTestId('parent')).toHaveAttribute('aria-checked', 'mixed');

    expect(screen.getByTestId('checkboxA')).toHaveAttribute('aria-checked', 'true');
  });

  it('should update the values array when a child checkbox is clicked', () => {
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

    render(<App />);

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

  it('should apply space-separated aria-controls attribute with child names', () => {
    function App() {
      const [value, setValue] = React.useState<string[]>([]);
      return (
        <CheckboxGroup value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root value="a" />
          <Checkbox.Root value="b" />
          <Checkbox.Root value="c" />
        </CheckboxGroup>
      );
    }

    render(<App />);

    const parent = screen.getByTestId('parent');
    const id = parent.getAttribute('id');

    expect(parent).toHaveAttribute('aria-controls', allValues.map((v) => `${id}-${v}`).join(' '));
  });

  it('does not select a child without an identifying value', () => {
    render(
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

  it('preserves initial state if mixed when parent is clicked', () => {
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

    render(<App />);

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
      if (checkbox !== checkboxA) {
        expect(checkbox).toHaveAttribute('aria-checked', 'false');
      }
    });
  });

  it('lets a parent checkbox cancel a parent-enabled group change', () => {
    const handleValueChange = vi.fn();
    const handleParentChange = vi.fn((_, eventDetails: Checkbox.Root.ChangeEventDetails) => {
      eventDetails.cancel();
    });

    render(
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

  it('lets a child checkbox cancel a parent-enabled group change', () => {
    const handleValueChange = vi.fn();
    const handleChildChange = vi.fn((_, eventDetails: Checkbox.Root.ChangeEventDetails) => {
      eventDetails.cancel();
    });

    render(
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

  it('does not advance the parent toggle cycle when the group cancels a parent change', () => {
    const handleValueChange = vi.fn((_, eventDetails: CheckboxGroup.ChangeEventDetails) => {
      eventDetails.cancel();
    });

    render(
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

  it('does not pollute the parent snapshot when the group cancels a child change', () => {
    const handleValueChange = vi.fn((_, eventDetails: CheckboxGroup.ChangeEventDetails) => {
      eventDetails.cancel();
    });

    render(
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

  it('handles unchecked disabled checkboxes', () => {
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

    render(<App />);

    const parent = screen.getByTestId('parent');
    fireEvent.click(parent);

    expect(parent).toHaveAttribute('aria-checked', 'mixed');
    expect(screen.getByTestId('checkboxA')).toHaveAttribute('aria-checked', 'false');
  });

  it('handles checked disabled checkboxes', () => {
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

    render(<App />);

    const checkboxA = screen.getByTestId('checkboxA');
    const checkboxB = screen.getByTestId('checkboxB');
    const parent = screen.getByTestId('parent');

    fireEvent.click(parent);
    expect(checkboxA).toHaveAttribute('aria-checked', 'true');
    expect(checkboxB).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(parent);
    expect(checkboxA).toHaveAttribute('aria-checked', 'true');
    expect(checkboxB).toHaveAttribute('aria-checked', 'false');
  });

  describe('child disabled state registration', () => {
    it('reads fresh disabled state when the parent is clicked right after the change commits', () => {
      function App() {
        const [disabled, setDisabled] = React.useState(false);
        const parentRef = React.useRef<HTMLElement>(null);

        useIsoLayoutEffect(() => {
          if (disabled) {
            parentRef.current?.click();
          }
        }, [disabled]);

        return (
          <div>
            <CheckboxGroup defaultValue={[]} allValues={allValues}>
              <Checkbox.Root parent data-testid="parent" ref={parentRef} />
              <Checkbox.Root value="a" disabled={disabled} data-testid="checkboxA" />
              <Checkbox.Root value="b" />
              <Checkbox.Root value="c" />
            </CheckboxGroup>
            <button onClick={() => setDisabled(true)}>Disable</button>
          </div>
        );
      }

      render(<App />);

      fireEvent.click(screen.getByText('Disable'));

      expect(screen.getByTestId('checkboxA')).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByTestId('parent')).toHaveAttribute('aria-checked', 'mixed');
    });

    it('keeps a replacement child registration when the replaced child unmounts later', () => {
      function App() {
        const [phase, setPhase] = React.useState(0);
        return (
          <div>
            <CheckboxGroup defaultValue={[]} allValues={allValues}>
              <Checkbox.Root parent data-testid="parent" />
              {phase < 2 && <Checkbox.Root key="old" value="a" />}
              {phase >= 1 && <Checkbox.Root key="new" value="a" disabled data-testid="new-a" />}
              <Checkbox.Root value="b" />
              <Checkbox.Root value="c" />
            </CheckboxGroup>
            <button onClick={() => setPhase((prev) => prev + 1)}>Advance</button>
          </div>
        );
      }

      render(<App />);

      const advance = screen.getByText('Advance');
      // Mount the disabled replacement alongside the old child, then unmount
      // the old child in a later commit so its cleanup runs after the
      // replacement registered.
      fireEvent.click(advance);
      fireEvent.click(advance);

      const parent = screen.getByTestId('parent');
      fireEvent.click(parent);

      expect(screen.getByTestId('new-a')).toHaveAttribute('aria-checked', 'false');
      expect(parent).toHaveAttribute('aria-checked', 'mixed');
    });

    it('tracks a child that is re-enabled after being disabled', () => {
      function App() {
        const [disabled, setDisabled] = React.useState(true);
        return (
          <div>
            <CheckboxGroup defaultValue={[]} allValues={allValues}>
              <Checkbox.Root parent data-testid="parent" />
              <Checkbox.Root value="a" disabled={disabled} data-testid="checkboxA" />
              <Checkbox.Root value="b" />
              <Checkbox.Root value="c" />
            </CheckboxGroup>
            <button onClick={() => setDisabled(false)}>Enable</button>
          </div>
        );
      }

      render(<App />);

      const parent = screen.getByTestId('parent');

      fireEvent.click(parent);
      expect(screen.getByTestId('checkboxA')).toHaveAttribute('aria-checked', 'false');
      expect(parent).toHaveAttribute('aria-checked', 'mixed');

      fireEvent.click(screen.getByText('Enable'));
      fireEvent.click(parent);

      expect(screen.getByTestId('checkboxA')).toHaveAttribute('aria-checked', 'true');
      expect(parent).toHaveAttribute('aria-checked', 'true');
    });

    it('moves the registration when a child value changes', () => {
      function App() {
        const [checkboxValue, setCheckboxValue] = React.useState('a');
        return (
          <div>
            <CheckboxGroup defaultValue={[]} allValues={allValues}>
              <Checkbox.Root parent data-testid="parent" />
              <Checkbox.Root value={checkboxValue} disabled data-testid="movable" />
              <Checkbox.Root value="b" data-testid="b" />
            </CheckboxGroup>
            <button onClick={() => setCheckboxValue('c')}>Move</button>
          </div>
        );
      }

      render(<App />);

      fireEvent.click(screen.getByText('Move'));

      const parent = screen.getByTestId('parent');
      fireEvent.click(parent);

      // "a" no longer has a disabled registration, while "c" does.
      expect(screen.getByTestId('movable')).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByTestId('b')).toHaveAttribute('aria-checked', 'true');
      expect(parent).toHaveAttribute('aria-checked', 'mixed');
    });

    it('clears the registration on unmount and restores it on remount', () => {
      function App() {
        const [value, setValue] = React.useState<string[]>([]);
        const [mounted, setMounted] = React.useState(true);
        return (
          <div>
            <CheckboxGroup value={value} onValueChange={setValue} allValues={allValues}>
              <Checkbox.Root parent data-testid="parent" />
              {mounted && <Checkbox.Root value="a" disabled data-testid="checkboxA" />}
              <Checkbox.Root value="b" />
              <Checkbox.Root value="c" />
            </CheckboxGroup>
            <button onClick={() => setMounted((prev) => !prev)}>Toggle</button>
            <button onClick={() => setValue([])}>Reset</button>
          </div>
        );
      }

      render(<App />);

      const parent = screen.getByTestId('parent');
      const toggle = screen.getByText('Toggle');

      fireEvent.click(toggle);
      fireEvent.click(parent);

      // The unmounted child no longer registers as disabled.
      expect(parent).toHaveAttribute('aria-checked', 'true');

      fireEvent.click(screen.getByText('Reset'));
      fireEvent.click(toggle);
      fireEvent.click(parent);

      // The remounted child registers as disabled again.
      expect(screen.getByTestId('checkboxA')).toHaveAttribute('aria-checked', 'false');
      expect(parent).toHaveAttribute('aria-checked', 'mixed');
    });
  });
});
