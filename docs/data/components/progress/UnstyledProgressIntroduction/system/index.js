'use client';
import * as React from 'react';
import { styled, useTheme, Box } from '@mui/system';
import { Progress as BaseProgress } from '@base-ui-components/react/progress';

export default function UnstyledProgressIntroduction() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  return (
    <Box className={isDarkMode ? 'dark' : ''} sx={{ width: 320, p: 2 }}>
      <Progress value={50} aria-labelledby="ProgressLabel">
        <Label id="ProgressLabel">Uploading files</Label>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
    </Box>
  );
}

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

const Progress = styled(BaseProgress.Root)`
  display: flex;
  flex-flow: column nowrap;
  gap: 1rem;
`;

const ProgressTrack = styled(BaseProgress.Track)`
  position: relative;
  width: 100%;
  height: 4px;
  border-radius: 9999px;
  background-color: ${grey[400]};
  display: flex;
  overflow: hidden;
`;

const ProgressIndicator = styled(BaseProgress.Indicator)`
  background-color: ${BLUE500};
  border-radius: inherit;

  .dark & {
    background-color: ${BLUE400};
  }
`;

const Label = styled('span')`
  cursor: unset;
  font-weight: bold;
  color: var(--color-gray-700);
`;

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}
