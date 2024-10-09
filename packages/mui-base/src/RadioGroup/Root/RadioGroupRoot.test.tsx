import * as React from 'react';
import * as RadioGroup from '@base_ui/react/RadioGroup';
import * as Radio from '@base_ui/react/Radio';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, act, screen, fireEvent } from '@mui/internal-test-utils';
import userEvent from '@testing-library/user-event';
import { describeConformance } from '../../../test/describeConformance';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

const user = userEvent.setup();

describe('<RadioGroup.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<RadioGroup.Root />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('extra props', () => {
    it('can override the built-in attributes', () => {
      const { container } = render(<RadioGroup.Root role="switch" />);
      // eslint-disable-next-line testing-library/no-node-access
      expect(container.firstElementChild as HTMLElement).to.have.attribute('role', 'switch');
    });
  });

  it('should call onValueChange when an item is clicked', () => {
    const handleChange = spy();
    render(
      <RadioGroup.Root onValueChange={handleChange}>
        <Radio.Root value="a" data-testid="item" />
      </RadioGroup.Root>,
    );

    const item = screen.getByTestId('item');

    fireEvent.click(item);

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
          <Radio.Root value="" data-testid="item" />
        </RadioGroup.Root>,
      );

      const item = screen.getByTestId('item');

      expect(item).to.have.attribute('aria-checked', 'false');

      fireEvent.click(item);

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
          <Radio.Root value="" data-testid="item" />
        </RadioGroup.Root>,
      );

      const item = screen.getByTestId('item');

      expect(item).to.have.attribute('aria-checked', 'false');

      fireEvent.click(item);

      expect(item).to.have.attribute('aria-checked', 'false');
    });
  });

  it('should update its state if the underlying input is toggled', () => {
    render(
      <RadioGroup.Root data-testid="root">
        <Radio.Root value="" data-testid="item" />
      </RadioGroup.Root>,
    );

    const group = screen.getByTestId('root');
    const item = screen.getByTestId('item');

    // eslint-disable-next-line testing-library/no-node-access
    const input = group.querySelector<HTMLInputElement>('input')!;

    fireEvent.click(input);

    expect(item).to.have.attribute('aria-checked', 'true');
  });

  it('should place the style hooks on the root and subcomponents', () => {
    render(
      <RadioGroup.Root defaultValue="1" disabled readOnly required>
        <Radio.Root value="1" data-testid="item">
          <Radio.Indicator data-testid="indicator" />
        </Radio.Root>
      </RadioGroup.Root>,
    );

    const root = screen.getByRole('radiogroup');
    const item = screen.getByTestId('item');
    const indicator = screen.getByTestId('indicator');

    expect(root).to.have.attribute('data-disabled', 'true');
    expect(root).to.have.attribute('data-readonly', 'true');
    expect(root).to.have.attribute('data-required', 'true');

    expect(item).to.have.attribute('data-radio', 'checked');
    expect(item).to.have.attribute('data-disabled', 'true');
    expect(item).to.have.attribute('data-readonly', 'true');
    expect(item).to.have.attribute('data-required', 'true');

    expect(indicator).to.have.attribute('data-radio', 'checked');
    expect(indicator).to.have.attribute('data-disabled', 'true');
    expect(indicator).to.have.attribute('data-readonly', 'true');
    expect(indicator).to.have.attribute('data-required', 'true');
  });

  it('should set the name attribute on the input', () => {
    render(<RadioGroup.Root name="radio-group" />);
    const group = screen.getByRole('radiogroup');
    // eslint-disable-next-line testing-library/no-node-access
    expect(group.nextElementSibling).to.have.attribute('name', 'radio-group');
  });

  it('should include the radio value in the form submission', async function test() {
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
          <Radio.Root value="a" />
          <Radio.Root value="b" />
          <Radio.Root value="c" />
        </RadioGroup.Root>
        <button type="submit">Submit</button>
      </form>,
    );

    const [radioA] = screen.getAllByRole('radio');
    const submitButton = screen.getByRole('button');

    submitButton.click();

    expect(stringifiedFormData).to.equal('group=');

    await act(async () => {
      radioA.click();
    });

    submitButton.click();

    expect(stringifiedFormData).to.equal('group=a');
  });

  it('should automatically select radio upon navigation', async () => {
    render(
      <RadioGroup.Root>
        <Radio.Root value="a" data-testid="a" />
        <Radio.Root value="b" data-testid="b" />
      </RadioGroup.Root>,
    );

    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');

    act(() => {
      a.focus();
    });

    expect(a).to.have.attribute('aria-checked', 'false');

    await user.keyboard('{ArrowDown}');

    expect(a).to.have.attribute('aria-checked', 'false');

    expect(b).toHaveFocus();
    expect(b).to.have.attribute('aria-checked', 'true');
  });

  it('should manage arrow key navigation', async () => {
    render(
      <div>
        <button data-testid="before" />
        <RadioGroup.Root>
          <Radio.Root value="a" data-testid="a" />
          <Radio.Root value="b" data-testid="b" />
          <Radio.Root value="c" data-testid="c" />
        </RadioGroup.Root>
        <button data-testid="after" />
      </div>,
    );

    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');
    const c = screen.getByTestId('c');
    const after = screen.getByTestId('after');

    act(() => {
      a.focus();
    });

    expect(a).toHaveFocus();

    await user.keyboard('{ArrowDown}');

    expect(b).toHaveFocus();

    await user.keyboard('{ArrowDown}');

    expect(c).toHaveFocus();

    await user.keyboard('{ArrowDown}');

    expect(a).toHaveFocus();

    await user.keyboard('{ArrowUp}');

    expect(c).toHaveFocus();

    await user.keyboard('{ArrowUp}');

    expect(b).toHaveFocus();

    await user.keyboard('{ArrowUp}');

    expect(a).toHaveFocus();

    await user.keyboard('{ArrowLeft}');

    expect(c).toHaveFocus();

    await user.keyboard('{ArrowRight}');

    expect(a).toHaveFocus();

    await user.tab();

    expect(after).toHaveFocus();

    await user.tab({ shift: true });

    expect(a).toHaveFocus();

    await user.keyboard('{ArrowLeft}');

    expect(c).toHaveFocus();

    await user.tab({ shift: true });
    await user.tab();

    expect(c).toHaveFocus();
  });
});
