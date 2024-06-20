import * as React from 'react';

import { useAnchorPositioning } from '../../../packages/mui-base/src/utils/useAnchorPositioning';

const oppositeSideMap = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
} as const;

export default function AnchorPositioning() {
  const [size, setSize] = React.useState<'xs' | 's' | 'm' | 'l' | 'xl'>('xs');
  const [side, setSide] = React.useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [alignment, setAlignment] = React.useState<'start' | 'center' | 'end'>('center');
  const [sideOffset, setSideOffset] = React.useState(0);
  const [alignmentOffset, setAlignmentOffset] = React.useState(0);
  const [collisionPadding, setCollisionPadding] = React.useState(5);
  const [hideWhenDetached, setHideWhenDetached] = React.useState(false);
  const [arrow, setArrow] = React.useState(true);
  const [hideArrowWhenUncentered, setHideArrowWhenUncentered] = React.useState(false);
  const [sticky, setSticky] = React.useState(false);

  const { positionerStyles, refs, arrowStyles, arrowRef, renderedSide, arrowUncentered } =
    useAnchorPositioning({
      side,
      alignment,
      sideOffset,
      alignmentOffset,
      collisionPadding,
      hideWhenDetached,
      sticky,
    });

  return (
    <div style={{ fontFamily: 'sans-serif', margin: 50 }}>
      <h1>Anchor Positioning Playground</h1>
      <div style={{ display: 'flex', gap: 20 }}>
        <div
          style={{
            overflow: 'auto',
            background: 'black',
            position: 'relative',
            width: 375,
            height: 800,
          }}
        >
          <div style={{ width: 1000, height: 1000 }} />
          <div
            ref={refs.setReference}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 50,
              height: 50,
              background: 'tomato',
              position: 'relative',
              left: 450,
              fontFamily: 'sans-serif',
              color: 'white',
            }}
          >
            A
          </div>
          <div ref={refs.setFloating} style={positionerStyles}>
            <div
              style={{
                background: 'white',
                maxWidth: 'var(--available-width)',
                maxHeight: 'var(--available-height)',
                overflow: 'auto',
                boxSizing: 'border-box',
                padding: 10,
              }}
            >
              {`Content `.repeat(
                {
                  xs: 1,
                  s: 3,
                  m: 10,
                  l: 50,
                  xl: 200,
                }[size],
              )}
            </div>
            {arrow && (
              <div
                ref={arrowRef as React.RefObject<HTMLDivElement>}
                style={{
                  ...arrowStyles,
                  background: 'rgba(0, 0, 255, 0.5)',
                  width: 20,
                  height: 20,
                  [oppositeSideMap[renderedSide]]: -10,
                  ...(arrowUncentered && hideArrowWhenUncentered && { visibility: 'hidden' }),
                }}
              />
            )}
          </div>
          <div style={{ width: 1000, height: 1000 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <fieldset>
            <legend>Content Size</legend>
            {(['xs', 's', 'm', 'l', 'xl'] as const).map((s) => (
              <label>
                <input name="size" type="radio" checked={s === size} onChange={() => setSize(s)} />
                {s}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Side</legend>
            {(['top', 'bottom', 'left', 'right'] as const).map((s) => (
              <label>
                <input name="side" type="radio" checked={s === side} onChange={() => setSide(s)} />
                {s}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Alignment</legend>
            {(['start', 'center', 'end'] as const).map((a) => (
              <label>
                <input
                  name="alignment"
                  type="radio"
                  checked={a === alignment}
                  onChange={() => setAlignment(a)}
                />
                {a}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Side Offset</legend>
            <input
              type="range"
              min={0}
              max={50}
              value={sideOffset}
              onChange={(e) => setSideOffset(Number(e.target.value))}
            />
            {sideOffset}
          </fieldset>

          <fieldset>
            <legend>Alignment Offset</legend>
            <input
              type="range"
              min={0}
              max={50}
              value={alignmentOffset}
              onChange={(e) => setAlignmentOffset(Number(e.target.value))}
            />
            {alignmentOffset}
          </fieldset>

          <fieldset>
            <legend>Collision Padding</legend>
            <input
              type="range"
              min={0}
              max={50}
              value={collisionPadding}
              onChange={(e) => setCollisionPadding(Number(e.target.value))}
            />
            {collisionPadding}
          </fieldset>

          <label>
            <input
              type="checkbox"
              checked={hideWhenDetached}
              onChange={() => setHideWhenDetached((prev) => !prev)}
            />
            Hide when detached
          </label>

          <label>
            <input type="checkbox" checked={arrow} onChange={() => setArrow((prev) => !prev)} />
            Arrow
          </label>

          <label>
            <input
              type="checkbox"
              checked={hideArrowWhenUncentered}
              onChange={() => setHideArrowWhenUncentered((prev) => !prev)}
            />
            Hide arrow when uncentered
          </label>

          <label>
            <input type="checkbox" checked={sticky} onChange={() => setSticky((prev) => !prev)} />
            Sticky
          </label>
        </div>
      </div>
    </div>
  );
}
