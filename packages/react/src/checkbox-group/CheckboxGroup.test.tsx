import * as React from 'react';
import { createRenderer, screen, fireEvent } from '@mui/internal-test-utils';
import { CheckboxGroup } from '@base-ui-components/react/checkbox-group';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import { spy } from 'sinon';
import { expect } from 'chai';
import { describeConformance, isJSDOM } from '#test-utils';

describe('<CheckboxGroup />', () => {
  const { render } = createRenderer();

  describeConformance(<CheckboxGroup />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('prop: value', () => {
    it('should control the value', () => {
      function App() {
        const [value, setValue] = React.useState(['red']);
        return (
          <CheckboxGroup value={value} onValueChange={setValue}>
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        );
      }

      render(<App />);

      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'false');
      expect(blue).to.have.attribute('aria-checked', 'false');

      fireEvent.click(green);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'true');
      expect(blue).to.have.attribute('aria-checked', 'false');

      fireEvent.click(blue);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'true');
      expect(blue).to.have.attribute('aria-checked', 'true');

      fireEvent.click(green);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'false');
      expect(blue).to.have.attribute('aria-checked', 'true');
    });
  });

  describe('prop: onValueChange', () => {
    it('should be called when the value changes', () => {
      const handleValueChange = spy();

      function App() {
        const [value, setValue] = React.useState<string[]>([]);
        return (
          <CheckboxGroup
            value={value}
            onValueChange={(nextValue) => {
              setValue(nextValue);
              handleValueChange(nextValue);
            }}
          >
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        );
      }

      render(<App />);

      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      fireEvent.click(red);

      expect(handleValueChange.callCount).to.equal(1);
      expect(handleValueChange.firstCall.args[0]).to.deep.equal(['red']);

      fireEvent.click(green);

      expect(handleValueChange.callCount).to.equal(2);
      expect(handleValueChange.secondCall.args[0]).to.deep.equal(['red', 'green']);

      fireEvent.click(blue);

      expect(handleValueChange.callCount).to.equal(3);
      expect(handleValueChange.thirdCall.args[0]).to.deep.equal(['red', 'green', 'blue']);
    });
  });

  describe('prop: defaultValue', () => {
    it('should set the initial value', () => {
      function App() {
        return (
          <CheckboxGroup defaultValue={['red']}>
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        );
      }

      render(<App />);

      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'false');
      expect(blue).to.have.attribute('aria-checked', 'false');

      fireEvent.click(green);

      expect(red).to.have.attribute('aria-checked', 'true');
      expect(green).to.have.attribute('aria-checked', 'true');
      expect(blue).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: disabled', () => {
    it('disables all checkboxes when `true`', () => {
      function App() {
        return (
          <CheckboxGroup disabled>
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        );
      }

      render(<App />);

      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      expect(red).to.have.attribute('disabled', '');
      expect(green).to.have.attribute('disabled', '');
      expect(blue).to.have.attribute('disabled', '');
    });

    it('does not disable all checkboxes when `false`', () => {
      function App() {
        return (
          <CheckboxGroup disabled={false}>
            <Checkbox.Root name="red" data-testid="red" />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        );
      }

      render(<App />);

      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      expect(red).not.to.have.attribute('disabled', '');
      expect(green).not.to.have.attribute('disabled', '');
      expect(blue).not.to.have.attribute('disabled', '');
    });

    it('takes precedence over individual checkboxes', () => {
      function App() {
        return (
          <CheckboxGroup disabled>
            <Checkbox.Root name="red" data-testid="red" disabled={false} />
            <Checkbox.Root name="green" data-testid="green" />
            <Checkbox.Root name="blue" data-testid="blue" />
          </CheckboxGroup>
        );
      }

      render(<App />);

      const red = screen.getByTestId('red');
      const green = screen.getByTestId('green');
      const blue = screen.getByTestId('blue');

      expect(red).to.have.attribute('disabled', '');
      expect(green).to.have.attribute('disabled', '');
      expect(blue).to.have.attribute('disabled', '');
    });
  });

  describe('Field', () => {
    it('prop: validationMode=onChange', async () => {
      const validateSpy = spy((value) => {
        const v = value as string[];
        return v.includes('fuji-apple') ? 'error' : null;
      });
      render(
        <Field.Root validationMode="onChange" validate={validateSpy} name="apple">
          <CheckboxGroup defaultValue={['fuji-apple']}>
            <Field.Item>
              <Checkbox.Root value="fuji-apple" data-testid="button-1" />
            </Field.Item>
            <Field.Item>
              <Checkbox.Root value="gala-apple" data-testid="button-2" />
            </Field.Item>
            <Field.Item>
              <Checkbox.Root value="granny-smith-apple" data-testid="button-3" />
            </Field.Item>
          </CheckboxGroup>
        </Field.Root>,
      );

      const button1 = screen.getByTestId('button-1');
      const button2 = screen.getByTestId('button-2');
      const button3 = screen.getByTestId('button-3');

      expect(button1).not.to.have.attribute('aria-invalid');
      expect(button2).not.to.have.attribute('aria-invalid');
      expect(button3).not.to.have.attribute('aria-invalid');

      fireEvent.click(button1);

      expect(button1).not.to.have.attribute('aria-invalid');
      expect(button2).not.to.have.attribute('aria-invalid');
      expect(button3).not.to.have.attribute('aria-invalid');
      expect(validateSpy.callCount).to.equal(1);
      expect(validateSpy.args[0][0]).to.deep.equal([]);

      fireEvent.click(button2);

      expect(button1).not.to.have.attribute('aria-invalid');
      expect(button2).not.to.have.attribute('aria-invalid');
      expect(button3).not.to.have.attribute('aria-invalid');
      expect(validateSpy.callCount).to.equal(2);
      expect(validateSpy.args[1][0]).to.deep.equal(['gala-apple']);

      fireEvent.click(button1);

      expect(button1).to.have.attribute('aria-invalid', 'true');
      expect(button2).to.have.attribute('aria-invalid', 'true');
      expect(button3).to.have.attribute('aria-invalid', 'true');
      expect(validateSpy.callCount).to.equal(3);
      expect(validateSpy.args[2][0]).to.deep.equal(['gala-apple', 'fuji-apple']);

      fireEvent.click(button3);

      expect(button1).to.have.attribute('aria-invalid', 'true');
      expect(button2).to.have.attribute('aria-invalid', 'true');
      expect(button3).to.have.attribute('aria-invalid', 'true');
    });

    it('prop: validationMode=onBlur', async () => {
      const validateSpy = spy((value) => {
        const v = value as string[];
        return v.includes('fuji-apple') ? 'error' : null;
      });
      render(
        <Field.Root validationMode="onBlur" validate={validateSpy} name="apple">
          <CheckboxGroup defaultValue={['fuji-apple']}>
            <Field.Item>
              <Checkbox.Root value="fuji-apple" data-testid="button-1" />
            </Field.Item>
            <Field.Item>
              <Checkbox.Root value="gala-apple" data-testid="button-2" />
            </Field.Item>
            <Field.Item>
              <Checkbox.Root value="granny-smith-apple" data-testid="button-3" />
            </Field.Item>
          </CheckboxGroup>
          <Field.Error data-testid="error" />
        </Field.Root>,
      );

      const button1 = screen.getByTestId('button-1');
      const button2 = screen.getByTestId('button-2');
      const button3 = screen.getByTestId('button-3');

      expect(button1).not.to.have.attribute('aria-invalid');
      expect(button2).not.to.have.attribute('aria-invalid');
      expect(button3).not.to.have.attribute('aria-invalid');

      fireEvent.click(button1);
      expect(validateSpy.callCount).to.equal(0);
      fireEvent.blur(button1);
      expect(validateSpy.callCount).to.equal(1);
      expect(validateSpy.args[0][0]).to.deep.equal([]);

      expect(button1).not.to.have.attribute('aria-invalid');
      expect(button2).not.to.have.attribute('aria-invalid');
      expect(button3).not.to.have.attribute('aria-invalid');

      fireEvent.click(button3);
      expect(validateSpy.callCount).to.equal(1);
      fireEvent.blur(button3);
      expect(validateSpy.callCount).to.equal(2);
      expect(validateSpy.args[1][0]).to.deep.equal(['granny-smith-apple']);

      expect(button1).not.to.have.attribute('aria-invalid');
      expect(button2).not.to.have.attribute('aria-invalid');
      expect(button3).not.to.have.attribute('aria-invalid');

      fireEvent.click(button1);
      expect(validateSpy.callCount).to.equal(2);
      fireEvent.blur(button1);
      expect(validateSpy.callCount).to.equal(3);
      expect(validateSpy.args[2][0]).to.deep.equal(['granny-smith-apple', 'fuji-apple']);

      expect(button1).to.have.attribute('aria-invalid', 'true');
      expect(button2).to.have.attribute('aria-invalid', 'true');
      expect(button3).to.have.attribute('aria-invalid', 'true');
    });
  });

  describe('Field.Label', () => {
    it('implicit association', async () => {
      const changeSpy = spy();
      const { container } = await render(
        <Field.Root name="apple">
          <CheckboxGroup defaultValue={['fuji-apple', 'gala-apple']}>
            <Field.Item>
              <Field.Label>
                <Checkbox.Root value="fuji-apple" />
                Fuji
              </Field.Label>
            </Field.Item>
            <Field.Item>
              <Field.Label>
                <Checkbox.Root value="gala-apple" />
                Gala
              </Field.Label>
            </Field.Item>
            <Field.Item>
              <Field.Label>
                <Checkbox.Root value="granny-smith-apple" onCheckedChange={changeSpy} />
                Granny Smith
              </Field.Label>
            </Field.Item>
          </CheckboxGroup>
        </Field.Root>,
      );

      const labels = container.querySelectorAll('label');
      expect(labels.length).to.equal(3);
      labels.forEach((label) => {
        expect(label).to.not.have.attribute('for');
      });

      fireEvent.click(labels[2]);
      expect(changeSpy.callCount).to.equal(1);
    });

    it('explicit association', async () => {
      const changeSpy = spy();
      const { container } = await render(
        <Field.Root name="apple">
          <CheckboxGroup defaultValue={['fuji-apple', 'gala-apple']}>
            <Field.Item>
              <Checkbox.Root value="fuji-apple" />
              <Field.Label>Fuji</Field.Label>
              <Field.Description>
                A fuji apple is the round, edible fruit of an apple tree
              </Field.Description>
            </Field.Item>
            <Field.Item>
              <Checkbox.Root value="gala-apple" onCheckedChange={changeSpy} />
              <Field.Label>Gala</Field.Label>
              <Field.Description>
                A gala apple is the round, edible fruit of an apple tree
              </Field.Description>
            </Field.Item>
          </CheckboxGroup>
        </Field.Root>,
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const labels = container.querySelectorAll('label');
      const descriptions = container.querySelectorAll('p');

      checkboxes.forEach((checkbox, index) => {
        const label = labels[index];
        const description = descriptions[index];

        expect(label.getAttribute('for')).to.not.equal(null);
        expect(label.getAttribute('for')).to.equal(checkbox.getAttribute('id'));
        expect(description.getAttribute('id')).to.not.equal(null);
        expect(description.getAttribute('id')).to.equal(checkbox.getAttribute('aria-describedby'));
      });

      fireEvent.click(screen.getByText('Gala'));
      expect(changeSpy.callCount).to.equal(1);
    });
  });

  describe.skipIf(isJSDOM)('Form', () => {
    it('includes the checkbox group value in form submission', async () => {
      const { getByRole } = await render(
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            expect(formData.getAll('apple')).to.deep.equal(['fuji-apple', 'gala-apple']);
          }}
        >
          <Field.Root name="apple">
            <CheckboxGroup defaultValue={['fuji-apple', 'gala-apple']}>
              <Field.Item>
                <Checkbox.Root value="fuji-apple" data-testid="button-1" />
              </Field.Item>
              <Field.Item>
                <Checkbox.Root value="gala-apple" data-testid="button-2" />
              </Field.Item>
              <Field.Item>
                <Checkbox.Root value="granny-smith-apple" data-testid="button-3" />
              </Field.Item>
            </CheckboxGroup>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      const submit = getByRole('button');
      fireEvent.click(submit);
    });

    it('is validated as a group upon form submission', async () => {
      const validateSpy = spy();
      const { getByRole } = await render(
        <Form
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <Field.Root name="apple" validate={validateSpy}>
            <CheckboxGroup defaultValue={['fuji-apple', 'gala-apple']}>
              <Field.Item>
                <Checkbox.Root value="fuji-apple" data-testid="button-1" />
              </Field.Item>
              <Field.Item>
                <Checkbox.Root value="gala-apple" data-testid="button-2" />
              </Field.Item>
              <Field.Item>
                <Checkbox.Root value="granny-smith-apple" data-testid="button-3" />
              </Field.Item>
            </CheckboxGroup>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      const submit = getByRole('button');
      fireEvent.click(submit);
      expect(validateSpy.callCount).to.equal(1);
      expect(validateSpy.args[0][0]).to.deep.equal(['fuji-apple', 'gala-apple']);
    });

    it('focuses the first checkbox when the field receives an error from Form', async () => {
      function App() {
        const [errors, setErrors] = React.useState<Form.Props['errors']>({});
        return (
          <Form
            errors={errors}
            onClearErrors={setErrors}
            onSubmit={(event) => {
              event.preventDefault();
              setErrors({ group: 'server error' });
            }}
          >
            <Field.Root name="group" data-testid="field">
              <CheckboxGroup defaultValue={['one']}>
                <Field.Item>
                  <Checkbox.Root value="one" />
                </Field.Item>
                <Field.Item>
                  <Checkbox.Root value="two" />
                </Field.Item>
              </CheckboxGroup>
              <Field.Error data-testid="error" />
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>
        );
      }

      const { user } = await render(<App />);
      expect(screen.queryByTestId('error')).to.equal(null);
      const submit = screen.getByText('Submit');
      await user.click(submit);

      const [checkbox1] = screen.getAllByRole('checkbox');
      expect(checkbox1).toHaveFocus();
      expect(checkbox1).to.have.attribute('aria-invalid', 'true');
      expect(screen.queryByTestId('error')).to.have.text('server error');
    });

    it('excludes parent checkboxes from form submission', async () => {
      const allValues = ['fuji-apple', 'gala-apple', 'granny-smith'];

      function App() {
        const [value, setValue] = React.useState<string[]>(['fuji-apple', 'gala-apple']);
        return (
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              expect(formData.getAll('apple')).to.deep.equal([
                'fuji-apple',
                'gala-apple',
                'granny-smith-apple',
              ]);
            }}
          >
            <Field.Root name="apple">
              <CheckboxGroup value={value} onValueChange={setValue} allValues={allValues}>
                <Field.Item>
                  <Checkbox.Root parent />
                </Field.Item>
                <Field.Item>
                  <Checkbox.Root value="fuji-apple" />
                </Field.Item>
                <Field.Item>
                  <Checkbox.Root value="gala-apple" />
                </Field.Item>
                <Field.Item>
                  <Checkbox.Root value="granny-smith-apple" />
                </Field.Item>
              </CheckboxGroup>
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>
        );
      }

      const { user } = await render(<App />);

      const [parentCheckbox, , , checkbox3] = screen.getAllByRole('checkbox');

      expect(parentCheckbox).to.have.attribute('aria-checked', 'mixed');

      await user.click(checkbox3);

      expect(parentCheckbox).to.have.attribute('aria-checked', 'true');

      const submit = screen.getByText('Submit');
      fireEvent.click(submit);
    });

    it('appends the id attribute of the error to aria-describedby of individual checkboxes', async () => {
      await render(
        <Form errors={{ group: 'error' }}>
          <Field.Root name="group">
            <CheckboxGroup defaultValue={['one']}>
              <Field.Item>
                <Checkbox.Root value="one" />
                <Field.Description>Description</Field.Description>
              </Field.Item>
              <Field.Item>
                <Checkbox.Root value="two" />
              </Field.Item>
            </CheckboxGroup>
            <Field.Error data-testid="error" />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );
      const error = screen.getByTestId('error');
      expect(error).to.not.equal(null);

      const [checkbox1] = screen.getAllByRole('checkbox');
      expect(checkbox1.getAttribute('aria-describedby')).to.include(error.getAttribute('id'));
      expect(checkbox1.getAttribute('aria-describedby')).to.include(
        screen.getByText('Description').getAttribute('id'),
      );
    });
  });
});
