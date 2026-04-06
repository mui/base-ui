import { expect, vi } from 'vitest';
import * as React from 'react';
import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
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
      .filter((v) => v.getAttribute('value') && v.tagName === 'BUTTON');
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
      .filter((v) => v.getAttribute('data-parent') == null && v.tagName === 'BUTTON');
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
});
