import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { spy } from 'sinon';
import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Value />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Value />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Select.Root open>{node}</Select.Root>);
    },
  }));

  describe('prop: placeholder', () => {
    it('renders a placeholder when the value is null', async () => {
      await render(
        <Select.Root>
          <Select.Value placeholder="Select a font" />
        </Select.Root>,
      );
      expect(screen.getByText('Select a font')).not.to.equal(null);
    });
  });

  describe('prop: children', () => {
    it('accepts a function with label and value parameters', async () => {
      const children = spy();
      await render(
        <Select.Root value="1">
          <Select.Value placeholder="placeholder">{children}</Select.Value>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="1">one</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(children.args[0][0]).to.equal('placeholder');
      expect(children.args[0][1]).to.equal('1');
      expect(children.args[4][0]).to.equal('one'); // 5th render
    });
  });

  it('switches the label when the value changes', async () => {
    function App() {
      const [value, setValue] = React.useState<string | null>(null);
      return (
        <div>
          <button onClick={() => setValue('1')}>1</button>
          <button onClick={() => setValue('2')}>2</button>
          <button onClick={() => setValue(null)}>null</button>
          <Select.Root value={value} onValueChange={setValue}>
            <Select.Trigger>
              <Select.Value placeholder="Select a font" data-testid="value" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="1">1</Select.Item>
                  <Select.Item value="2">2</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </div>
      );
    }

    const { user } = await render(<App />);

    await user.click(screen.getByRole('button', { name: '1' }));
    expect(screen.getByTestId('value')).to.have.text('1');

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByTestId('value')).to.have.text('2');

    await user.click(screen.getByRole('button', { name: 'null' }));
    expect(screen.getByTestId('value')).to.have.text('Select a font');
  });
});
