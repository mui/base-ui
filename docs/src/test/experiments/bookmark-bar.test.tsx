// @vitest-environment jsdom

import * as React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createRenderer,
  fireEvent,
  ignoreActWarnings,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import BookmarkBarExperiment, {
  resolveTabTargetIntent,
} from '../../app/(private)/experiments/drag-engine/bookmark-bar';

describe('BookmarkBarExperiment', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', true);
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderExperiment() {
    return render(React.createElement(BookmarkBarExperiment));
  }

  it('associates tabs with persistent panels', async () => {
    const { user } = renderExperiment();
    const initialTab = screen.getByRole('tab', { name: 'Artificial intelligence' });
    const initialFrame = screen.getByTitle('Artificial intelligence');

    await user.click(screen.getByRole('button', { name: 'New tab' }));

    const panels = screen.getAllByRole('tabpanel', { hidden: true });
    expect(panels).toHaveLength(2);
    expect(initialTab).toHaveAttribute('aria-controls', panels[0].id);
    expect(panels[0]).toHaveAttribute('aria-labelledby', initialTab.id);
    expect(initialFrame).toBeInTheDocument();
    expect(initialFrame.closest('[role="tabpanel"]')).toHaveAttribute('hidden');

    await user.click(initialTab);

    expect(screen.getByTitle('Artificial intelligence')).toBe(initialFrame);
  });

  it('moves focus to the adjacent tab when the focused tab closes', async () => {
    const { user } = renderExperiment();
    const initialTab = screen.getByRole('tab', { name: 'Artificial intelligence' });

    await user.click(screen.getByRole('button', { name: 'New tab' }));
    await user.click(screen.getByRole('tab', { name: 'New tab' }));
    await user.keyboard('{Delete}');

    await waitFor(() => {
      expect(initialTab).toHaveFocus();
    });
  });

  it('moves focus to the new-tab button when the final tab closes', async () => {
    const { user } = renderExperiment();

    await user.click(screen.getByRole('tab', { name: 'Artificial intelligence' }));
    await user.keyboard('{Delete}');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'New tab' })).toHaveFocus();
    });
  });

  it('restores focus outside a closing bookmark menu after paste', async () => {
    // Menu's document-level pointer tracking updates after the synthetic click's act boundary.
    ignoreActWarnings();
    const { user } = renderExperiment();
    const scienceFolder = screen.getByRole('button', { name: 'Science' });

    fireEvent.click(scienceFolder);
    const physics = await screen.findByRole('menuitem', { name: 'Physics' });
    physics.focus();
    await user.keyboard('{Control>}c{/Control}');
    await user.keyboard('{Control>}v{/Control}');

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(scienceFolder).toHaveFocus();
    });
  });
});

describe('resolveTabTargetIntent', () => {
  const target = { index: 2, tabId: 'tab-3' };

  it('uses pointer quarters for insertion and the middle for replacement', () => {
    expect(resolveTabTargetIntent(target, 0.2, true)).toEqual({ type: 'insert', index: 2 });
    expect(resolveTabTargetIntent(target, 0.5, true)).toEqual({
      type: 'replace',
      tabId: 'tab-3',
    });
    expect(resolveTabTargetIntent(target, 0.8, true)).toEqual({ type: 'insert', index: 3 });
  });

  it('uses keyboard travel direction for tab reordering', () => {
    expect(resolveTabTargetIntent(target, 0.5, false, -1)).toEqual({
      type: 'insert',
      index: 2,
    });
    expect(resolveTabTargetIntent(target, 0.5, false, 1)).toEqual({
      type: 'insert',
      index: 3,
    });
  });

  it('lets keyboard users choose replacement or insertion', () => {
    expect(resolveTabTargetIntent(target, 0.5, true, 1)).toEqual({
      type: 'replace',
      tabId: 'tab-3',
    });
    expect(resolveTabTargetIntent(target, 0.5, true, 1, true)).toEqual({
      type: 'insert',
      index: 3,
    });
  });
});
