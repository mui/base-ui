import * as React from 'react';
import UnstyledNumberFieldIntroduction from './UnstyledNumberFieldIntroduction/system/index';
import { styled, useTheme } from '@mui/system';

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export default function AnatomyDemo() {
  const isDarkMode = useIsDarkMode();
  const [hoveredContainer, setHoveredContainer] = React.useState<number | null>(
    null,
  );
  const AnatomyConfig = [
    {
      label: 'NumberField',
      identAmount: '0px',
      ContainerPosition: {
        top: '30%',
        left: '15%',
        width: '70%',
        height: '45%',
      },
    },
    {
      label: 'NumberField.ScrubArea',
      identAmount: '16px',
      ContainerPosition: { top: '36%', left: '20%', width: '75px', height: '22px' },
    },
    {
      label: 'NumberField.ScrubAreaCursor',
      identAmount: '32px',
      ContainerPosition: { top: '36%', left: '20%', width: '75px', height: '22px' },
    },
    {
      label: 'NumberField.Group',
      identAmount: '16px',
      ContainerPosition: { top: '48%', left: '21%', width: '220px', height: '36px' },
    },
    {
      label: 'NumberField.Decrement',
      identAmount: '32px',
      ContainerPosition: { top: '48%', left: '21%', width: '37px', height: '36px' },
    },
    {
      label: 'NumberField.Input',
      identAmount: '32px',
      ContainerPosition: { top: '48%', left: '30%', width: '155px', height: '36px' },
    },
    {
      label: 'NumberField.Increment',
      identAmount: '32px',
      ContainerPosition: { top: '48%', left: '69%', width: '37px', height: '36px' },
    },
  ];

  return (
    <AnatomyOverlay className={isDarkMode ? 'dark' : ''}>
      <LabelContainer>
        {AnatomyConfig.map((config, index) => (
          <Label
            key={index}
            style={{
              marginLeft: config.identAmount,
            }}
            onMouseEnter={() => setHoveredContainer(index)}
            onMouseLeave={() => setHoveredContainer(null)}
          >
            {config.label}
          </Label>
        ))}
      </LabelContainer>
      <DemoContainer>
        {AnatomyConfig.map((config, index) => (
          <AnatomyContainer
            key={index}
            style={{
              opacity: hoveredContainer === index ? 1 : 0,
              width: config.ContainerPosition.width,
              height: config.ContainerPosition.height,
              top: config.ContainerPosition.top,
              left: config.ContainerPosition.left,
            }}
          />
        ))}
        <UnstyledNumberFieldIntroduction />
      </DemoContainer>
    </AnatomyOverlay>
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
  width: 100%;
  height: 100%;
  min-height: 200px;
  display: flex;
  // align-items: center;
  justify-content: space-between;
  gap: 48px;
`;

const LabelContainer = styled('div')`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
`;

const Label = styled('span')`
  // position: absolute;
  width: fit-content;
  opacity: 0.8;
  padding: 2px 8px;
  font-size: 0.75rem;
  font-family: monospace;
  // transform: translateX(-50%);
  // white-space: nowrap;
  border-radius: 0.5rem;
  color: ${grey[900]};
  background-color: ${grey[50]};
  border: 1px solid ${grey[300]};
  cursor: default;
  transition-property: opacity, border-color, box-shadow;
  transition-duration: 100ms;

  &:hover {
    opacity: 1;
    border-color: ${blue[200]};
    // box-shadow: 0 0 8px 1px hsla(210, 100%, 90%, 0.5);
  }

  .dark & {
    color: ${grey[400]};
    background-color: ${grey[900]};
    border: 1px solid;
    border-color: ${grey[800]};

    &:hover {
      border-style: dashed;
      opacity: 1;
      color: ${blue[100]};
      border-color: ${blue[400]};
      background-color: hsla(210, 80%, 40%, 0.4);
      // box-shadow: 0 0 8px 1px hsla(210, 100%, 23%, 0.3);
    }
  }
`;

const AnatomyContainer = styled('div')`
  z-index: 90;
  opacity: 0;
  position: absolute;
  background-color: 'transparent';
  border-radius: 0.2rem;
  outline: 1px dashed;
  outline-color: ${blue[400]};
  outline-offset: 0.2rem;

  .dark & {
    outline-color: ${blue[400]};
    background-color: hsla(210, 80%, 40%, 0.2);
  }
`;

const DemoContainer = styled('div')`
  position: relative;
  width: 100%;
  min-height: 100%;
  max-width: 384px;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed;
  border-color: ${grey[400]};
  border-radius: 6px;

  .dark & {
    border-color: ${grey[800]};
  }
`;
