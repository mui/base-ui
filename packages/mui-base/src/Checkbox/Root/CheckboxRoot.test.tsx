import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, act, fireEvent } from '@mui/internal-test-utils';
import * as Checkbox from '@base_ui/react/Checkbox';
import { describeConformance } from '../../../test/describeConformance';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

describe('<Checkbox.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Checkbox.Root />, () => ({
    inheritComponent: 'button',
    refInstanceof: window.HTMLButtonElement,
    render,
  }));

  describe('extra props', () => {
    it('can override the built-in attributes', () => {
      const { container } = render(<Checkbox.Root data-state="checked" role="switch" />);
      expect(container.firstElementChild as HTMLElement).to.have.attribute('role', 'switch');
    });
  });

  it('should change its state when clicked', () => {
    const { getAllByRole, container } = render(<Checkbox.Root />);
    const [checkbox] = getAllByRole('checkbox');
    const input = container.querySelector('input[type=checkbox]') as HTMLInputElement;

    expect(checkbox).to.have.attribute('aria-checked', 'false');
    expect(input.checked).to.equal(false);

    act(() => {
      checkbox.click();
    });

    expect(checkbox).to.have.attribute('aria-checked', 'true');
    expect(input.checked).to.equal(true);

    act(() => {
      checkbox.click();
    });

    expect(checkbox).to.have.attribute('aria-checked', 'false');
    expect(input.checked).to.equal(false);
  });

  it('should update its state when changed from outside', () => {
    function Test() {
      const [checked, setChecked] = React.useState(false);
      return (
        <div>
          <button onClick={() => setChecked((c) => !c)}>Toggle</button>
          <Checkbox.Root checked={checked} />;
        </div>
      );
    }

    const { getAllByRole, getByText } = render(<Test />);
    const [checkbox] = getAllByRole('checkbox');
    const button = getByText('Toggle');

    expect(checkbox).to.have.attribute('aria-checked', 'false');
    act(() => {
      button.click();
    });

    expect(checkbox).to.have.attribute('aria-checked', 'true');

    act(() => {
      button.click();
    });

    expect(checkbox).to.have.attribute('aria-checked', 'false');
  });

  it('should call onChange when clicked', () => {
    const handleChange = spy();
    const { getAllByRole, container } = render(<Checkbox.Root onChange={handleChange} />);
    const [checkbox] = getAllByRole('checkbox');
    const input = container.querySelector('input[type=checkbox]') as HTMLInputElement;

    act(() => {
      checkbox.click();
    });

    expect(handleChange.callCount).to.equal(1);
    expect(handleChange.firstCall.args[0].target).to.equal(input);
  });

  describe('prop: disabled', () => {
    it('should have the `aria-disabled` attribute', () => {
      const { getAllByRole } = render(<Checkbox.Root disabled />);
      expect(getAllByRole('checkbox')[0]).to.have.attribute('aria-disabled', 'true');
    });

    it('should not have the aria attribute when `disabled` is not set', () => {
      const { getAllByRole } = render(<Checkbox.Root />);
      expect(getAllByRole('checkbox')[0]).not.to.have.attribute('aria-disabled');
    });

    it('should not change its state when clicked', () => {
      const { getAllByRole } = render(<Checkbox.Root disabled />);
      const [checkbox] = getAllByRole('checkbox');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      act(() => {
        checkbox.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: readOnly', () => {
    it('should have the `aria-readonly` attribute', () => {
      const { getAllByRole } = render(<Checkbox.Root readOnly />);
      expect(getAllByRole('checkbox')[0]).to.have.attribute('aria-readonly', 'true');
    });

    it('should not have the aria attribute when `readOnly` is not set', () => {
      const { getAllByRole } = render(<Checkbox.Root />);
      expect(getAllByRole('checkbox')[0]).not.to.have.attribute('aria-readonly');
    });

    it('should not change its state when clicked', () => {
      const { getAllByRole } = render(<Checkbox.Root readOnly />);
      const [checkbox] = getAllByRole('checkbox');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      act(() => {
        checkbox.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: indeterminate', () => {
    it('should set the `aria-checked` attribute as "mixed"', () => {
      const { getAllByRole } = render(<Checkbox.Root indeterminate />);
      expect(getAllByRole('checkbox')[0]).to.have.attribute('aria-checked', 'mixed');
    });

    it('should not change its state when clicked', () => {
      const { getAllByRole } = render(<Checkbox.Root indeterminate />);
      const [checkbox] = getAllByRole('checkbox');

      expect(checkbox).to.have.attribute('aria-checked', 'mixed');

      act(() => {
        checkbox.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'mixed');
    });

    it('should not set the `data-indeterminate` attribute', () => {
      const { getAllByRole } = render(<Checkbox.Root indeterminate />);
      expect(getAllByRole('checkbox')[0]).to.not.have.attribute('data-indeterminate', 'true');
    });

    it('should not have the aria attribute when `indeterminate` is not set', () => {
      const { getAllByRole } = render(<Checkbox.Root />);
      expect(getAllByRole('checkbox')[0]).not.to.have.attribute('aria-checked', 'mixed');
    });

    it('should not be overridden by `checked` prop', () => {
      const { getAllByRole } = render(<Checkbox.Root indeterminate checked />);
      expect(getAllByRole('checkbox')[0]).to.have.attribute('aria-checked', 'mixed');
    });
  });

  it('should update its state if the underlying input is toggled', () => {
    const { getAllByRole, container } = render(<Checkbox.Root />);
    const [checkbox] = getAllByRole('checkbox');
    const input = container.querySelector('input[type=checkbox]') as HTMLInputElement;

    act(() => {
      input.click();
    });

    expect(checkbox).to.have.attribute('aria-checked', 'true');
  });

  it('should place the style hooks on the root and the indicator', () => {
    const { getAllByRole } = render(
      <Checkbox.Root defaultChecked disabled readOnly required>
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );

    const [checkbox] = getAllByRole('checkbox');
    const indicator = checkbox.querySelector('span');

    expect(checkbox).to.have.attribute('data-state', 'checked');
    expect(checkbox).to.have.attribute('data-disabled', 'true');
    expect(checkbox).to.have.attribute('data-readonly', 'true');
    expect(checkbox).to.have.attribute('data-required', 'true');

    expect(indicator).to.have.attribute('data-state', 'checked');
    expect(indicator).to.have.attribute('data-disabled', 'true');
    expect(indicator).to.have.attribute('data-readonly', 'true');
    expect(indicator).to.have.attribute('data-required', 'true');
  });

  it('should set the name attribute on the input', () => {
    const { container } = render(<Checkbox.Root name="checkbox-name" />);
    const input = container.querySelector('input[type="checkbox"]')! as HTMLInputElement;

    expect(input).to.have.attribute('name', 'checkbox-name');
  });

  describe('form handling', () => {
    it('should toggle the checkbox when a parent label is clicked', function test() {
      // Clicking the label causes unrelated browser tests to fail.
      if (!isJSDOM) {
        this.skip();
      }

      const { getByTestId, getAllByRole } = render(
        <label data-testid="label">
          <Checkbox.Root />
          Toggle
        </label>,
      );

      const [checkbox] = getAllByRole('checkbox');
      const label = getByTestId('label');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      act(() => {
        label.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'true');
    });

    it('should toggle the checkbox when a linked label is clicked', function test() {
      // Clicking the label causes unrelated browser tests to fail.
      if (!isJSDOM) {
        this.skip();
      }

      const { getByTestId, getAllByRole } = render(
        <div>
          <label htmlFor="test-checkbox" data-testid="label">
            Toggle
          </label>
          <Checkbox.Root id="test-checkbox" />
        </div>,
      );

      const [checkbox] = getAllByRole('checkbox');
      const label = getByTestId('label');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      act(() => {
        label.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'true');
    });
  });

  it('should include the checkbox value in the form submission', function test() {
    if (isJSDOM) {
      // FormData is not available in JSDOM
      this.skip();
    }

    let stringifiedFormData = '';

    const { getAllByRole, getByRole } = render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          stringifiedFormData = new URLSearchParams(formData as any).toString();
        }}
      >
        <Checkbox.Root name="test-checkbox" />
        <button type="submit">Submit</button>
      </form>,
    );

    const [checkbox] = getAllByRole('checkbox');
    const submitButton = getByRole('button')!;

    submitButton.click();

    expect(stringifiedFormData).to.equal('test-checkbox=off');

    act(() => {
      checkbox.click();
    });

    submitButton.click();

    expect(stringifiedFormData).to.equal('test-checkbox=on');
  });

  it('should change state when clicking the checkbox if it has a wrapping label', () => {
    const { getAllByRole } = render(
      <label data-testid="label">
        <Checkbox.Root />
        Toggle
      </label>,
    );

    const [checkbox] = getAllByRole('checkbox');

    expect(checkbox).to.have.attribute('aria-checked', 'false');

    fireEvent.click(checkbox);

    expect(checkbox).to.have.attribute('aria-checked', 'true');
  });
});
