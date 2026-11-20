import { describe, expect, it, vi } from 'vitest';
import { PopupTreeRegistry } from '../../utils/popups/tree/PopupTreeRegistry';
import { getMenuTreeEvents } from './menuTreeEvents';

describe('getMenuTreeEvents', () => {
  it('returns the same events for the same popup tree', () => {
    const tree = new PopupTreeRegistry();
    const listener = vi.fn();

    getMenuTreeEvents(tree).on('nodeItemHover', listener);
    getMenuTreeEvents(tree).emit('nodeItemHover', { nodeId: 'menu', target: null });

    expect(listener).toHaveBeenCalledWith({ nodeId: 'menu', target: null });
  });

  it('keeps the events of different popup trees apart', () => {
    const listener = vi.fn();
    getMenuTreeEvents(new PopupTreeRegistry()).on('nodeItemHover', listener);

    getMenuTreeEvents(new PopupTreeRegistry()).emit('nodeItemHover', {
      nodeId: 'menu',
      target: null,
    });

    expect(listener).not.toHaveBeenCalled();
  });
});
