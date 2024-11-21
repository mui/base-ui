'use client';
import * as React from 'react';
import { Progress as BaseProgress } from '@base-ui-components/react/Progress';
import { Box, styled, keyframes, css } from '@mui/system';

export default function IndeterminateProgress() {
  return (
    <Box sx={{ width: 320, p: 2 }}>
      <Progress value={null} aria-labelledby="ProgressLabel">
        <span className="Progress-label" id="ProgressLabel">
          Uploading files
        </span>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
    </Box>
  );
}

const Progress = styled(BaseProgress.Root)`
  display: flex;
  flex-flow: column nowrap;
  gap: 1rem;
`;

const ProgressTrack = styled(BaseProgress.Track)(
  ({ theme }) => `
    position: relative;
    width: 100%;
    height: 4px;
    border-radius: 9999px;
    background-color: ${theme.palette.mode === 'dark' ? grey[400] : grey[400]};
    display: flex;
    overflow: hidden;
  `,
);

const indeterminateProgress = keyframes`
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(20rem);
  }
`;

const ProgressIndicator = styled(BaseProgress.Indicator)(
  ({ theme }) => css`
    background-color: ${theme.palette.mode === 'dark' ? BLUE400 : BLUE500};
    border-radius: inherit;

    &[data-indeterminate] {
      width: 25%;
      animation: ${indeterminateProgress} 1.5s infinite ease-in-out;
      will-change: transform;
    }
  `,
);

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

const BLUE400 = '#3399FF';
const BLUE500 = '#007FFF';
