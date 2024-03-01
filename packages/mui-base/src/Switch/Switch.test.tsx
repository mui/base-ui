import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, act } from '@mui/internal-test-utils';
import { Switch } from '@mui/base/Switch';

describe('<Switch />', () => {
  const { render } = createRenderer();

  // TODO: move to the conformance test suite

  describe('prop: className', () => {
    it('should apply the className when passed as a string', () => {
      const { container } = render(<Switch className="test-class" />);
      expect(container.firstElementChild?.className).to.contain('test-class');
    });
  });

  describe('extra props', () => {
    it('should spread extra props', () => {
      const { container } = render(<Switch data-extra-prop="Lorem ipsum" />);
      expect(container.firstElementChild as HTMLElement).to.have.attribute(
        'data-extra-prop',
        'Lorem ipsum',
      );
    });

    it('should not override the built-in attributes', () => {
      const { container } = render(<Switch data-state="checked" role="checkbox" />);
      expect(container.firstElementChild as HTMLElement).to.have.attribute('role', 'switch');
    });
  });

  describe('prop: render', () => {
    const Wrapper = React.forwardRef<HTMLButtonElement, { children?: React.ReactNode }>(
      function Wrapper(props, forwardedRef) {
        return (
          <div data-testid="wrapper">
            <button ref={forwardedRef} {...props} />
          </div>
        );
      },
    );

    it('should render the custom component', () => {
      const { container, getByTestId } = render(
        <Switch render={(props) => <Wrapper {...props} />} data-testid="wrapped" />,
      );

      expect(container.firstElementChild).to.equal(getByTestId('wrapper'));
    });

    it('should pass the ref to the custom component', () => {
      let instanceFromRef = null;

      function Test() {
        return (
          <Switch
            ref={(el) => {
              instanceFromRef = el;
            }}
            render={(props) => <Wrapper {...props} />}
            data-testid="wrapped"
          />
        );
      }

      render(<Test />);
      expect(instanceFromRef!.tagName).to.equal('BUTTON');
      expect(instanceFromRef!).to.have.attribute('data-testid', 'wrapped');
    });
  });

  it('should change its state when clicked', () => {
    const { getByRole } = render(<Switch />);
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
          <Switch checked={checked} />;
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

  it('should call onChange when clicked', () => {
    const handleChange = spy();
    const { getByRole, container } = render(<Switch onChange={handleChange} />);
    const switchElement = getByRole('switch');
    const internalInput = container.querySelector('input[type="checkbox"]')!;

    act(() => {
      switchElement.click();
    });

    expect(handleChange.callCount).to.equal(1);
    expect(handleChange.firstCall.args[0].target).to.equal(internalInput);
  });

  describe('prop: disabled', () => {
    it('should have the `aria-disabled` attribute', () => {
      const { getByRole } = render(<Switch disabled />);
      expect(getByRole('switch')).to.have.attribute('aria-disabled', 'true');
    });

    it('should not have the aria attribute when `disabled` is not set', () => {
      const { getByRole } = render(<Switch />);
      expect(getByRole('switch')).not.to.have.attribute('aria-disabled');
    });

    it('should not change its state when clicked', () => {
      const { getByRole } = render(<Switch disabled />);
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
      const { getByRole } = render(<Switch readOnly />);
      expect(getByRole('switch')).to.have.attribute('aria-readonly', 'true');
    });

    it('should not have the aria attribute when `readOnly` is not set', () => {
      const { getByRole } = render(<Switch />);
      expect(getByRole('switch')).not.to.have.attribute('aria-readonly');
    });

    it('should not change its state when clicked', () => {
      const { getByRole } = render(<Switch readOnly />);
      const switchElement = getByRole('switch');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      act(() => {
        switchElement.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'false');
    });
  });

  it('should update its state if the underlying input is toggled', () => {
    const { getByRole, container } = render(<Switch />);
    const switchElement = getByRole('switch');
    const internalInput = container.querySelector('input[type="checkbox"]')! as HTMLInputElement;

    act(() => {
      internalInput.click();
    });

    expect(switchElement).to.have.attribute('aria-checked', 'true');
  });

  it('should place the style hooks on the root and the thumb', () => {
    const { getByRole } = render(
      <Switch defaultChecked disabled readOnly required>
        <Switch.Thumb />
      </Switch>,
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
    const { container } = render(<Switch name="switch-name" />);
    const internalInput = container.querySelector('input[type="checkbox"]')! as HTMLInputElement;

    expect(internalInput).to.have.attribute('name', 'switch-name');
  });

  describe('form handling', () => {
    it('should toggle the switch when a parent label is clicked', () => {
      const { getByTestId, getByRole } = render(
        <label data-testid="label">
          <Switch />
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

    it('should toggle the switch when a linked label is clicked', () => {
      const { getByTestId, getByRole } = render(
        <div>
          <label htmlFor="test-switch" data-testid="label">
            Toggle
          </label>
          <Switch id="test-switch" />
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
        <Switch name="test-switch" />
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
