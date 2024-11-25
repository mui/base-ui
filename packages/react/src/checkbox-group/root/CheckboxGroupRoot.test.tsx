import * as React from 'react';
import { expect } from 'chai';
import { createRenderer, screen, fireEvent } from '@mui/internal-test-utils';
import { CheckboxGroup } from '@base-ui-components/react/checkbox-group';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { describeConformance } from '../../../test/describeConformance';

describe('<CheckboxGroup.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<CheckboxGroup.Root />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('prop: preserveChildStates', () => {
    it('should not preserve child states when false', () => {
      function App() {
        const [value, setValue] = React.useState<string[]>([]);
        return (
          <CheckboxGroup.Root
            allValues={['red', 'green', 'blue']}
            value={value}
            onValueChange={setValue}
            preserveChildStates={false}
          >
            <Checkbox.Root parent data-testid="parent" />
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup.Root>
        );
      }

      render(<App />);

      const parent = screen.getByTestId('parent');
      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      expect(red).to.have.attribute('aria-checked', 'false');
      expect(green).to.have.attribute('aria-checked', 'false');
      expect(blue).to.have.attribute('aria-checked', 'false');

      fireEvent.click(red);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'false');
      expect(blue).to.have.attribute('aria-checked', 'false');
      expect(parent).to.have.attribute('aria-checked', 'mixed');

      fireEvent.click(parent);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'true');
      expect(blue).to.have.attribute('aria-checked', 'true');
      expect(parent).to.have.attribute('aria-checked', 'true');

      fireEvent.click(parent);

      expect(red).to.have.attribute('aria-checked', 'false');
      expect(green).to.have.attribute('aria-checked', 'false');
      expect(blue).to.have.attribute('aria-checked', 'false');
      expect(parent).to.have.attribute('aria-checked', 'false');

      fireEvent.click(parent);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'true');
      expect(blue).to.have.attribute('aria-checked', 'true');
      expect(parent).to.have.attribute('aria-checked', 'true');
    });

    it('should preserve child states when true', () => {
      function App() {
        const [value, setValue] = React.useState<string[]>([]);
        return (
          <CheckboxGroup.Root
            allValues={['red', 'green', 'blue']}
            value={value}
            onValueChange={setValue}
            preserveChildStates
          >
            <Checkbox.Root parent data-testid="parent" />
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup.Root>
        );
      }

      render(<App />);

      const parent = screen.getByTestId('parent');
      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      expect(red).to.have.attribute('aria-checked', 'false');
      expect(green).to.have.attribute('aria-checked', 'false');
      expect(blue).to.have.attribute('aria-checked', 'false');

      fireEvent.click(red);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'false');
      expect(blue).to.have.attribute('aria-checked', 'false');
      expect(parent).to.have.attribute('aria-checked', 'mixed');

      fireEvent.click(parent);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'true');
      expect(blue).to.have.attribute('aria-checked', 'true');
      expect(parent).to.have.attribute('aria-checked', 'true');

      fireEvent.click(parent);

      expect(red).to.have.attribute('aria-checked', 'false');
      expect(green).to.have.attribute('aria-checked', 'false');
      expect(blue).to.have.attribute('aria-checked', 'false');
      expect(parent).to.have.attribute('aria-checked', 'false');

      fireEvent.click(parent);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'false');
      expect(blue).to.have.attribute('aria-checked', 'false');
      expect(parent).to.have.attribute('aria-checked', 'mixed');
    });
  });
});
