import * as React from 'react';
import UnstyledNumberFieldIntroduction from './UnstyledNumberFieldIntroduction/system/index';
import { styled, useTheme } from '@mui/system';

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export default function AnatomyDemo() {
  const isDarkMode = useIsDarkMode();
  const [hoveredContainer, setHoveredContainer] = React.useState(null);
  const AnatomyConfig = [
    {
      label: 'NumberField',
      labelPosition: { top: '-200%', left: '50%' },
      ContainerPosition: {
        top: '0%',
        left: '0%',
        width: '100%',
        height: '100%',
      },
    },
    {
      label: 'NumberField.ScrubArea',
      labelPosition: { top: '-140%', left: '50%' },
      ContainerPosition: { top: '0%', left: '0%', width: '60px', height: '22px' },
    },
    {
      label: 'label and NumberField.ScrubAreaCursor',
      labelPosition: { top: '-80%', left: '50%' },
      ContainerPosition: { top: '0%', left: '0%', width: '60px', height: '22px' },
    },
    {
      label: 'NumberField.Group',
      labelPosition: { top: '200%', left: '50%' },
      ContainerPosition: { top: '44%', left: '0%', width: '100%', height: '36px' },
    },
    {
      label: 'NumberField.Decrement',
      labelPosition: { top: '50%', left: '-50%' },
      ContainerPosition: { top: '44%', left: '0%', width: '36px', height: '36px' },
    },
    {
      label: 'NumberField.Input',
      labelPosition: { top: '130%', left: '50%' },
      ContainerPosition: { top: '44%', left: '16%', width: '150px', height: '36px' },
    },
    {
      label: 'NumberField.Increment',
      labelPosition: { top: '50%', left: '150%' },
      ContainerPosition: { top: '44%', left: '84%', width: '36px', height: '36px' },
    },
  ];

  return (
    <div
      className={isDarkMode ? 'dark' : ''}
      style={{ paddingTop: 140, paddingBottom: 100 }}
    >
      <AnatomyOverlay>
        <UnstyledNumberFieldIntroduction />
        {AnatomyConfig.map((config, index) => (
          <React.Fragment key={index}>
            <Label
              style={{
                top: config.labelPosition.top,
                left: config.labelPosition.left,
              }}
              onMouseEnter={() => setHoveredContainer(index)}
              onMouseLeave={() => setHoveredContainer(null)}
            >
              {config.label}
            </Label>
            <AnatomyContainer
              style={{
                opacity: hoveredContainer === index ? 1 : 0,
                width: config.ContainerPosition.width,
                height: config.ContainerPosition.height,
                top: config.ContainerPosition.top,
                left: config.ContainerPosition.left,
              }}
            />
          </React.Fragment>
        ))}
      </AnatomyOverlay>
    </div>
  );
}

const grey = {
  50: '#F9FAFB',
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

const blue = {
  50: '#EBF5FF',
  100: '#CCE5FF',
  200: '#99CCFF',
  300: '#66B2FF',
  400: '#3399FF',
  500: '#007FFF',
  600: '#0066CC',
  700: '#004C99',
  800: '#004C99',
  900: '#003A75',
};

const AnatomyOverlay = styled('div')`
  position: relative;
`;

const Label = styled('span')`
  position: absolute;
  opacity: 0.5;
  padding: 2px 8px;
  font-size: 14px;
  transform: translateX(-50%);
  white-space: nowrap;
  border-radius: 0.5rem;
  background-color: ${grey[50]};
  border: 1px solid ${grey[300]};
  cursor: default;
  transition-property: opacity, border-color, box-shadow;
  transition-duration: 100ms;
  &:hover {
    opacity: 1;
    border-color: ${blue[200]};
    box-shadow: 0 0 8px 1px hsla(210, 100%, 90%, 0.5);
  }
  .dark & {
    background-color: ${grey[900]};
    border: 1px solid;
    border-color: ${grey[800]};
    &:hover {
      opacity: 1;
      border-color: ${blue[700]};
      box-shadow: 0 0 8px 1px hsla(210, 100%, 23%, 0.3);
    }
  }
`;

const AnatomyContainer = styled('div')`
  z-index: 90;
  opacity: 0;
  // position: absolute;
  background-color: 'transparent';
  border-radius: 0.2rem;
  outline: 1px dashed;
  outline-color: ${blue[400]};
  outline-offset: 0.2rem;
  .dark & {
    outline-color: ${blue[600]};
  }
`;
