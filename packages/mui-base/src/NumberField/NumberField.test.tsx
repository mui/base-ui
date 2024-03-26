import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { fireEvent } from '@testing-library/react';
import { NumberField as NumberFieldBase, type NumberFieldProps } from '@mui/base/NumberField';
import { describeConformance } from '../../test/describeConformance';

describe('<NumberField />', () => {
  const { render } = createRenderer();

  describeConformance(<NumberFieldBase />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  function NumberField(props: NumberFieldProps) {
    return (
      <NumberFieldBase {...props}>
        <NumberFieldBase.Group>
          <NumberFieldBase.Input />
          <NumberFieldBase.Increment />
          <NumberFieldBase.Decrement />
          <NumberFieldBase.ScrubArea />
        </NumberFieldBase.Group>
      </NumberFieldBase>
    );
  }

  describe('prop: defaultValue', () => {
    it('should accept a number value', () => {
      render(<NumberField defaultValue={1} />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.value('1');
    });

    it('should accept an `undefined` value', () => {
      render(<NumberField />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.value('');
    });
  });

  describe('prop: value', () => {
    it('should accept a number value that can change over time', () => {
      const { rerender } = render(<NumberField value={1} />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.value('1');
      rerender(<NumberField value={2} />);
      expect(input).to.have.value('2');
    });

    it('should accept an `undefined` value', () => {
      render(<NumberField />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.value('');
    });

    it('should accept a `null` value', () => {
      render(<NumberField value={null} />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.value('');
    });
  });

  describe('prop: onChange', () => {
    it('should be called when the value changes', () => {
      const onChange = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(1);
        return (
          <NumberField
            value={value}
            onChange={(val) => {
              onChange(val);
              setValue(val);
            }}
          />
        );
      }
      render(<App />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '2' } });
      expect(onChange.callCount).to.equal(1);
      expect(onChange.firstCall.args[0]).to.equal(2);
    });

    it('should be called with a number when transitioning from `null`', () => {
      const onChange = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(null);
        return (
          <NumberField
            value={value}
            onChange={(val) => {
              onChange(val);
              setValue(val);
            }}
          />
        );
      }
      render(<App />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '5' } });
      expect(onChange.callCount).to.equal(1);
      expect(onChange.firstCall.args[0]).to.equal(5);
    });

    it('should be called with `null` when empty and transitioning from a number', () => {
      const onChange = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(5);
        return (
          <NumberField
            value={value}
            onChange={(val) => {
              onChange(val);
              setValue(val);
            }}
          />
        );
      }
      render(<App />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });
      expect(onChange.callCount).to.equal(1);
      expect(onChange.firstCall.args[0]).to.equal(null);
    });
  });

  describe('prop: disabled', () => {
    it('should disable the input', () => {
      render(<NumberField disabled />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.attribute('disabled');
    });
  });

  describe('prop: readOnly', () => {
    it('should mark the input as readOnly', () => {
      render(<NumberField readOnly />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.attribute('readonly');
    });
  });

  describe('prop: autoFocus', () => {
    it('should focus the input', () => {
      render(<NumberField autoFocus />);
      const input = screen.getByRole('textbox');
      expect(document.activeElement).to.equal(input);
    });
  });

  describe('prop: required', () => {
    it('should mark the input as required', () => {
      render(<NumberField required />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.attribute('required');
    });
  });

  describe('prop: invalid', () => {
    it('sets `aria-invalid` on the input', () => {
      render(<NumberField invalid />);
      const input = screen.getByRole('textbox');
      expect(input).to.have.attribute('aria-invalid', 'true');
    });
  });

  describe('prop: min', () => {
    it('prevents the raw value from going below the `min` prop', () => {
      const fn = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(5);
        return (
          <NumberField
            value={value}
            onChange={(v) => {
              fn(v);
              setValue(v);
            }}
            min={5}
          />
        );
      }

      render(<App />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '4' } });
      expect(input).to.have.value('4');
      expect(fn.firstCall.args[0]).to.equal(5);
    });

    it('allows the value to go above the `min` prop', () => {
      const fn = spy();
      function App() {
        const [value, setValue] = React.useState<number | null>(5);
        return (
          <NumberField
            value={value}
            onChange={(v) => {
              fn(v);
              setValue(v);
            }}
            min={5}
          />
        );
      }

      render(<App />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '6' } });
      expect(input).to.have.value('6');
    });
  });
});
