'use client';
import * as React from 'react';
import { ScrollArea } from '@base_ui/react/ScrollArea';
import { styled } from '@mui/system';

const data = Array.from({ length: 30 }, (_, i) => i + 1);

export default function ScrollAreaIntroduction() {
  return (
    <ScrollAreaRoot>
      <ScrollAreaViewport>
        <ul
          style={{
            listStyle: 'none',
            padding: '10px 20px',
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          {data.map((value) => (
            <li key={value} style={{ padding: 5, width: 'auto' }}>
              List item {value}
            </li>
          ))}
        </ul>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar>
        <ScrollAreaThumb />
      </ScrollAreaScrollbar>
      <ScrollAreaScrollbar orientation="horizontal">
        <ScrollAreaThumb />
      </ScrollAreaScrollbar>
    </ScrollAreaRoot>
  );
}

const ScrollAreaRoot = styled(ScrollArea.Root)`
  width: 250px;
  height: 250px;
  border-radius: 6px;
  background: #f5f5f5;
  overflow: hidden;
`;

const ScrollAreaViewport = styled(ScrollArea.Viewport)`
  width: 100%;
  height: 100%;
  scrollbar-width: none;
`;

const ScrollAreaScrollbar = styled(ScrollArea.Scrollbar)`
  width: 10px;
  padding: 2px;
  visibility: hidden;
  background: transparent;
  transition:
    opacity 0.2s,
    background 0.2s,
    visibility 0.2s;
  opacity: 0;

  &:hover {
    background: rgb(0 0 0 / 0.1);
  }

  &[data-orientation='horizontal'] {
    width: 100%;
    height: 10px;
  }

  &[data-scrolling] {
    transition: none;
  }

  &[data-hovering],
  &[data-scrolling],
  &:hover {
    visibility: visible;
    opacity: 1;
  }
`;

const ScrollAreaThumb = styled(ScrollArea.Thumb)`
  background: rgb(0 0 0 / 0.5);
  border-radius: 20px;
  height: var(--scroll-area-thumb-height, 6px);
  width: var(--scroll-area-thumb-width, 6px);

  &::before {
    content: '';
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 22px;
    min-height: 22px;
  }
`;
