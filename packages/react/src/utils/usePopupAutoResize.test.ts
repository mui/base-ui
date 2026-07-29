import { expect } from 'vitest';
import { getPopupAnchoringStyles } from './usePopupAutoResize';

describe('getPopupAnchoringStyles', () => {
  it('pins a physical-left popup to its right edge so it grows toward the anchor', () => {
    expect(getPopupAnchoringStyles('left', 'ltr')).toEqual({
      position: 'absolute',
      top: '0',
      right: '0',
    });
    expect(getPopupAnchoringStyles('left', 'rtl')).toEqual({
      position: 'absolute',
      top: '0',
      right: '0',
    });
  });

  it('pins a top popup to its bottom edge', () => {
    const expected = { position: 'absolute', bottom: '0', left: '0' };
    expect(getPopupAnchoringStyles('top', 'ltr')).toEqual(expected);
    expect(getPopupAnchoringStyles('top', 'rtl')).toEqual(expected);
  });

  it('returns no styles for sides that keep the default top-left origin', () => {
    expect(getPopupAnchoringStyles('bottom', 'ltr')).toEqual({});
    expect(getPopupAnchoringStyles('bottom', 'rtl')).toEqual({});
    expect(getPopupAnchoringStyles('right', 'ltr')).toEqual({});
    expect(getPopupAnchoringStyles('right', 'rtl')).toEqual({});
  });

  it('maps logical sides to physical-left anchoring per direction', () => {
    const leftAnchor = { position: 'absolute', top: '0', right: '0' };

    expect(getPopupAnchoringStyles('inline-start', 'ltr')).toEqual(leftAnchor);
    expect(getPopupAnchoringStyles('inline-end', 'ltr')).toEqual({});

    expect(getPopupAnchoringStyles('inline-end', 'rtl')).toEqual(leftAnchor);
    expect(getPopupAnchoringStyles('inline-start', 'rtl')).toEqual({});
  });
});
