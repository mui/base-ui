import * as React from 'react';
import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Checkbox } from '@base-ui/react/checkbox';
import { expect } from 'chai';
import { spy } from 'sinon';

describe('useCheckboxGroupParent', () => {
  const { render } = createRenderer();
  const allValues = ['a', 'b', 'c'];

  it('should control child checkboxes', () => {
    const parentCheckedChange = spy();
    const childCheckedChange = spy();
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
      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });

    fireEvent.click(parent);
    expect(parent).to.have.attribute('aria-checked', 'true');

    checkboxes.forEach((checkbox) => {
      expect(checkbox).to.have.attribute('aria-checked', 'true');
    });

    expect(parentCheckedChange.callCount).to.equal(1);
    expect(childCheckedChange.callCount).to.equal(0);

    fireEvent.click(parent);
    expect(parent).to.have.attribute('aria-checked', 'false');

    checkboxes.forEach((checkbox) => {
      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });

    expect(parentCheckedChange.callCount).to.equal(2);
    expect(childCheckedChange.callCount).to.equal(0);
  });

  it('parent should be marked as mixed if some children are checked', () => {
    const childCheckedChange = spy();
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
      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });
    fireEvent.click(checkboxes[0]);
    expect(childCheckedChange.callCount).to.equal(1);

    expect(screen.getByTestId('parent')).to.have.attribute('aria-checked', 'mixed');
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

    expect(screen.getByTestId('parent')).to.have.attribute('aria-checked', 'mixed');

    expect(screen.getByTestId('checkboxA')).to.have.attribute('aria-checked', 'true');
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

    expect(screen.getByTestId('parent')).to.have.attribute('aria-checked', 'mixed');

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((v) => v.getAttribute('data-parent') == null);

    const checkboxA = screen.getByTestId('checkboxA');
    expect(checkboxA).to.have.attribute('aria-checked', 'true');

    checkboxes.forEach((checkbox) => {
      if (checkbox !== checkboxA) {
        fireEvent.click(checkbox);
      }
    });

    expect(screen.getByTestId('parent')).to.have.attribute('aria-checked', 'true');
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

    expect(parent).to.have.attribute('aria-controls', allValues.map((v) => `${id}-${v}`).join(' '));
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

    expect(screen.getByTestId('parent')).to.have.attribute('aria-checked', 'mixed');

    fireEvent.click(parent);

    checkboxes.forEach((checkbox) => {
      expect(checkbox).to.have.attribute('aria-checked', 'true');
    });

    fireEvent.click(parent);

    checkboxes.forEach((checkbox) => {
      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });

    fireEvent.click(parent);

    expect(parent).to.have.attribute('aria-checked', 'mixed');
    expect(checkboxA).to.have.attribute('aria-checked', 'true');
    checkboxes.forEach((checkbox) => {
      if (checkbox !== checkboxA) {
        expect(checkbox).to.have.attribute('aria-checked', 'false');
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

    expect(parent).to.have.attribute('aria-checked', 'mixed');
    expect(screen.getByTestId('checkboxA')).to.have.attribute('aria-checked', 'false');
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
    expect(checkboxA).to.have.attribute('aria-checked', 'true');
    expect(checkboxB).to.have.attribute('aria-checked', 'true');

    fireEvent.click(parent);
    expect(checkboxA).to.have.attribute('aria-checked', 'true');
    expect(checkboxB).to.have.attribute('aria-checked', 'false');
  });
});
