import * as React from 'react';
import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { CheckboxGroup } from '@base-ui-components/react/checkbox-group';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { expect } from 'chai';

describe('useCheckboxGroupParent', () => {
  const { render } = createRenderer();
  const allValues = ['a', 'b', 'c'];

  it('should control child checkboxes', () => {
    function App() {
      const [value, setValue] = React.useState<string[]>([]);
      return (
        <CheckboxGroup.Root value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root name="a" />
          <Checkbox.Root name="b" />
          <Checkbox.Root name="c" />
        </CheckboxGroup.Root>
      );
    }

    render(<App />);

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((v) => v.getAttribute('name') && v.tagName === 'BUTTON');
    const parent = screen.getByTestId('parent');

    checkboxes.forEach((checkbox) => {
      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });

    fireEvent.click(parent);
    expect(parent).to.have.attribute('aria-checked', 'true');

    checkboxes.forEach((checkbox) => {
      expect(checkbox).to.have.attribute('aria-checked', 'true');
    });

    fireEvent.click(parent);
    expect(parent).to.have.attribute('aria-checked', 'false');

    checkboxes.forEach((checkbox) => {
      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });
  });

  it('parent should be marked as mixed if some children are checked', () => {
    function App() {
      const [value, setValue] = React.useState<string[]>([]);
      return (
        <CheckboxGroup.Root value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root name="a" />
          <Checkbox.Root name="b" />
          <Checkbox.Root name="c" />
        </CheckboxGroup.Root>
      );
    }

    render(<App />);

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((v) => v.getAttribute('name') && v.tagName === 'BUTTON');

    checkboxes.forEach((checkbox) => {
      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });

    fireEvent.click(checkboxes[0]);

    expect(screen.getByTestId('parent')).to.have.attribute('aria-checked', 'mixed');
  });

  it('should correctly initialize the values array', () => {
    function App() {
      const [value, setValue] = React.useState<string[]>(['a']);
      return (
        <CheckboxGroup.Root value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root name="a" />
          <Checkbox.Root name="b" />
          <Checkbox.Root name="c" />
        </CheckboxGroup.Root>
      );
    }

    render(<App />);

    expect(screen.getByTestId('parent')).to.have.attribute('aria-checked', 'mixed');

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((v) => v.getAttribute('name') && v.tagName === 'BUTTON');
    const checkboxA = checkboxes.find((v) => v.getAttribute('name') === 'a');

    expect(checkboxA).to.have.attribute('aria-checked', 'true');
  });

  it('should update the values array when a child checkbox is clicked', () => {
    function App() {
      const [value, setValue] = React.useState<string[]>(['a']);
      return (
        <CheckboxGroup.Root value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root name="a" />
          <Checkbox.Root name="b" />
          <Checkbox.Root name="c" />
        </CheckboxGroup.Root>
      );
    }

    render(<App />);

    expect(screen.getByTestId('parent')).to.have.attribute('aria-checked', 'mixed');

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((v) => v.getAttribute('name') && v.tagName === 'BUTTON');
    const checkboxA = checkboxes.find((v) => v.getAttribute('name') === 'a');

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
        <CheckboxGroup.Root value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root name="a" />
          <Checkbox.Root name="b" />
          <Checkbox.Root name="c" />
        </CheckboxGroup.Root>
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
        <CheckboxGroup.Root value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root name="a" />
          <Checkbox.Root name="b" />
          <Checkbox.Root name="c" />
        </CheckboxGroup.Root>
      );
    }

    render(<App />);

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((v) => v.getAttribute('name') && v.tagName === 'BUTTON');
    const checkboxA = checkboxes.find((v) => v.getAttribute('name') === 'a')!;
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
        <CheckboxGroup.Root value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root name="a" disabled />
          <Checkbox.Root name="b" />
          <Checkbox.Root name="c" />
        </CheckboxGroup.Root>
      );
    }

    render(<App />);

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((v) => v.getAttribute('name') && v.tagName === 'BUTTON');
    const checkboxA = checkboxes.find((v) => v.getAttribute('name') === 'a')!;
    const parent = screen.getByTestId('parent');

    fireEvent.click(parent);

    expect(parent).to.have.attribute('aria-checked', 'mixed');
    expect(checkboxA).to.have.attribute('aria-checked', 'false');
  });

  it('handles checked disabled checkboxes', () => {
    function App() {
      const [value, setValue] = React.useState<string[]>(['a']);
      return (
        <CheckboxGroup.Root value={value} onValueChange={setValue} allValues={allValues}>
          <Checkbox.Root parent data-testid="parent" />
          <Checkbox.Root name="a" disabled />
          <Checkbox.Root name="b" />
          <Checkbox.Root name="c" />
        </CheckboxGroup.Root>
      );
    }

    render(<App />);

    const checkboxes = screen
      .getAllByRole('checkbox')
      .filter((v) => v.getAttribute('name') && v.tagName === 'BUTTON');
    const checkboxA = checkboxes.find((v) => v.getAttribute('name') === 'a')!;
    const checkboxB = checkboxes.find((v) => v.getAttribute('name') === 'b')!;
    const parent = screen.getByTestId('parent');

    fireEvent.click(parent);

    expect(checkboxA).to.have.attribute('aria-checked', 'true');
    expect(checkboxB).to.have.attribute('aria-checked', 'true');

    fireEvent.click(parent);

    expect(checkboxA).to.have.attribute('aria-checked', 'true');
    expect(checkboxB).to.have.attribute('aria-checked', 'false');
  });
});
