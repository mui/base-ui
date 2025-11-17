import * as React from 'react';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import { Radio } from '@base-ui-components/react/radio';
import { Field } from '@base-ui-components/react/field';
import { Fieldset } from '@base-ui-components/react/fieldset';
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
      render(
        <RadioGroup disabled>
          <Radio.Root value="a" />
        </RadioGroup>,
      );
      expect(screen.getByRole('radiogroup')).to.have.attribute('aria-disabled', 'true');
      expect(screen.getByRole('radio')).to.have.attribute('aria-disabled', 'true');
      expect(screen.getByRole('radio')).to.have.attribute('data-disabled');
      expect(
        screen.getByRole('textbox', {
          hidden: true,
        }),
      ).to.have.attribute('disabled');
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

  it('should set the name attribute on the input only when a value is selected', async () => {
    await render(
      <RadioGroup name="radio-group">
        <Radio.Root value="a" data-testid="radio" />
      </RadioGroup>,
    );
    const group = screen.getByRole('radiogroup');
    const radio = screen.getByTestId('radio');

    expect(group.nextElementSibling).to.not.have.attribute('name');

    act(() => {
      radio.click();
    });
    expect(group.nextElementSibling).to.have.attribute('name', 'radio-group');
  });

  it.skipIf(isJSDOM)(
    'should return null when no radio is selected (matching native behavior)',
    async () => {
      await render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            expect(formData.get('test-group')).to.equal(null);
          }}
        >
          <RadioGroup name="test-group">
            <Radio.Root value="option-a" />
            <Radio.Root value="option-b" />
          </RadioGroup>
          <button type="submit">Submit</button>
        </form>,
      );

      const submitButton = screen.getByRole('button');
      submitButton.click();
    },
  );

  it.skipIf(isJSDOM)('should return null in form data when no radio is selected', async () => {
    await render(
      <form data-testid="form">
        <RadioGroup name="group">
          <Radio.Root value="a" />
          <Radio.Root value="b" />
          <Radio.Root value="c" />
        </RadioGroup>
      </form>,
    );

    const form = screen.getByTestId('form') as HTMLFormElement;
    const formData = new FormData(form);
    expect(formData.get('group')).to.equal(null);
  });

  it.skipIf(isJSDOM)('should include selected radio value in form data', async () => {
    await render(
      <form data-testid="form">
        <RadioGroup name="group">
          <Radio.Root value="a" data-testid="radio-a" />
          <Radio.Root value="b" />
          <Radio.Root value="c" />
        </RadioGroup>
      </form>,
    );

    const radio = screen.getByTestId('radio-a');
    const form = screen.getByTestId('form') as HTMLFormElement;

    await act(async () => {
      radio.click();
    });

    const formData = new FormData(form);
    expect(formData.get('group')).to.equal('a');
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

  describe('with native <label>', () => {
    it('associates implicitly', async () => {
      const changeSpy = spy((newValue) => newValue);
      await render(
        <RadioGroup onValueChange={changeSpy}>
          <label data-testid="label">
            <Radio.Root value="apple" />
            Apple
          </label>

          <label data-testid="label">
            <Radio.Root value="banana" />
            Banana
          </label>
        </RadioGroup>,
      );

      const [label1, label2] = screen.getAllByTestId('label');

      fireEvent.click(label1);
      expect(changeSpy.callCount).to.equal(1);
      expect(changeSpy.lastCall.returnValue).to.equal('apple');

      fireEvent.click(label2);
      expect(changeSpy.callCount).to.equal(2);
      expect(changeSpy.lastCall.returnValue).to.equal('banana');
    });

    it('associates explicitly', async () => {
      const changeSpy = spy((newValue) => newValue);
      await render(
        <RadioGroup onValueChange={changeSpy}>
          <div>
            <label data-testid="label" htmlFor="RadioA">
              Apple
            </label>
            <Radio.Root value="apple" id="RadioA" />
          </div>

          <div>
            <label data-testid="label" htmlFor="RadioB">
              Banana
            </label>
            <Radio.Root value="banana" id="RadioB" />
          </div>
        </RadioGroup>,
      );

      const [label1, label2] = screen.getAllByTestId('label');

      fireEvent.click(label1);
      expect(changeSpy.callCount).to.equal(1);
      expect(changeSpy.lastCall.returnValue).to.equal('apple');

      fireEvent.click(label2);
      expect(changeSpy.callCount).to.equal(2);
      expect(changeSpy.lastCall.returnValue).to.equal('banana');
    });
  });

  describe('Field', () => {
    it('passes the `name` prop to the hidden input only when a value is selected', async () => {
      await render(
        <Field.Root name="test" data-testid="field">
          <RadioGroup name="group">
            <Field.Item>
              <Radio.Root value="a" data-testid="item" />
            </Field.Item>
          </RadioGroup>
        </Field.Root>,
      );

      // Initially, no name attribute when no value is selected
      let input = screen.getByTestId('field').querySelector('input[name="test"]');
      expect(input).to.equal(null);

      // After selecting, should have name attribute
      const radio = screen.getByTestId('item');
      act(() => {
        radio.click();
      });

      input = screen.getByTestId('field').querySelector('input[name="test"]');
      expect(input).not.to.equal(null);
    });

    describe('Field.Root', () => {
      it('should receive disabled prop from Field.Root', () => {
        render(
          <Field.Root disabled>
            <RadioGroup>
              <Field.Item>
                <Radio.Root value="a" data-testid="radio" />
              </Field.Item>
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
            <RadioGroup value="a">
              <Field.Item>
                <Radio.Root value="a" data-testid="radio" />
              </Field.Item>
            </RadioGroup>
          </Field.Root>,
        );

        const group = screen.getByRole('radiogroup');
        const input = group.nextElementSibling as HTMLInputElement;

        expect(input).to.have.attribute('name', 'field-radio');
      });

      it('revalidates when the controlled value changes externally', async () => {
        const validateSpy = spy((value: unknown) => ((value as string) === 'b' ? 'error' : null));

        function App() {
          const [value, setValue] = React.useState('a');

          return (
            <React.Fragment>
              <Field.Root validationMode="onChange" validate={validateSpy} name="choices">
                <RadioGroup
                  value={value}
                  onValueChange={(nextValue) => setValue(nextValue as string)}
                >
                  <Field.Item>
                    <Radio.Root value="a" data-testid="radio" />
                  </Field.Item>
                  <Field.Item>
                    <Radio.Root value="b" data-testid="radio" />
                  </Field.Item>
                </RadioGroup>
              </Field.Root>
              <button type="button" onClick={() => setValue('b')}>
                Select externally
              </button>
            </React.Fragment>
          );
        }

        await render(<App />);

        const radioGroup = screen.getByRole('radiogroup');
        const toggle = screen.getByText('Select externally');

        expect(radioGroup).not.to.have.attribute('aria-invalid');
        const initialCallCount = validateSpy.callCount;

        fireEvent.click(toggle);

        expect(validateSpy.callCount).to.equal(initialCallCount + 1);
        expect(validateSpy.lastCall.args[0]).to.equal('b');
        expect(radioGroup).to.have.attribute('aria-invalid', 'true');
      });
    });

    describe('Field.Label', () => {
      it('associates implicitly', async () => {
        const changeSpy = spy((newValue) => newValue);
        await render(
          <Field.Root name="options">
            <RadioGroup onValueChange={changeSpy}>
              <Field.Item>
                <Field.Label data-testid="label">
                  <Radio.Root value="apple" />
                  Apple
                </Field.Label>
              </Field.Item>
              <Field.Item>
                <Field.Label data-testid="label">
                  <Radio.Root value="banana" />
                  Banana
                </Field.Label>
              </Field.Item>
            </RadioGroup>
          </Field.Root>,
        );

        const labels = screen.getAllByTestId('label');
        expect(labels.length).to.equal(2);
        labels.forEach((label) => {
          expect(label).to.have.attribute('for');
        });

        fireEvent.click(screen.getByText('Apple'));
        expect(changeSpy.callCount).to.equal(1);
        expect(changeSpy.lastCall.returnValue).to.equal('apple');
      });

      it('associates explicitly', async () => {
        const changeSpy = spy((newValue) => newValue);
        await render(
          <Field.Root name="options">
            <RadioGroup onValueChange={changeSpy}>
              <Field.Item>
                <Radio.Root value="apple" />
                <Field.Label data-testid="label">Apple</Field.Label>
                <Field.Description data-testid="description">
                  An apple is the round, edible fruit of an apple tree
                </Field.Description>
              </Field.Item>
              <Field.Item>
                <Radio.Root value="banana" />
                <Field.Label data-testid="label">Banana</Field.Label>
                <Field.Description data-testid="description">
                  A banana is an elongated, edible fruit
                </Field.Description>
              </Field.Item>
            </RadioGroup>
          </Field.Root>,
        );

        const radios = screen.getAllByRole('radio');
        const labels = screen.getAllByTestId('label');
        const descriptions = screen.getAllByTestId('description');
        const inputs = document.querySelectorAll('input[type="radio"]');

        radios.forEach((radio, index) => {
          const label = labels[index];
          const description = descriptions[index];
          const input = inputs[index];

          expect(label.getAttribute('for')).to.not.equal(null);
          expect(label.getAttribute('for')).to.equal(input?.getAttribute('id'));
          expect(description.getAttribute('id')).to.not.equal(null);
          expect(description.getAttribute('id')).to.equal(radio.getAttribute('aria-describedby'));
        });

        fireEvent.click(screen.getByText('Banana'));
        expect(changeSpy.lastCall.returnValue).to.equal('banana');
      });
    });

    describe('prop: validationMode', () => {
      it('onSubmit', async () => {
        const { user } = await render(
          <Form>
            <Field.Root
              validate={(val) => {
                if (val === 'a') {
                  return 'custom error a';
                }

                if (val === 'c') {
                  return 'custom error c';
                }
                return null;
              }}
            >
              <RadioGroup>
                <Radio.Root value="a" data-testid="item" />
                <Radio.Root value="b" data-testid="item" />
                <Radio.Root value="c" data-testid="item" />
              </RadioGroup>
            </Field.Root>
            <button type="submit">submit</button>
          </Form>,
        );

        const radioGroup = screen.getByRole('radiogroup');
        const [radioA, radioB, radioC] = screen.getAllByTestId('item');
        expect(radioGroup).to.not.have.attribute('aria-invalid');

        await user.click(radioA);
        expect(radioA).to.have.attribute('data-checked', '');
        expect(radioGroup).to.not.have.attribute('aria-invalid');

        await user.click(radioC);
        expect(radioC).to.have.attribute('data-checked', '');
        expect(radioGroup).to.not.have.attribute('aria-invalid');

        await user.click(screen.getByText('submit'));
        expect(radioGroup).to.have.attribute('aria-invalid');

        await user.click(radioB);
        expect(radioB).to.have.attribute('data-checked', '');
        expect(radioGroup).to.not.have.attribute('aria-invalid');
      });
    });
  });

  describe('Fieldset', () => {
    it("labels the radio group's hidden input", async () => {
      await render(
        <Field.Root name="test">
          <Fieldset.Root render={<RadioGroup />}>
            <Fieldset.Legend>Legend</Fieldset.Legend>
            <Field.Item>
              <Radio.Root value="a" />
            </Field.Item>
          </Fieldset.Root>
        </Field.Root>,
      );

      const hiddenInput = document.querySelector('input[value]');
      expect(hiddenInput).to.not.equal(null);

      const legend = screen.getByText('Legend');
      expect(legend.getAttribute('id')).to.equal(hiddenInput?.getAttribute('aria-labelledby'));
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
              <Field.Item>
                <Radio.Root value="a" data-testid="item" />
              </Field.Item>
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

    it('clears external errors on change', async () => {
      await renderFakeTimers(
        <Form
          errors={{
            test: 'test',
          }}
        >
          <Field.Root name="test" data-testid="field">
            <RadioGroup data-testid="radio-group">
              <Field.Item>
                <Radio.Root value="a" data-testid="item-a" />
              </Field.Item>
              <Field.Item>
                <Radio.Root value="b" data-testid="item-b" />
              </Field.Item>
            </RadioGroup>
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>,
      );

      const itemA = screen.getByTestId('item-a');
      const radioGroup = screen.getByTestId('radio-group');

      expect(screen.queryByTestId('error')).to.have.text('test');

      fireEvent.click(itemA);

      expect(screen.queryByTestId('error')).to.equal(null);
      expect(radioGroup).not.to.have.attribute('aria-invalid', 'true');
    });

    it('appends the id attribute of the error to aria-describedby of individual radios', async () => {
      const { user } = await renderFakeTimers(
        <Form>
          <Field.Root name="test" data-testid="field">
            <RadioGroup name="group" required>
              <Field.Item>
                <Radio.Root value="a" />
                <Field.Description>description</Field.Description>
              </Field.Item>
            </RadioGroup>
            <Field.Error match="valueMissing" data-testid="error" />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      expect(screen.queryByTestId('error')).to.equal(null);

      await user.click(screen.getByText('Submit'));

      const error = screen.getByTestId('error');
      const radio = screen.getByRole('radio');
      const description = screen.getByText('description');
      expect(radio.getAttribute('aria-describedby')).to.include(error.getAttribute('id'));
      expect(radio.getAttribute('aria-describedby')).to.include(description.getAttribute('id'));
    });
  });
});
