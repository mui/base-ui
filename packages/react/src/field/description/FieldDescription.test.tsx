import { Field } from '@base-ui/react/field';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { describeConformance } from '../../../test/describeConformance';

describe('<Field.Description />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Description />, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render(node) {
      return render(<Field.Root>{node}</Field.Root>);
    },
  }));

  it('should set aria-describedby on the control automatically', () => {
    render(
      <Field.Root>
        <Field.Control />
        <Field.Description>Message</Field.Description>
      </Field.Root>,
    );

    expect(screen.getByRole('textbox')).to.have.attribute(
      'aria-describedby',
      screen.getByText('Message').id,
    );
  });
});
