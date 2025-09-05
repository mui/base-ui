import * as React from 'react';
import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { Combobox } from '@base-ui-components/react/combobox';
import { createRenderer } from '#test-utils';

describe('<Combobox.Value />', () => {
  const { render } = createRenderer();

  describe('prop: children', () => {
    it('renders current selected value via function child', async () => {
      await render(
        <Combobox.Root defaultValue="b">
          <Combobox.Value>{(val) => <div data-testid="value">{val}</div>}</Combobox.Value>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="a">a</Combobox.Item>
                  <Combobox.Item value="b">b</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('b');
    });

    it('renders function child with null when no value selected', async () => {
      await render(
        <Combobox.Root>
          <Combobox.Value>
            {(val) => <div data-testid="value">{val === null ? 'null' : String(val)}</div>}
          </Combobox.Value>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="a">a</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('null');
    });

    it('renders function child with complex objects', async () => {
      const complexValue = { id: 1, name: 'Test', nested: { data: 'value' } };

      await render(
        <Combobox.Root defaultValue={complexValue}>
          <Combobox.Value>
            {(val) => <div data-testid="value">{val ? `${val.name} (${val.id})` : 'No value'}</div>}
          </Combobox.Value>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value={complexValue}>Test Item</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('Test (1)');
    });

    it('overrides the value display when children is a static ReactNode', async () => {
      await render(
        <Combobox.Root defaultValue="test-value">
          <Combobox.Value>Custom Display Text</Combobox.Value>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="test-value">Test</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByText('Custom Display Text')).not.to.equal(null);
    });

    it('renders complex ReactNode children', async () => {
      await render(
        <Combobox.Root defaultValue="test">
          <Combobox.Value>
            <span data-testid="complex">
              <strong>Bold</strong> and <em>italic</em> text
            </span>
          </Combobox.Value>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="test">Test</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const element = screen.getByTestId('complex');
      expect(element.querySelector('strong')).to.have.text('Bold');
      expect(element.querySelector('em')).to.have.text('italic');
    });
  });

  describe('selected value with label property', () => {
    it('renders label from selected value object', async () => {
      const valueWithLabel = { value: 'test', label: 'Test Label' };

      await render(
        <Combobox.Root defaultValue={valueWithLabel}>
          <Combobox.Trigger data-testid="value">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value={valueWithLabel}>Test Item</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('Test Label');
    });

    it('renders ReactNode label from selected value object', async () => {
      const valueWithLabel = {
        value: 'test',
        label: <span data-testid="label-node">Formatted Label</span>,
      };

      await render(
        <Combobox.Root defaultValue={valueWithLabel}>
          <Combobox.Trigger data-testid="value">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value={valueWithLabel}>Test Item</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('label-node')).to.have.text('Formatted Label');
    });

    it('handles selected value with null label', async () => {
      const valueWithNullLabel = { value: 'test', label: null };

      await render(
        <Combobox.Root defaultValue={valueWithNullLabel}>
          <Combobox.Trigger data-testid="value">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value={valueWithNullLabel}>Test Item</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      // Should fall back to stringifyItem behavior
      expect(screen.getByTestId('value')).to.have.text('test');
    });
  });

  describe('items array format', () => {
    it('renders null item label from items array when no value selected', async () => {
      const items = [
        { value: null, label: 'Select item' },
        { value: 'a', label: 'A' },
      ];

      await render(
        <Combobox.Root items={items}>
          <Combobox.Trigger data-testid="value">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value={items[0]}>Select item</Combobox.Item>
                  <Combobox.Item value={items[1]}>A</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('Select item');
    });

    it('displays the label from items array when value is selected', async () => {
      const items = [
        { value: 'sans', label: 'Sans-serif' },
        { value: 'serif', label: 'Serif' },
        { value: 'mono', label: 'Monospace' },
      ];

      await render(
        <Combobox.Root defaultValue={items[1]} items={items}>
          <Combobox.Trigger data-testid="value">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value={items[0]}>Sans-serif</Combobox.Item>
                  <Combobox.Item value={items[1]}>Serif</Combobox.Item>
                  <Combobox.Item value={items[2]}>Monospace</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('Serif');
    });

    it('updates the label when value changes with items array', async () => {
      const items = [
        { value: 'sans', label: 'Sans-serif' },
        { value: 'serif', label: 'Serif' },
        { value: 'mono', label: 'Monospace' },
      ];

      function App() {
        const [value, setValue] = React.useState<(typeof items)[number] | null>(items[0]);
        return (
          <div>
            <button onClick={() => setValue(items[1])}>serif</button>
            <button onClick={() => setValue(items[2])}>mono</button>
            <button onClick={() => setValue(null)}>clear</button>
            <Combobox.Root value={value} onValueChange={setValue} items={items}>
              <Combobox.Trigger data-testid="value">
                <Combobox.Value />
              </Combobox.Trigger>
              <Combobox.Portal>
                <Combobox.Positioner>
                  <Combobox.Popup>
                    <Combobox.List>
                      <Combobox.Item value={items[0]}>Sans-serif</Combobox.Item>
                      <Combobox.Item value={items[1]}>Serif</Combobox.Item>
                      <Combobox.Item value={items[2]}>Monospace</Combobox.Item>
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
          </div>
        );
      }

      const { user } = await render(<App />);

      expect(screen.getByTestId('value')).to.have.text('Sans-serif');

      await user.click(screen.getByRole('button', { name: 'serif' }));
      expect(screen.getByTestId('value')).to.have.text('Serif');

      await user.click(screen.getByRole('button', { name: 'mono' }));
      expect(screen.getByTestId('value')).to.have.text('Monospace');

      await user.click(screen.getByRole('button', { name: 'clear' }));
      expect(screen.getByTestId('value')).to.have.text('');
    });

    it('supports ReactNode labels in items array', async () => {
      const items = [
        { value: 'bold', label: <strong>Bold Text</strong> },
        { value: 'italic', label: <em>Italic Text</em> },
      ];

      await render(
        <Combobox.Root defaultValue={items[0]} items={items}>
          <Combobox.Trigger data-testid="value">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value={items[0]}>Bold Text</Combobox.Item>
                  <Combobox.Item value={items[1]}>Italic Text</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value').querySelector('strong')).to.have.text('Bold Text');
    });

    it('handles duplicate values in items array (uses first match)', async () => {
      const items = [
        { value: 'test', label: 'First Label' },
        { value: 'test', label: 'Second Label' },
        { value: 'other', label: 'Other' },
      ];

      await render(
        <Combobox.Root defaultValue={items[0]} items={items}>
          <Combobox.Trigger data-testid="value">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value={items[0]}>First Label</Combobox.Item>
                  <Combobox.Item value={items[1]}>Second Label</Combobox.Item>
                  <Combobox.Item value={items[2]}>Other</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('First Label');
    });

    it('is not stale after items are updated', async () => {
      function App() {
        // Keep stable object identities for selected items
        const aRef = React.useRef({ value: 'a', label: 'a' });
        const bRef = React.useRef({ value: 'b', label: 'b' });
        const cRef = React.useRef<{ value: 'c'; label: string } | null>(null);

        const [value, setValue] = React.useState(aRef.current);
        const [items, setItems] = React.useState([aRef.current, bRef.current]);

        function updateItems() {
          // mutate the label but keep the same object identity for `a`
          aRef.current.label = 'a new';
          // introduce a new item `c` and keep reference to it for selection later
          cRef.current = { value: 'c', label: 'c' };
          setItems([aRef.current, bRef.current, cRef.current]);
        }

        return (
          <div>
            <button onClick={updateItems}>update</button>
            <button onClick={() => cRef.current && setValue(cRef.current)}>select c</button>
            <Combobox.Root value={value} onValueChange={setValue} items={items}>
              <Combobox.Trigger data-testid="value">
                <Combobox.Value />
              </Combobox.Trigger>
              <Combobox.Portal>
                <Combobox.Positioner>
                  <Combobox.Popup>
                    <Combobox.List>
                      {items.map((item) => (
                        <Combobox.Item key={item.value} value={item}>
                          {item.label}
                        </Combobox.Item>
                      ))}
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
          </div>
        );
      }

      const { user } = await render(<App />);

      expect(screen.getByTestId('value')).to.have.text('a');

      await user.click(screen.getByRole('button', { name: 'update' }));
      expect(screen.getByTestId('value')).to.have.text('a new');

      await user.click(screen.getByRole('button', { name: 'select c' }));
      expect(screen.getByTestId('value')).to.have.text('c');
    });
  });

  describe('grouped items', () => {
    it('handles grouped items correctly', async () => {
      const items = [
        {
          value: 'fonts',
          items: [
            { value: 'sans', label: 'Sans-serif' },
            { value: 'serif', label: 'Serif' },
          ],
        },
        {
          value: 'sizes',
          items: [
            { value: 'small', label: 'Small' },
            { value: 'large', label: 'Large' },
          ],
        },
      ];

      await render(
        <Combobox.Root defaultValue={items[0].items[1]} items={items}>
          <Combobox.Trigger data-testid="value">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Group items={items[0].items}>
                    <Combobox.Item value={items[0].items[0]}>Sans-serif</Combobox.Item>
                    <Combobox.Item value={items[0].items[1]}>Serif</Combobox.Item>
                  </Combobox.Group>
                  <Combobox.Group items={items[1].items}>
                    <Combobox.Item value={items[1].items[0]}>Small</Combobox.Item>
                    <Combobox.Item value={items[1].items[1]}>Large</Combobox.Item>
                  </Combobox.Group>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('Serif');
    });

    it('handles null items in grouped structure', async () => {
      const items = [
        {
          value: 'options',
          items: [
            { value: null, label: 'None selected' },
            { value: 'option1', label: 'Option 1' },
          ],
        },
      ];

      await render(
        <Combobox.Root items={items}>
          <Combobox.Trigger data-testid="value">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Group items={items[0].items}>
                    <Combobox.Item value={items[0].items[0]}>None selected</Combobox.Item>
                    <Combobox.Item value={items[0].items[1]}>Option 1</Combobox.Item>
                  </Combobox.Group>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('None selected');
    });
  });

  describe('primitive values', () => {
    it('handles string values correctly', async () => {
      await render(
        <Combobox.Root defaultValue="test-string">
          <Combobox.Trigger data-testid="value">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="test-string">Test String</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('test-string');
    });

    it('handles number values correctly', async () => {
      await render(
        <Combobox.Root defaultValue={42}>
          <Combobox.Trigger data-testid="value">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value={42}>Forty Two</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('42');
    });

    it('handles boolean values correctly', async () => {
      await render(
        <Combobox.Root defaultValue={true}>
          <Combobox.Trigger data-testid="value">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value={true}>True</Combobox.Item>
                  <Combobox.Item value={false}>False</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('true');
    });
  });

  describe('itemToStringLabel prop', () => {
    it('uses custom itemToStringLabel function', async () => {
      const customitemToStringLabel = (item: any) => {
        if (item && typeof item === 'object' && 'name' in item) {
          return `Custom: ${item.name}`;
        }
        return String(item);
      };

      const complexItem = { id: 1, name: 'Test Item' };

      await render(
        <Combobox.Root defaultValue={complexItem} itemToStringLabel={customitemToStringLabel}>
          <Combobox.Trigger data-testid="value">
            <Combobox.Value />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value={complexItem}>Test Item</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('Custom: Test Item');
    });
  });
});
