'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { useAnchorPositioning } from '../../../../../packages/react/src/utils/useAnchorPositioning';

const oppositeSideMap = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
  'inline-start': 'right',
  'inline-end': 'left',
} as const;

type Size = 'xs' | 's' | 'm' | 'l' | 'xl';

export default function AnchorPositioning() {
  const [popupSize, setPopupSize] = React.useState<Size>('xs');
  const [anchorSize, setAnchorSize] = React.useState<Size>('m');
  const [side, setSide] = React.useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [align, setAlign] = React.useState<'start' | 'center' | 'end'>('center');
  const [sideOffset, setSideOffset] = React.useState(0);
  const [alignOffset, setAlignOffset] = React.useState(0);
  const [collisionPadding, setCollisionPadding] = React.useState(5);
  const [arrowPadding, setArrowPadding] = React.useState(5);
  const [arrow, setArrow] = React.useState(true);
  const [hideArrowWhenUncentered, setHideArrowWhenUncentered] =
    React.useState(false);
  const [sticky, setSticky] = React.useState(false);
  const [constrainSize, setConstrainSize] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [trackAnchor, setTrackAnchor] = React.useState(true);

  const {
    refs,
    positionerStyles,
    arrowStyles,
    arrowRef,
    side: renderedSide,
    arrowUncentered,
  } = useAnchorPositioning({
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    sticky,
    arrowPadding,
    trackAnchor,
    mounted: true,
    keepMounted: true,
  });

  const handleInitialScroll = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.scrollLeft = 285;
      node.scrollTop = 625;
      setVisible(true);
    }
  }, []);

  const anchorLength = {
    xs: 5,
    s: 25,
    m: 50,
    l: 100,
    xl: 250,
  }[anchorSize];

  const popup = (
    <div
      ref={refs.setFloating}
      style={{
        visibility: visible ? 'visible' : 'hidden',
        ...positionerStyles,
      }}
    >
      <div
        style={{
          background: 'white',
          boxSizing: 'border-box',
          padding: 10,
          ...(constrainSize && {
            maxWidth: 'var(--available-width)',
            maxHeight: 'var(--available-height)',
            overflow: 'auto',
          }),
        }}
      >
        {`Content `.repeat(
          {
            xs: 1,
            s: 3,
            m: 10,
            l: 50,
            xl: 200,
          }[popupSize],
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
            ...(arrowUncentered &&
              hideArrowWhenUncentered && { visibility: 'hidden' }),
          }}
        />
      )}
    </div>
  );

  const popupNode = trackAnchor
    ? popup
    : ReactDOM.createPortal(popup, document.body);

  return (
    <div style={{ fontFamily: 'sans-serif', margin: 50 }}>
      <h1>Anchor Positioning Playground</h1>
      <div style={{ display: 'flex', gap: 20 }}>
        <div
          ref={handleInitialScroll}
          style={{
            overflow: 'auto',
            background: 'black',
            position: 'relative',
            width: 375,
            height: 800,
          }}
        >
          <div style={{ width: 1000 + anchorLength / 2, height: 1000 }} />
          <div
            ref={refs.setReference}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: anchorLength,
              height: anchorLength,
              background: 'tomato',
              position: 'relative',
              left: 450,
              fontFamily: 'sans-serif',
              color: 'white',
              fontSize: 12,
              fontWeight: 'bold',
            }}
          >
            {anchorSize !== 'xs' ? 'A' : null}
          </div>
          {popupNode}
          <div style={{ width: 1000 + anchorLength / 2, height: 1000 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <fieldset>
            <legend>Popup Size</legend>
            {(['xs', 's', 'm', 'l', 'xl'] as const).map((s) => (
              <label key={s}>
                <input
                  name="popup-size"
                  type="radio"
                  checked={s === popupSize}
                  onChange={() => setPopupSize(s)}
                />
                {s}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Anchor Size</legend>
            {(['xs', 's', 'm', 'l', 'xl'] as const).map((s) => (
              <label key={s}>
                <input
                  name="anchor-size"
                  type="radio"
                  checked={s === anchorSize}
                  onChange={() => setAnchorSize(s)}
                />
                {s}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Side</legend>
            {(['top', 'bottom', 'left', 'right'] as const).map((s) => (
              <label key={s}>
                <input
                  name="side"
                  type="radio"
                  checked={s === side}
                  onChange={() => setSide(s)}
                />
                {s}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Align</legend>
            {(['start', 'center', 'end'] as const).map((a) => (
              <label key={a}>
                <input
                  name="align"
                  type="radio"
                  checked={a === align}
                  onChange={() => setAlign(a)}
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
              onChange={(event) => setSideOffset(Number(event.target.value))}
            />
            {sideOffset}
          </fieldset>

          <fieldset>
            <legend>Align Offset</legend>
            <input
              type="range"
              min={0}
              max={50}
              value={alignOffset}
              onChange={(event) => setAlignOffset(Number(event.target.value))}
            />
            {alignOffset}
          </fieldset>

          <fieldset>
            <legend>Collision Padding</legend>
            <input
              type="range"
              min={0}
              max={50}
              value={collisionPadding}
              onChange={(event) => setCollisionPadding(Number(event.target.value))}
            />
            {collisionPadding}
          </fieldset>

          <fieldset>
            <legend>Arrow Padding</legend>
            <input
              type="range"
              min={0}
              max={20}
              value={arrowPadding}
              onChange={(event) => setArrowPadding(Number(event.target.value))}
            />
            {arrowPadding}
          </fieldset>

          <label>
            <input
              type="checkbox"
              checked={constrainSize}
              onChange={() => setConstrainSize((prev) => !prev)}
            />
            Constrain size
          </label>

          <label>
            <input
              type="checkbox"
              checked={arrow}
              onChange={() => setArrow((prev) => !prev)}
            />
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
            <input
              type="checkbox"
              checked={sticky}
              onChange={() => setSticky((prev) => !prev)}
            />
            Sticky
          </label>

          <label>
            <input
              type="checkbox"
              checked={trackAnchor}
              onChange={() => setTrackAnchor((prev) => !prev)}
            />
            Track anchor
          </label>
        </div>
      </div>
    </div>
  );
}
