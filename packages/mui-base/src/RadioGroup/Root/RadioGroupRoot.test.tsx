import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, act, screen } from '@mui/internal-test-utils';
import * as RadioGroup from '@base_ui/react/RadioGroup';
import { describeConformance } from '../../../test/describeConformance';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

describe('<RadioGroup.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<RadioGroup.Root />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('extra props', () => {
    it('can override the built-in attributes', () => {
      const { container } = render(<RadioGroup.Root data-state="checked" role="switch" />);
      expect(container.firstElementChild as HTMLElement).to.have.attribute('role', 'switch');
    });
  });

  it('should call onValueChange when an item is clicked', () => {
    const handleChange = spy();
    render(
      <RadioGroup.Root onValueChange={handleChange}>
        <RadioGroup.Item value="a" data-testid="item" />
      </RadioGroup.Root>,
    );

    const item = screen.getByTestId('item');

    act(() => {
      item.click();
    });

    expect(handleChange.callCount).to.equal(1);
    expect(handleChange.firstCall.args[0]).to.equal('a');
  });

  describe('prop: disabled', () => {
    it('should have the `aria-disabled` attribute', () => {
      render(<RadioGroup.Root disabled />);
      expect(screen.getByRole('radiogroup')).to.have.attribute('aria-disabled', 'true');
    });

    it('should not have the aria attribute when `disabled` is not set', () => {
      render(<RadioGroup.Root />);
      expect(screen.getByRole('radiogroup')).not.to.have.attribute('aria-disabled');
    });

    it('should not change its state when clicked', () => {
      render(
        <RadioGroup.Root disabled>
          <RadioGroup.Item value="" data-testid="item" />
        </RadioGroup.Root>,
      );

      const item = screen.getByTestId('item');

      expect(item).to.have.attribute('aria-checked', 'false');

      act(() => {
        item.click();
      });

      expect(item).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: readOnly', () => {
    it('should have the `aria-readonly` attribute', () => {
      render(<RadioGroup.Root readOnly />);
      const group = screen.getByRole('radiogroup');
      expect(group).to.have.attribute('aria-readonly', 'true');
    });

    it('should not have the aria attribute when `readOnly` is not set', () => {
      render(<RadioGroup.Root />);
      const group = screen.getByRole('radiogroup');
      expect(group).not.to.have.attribute('aria-readonly');
    });

    it('should not change its state when clicked', () => {
      render(
        <RadioGroup.Root readOnly>
          <RadioGroup.Item value="" data-testid="item" />
        </RadioGroup.Root>,
      );

      const item = screen.getByTestId('item');

      expect(item).to.have.attribute('aria-checked', 'false');

      act(() => {
        item.click();
      });

      expect(item).to.have.attribute('aria-checked', 'false');
    });
  });

  it('should update its state if the underlying input is toggled', () => {
    render(
      <RadioGroup.Root data-testid="root">
        <RadioGroup.Item value="" data-testid="item" />
      </RadioGroup.Root>,
    );

    const group = screen.getByTestId('root');
    const item = screen.getByTestId('item');

    const input = group.querySelector('input');

    act(() => {
      input?.click();
    });

    expect(item).to.have.attribute('aria-checked', 'true');
  });

  it('should place the style hooks on the root and subcomponents', () => {
    render(
      <RadioGroup.Root defaultValue="1" disabled readOnly required>
        <RadioGroup.Item value="1" data-testid="item">
          <RadioGroup.Indicator data-testid="indicator" />
        </RadioGroup.Item>
      </RadioGroup.Root>,
    );

    const root = screen.getByRole('radiogroup');
    const item = screen.getByTestId('item');
    const indicator = screen.getByTestId('indicator');

    expect(root).to.have.attribute('data-disabled', 'true');
    expect(root).to.have.attribute('data-readonly', 'true');
    expect(root).to.have.attribute('data-required', 'true');

    expect(item).to.have.attribute('data-state', 'checked');
    expect(item).to.have.attribute('data-disabled', 'true');
    expect(item).to.have.attribute('data-readonly', 'true');
    expect(item).to.have.attribute('data-required', 'true');

    expect(indicator).to.have.attribute('data-state', 'checked');
    expect(indicator).to.have.attribute('data-disabled', 'true');
    expect(indicator).to.have.attribute('data-readonly', 'true');
    expect(indicator).to.have.attribute('data-required', 'true');
  });

  it('should set the name attribute on the input', () => {
    render(<RadioGroup.Root name="radio-group" />);
    const group = screen.getByRole('radiogroup');
    expect(group.nextElementSibling).to.have.attribute('name', 'radio-group');
  });

  it('should include the checkbox value in the form submission', function test() {
    if (isJSDOM) {
      // FormData is not available in JSDOM
      this.skip();
    }

    let stringifiedFormData = '';

    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          stringifiedFormData = new URLSearchParams(formData as any).toString();
        }}
      >
        <RadioGroup.Root name="group">
          <RadioGroup.Item value="a" />
          <RadioGroup.Item value="b" />
          <RadioGroup.Item value="c" />
        </RadioGroup.Root>
        <button type="submit">Submit</button>
      </form>,
    );

    const [radioA] = screen.getAllByRole('radio');
    const submitButton = screen.getByRole('button');

    submitButton.click();

    expect(stringifiedFormData).to.equal('a=off;b=off;c=off');

    act(() => {
      radioA.click();
    });

    submitButton.click();

    expect(stringifiedFormData).to.equal('a=on;b=off;c=off;group=a');
  });
});
