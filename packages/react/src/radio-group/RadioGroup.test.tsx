import * as React from 'react';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import { Radio } from '@base-ui-components/react/radio';
import {
  DirectionProvider,
  type TextDirection,
} from '@base-ui-components/react/direction-provider';
import { expect } from 'chai';
import { spy } from 'sinon';
import { isJSDOM } from '#test-utils';
import { createRenderer, act, screen, fireEvent, describeSkipIf } from '@mui/internal-test-utils';
import { describeConformance } from '../../test/describeConformance';

describe('<RadioGroup />', () => {
  const { render } = createRenderer();

  describeConformance(<RadioGroup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('extra props', () => {
    it('can override the built-in attributes', () => {
      const { container } = render(<RadioGroup role="switch" />);
      expect(container.firstElementChild as HTMLElement).to.have.attribute('role', 'switch');
    });
  });

  it('should call onValueChange when an item is clicked', () => {
    const handleChange = spy();
    render(
      <RadioGroup onValueChange={handleChange}>
        <Radio.Root value="a" data-testid="item" />
      </RadioGroup>,
    );

    const item = screen.getByTestId('item');

    fireEvent.click(item);

    expect(handleChange.callCount).to.equal(1);
    expect(handleChange.firstCall.args[0]).to.equal('a');
  });

  describe('prop: disabled', () => {
    it('should have the `aria-disabled` attribute', () => {
      const { container } = render(
        <RadioGroup disabled>
          <Radio.Root value="a" />
        </RadioGroup>,
      );
      expect(screen.getByRole('radiogroup')).to.have.attribute('aria-disabled', 'true');
      expect(screen.getByRole('radio')).to.have.attribute('disabled');
      expect(screen.getByRole('radio')).to.have.attribute('data-disabled');
      expect(container.querySelector('input')).to.have.attribute('disabled');
    });

    it('should not have the aria attribute when `disabled` is not set', () => {
      render(<RadioGroup />);
      expect(screen.getByRole('radiogroup')).not.to.have.attribute('aria-disabled');
    });

    it('should not change its state when clicked', () => {
      render(
        <RadioGroup disabled>
          <Radio.Root value="" data-testid="item" />
        </RadioGroup>,
      );

      const item = screen.getByTestId('item');

      expect(item).to.have.attribute('aria-checked', 'false');

      fireEvent.click(item);

      expect(item).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: readOnly', () => {
    it('should have the `aria-readonly` attribute', () => {
      render(<RadioGroup readOnly />);
      const group = screen.getByRole('radiogroup');
      expect(group).to.have.attribute('aria-readonly', 'true');
    });

    it('should not have the aria attribute when `readOnly` is not set', () => {
      render(<RadioGroup />);
      const group = screen.getByRole('radiogroup');
      expect(group).not.to.have.attribute('aria-readonly');
    });

    it('should not change its state when clicked', () => {
      render(
        <RadioGroup readOnly>
          <Radio.Root value="" data-testid="item" />
        </RadioGroup>,
      );

      const item = screen.getByTestId('item');

      expect(item).to.have.attribute('aria-checked', 'false');

      fireEvent.click(item);

      expect(item).to.have.attribute('aria-checked', 'false');
    });
  });

  it('should update its state if the underlying input is toggled', () => {
    render(
      <RadioGroup data-testid="root">
        <Radio.Root value="" data-testid="item" />
      </RadioGroup>,
    );

    const group = screen.getByTestId('root');
    const item = screen.getByTestId('item');

    const input = group.querySelector<HTMLInputElement>('input')!;

    fireEvent.click(input);

    expect(item).to.have.attribute('aria-checked', 'true');
  });

  it('should place the style hooks on the root and subcomponents', () => {
    render(
      <RadioGroup defaultValue="1" disabled readOnly required>
        <Radio.Root value="1" data-testid="item">
          <Radio.Indicator data-testid="indicator" />
        </Radio.Root>
      </RadioGroup>,
    );

    const root = screen.getByRole('radiogroup');
    const item = screen.getByTestId('item');
    const indicator = screen.getByTestId('indicator');

    expect(root).to.have.attribute('data-disabled', '');
    expect(root).to.have.attribute('data-readonly', '');
    expect(root).to.have.attribute('data-required', '');

    expect(item).to.have.attribute('data-checked', '');
    expect(item).to.have.attribute('data-disabled', '');
    expect(item).to.have.attribute('data-readonly', '');
    expect(item).to.have.attribute('data-required', '');

    expect(indicator).to.have.attribute('data-checked', '');
    expect(indicator).to.have.attribute('data-disabled', '');
    expect(indicator).to.have.attribute('data-readonly', '');
    expect(indicator).to.have.attribute('data-required', '');
  });

  it('should set the name attribute on the input', () => {
    render(<RadioGroup name="radio-group" />);
    const group = screen.getByRole('radiogroup');
    expect(group.nextElementSibling).to.have.attribute('name', 'radio-group');
  });

  it('should include the radio value in the form submission', async function test(t = {}) {
    if (isJSDOM) {
      // FormData is not available in JSDOM
      // @ts-expect-error to support mocha and vitest
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this?.skip?.() || t?.skip();
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
        <RadioGroup name="group">
          <Radio.Root value="a" />
          <Radio.Root value="b" />
          <Radio.Root value="c" />
        </RadioGroup>
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
    const { user } = await render(
      <RadioGroup>
        <Radio.Root value="a" data-testid="a" />
        <Radio.Root value="b" data-testid="b" />
      </RadioGroup>,
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

  describe('should manage arrow key navigation', () => {
    [
      ['ltr', 'ArrowRight', 'ArrowLeft'],
      ['rtl', 'ArrowLeft', 'ArrowRight'],
    ].forEach((entry) => {
      const [direction, horizontalNextKey, horizontalPrevKey] = entry;

      describeSkipIf(isJSDOM && direction === 'rtl')(direction, () => {
        it(direction, async () => {
          const { user } = await render(
            <DirectionProvider direction={direction as TextDirection}>
              <button data-testid="before" />
              <RadioGroup>
                <Radio.Root value="a" data-testid="a" />
                <Radio.Root value="b" data-testid="b" />
                <Radio.Root value="c" data-testid="c" />
              </RadioGroup>
              <button data-testid="after" />
            </DirectionProvider>,
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

          await user.keyboard(`{${horizontalPrevKey}}`);

          expect(c).toHaveFocus();

          await user.keyboard(`{${horizontalNextKey}}`);

          expect(a).toHaveFocus();

          await user.tab();

          expect(after).toHaveFocus();

          await user.tab({ shift: true });

          expect(a).toHaveFocus();

          await user.keyboard(`{${horizontalPrevKey}}`);

          expect(c).toHaveFocus();

          await user.tab({ shift: true });
          await user.tab();

          expect(c).toHaveFocus();
        });
      });
    });
  });

  describe('style hooks', () => {
    it('should apply data-checked and data-unchecked to radio root and indicator', () => {
      render(
        <RadioGroup>
          <Radio.Root value="a" data-testid="a">
            <Radio.Indicator data-testid="indicator-a" />
          </Radio.Root>
          <Radio.Root value="b" data-testid="b">
            <Radio.Indicator data-testid="indicator-b" />
          </Radio.Root>
        </RadioGroup>,
      );

      const a = screen.getByTestId('a');
      const b = screen.getByTestId('b');
      const indicatorA = screen.getByTestId('indicator-a');
      const indicatorB = screen.getByTestId('indicator-b');

      expect(a).to.have.attribute('data-unchecked', '');
      expect(indicatorA).to.have.attribute('data-unchecked', '');

      expect(b).to.have.attribute('data-unchecked', '');
      expect(indicatorB).to.have.attribute('data-unchecked', '');

      fireEvent.click(a);

      expect(a).to.have.attribute('data-checked', '');
      expect(indicatorA).to.have.attribute('data-checked', '');

      expect(b).to.have.attribute('data-unchecked', '');
      expect(indicatorB).to.have.attribute('data-unchecked', '');

      fireEvent.click(b);

      expect(a).to.have.attribute('data-unchecked', '');
      expect(indicatorA).to.have.attribute('data-unchecked', '');

      expect(b).to.have.attribute('data-checked', '');
      expect(indicatorB).to.have.attribute('data-checked', '');

      fireEvent.click(a);

      expect(a).to.have.attribute('data-checked', '');
      expect(indicatorA).to.have.attribute('data-checked', '');

      expect(b).to.have.attribute('data-unchecked', '');
      expect(indicatorB).to.have.attribute('data-unchecked', '');
    });
  });
});
