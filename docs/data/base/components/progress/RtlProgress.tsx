import * as React from 'react';
import { styled, Box } from '@mui/system';
import * as BaseProgress from '@base_ui/react/Progress';

export default function RtlProgress() {
  return (
    <Box sx={{ width: 320, p: 2 }}>
      <Progress value={65} aria-labelledby="RtlProgressLabel" dir="rtl">
        <span className="Progress-label" id="RtlProgressLabel">
          Uploading files (RTL)
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

const ProgressIndicator = styled(BaseProgress.Indicator)(
  ({ theme }) => `
    background-color: ${theme.palette.mode === 'dark' ? BLUE400 : BLUE500};
    border-radius: inherit;
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
