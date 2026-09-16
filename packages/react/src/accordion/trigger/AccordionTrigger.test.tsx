import { expect, describe, it } from 'vitest';
import { Accordion } from '@base-ui/react/accordion';
import { screen } from '@mui/internal-test-utils';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Accordion.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render: (node) =>
      render(
        <Accordion.Root>
          <Accordion.Item>{node}</Accordion.Item>
        </Accordion.Root>,
      ),
  }));

  it('keeps a non-native trigger tabbable', async () => {
    await render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger nativeButton={false} render={<span />}>
              Trigger
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    expect(trigger).toHaveAttribute('tabindex', '0');
  });

  it('does not render the root value as data-value', async () => {
    await render(
      <Accordion.Root value={['a', 'b']} multiple>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>header a</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>panel a</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Header>
            <Accordion.Trigger>header b</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>panel b</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const triggers = screen.getAllByRole('button');
    expect(triggers[0]).not.toHaveAttribute('data-value');
    expect(triggers[1]).not.toHaveAttribute('data-value');
  });

  it('renders data-index on every trigger including the first', async () => {
    await render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>first</Accordion.Trigger>
          </Accordion.Header>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>second</Accordion.Trigger>
          </Accordion.Header>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const triggers = screen.getAllByRole('button');
    expect(triggers[0]).toHaveAttribute('data-index', '0');
    expect(triggers[1]).toHaveAttribute('data-index', '1');
  });

  it('keeps data-panel-open instead of data-open', async () => {
    await render(
      <Accordion.Root value={['a']}>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>header a</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>panel a</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'header a' });
    expect(trigger).toHaveAttribute('data-panel-open');
    expect(trigger).not.toHaveAttribute('data-open');
  });
});
