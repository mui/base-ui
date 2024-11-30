'use client';
import * as React from 'react';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { styled } from '@mui/system';

const data = [
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  '550e8400-e29b-41d4-a716-446655440000',
  '9b2b38e2-4c7b-4e53-a228-c89c535c5072',
  '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  '4dfbdfc4-2d0e-4e6c-8bd6-7c8d765f0a1c',
  'aa9e5d30-cf2a-4234-bc9b-6a5d965c6a00',
  '16fd2706-8baf-433b-82eb-8c7fada847da',
  '66ed7a57-e4b7-4b82-8b1e-2a8942f8ec6e',
  'f9e87c8f-7b4f-4c7e-bb72-ebe8e2277c5e',
];

export default function ScrollAreaIntroduction() {
  return (
    <ScrollAreaRoot>
      <ScrollAreaViewport>
        <div style={{ padding: '10px 20px' }}>
          <h3 style={{ margin: '20px 0 10px' }}>User IDs</h3>
          <ul
            style={{
              padding: '10px 20px',
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
            }}
          >
            {data.map((value) => (
              <li key={value} style={{ padding: 5, whiteSpace: 'nowrap' }}>
                {value}
              </li>
            ))}
          </ul>
        </div>
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
  padding: 2px;
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
    width: 10px;
  }

  &[data-orientation='horizontal'] {
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
