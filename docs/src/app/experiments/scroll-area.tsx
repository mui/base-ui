'use client';
import * as React from 'react';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { styled } from '@mui/system';

export default function ScrollAreaIntroduction() {
  return (
    <ScrollAreaRoot>
      <ScrollAreaViewport>
        <div
          style={{
            width: 1000,
            height: 1000,
            background: 'linear-gradient(to bottom, red, white)',
          }}
        />
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
  width: 300px;
  height: 100vh;
  border-radius: 6px;
  background: #f5f5f5;
`;

const ScrollAreaViewport = styled(ScrollArea.Viewport)`
  width: 100%;
  height: 100%;
  border-radius: 6px;

  &:focus-visible {
    outline: 2px solid rgb(0 0 0 / 0.5);
  }
`;

const ScrollAreaScrollbar = styled(ScrollArea.Scrollbar)`
  visibility: hidden;
  background: transparent;
  box-sizing: border-box;
  transition:
    opacity 0.2s,
    background 0.2s,
    visibility 0.2s;
  opacity: 0;
  display: flex;

  &:hover {
    background: rgb(0 0 0 / 0.1);
  }

  &[data-orientation='vertical'] {
    padding-block: 20px;
    width: 10px;
  }

  &[data-orientation='horizontal'] {
    padding-inline: 20px;
    flex-direction: column;
    height: 10px;
  }

  &[data-hovering],
  &[data-scrolling],
  &:hover {
    visibility: visible;
    opacity: 1;
  }

  &[data-scrolling]:not(:hover) {
    transition: none;
  }
`;

const ScrollAreaThumb = styled(ScrollArea.Thumb)`
  background: rgb(0 0 0 / 0.5);
  border-radius: 20px;
  flex: 1;

  &[data-orientation='vertical'] {
    margin-block: 10px;
  }

  &[data-orientation='horizontal'] {
    margin-inline: 10px;
  }

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
