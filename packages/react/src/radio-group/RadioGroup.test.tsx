import * as React from 'react';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import { Radio } from '@base-ui-components/react/radio';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import {
  DirectionProvider,
  type TextDirection,
} from '@base-ui-components/react/direction-provider';
import { expect } from 'chai';
import { spy } from 'sinon';
import { isJSDOM, createRenderer as createAsyncRenderer } from '#test-utils';
import { act, screen, fireEvent, createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../test/describeConformance';

describe('<RadioGroup />', () => {
  const { render } = createRenderer();

  describeConformance(<RadioGroup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('extra props', () => {
    it('can override the built-in attributes', async () => {
      const { container } = await render(<RadioGroup role="switch" />);
      expect(container.firstElementChild as HTMLElement).to.have.attribute('role', 'switch');
    });
  });

  it('should call onValueChange when an item is clicked', async () => {
    const handleChange = spy();
    await render(
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
    it('should have the `aria-disabled` attribute', async () => {
      const { container } = await render(
        <RadioGroup disabled>
          <Radio.Root value="a" />
        </RadioGroup>,
      );
      expect(screen.getByRole('radiogroup')).to.have.attribute('aria-disabled', 'true');
      expect(screen.getByRole('radio')).to.have.attribute('aria-disabled', 'true');
      expect(screen.getByRole('radio')).to.have.attribute('data-disabled');
      expect(container.querySelector('input')).to.have.attribute('disabled');
    });

    it('should not have the aria attribute when `disabled` is not set', async () => {
      await render(<RadioGroup />);
      expect(screen.getByRole('radiogroup')).not.to.have.attribute('aria-disabled');
    });

    it('should not change its state when clicked', async () => {
      await render(
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
    it('should have the `aria-readonly` attribute', async () => {
      await render(<RadioGroup readOnly />);
      const group = screen.getByRole('radiogroup');
      expect(group).to.have.attribute('aria-readonly', 'true');
    });

    it('should not have the aria attribute when `readOnly` is not set', async () => {
      await render(<RadioGroup />);
      const group = screen.getByRole('radiogroup');
      expect(group).not.to.have.attribute('aria-readonly');
    });

    it('should not change its state when clicked', async () => {
      await render(
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

  it('should update its state if the underlying input is toggled', async () => {
    await render(
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

  it('should place the style hooks on the root and subcomponents', async () => {
    await render(
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

  it('should set the name attribute on the input', async () => {
    await render(<RadioGroup name="radio-group" />);
    const group = screen.getByRole('radiogroup');
    expect(group.nextElementSibling).to.have.attribute('name', 'radio-group');
  });

  it('should include the radio value in the form submission', async ({ skip }) => {
    if (isJSDOM) {
      // FormData is not available in JSDOM
      skip();
    }

    let stringifiedFormData = '';

    await render(
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

      describe.skipIf(isJSDOM && direction === 'rtl')(direction, () => {
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

        describe('modifier keys', () => {
          it('when Shift is pressed arrow keys move focus normally', async () => {
            const { user } = await render(
              <DirectionProvider direction={direction as TextDirection}>
                <RadioGroup>
                  <Radio.Root value="a" data-testid="a" />
                  <Radio.Root value="b" data-testid="b" />
                  <Radio.Root value="c" data-testid="c" />
                </RadioGroup>
              </DirectionProvider>,
            );

            const a = screen.getByTestId('a');
            const b = screen.getByTestId('b');
            const c = screen.getByTestId('c');

            await user.keyboard('{Tab}');
            expect(a).toHaveFocus();

            await user.keyboard(`{Shift>}{${horizontalNextKey}}`);
            expect(b).toHaveFocus();

            await user.keyboard('{Shift>}{ArrowDown}');
            expect(c).toHaveFocus();
          });
        });
      });
    });
  });

  describe('style hooks', () => {
    it('should apply data-checked and data-unchecked to radio root and indicator', async () => {
      await render(
        <RadioGroup>
          <Radio.Root value="a" data-testid="a">
            <Radio.Indicator keepMounted data-testid="indicator-a" />
          </Radio.Root>
          <Radio.Root value="b" data-testid="b">
            <Radio.Indicator keepMounted data-testid="indicator-b" />
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

  describe('Field', () => {
    it('passes the `name` prop to the hidden input', async () => {
      await render(
        <Field.Root name="test" data-testid="field">
          <RadioGroup name="group">
            <Radio.Root value="a" data-testid="item" />
          </RadioGroup>
        </Field.Root>,
      );

      const input = screen.getByTestId('field').querySelector('input[name="test"]');
      expect(input).not.to.equal(null);
    });

    describe('Form', () => {
      it('triggers native HTML validation on submit', async () => {
        const { user } = await render(
          <Form>
            <Field.Root name="test" data-testid="field">
              <RadioGroup name="group" required>
                <Radio.Root value="a" data-testid="item" />
              </RadioGroup>
              <Field.Error match="valueMissing" data-testid="error">
                required
              </Field.Error>
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>,
        );

        const submit = screen.getByText('Submit');

        expect(screen.queryByTestId('error')).to.equal(null);

        await user.click(submit);

        const error = screen.getByTestId('error');
        expect(error).to.have.text('required');
      });
    });

    describe('with Field.Root', () => {
      it('should receive disabled prop from Field.Root', () => {
        render(
          <Field.Root disabled>
            <RadioGroup>
              <Radio.Root value="a" data-testid="radio" />
            </RadioGroup>
          </Field.Root>,
        );

        const radioGroup = screen.getByRole('radiogroup');
        const radio = screen.getByTestId('radio');

        expect(radioGroup).to.have.attribute('aria-disabled', 'true');
        expect(radioGroup).to.have.attribute('data-disabled');
        expect(radio).to.have.attribute('aria-disabled', 'true');
        expect(radio).to.have.attribute('data-disabled');
      });

      it('should receive name prop from Field.Root', async () => {
        await render(
          <Field.Root name="field-radio">
            <RadioGroup>
              <Radio.Root value="a" data-testid="radio" />
            </RadioGroup>
          </Field.Root>,
        );

        const group = screen.getByRole('radiogroup');
        const input = group.nextElementSibling as HTMLInputElement;

        expect(input).to.have.attribute('name', 'field-radio');
      });
    });

    describe('Form', () => {
      const { render: renderFakeTimers, clock } = createAsyncRenderer({
        clockOptions: {
          shouldAdvanceTime: true,
        },
      });

      clock.withFakeTimers();

      it('triggers native HTML validation on submit', async () => {
        const { user } = await renderFakeTimers(
          <Form>
            <Field.Root name="test" data-testid="field">
              <RadioGroup name="group" required>
                <Radio.Root value="a" data-testid="item" />
              </RadioGroup>
              <Field.Error match="valueMissing" data-testid="error">
                required
              </Field.Error>
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>,
        );

        const submit = screen.getByText('Submit');

        expect(screen.queryByTestId('error')).to.equal(null);

        await user.click(submit);

        const error = screen.getByTestId('error');
        expect(error).to.have.text('required');
      });

      it('clears errors on change', async () => {
        function App() {
          const [errors, setErrors] = React.useState<Record<string, string | string[]>>({
            test: 'test',
          });
          return (
            <Form errors={errors} onClearErrors={setErrors}>
              <Field.Root name="test" data-testid="field">
                <RadioGroup data-testid="radio-group">
                  <Radio.Root value="a" data-testid="item-a" />
                  <Radio.Root value="b" data-testid="item-b" />
                </RadioGroup>
                <Field.Error data-testid="error" />
              </Field.Root>
            </Form>
          );
        }

        await renderFakeTimers(<App />);

        const itemA = screen.getByTestId('item-a');
        const radioGroup = screen.getByTestId('radio-group');

        expect(screen.queryByTestId('error')).to.have.text('test');

        fireEvent.click(itemA);

        expect(screen.queryByTestId('error')).to.equal(null);
        expect(radioGroup).not.to.have.attribute('aria-invalid', 'true');
      });
    });

    it('does not forward `value` prop', async () => {
      await render(
        <RadioGroup value="test" data-testid="radio-group">
          <Radio.Root value="" />
        </RadioGroup>,
      );

      expect(screen.getByTestId('radio-group')).not.to.have.attribute('value');
    });

    it('sets tabIndex=0 to the correct element initially', async () => {
      await render(
        <RadioGroup defaultValue="b">
          <Radio.Root value="a" data-testid="radio-a" />
          <Radio.Root value="b" data-testid="radio-b" />
        </RadioGroup>,
      );

      const radioA = screen.getByTestId('radio-a');
      const radioB = screen.getByTestId('radio-b');

      expect(radioA).not.to.have.attribute('tabindex', '0');
      expect(radioB).to.have.attribute('tabindex', '0');
    });
  });
});
