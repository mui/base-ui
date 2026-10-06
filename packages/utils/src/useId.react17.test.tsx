import { expect, vi } from 'vitest';
import * as React from 'react';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { useId } from '@base-ui/utils/useId';

vi.mock('@base-ui/utils/safeReact', async (importOriginal) => {
  const original = await importOriginal<typeof import('@base-ui/utils/safeReact')>();

  return {
    SafeReact: {
      ...original.SafeReact,
      captureOwnerStack: undefined,
      useId: undefined,
    },
  };
});

interface TestComponentProps {
  id?: string;
  prefix?: string;
}

describe('useId with the React 17 id fallback', () => {
  const { render, renderToString } = createRenderer();
  const { render: renderNonStrict } = createRenderer({ strict: false });

  let renderedIds: (string | undefined)[] = [];

  function lastRenderedId() {
    return renderedIds[renderedIds.length - 1];
  }

  function TestComponent({ id: idProp, prefix }: TestComponentProps) {
    const id = useId(idProp, prefix);
    renderedIds.push(id);
    return <span data-testid="target" id={id} />;
  }

  beforeEach(() => {
    renderedIds = [];
  });

  it('returns the provided id', () => {
    render(<TestComponent id="some-id" />);

    expect(screen.getByTestId('target')).toHaveProperty('id', 'some-id');
  });

  it("generates an id if one isn't provided", () => {
    render(<TestComponent />);

    expect(screen.getByTestId('target').id).toMatch(/^mui-\d+$/);
  });

  it('generates an id with the provided prefix', () => {
    render(<TestComponent prefix="base-ui" />);

    expect(screen.getByTestId('target').id).toMatch(/^base-ui-\d+$/);
  });

  it('generates an id when the provided id is removed', () => {
    const { setProps } = render(<TestComponent id="some-id" />);

    expect(screen.getByTestId('target')).toHaveProperty('id', 'some-id');

    setProps({ id: undefined });

    expect(screen.getByTestId('target').id).toMatch(/^mui-\d+$/);
  });

  // Every render is inspected rather than just the resulting DOM.
  // `act()` flushes a deferred fallback before the assertion runs, so a lazily generated id
  // is indistinguishable from the outside even though it leaves one commit with no id.
  it('never renders without an id once the provided id is removed', () => {
    const { setProps } = render(<TestComponent id="some-id" />);

    renderedIds = [];

    setProps({ id: undefined });

    expect(renderedIds).not.toContain(undefined);
  });

  // Rendered without StrictMode so the assertion counts real passes rather than
  // React's development-only double render.
  it('does not rerender after mounting with a provided id', () => {
    renderNonStrict(<TestComponent id="some-id" />);

    expect(renderedIds).toEqual(['some-id']);
  });

  it('keeps the generated id when the provided id is added and removed again', () => {
    const { setProps } = render(<TestComponent />);

    const generatedId = screen.getByTestId('target').id;

    expect(generatedId).toMatch(/^mui-\d+$/);

    setProps({ id: 'some-id' });

    expect(screen.getByTestId('target')).toHaveProperty('id', 'some-id');

    setProps({ id: undefined });

    expect(screen.getByTestId('target')).toHaveProperty('id', generatedId);
  });

  it('does not regenerate the id on subsequent renders', () => {
    const { setProps } = render(<TestComponent />);

    const generatedId = screen.getByTestId('target').id;

    setProps({});

    expect(screen.getByTestId('target')).toHaveProperty('id', generatedId);
  });

  it('returns an empty string id override as-is', () => {
    const { setProps } = render(<TestComponent />);

    expect(screen.getByTestId('target').id).toMatch(/^mui-\d+$/);

    setProps({ id: '' });

    expect(lastRenderedId()).toBe('');
  });

  it('matches the server markup on the first client render', () => {
    const { hydrate } = renderToString(<TestComponent />);

    renderedIds = [];

    hydrate();

    // The server emits no id, so generating the fallback any earlier than the passive
    // effect would put an id on the first client pass and mismatch the markup.
    expect(renderedIds[0]).toBe(undefined);
    expect(screen.getByTestId('target').id).toMatch(/^mui-\d+$/);
  });

  it('returns undefined on the server', () => {
    renderToString(<TestComponent />);

    expect(lastRenderedId()).toBe(undefined);
    expect(screen.getByTestId('target')).not.toHaveAttribute('id');
  });
});
