import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, act } from '@mui/internal-test-utils';
import * as Switch from '@base_ui/react/Switch';
import { describeConformance } from '../../../test/describeConformance';

describe('<Switch.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Switch.Root />, () => ({
    inheritComponent: 'button',
    refInstanceof: window.HTMLButtonElement,
    render,
  }));

  describe('interaction', () => {
    it('should change its state when clicked', () => {
      const { getByRole } = render(<Switch.Root />);
      const switchElement = getByRole('switch');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      act(() => {
        switchElement.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });

    it('should update its state when changed from outside', () => {
      function Test() {
        const [checked, setChecked] = React.useState(false);
        return (
          <div>
            <button onClick={() => setChecked((c) => !c)}>Toggle</button>
            <Switch.Root checked={checked} />;
          </div>
        );
      }

      const { getByRole, getByText } = render(<Test />);
      const switchElement = getByRole('switch');
      const button = getByText('Toggle');

      expect(switchElement).to.have.attribute('aria-checked', 'false');
      act(() => {
        button.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'true');

      act(() => {
        button.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'false');
    });

    it('should update its state if the underlying input is toggled', () => {
      const { getByRole, container } = render(<Switch.Root />);
      const switchElement = getByRole('switch');
      const internalInput = container.querySelector('input[type="checkbox"]')! as HTMLInputElement;

      act(() => {
        internalInput.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });
  });

  describe('extra props', () => {
    it('should override the built-in attributes', () => {
      const { container } = render(<Switch.Root data-state="checked" role="checkbox" />);
      expect(container.firstElementChild as HTMLElement).to.have.attribute('role', 'checkbox');
      expect(container.firstElementChild as HTMLElement).to.have.attribute('data-state', 'checked');
    });
  });

  describe('prop: onChange', () => {
    it('should call onChange when clicked', () => {
      const handleChange = spy();
      const { getByRole } = render(<Switch.Root onCheckedChange={handleChange} />);
      const switchElement = getByRole('switch');

      act(() => {
        switchElement.click();
      });

      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.args[0]).to.equal(true);
    });
  });

  describe('prop: onClick', () => {
    it('should call onClick when clicked', () => {
      const handleClick = spy();
      const { getByRole } = render(<Switch.Root onClick={handleClick} />);
      const switchElement = getByRole('switch');

      act(() => {
        switchElement.click();
      });

      expect(handleClick.callCount).to.equal(1);
    });
  });

  describe('prop: disabled', () => {
    it('should have the `aria-disabled` attribute', () => {
      const { getByRole } = render(<Switch.Root disabled />);
      expect(getByRole('switch')).to.have.attribute('aria-disabled', 'true');
    });

    it('should not have the aria attribute when `disabled` is not set', () => {
      const { getByRole } = render(<Switch.Root />);
      expect(getByRole('switch')).not.to.have.attribute('aria-disabled');
    });

    it('should not change its state when clicked', () => {
      const { getByRole } = render(<Switch.Root disabled />);
      const switchElement = getByRole('switch');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      act(() => {
        switchElement.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: readOnly', () => {
    it('should have the `aria-readonly` attribute', () => {
      const { getByRole } = render(<Switch.Root readOnly />);
      expect(getByRole('switch')).to.have.attribute('aria-readonly', 'true');
    });

    it('should not have the aria attribute when `readOnly` is not set', () => {
      const { getByRole } = render(<Switch.Root />);
      expect(getByRole('switch')).not.to.have.attribute('aria-readonly');
    });

    it('should not change its state when clicked', () => {
      const { getByRole } = render(<Switch.Root readOnly />);
      const switchElement = getByRole('switch');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      act(() => {
        switchElement.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: inputRef', () => {
    it('should be able to access the native input', () => {
      const inputRef = React.createRef<HTMLInputElement>();
      const { container } = render(<Switch.Root inputRef={inputRef} />);
      const internalInput = container.querySelector('input[type="checkbox"]')!;

      expect(inputRef.current).to.equal(internalInput);
    });
  });

  describe('form handling', () => {
    // TODO: when a label is clicked, mocha throws an error in unrelated tests. Uncomment when fixed or another test runner is used.
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('should toggle the switch when a parent label is clicked', () => {
      const { getByTestId, getByRole } = render(
        <label data-testid="label">
          <Switch.Root />
          Toggle
        </label>,
      );

      const switchElement = getByRole('switch');
      const label = getByTestId('label');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      act(() => {
        label.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });

    // TODO: when a label is clicked, mocha throws an error in unrelated tests. Uncomment when fixed or another test runner is used.
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('should toggle the switch when a linked label is clicked', () => {
      const { getByTestId, getByRole } = render(
        <div>
          <label htmlFor="test-switch" data-testid="label">
            Toggle
          </label>
          <Switch.Root id="test-switch" />
        </div>,
      );

      const switchElement = getByRole('switch');
      const label = getByTestId('label');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      act(() => {
        label.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });

    it('should include the switch value in the form submission', function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // FormData is not available in JSDOM
        this.skip();
      }

      let stringifiedFormData = '';

      const { getByRole } = render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            stringifiedFormData = new URLSearchParams(formData as any).toString();
          }}
        >
          <Switch.Root name="test-switch" />
          <button type="submit">Submit</button>
        </form>,
      );

      const switchElement = getByRole('switch');
      const submitButton = getByRole('button')!;

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-switch=off');

      act(() => {
        switchElement.click();
      });

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-switch=on');
    });
  });

  it('should place the style hooks on the root and the thumb', () => {
    const { getByRole } = render(
      <Switch.Root defaultChecked disabled readOnly required>
        <Switch.Thumb />
      </Switch.Root>,
    );

    const switchElement = getByRole('switch');
    const thumb = switchElement.querySelector('span');

    expect(switchElement).to.have.attribute('data-state', 'checked');
    expect(switchElement).to.have.attribute('data-disabled', 'true');
    expect(switchElement).to.have.attribute('data-readonly', 'true');
    expect(switchElement).to.have.attribute('data-required', 'true');

    expect(thumb).to.have.attribute('data-state', 'checked');
    expect(thumb).to.have.attribute('data-disabled', 'true');
    expect(thumb).to.have.attribute('data-readonly', 'true');
    expect(thumb).to.have.attribute('data-required', 'true');
  });

  it('should set the name attribute on the input', () => {
    const { container } = render(<Switch.Root name="switch-name" />);
    const internalInput = container.querySelector('input[type="checkbox"]')! as HTMLInputElement;

    expect(internalInput).to.have.attribute('name', 'switch-name');
  });
});
