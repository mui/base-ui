import { expect, describe, it } from 'vitest';
import { Field } from '@base-ui/react/field';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Field.Description />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Description />, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render(node) {
      return render(<Field.Root>{node}</Field.Root>);
    },
  }));

  it('should set aria-describedby on the control automatically', async () => {
    await render(
      <Field.Root>
        <Field.Control />
        <Field.Description>Message</Field.Description>
      </Field.Root>,
    );

    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      screen.getByText('Message').id,
    );
  });

  it('should preserve user aria-describedby values on the control', async () => {
    await render(
      <Field.Root>
        <Field.Control aria-describedby="external-description" />
        <Field.Description>Message</Field.Description>
      </Field.Root>,
    );

    expect(screen.getByRole('textbox').getAttribute('aria-describedby')).toBe(
      `external-description ${screen.getByText('Message').id}`,
    );
  });

  it('does not register an empty description id', async () => {
    await render(
      <Field.Root>
        <Field.Control aria-describedby="external-description" />
        <Field.Description id="">Message</Field.Description>
      </Field.Root>,
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'external-description');
  });

  it('reflects the disabled state from Field.Item', async () => {
    await render(
      <Field.Root>
        <Field.Item disabled>
          <Field.Description data-testid="description">Message</Field.Description>
        </Field.Item>
      </Field.Root>,
    );

    expect(screen.getByTestId('description')).toHaveAttribute('data-disabled');
  });
});
