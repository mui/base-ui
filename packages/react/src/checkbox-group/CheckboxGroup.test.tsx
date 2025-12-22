import * as React from 'react';
import { createRenderer, screen, fireEvent } from '@mui/internal-test-utils';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Checkbox } from '@base-ui/react/checkbox';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
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

      expect(red).to.have.attribute('aria-disabled', 'true');
      expect(green).to.have.attribute('aria-disabled', 'true');
      expect(blue).to.have.attribute('aria-disabled', 'true');
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

      expect(red).not.to.have.attribute('aria-disabled', 'true');
      expect(green).not.to.have.attribute('aria-disabled', 'true');
      expect(blue).not.to.have.attribute('aria-disabled', 'true');
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

      expect(red).to.have.attribute('aria-disabled', 'true');
      expect(green).to.have.attribute('aria-disabled', 'true');
      expect(blue).to.have.attribute('aria-disabled', 'true');
    });
  });

  describe('Field', () => {
    it('prop: validationMode=onSubmit', async () => {
      const validateSpy = spy((value) => {
        const v = value as string[];
        if (v.length === 0) {
          return 'custom error 1';
        }
        if (v.length < 2) {
          return 'custom error 2';
        }
        if (v.includes('two')) {
          return 'custom error 3';
        }
        return null;
      });
      const { user } = render(
        <Form>
          <Field.Root validate={validateSpy} name="test">
            <CheckboxGroup defaultValue={[]}>
              <Field.Item>
                <Checkbox.Root value="one" data-testid="checkbox" />
              </Field.Item>
              <Field.Item>
                <Checkbox.Root value="two" data-testid="checkbox" />
              </Field.Item>
              <Field.Item>
                <Checkbox.Root value="three" data-testid="checkbox" />
              </Field.Item>
            </CheckboxGroup>
          </Field.Root>
          <button type="submit">submit</button>
        </Form>,
      );

      const checkboxes = screen.getAllByTestId('checkbox');
      const [checkbox1, checkbox2, checkbox3] = checkboxes;
      checkboxes.forEach((checkbox) => expect(checkbox).to.not.have.attribute('aria-invalid'));

      await user.click(checkbox2);
      checkboxes.forEach((checkbox) => expect(checkbox).to.not.have.attribute('aria-invalid'));

      await user.click(screen.getByText('submit'));
      checkboxes.forEach((checkbox) => expect(checkbox).to.have.attribute('aria-invalid'));

      await user.click(checkbox1);
      expect(validateSpy.lastCall.args[0]).to.deep.equal(['two', 'one']);
      checkboxes.forEach((checkbox) => expect(checkbox).to.have.attribute('aria-invalid'));
      await user.click(checkbox2);
      await user.click(checkbox3);
      expect(validateSpy.lastCall.args[0]).to.deep.equal(['one', 'three']);
      checkboxes.forEach((checkbox) => expect(checkbox).to.not.have.attribute('aria-invalid'));
    });

    it('prop: validationMode=onChange', async () => {
      const validateSpy = spy((value) => {
        const v = value as string[];
        return v.includes('one') ? 'error' : null;
      });
      render(
        <Field.Root validationMode="onChange" validate={validateSpy} name="apple">
          <CheckboxGroup defaultValue={['one']}>
            <Field.Item>
              <Checkbox.Root value="one" data-testid="checkbox" />
            </Field.Item>
            <Field.Item>
              <Checkbox.Root value="two" data-testid="checkbox" />
            </Field.Item>
            <Field.Item>
              <Checkbox.Root value="three" data-testid="checkbox" />
            </Field.Item>
          </CheckboxGroup>
        </Field.Root>,
      );

      const checkboxes = screen.getAllByTestId('checkbox');
      const [checkbox1, checkbox2, checkbox3] = checkboxes;

      checkboxes.forEach((checkbox) => expect(checkbox).to.not.have.attribute('aria-invalid'));

      fireEvent.click(checkbox1);
      checkboxes.forEach((checkbox) => expect(checkbox).to.not.have.attribute('aria-invalid'));
      expect(validateSpy.callCount).to.equal(1);
      expect(validateSpy.lastCall.args[0]).to.deep.equal([]);

      fireEvent.click(checkbox2);
      checkboxes.forEach((checkbox) => expect(checkbox).to.not.have.attribute('aria-invalid'));
      expect(validateSpy.callCount).to.equal(2);
      expect(validateSpy.lastCall.args[0]).to.deep.equal(['two']);

      fireEvent.click(checkbox1);
      checkboxes.forEach((checkbox) => expect(checkbox).to.have.attribute('aria-invalid', 'true'));
      expect(validateSpy.callCount).to.equal(3);
      expect(validateSpy.lastCall.args[0]).to.deep.equal(['two', 'one']);

      fireEvent.click(checkbox3);
      checkboxes.forEach((checkbox) => expect(checkbox).to.have.attribute('aria-invalid', 'true'));
    });

    it('revalidates when the controlled value changes externally', async () => {
      const validateSpy = spy((value: unknown) => {
        const values = value as string[];
        return values.includes('one') ? 'error' : null;
      });

      function App() {
        const [selected, setSelected] = React.useState<string[]>([]);

        return (
          <React.Fragment>
            <Field.Root validationMode="onChange" validate={validateSpy} name="apple">
              <CheckboxGroup value={selected}>
                <Field.Item>
                  <Checkbox.Root value="one" data-testid="checkbox" />
                </Field.Item>
                <Field.Item>
                  <Checkbox.Root value="two" data-testid="checkbox" />
                </Field.Item>
              </CheckboxGroup>
            </Field.Root>
            <button type="button" onClick={() => setSelected(['one'])}>
              Select externally
            </button>
          </React.Fragment>
        );
      }

      render(<App />);

      const checkboxes = screen.getAllByTestId('checkbox');
      const toggle = screen.getByText('Select externally');

      checkboxes.forEach((checkbox) => expect(checkbox).not.to.have.attribute('aria-invalid'));
      const initialCallCount = validateSpy.callCount;

      fireEvent.click(toggle);

      expect(validateSpy.callCount).to.equal(initialCallCount + 1);
      expect(validateSpy.lastCall.args[0]).to.deep.equal(['one']);
      checkboxes.forEach((checkbox) => expect(checkbox).to.have.attribute('aria-invalid', 'true'));
    });

    it('prop: validationMode=onBlur', async () => {
      const validateSpy = spy((value) => {
        const v = value as string[];
        return v.includes('one') ? 'error' : null;
      });
      render(
        <Field.Root validationMode="onBlur" validate={validateSpy} name="apple">
          <CheckboxGroup defaultValue={['one']}>
            <Field.Item>
              <Checkbox.Root value="one" data-testid="checkbox" />
            </Field.Item>
            <Field.Item>
              <Checkbox.Root value="two" data-testid="checkbox" />
            </Field.Item>
            <Field.Item>
              <Checkbox.Root value="three" data-testid="checkbox" />
            </Field.Item>
          </CheckboxGroup>
          <Field.Error data-testid="error" />
        </Field.Root>,
      );

      const checkboxes = screen.getAllByTestId('checkbox');
      const [checkbox1, , checkbox3] = checkboxes;

      checkboxes.forEach((checkbox) => expect(checkbox).to.not.have.attribute('aria-invalid'));

      fireEvent.click(checkbox1);
      expect(validateSpy.callCount).to.equal(0);
      fireEvent.blur(checkbox1);
      expect(validateSpy.callCount).to.equal(1);
      expect(validateSpy.lastCall.args[0]).to.deep.equal([]);

      checkboxes.forEach((checkbox) => expect(checkbox).to.not.have.attribute('aria-invalid'));

      fireEvent.click(checkbox3);
      expect(validateSpy.callCount).to.equal(1);
      fireEvent.blur(checkbox3);
      expect(validateSpy.callCount).to.equal(2);
      expect(validateSpy.lastCall.args[0]).to.deep.equal(['three']);

      checkboxes.forEach((checkbox) => expect(checkbox).to.not.have.attribute('aria-invalid'));

      fireEvent.click(checkbox1);
      expect(validateSpy.callCount).to.equal(2);
      fireEvent.blur(checkbox1);
      expect(validateSpy.callCount).to.equal(3);
      expect(validateSpy.lastCall.args[0]).to.deep.equal(['three', 'one']);

      checkboxes.forEach((checkbox) => expect(checkbox).to.have.attribute('aria-invalid', 'true'));
    });
  });

  describe('Field.Label', () => {
    it('implicit association', async () => {
      const changeSpy = spy();
      render(
        <Field.Root name="apple">
          <CheckboxGroup defaultValue={['fuji-apple', 'gala-apple']}>
            <Field.Item>
              <Field.Label data-testid="label">
                <Checkbox.Root value="fuji-apple" />
                Fuji
              </Field.Label>
            </Field.Item>
            <Field.Item>
              <Field.Label data-testid="label">
                <Checkbox.Root value="gala-apple" />
                Gala
              </Field.Label>
            </Field.Item>
            <Field.Item>
              <Field.Label data-testid="label">
                <Checkbox.Root value="granny-smith-apple" onCheckedChange={changeSpy} />
                Granny Smith
              </Field.Label>
            </Field.Item>
          </CheckboxGroup>
        </Field.Root>,
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const labels = screen.getAllByTestId('label');
      const inputs = document.querySelectorAll('input[type="checkbox"]');

      checkboxes.forEach((checkbox, index) => {
        const label = labels[index];
        const input = inputs[index];

        expect(label.getAttribute('for')).to.not.equal(null);
        expect(label.getAttribute('for')).to.equal(input.getAttribute('id'));
        expect(label.getAttribute('id')).to.not.equal(null);
        expect(label.getAttribute('id')).to.equal(checkbox.getAttribute('aria-labelledby'));
      });

      fireEvent.click(labels[2]);
      expect(changeSpy.callCount).to.equal(1);
    });

    it('explicit association', async () => {
      const changeSpy = spy();

      await render(
        <Field.Root name="apple">
          <CheckboxGroup defaultValue={['fuji-apple', 'gala-apple']}>
            <Field.Item>
              <Checkbox.Root value="fuji-apple" />
              <Field.Label data-testid="label">Fuji</Field.Label>
              <Field.Description data-testid="description">
                A fuji apple is the round, edible fruit of an apple tree
              </Field.Description>
            </Field.Item>
            <Field.Item>
              <Checkbox.Root value="gala-apple" onCheckedChange={changeSpy} />
              <Field.Label data-testid="label">Gala</Field.Label>
              <Field.Description data-testid="description">
                A gala apple is the round, edible fruit of an apple tree
              </Field.Description>
            </Field.Item>
          </CheckboxGroup>
        </Field.Root>,
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const labels = screen.getAllByTestId('label');
      const descriptions = screen.getAllByTestId('description');
      const inputs = document.querySelectorAll('input[type="checkbox"]');

      checkboxes.forEach((checkbox, index) => {
        const label = labels[index];
        const description = descriptions[index];
        const input = inputs[index];

        expect(label.getAttribute('for')).to.not.equal(null);
        expect(label.getAttribute('for')).to.equal(input.getAttribute('id'));
        expect(label.getAttribute('id')).to.not.equal(null);
        expect(label.getAttribute('id')).to.equal(checkbox.getAttribute('aria-labelledby'));
        expect(description.getAttribute('id')).to.not.equal(null);
        expect(description.getAttribute('id')).to.equal(checkbox.getAttribute('aria-describedby'));
      });

      fireEvent.click(screen.getByText('Gala'));
      expect(changeSpy.callCount).to.equal(1);
    });
  });

  describe('Field.Description', () => {
    it('links the group and individual checkboxes', async () => {
      await render(
        <Field.Root name="apple">
          <CheckboxGroup defaultValue={[]}>
            <Field.Description data-testid="group-description">Group description</Field.Description>
            <Field.Item>
              <Field.Label>
                <Checkbox.Root value="fuji-apple" />
                Fuji
              </Field.Label>
            </Field.Item>
          </CheckboxGroup>
        </Field.Root>,
      );

      const groupDescription = screen.getByTestId('group-description');
      const groupDescriptionId = groupDescription.getAttribute('id');
      expect(groupDescriptionId).to.not.equal(null);
      expect(screen.getByRole('group').getAttribute('aria-describedby')).to.include(
        groupDescriptionId,
      );
      expect(screen.getByRole('checkbox').getAttribute('aria-describedby')).to.include(
        groupDescriptionId,
      );
    });
  });

  describe.skipIf(isJSDOM)('Form', () => {
    it('includes the checkbox group value in form submission', async () => {
      render(
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

      const submit = screen.getByRole('button');
      fireEvent.click(submit);
    });

    it('is validated as a group upon form submission', async () => {
      const validateSpy = spy();

      render(
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

      const submit = screen.getByRole('button');
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

      const { user } = render(<App />);
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

      const { user } = render(<App />);

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
