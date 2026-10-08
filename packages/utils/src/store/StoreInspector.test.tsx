import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { Store } from './Store';
import { StoreInspector } from './StoreInspector';

describe('StoreInspector', () => {
  const { render } = createRenderer();

  it('marks a reference back to the store reached through a Map as circular', async () => {
    const state: { owners: Map<string, { store: Store<unknown> }> } = { owners: new Map() };
    const store = new Store(state);
    state.owners.set('owner', { store });

    await render(<StoreInspector store={store} defaultOpen />);

    expect(screen.getByText(/\[circular reference\]/)).not.toBe(null);
  });
});
