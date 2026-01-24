import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { Field } from '@base-ui/react/field';
import { expect } from 'chai';
import { describeConformance } from '../../../test/describeConformance';

describe('<Field.Control />', () => {
  const { render } = createRenderer();
  const { render: renderNonStrict } = createRenderer({ strict: false });

  describeConformance(<Field.Control />, () => ({
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(<Field.Root>{node}</Field.Root>);
    },
  }));

  it('avoids rerendering for uncontrolled input changes', async () => {
    const renderCountRef = { current: 0 };

    function RenderCountedControl() {
      renderCountRef.current += 1;
      return <Field.Control data-testid="control" />;
    }

    renderNonStrict(
      <Field.Root>
        <RenderCountedControl />
      </Field.Root>,
    );

    const control = screen.getByTestId('control');
    const initialRenderCount = renderCountRef.current;

    fireEvent.change(control, { target: { value: 'a' } });
    const afterFirstChange = renderCountRef.current;

    fireEvent.change(control, { target: { value: 'ab' } });
    fireEvent.change(control, { target: { value: 'abc' } });

    expect(renderCountRef.current).to.equal(afterFirstChange);
    expect(afterFirstChange).to.be.at.most(initialRenderCount + 1);
  });
});
