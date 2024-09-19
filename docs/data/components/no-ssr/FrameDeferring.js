'use client';
import * as React from 'react';
import { styled } from '@mui/system';
import { NoSsr } from '@base_ui/react/NoSsr';

function LargeTree() {
  return Array.from(new Array(5000)).map((_, index) => <span key={index}>.</span>);
}

export default function FrameDeferring() {
  const [state, setState] = React.useState({
    open: false,
    defer: false,
  });

  return (
    <Demo>
      <Button
        type="button"
        onClick={() =>
          setState({
            open: !state.open,
            defer: false,
          })
        }
      >
        {'Render <NoSsr defer={false} />'}
      </Button>
      <br />
      <Button
        type="button"
        onClick={() =>
          setState({
            open: !state.open,
            defer: true,
          })
        }
      >
        {'Render <NoSsr defer={true} />'}
      </Button>
      <br />
      <br />
      <Panel sx={{ width: 300, display: 'flex', flexWrap: 'wrap' }}>
        {state.open ? (
          <React.Fragment>
            <div>Outside NoSsr</div>
            <NoSsr defer={state.defer}>
              .....Inside NoSsr
              <LargeTree />
            </NoSsr>
          </React.Fragment>
        ) : null}
      </Panel>
    </Demo>
  );
}

const Panel = styled('div')`
  padding: 16px;
`;

const Demo = styled('div')`
  height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow: auto;
  padding: 8px;
`;

const Button = styled('button')(
  ({ theme }) => `
  background-color: ${theme.palette.mode === 'dark' ? 'var(--gray-50)' : 'var(--gray-900)'};
  color: ${theme.palette.mode === 'dark' ? 'var(--gray-900)' : 'var(--gray-50)'};
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-family:
    "IBM Plex Sans",
    sans-serif;

  &:hover {
    background-color: ${theme.palette.mode === 'dark' ? 'var(--gray-200)' : 'var(--gray-700)'};
  }
`,
);
