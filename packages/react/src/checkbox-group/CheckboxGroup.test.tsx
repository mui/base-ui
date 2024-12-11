import * as React from 'react';
import { createRenderer, screen, fireEvent } from '@mui/internal-test-utils';
import { CheckboxGroup } from '@base-ui-components/react/checkbox-group';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { spy } from 'sinon';
import { expect } from 'chai';
import { describeConformance } from '#test-utils';

describe('<CheckboxGroup />', () => {
  const { render } = createRenderer();

  describeConformance(<CheckboxGroup />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('prop: value', () => {
    it('should control the value', () => {
      function App() {
        const [value, setValue] = React.useState(['red']);
        return (
          <CheckboxGroup value={value} onValueChange={setValue}>
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        );
      }

      render(<App />);

      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'false');
      expect(blue).to.have.attribute('aria-checked', 'false');

      fireEvent.click(green);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'true');
      expect(blue).to.have.attribute('aria-checked', 'false');

      fireEvent.click(blue);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'true');
      expect(blue).to.have.attribute('aria-checked', 'true');

      fireEvent.click(green);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'false');
      expect(blue).to.have.attribute('aria-checked', 'true');
    });
  });

  describe('prop: onValueChange', () => {
    it('should be called when the value changes', () => {
      const handleValueChange = spy();

      function App() {
        const [value, setValue] = React.useState<string[]>([]);
        return (
          <CheckboxGroup
            value={value}
            onValueChange={(nextValue) => {
              setValue(nextValue);
              handleValueChange(nextValue);
            }}
          >
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        );
      }

      render(<App />);

      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      fireEvent.click(red);

      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.firstCall.args[0]).to.deep.equal(['red']);

      fireEvent.click(green);

      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.secondCall.args[0]).to.deep.equal(['red', 'green']);

      fireEvent.click(blue);

      expect(handleValueChange.callCount).to.equal(3);
      expect(handleValueChange.thirdCall.args[0]).to.deep.equal(['red', 'green', 'blue']);
    });
  });

  describe('prop: defaultValue', () => {
    it('should set the initial value', () => {
      function App() {
        return (
          <CheckboxGroup defaultValue={['red']}>
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        );
      }

      render(<App />);

      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'false');
      expect(blue).to.have.attribute('aria-checked', 'false');

      fireEvent.click(green);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'true');
      expect(blue).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: disabled', () => {
    it('disables all checkboxes when `true`', () => {
      function App() {
        return (
          <CheckboxGroup disabled>
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        );
      }

      render(<App />);

      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      expect(red).to.have.attribute('disabled', '');
      expect(green).to.have.attribute('disabled', '');
      expect(blue).to.have.attribute('disabled', '');
    });

    it('does not disable all checkboxes when `false`', () => {
      function App() {
        return (
          <CheckboxGroup disabled={false}>
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        );
      }

      render(<App />);

      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      expect(red).not.to.have.attribute('disabled', '');
      expect(green).not.to.have.attribute('disabled', '');
      expect(blue).not.to.have.attribute('disabled', '');
    });

    it('takes precedence over individual checkboxes', () => {
      function App() {
        return (
          <CheckboxGroup disabled>
            <Checkbox.Root name="red" data-testid="red" disabled={false} />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        );
      }

      render(<App />);

      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      expect(red).to.have.attribute('disabled', '');
      expect(green).to.have.attribute('disabled', '');
      expect(blue).to.have.attribute('disabled', '');
    });
  });
});
