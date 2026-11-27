import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Fieldset.Description />', () => {
  const { render } = createRenderer();

  describeConformance(<Fieldset.Description />, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render(node) {
      return render(<Fieldset.Root>{node}</Fieldset.Root>);
    },
  }));

  it('sets aria-describedby on the fieldset automatically', async () => {
    await render(
      <Fieldset.Root>
        <Fieldset.Legend>Legend</Fieldset.Legend>
        <Fieldset.Description data-testid="description">Description</Fieldset.Description>
      </Fieldset.Root>,
    );

    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-describedby',
      screen.getByTestId('description').id,
    );
    expect(screen.getByRole('group')).toHaveAccessibleDescription('Description');
  });

  it('sets aria-describedby on the fieldset with a custom id', async () => {
    await render(
      <Fieldset.Root>
        <Fieldset.Description id="description-id" />
      </Fieldset.Root>,
    );

    expect(screen.getByRole('group')).toHaveAttribute('aria-describedby', 'description-id');
  });

  it('supports multiple descriptions', async () => {
    await render(
      <Fieldset.Root>
        <Fieldset.Description id="first" />
        <Fieldset.Description id="second" />
      </Fieldset.Root>,
    );

    expect(screen.getByRole('group')).toHaveAttribute('aria-describedby', 'first second');
  });

  it('preserves user aria-describedby values on the fieldset', async () => {
    await render(
      <Fieldset.Root aria-describedby="custom">
        <Fieldset.Description id="description-id" />
      </Fieldset.Root>,
    );

    expect(screen.getByRole('group')).toHaveAttribute('aria-describedby', 'custom description-id');
  });

  it('does not set aria-describedby without a description', async () => {
    await render(<Fieldset.Root />);

    expect(screen.getByRole('group')).not.toHaveAttribute('aria-describedby');
  });

  it('removes the association when the description unmounts', async () => {
    function App() {
      const [show, setShow] = React.useState(true);
      return (
        <Fieldset.Root>
          {show && <Fieldset.Description id="description-id" />}
          <button onClick={() => setShow(false)}>hide</button>
        </Fieldset.Root>
      );
    }
    await render(<App />);

    expect(screen.getByRole('group')).toHaveAttribute('aria-describedby', 'description-id');

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('group')).not.toHaveAttribute('aria-describedby');
  });

  it('describes a checkbox group rendered as the fieldset', async () => {
    await render(
      <Field.Root>
        <Fieldset.Root render={<CheckboxGroup />}>
          <Fieldset.Legend>Fruits</Fieldset.Legend>
          <Fieldset.Description>Pick any</Fieldset.Description>
        </Fieldset.Root>
      </Field.Root>,
    );

    expect(screen.getByRole('group')).toHaveAccessibleName('Fruits');
    expect(screen.getByRole('group')).toHaveAccessibleDescription('Pick any');
  });

  it('reflects the disabled state', async () => {
    await render(
      <Fieldset.Root disabled>
        <Fieldset.Description data-testid="description" />
      </Fieldset.Root>,
    );

    expect(screen.getByTestId('description')).toHaveAttribute('data-disabled');
  });
});
