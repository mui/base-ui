import * as React from 'react';
import { NumberField as BaseNumberField } from '@mui/base/NumberField';
import { css, styled, useTheme } from '@mui/system';

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
      ContainerPosition: { top: '36%', left: '20%', width: '56px', height: '22px' },
    },
    {
      label: 'NumberField.ScrubAreaCursor',
      identAmount: '32px',
      ContainerPosition: { top: '36%', left: '20%', width: '56px', height: '22px' },
    },
    {
      label: 'NumberField.Group',
      identAmount: '16px',
      ContainerPosition: { top: '48%', left: '20%', width: '230px', height: '38px' },
    },
    {
      label: 'NumberField.Decrement',
      identAmount: '32px',
      ContainerPosition: { top: '48%', left: '20%', width: '42px', height: '36px' },
    },
    {
      label: 'NumberField.Input',
      identAmount: '32px',
      ContainerPosition: { top: '48%', left: '30%', width: '152px', height: '36px' },
    },
    {
      label: 'NumberField.Increment',
      identAmount: '32px',
      ContainerPosition: { top: '48%', left: '69%', width: '42px', height: '36px' },
    },
  ];

  return (
    <AnatomyOverlay className={isDarkMode ? 'dark' : ''}>
      <LabelContainer>
        {AnatomyConfig.map((config, index) => (
          <Label
            tabIndex={0}
            key={index}
            style={{
              marginLeft: config.identAmount,
            }}
            onMouseEnter={() => setHoveredContainer(index)}
            onMouseLeave={() => setHoveredContainer(null)}
            onFocus={() => setHoveredContainer(index)}
            onBlur={() => setHoveredContainer(null)}
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
        <NumberFieldWireframe />
      </DemoContainer>
    </AnatomyOverlay>
  );
}

export function NumberFieldWireframe() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  const id = React.useId();

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <NumberField disabled id={id}>
        <NumberFieldScrubArea>
          <NumberFieldVirtualCursor style={{ transform: 'rotate(90deg)' }}>
            <svg
              width="26"
              height="14"
              viewBox="0 0 24 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              shapeRendering="crispEdges"
            >
              <path
                d="M19.3382 3.00223V5.40757L13.0684 5.40757L13.0683 5.40757L6.59302 5.40964V3V1.81225L5.74356 2.64241L1.65053 6.64241L1.28462 7L1.65053 7.35759L5.74356 11.3576L6.59302 12.1878V11L6.59302 8.61585L13.0684 8.61585H19.3382V11V12.1741L20.1847 11.3605L24.3465 7.36049L24.7217 6.9999L24.3464 6.63941L20.1846 2.64164L19.3382 1.82862V3.00223Z"
                fill="black"
                stroke="white"
              />
            </svg>
          </NumberFieldVirtualCursor>
          <label
            htmlFor={id}
            style={{ cursor: 'unset', color: isDarkMode ? grey[300] : grey[800] }}
          >
            Label
          </label>
        </NumberFieldScrubArea>
        <NumberFieldGroup>
          <NumberFieldDecrement>&minus;</NumberFieldDecrement>
          <NumberFieldInput placeholder="Placeholder" />
          <NumberFieldIncrement>+</NumberFieldIncrement>
        </NumberFieldGroup>
      </NumberField>
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

const NumberField = styled(BaseNumberField)`
  font-family: 'Menlo', monospace;
  font-size: 1rem;
`;

const NumberFieldGroup = styled(BaseNumberField.Group)`
  display: flex;
  align-items: center;
  margin-top: 0.25rem;
  border: 1px solid ${grey[500]};
  border-color: ${grey[500]};
  overflow: hidden;

  .dark & {
    border: 1px solid ${grey[600]};
    border-color: ${grey[600]};
  }
`;

const NumberFieldScrubArea = styled(BaseNumberField.ScrubArea)`
  cursor: ns-resize;
  font-weight: bold;
  user-select: none;
`;

const NumberFieldVirtualCursor = styled(BaseNumberField.ScrubAreaCursor)`
  filter: drop-shadow(0 0 2px rgb(0 0 0 / 0.3));
`;

const NumberFieldInput = styled(BaseNumberField.Input)`
  position: relative;
  z-index: 10;
  align-self: stretch;
  padding: 0.25rem 0.5rem;
  line-height: 1.5;
  border: none;
  background-color: ${grey[50]};
  color: ${grey[700]};
  box-shadow: 0 1px 2px 0 rgba(0 0 0 / 0.05);
  overflow: hidden;
  max-width: 150px;
  font-family: inherit;
  font-size: inherit;

  .dark & {
    background-color: ${grey[900]};
    border-color: ${grey[600]};
    color: ${grey[300]};
  }
`;

const buttonStyles = css`
  position: relative;
  border: none;
  font-weight: bold;
  transition-duration: 100ms;
  padding: 0.5rem 0.75rem;
  flex: 1;
  align-self: stretch;
  background-color: ${grey[300]};
  color: ${grey[900]};
  margin: 0;
  font-family: math, monospace;

  .dark & {
    background-color: ${grey[700]};
    color: ${grey[50]};
    border-color: ${grey[600]};
  }

  .dark {
    &:hover:not([disabled]) {
      background-color: ${grey[800]};
      border-color: ${grey[600]};
      color: ${grey[200]};
    }

    &:active:not([disabled]) {
      background-color: ${grey[700]};
    }
  }
`;

const NumberFieldDecrement = styled(BaseNumberField.Decrement)`
  ${buttonStyles}
  border-right: 1px solid ${grey[500]};
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;

  .dark & {
    border-right-color: ${grey[600]};
  }
`;

const NumberFieldIncrement = styled(BaseNumberField.Increment)`
  ${buttonStyles}
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: 1px solid ${grey[500]};

  .dark & {
    border-left-color: ${grey[600]};
  }
`;

//Anatomy styling
const AnatomyOverlay = styled('div')`
  width: 100%;
  height: 100%;
  min-height: 200px;
  display: flex;
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
  width: fit-content;
  opacity: 0.8;
  padding: 2px 8px;
  font-size: 0.75rem;
  font-family: monospace;
  border-radius: 0.5rem;
  color: ${grey[900]};
  background-color: ${grey[50]};
  border: 1px solid ${grey[300]};
  cursor: default;
  transition-property: opacity, border-color, box-shadow;
  transition-duration: 100ms;

  &:hover {
    border-style: dashed;
    opacity: 1;
    color: ${blue[900]};
    border-color: ${blue[400]};
    background-color: ${blue[100]};
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
  outline-offset: 0.2rem;
  outline-color: ${blue[400]};
  background-color: hsla(210, 80%, 80%, 0.3);

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
  border: 1px solid;
  border-color: ${grey[200]};
  border-radius: 6px;
  background-image: radial-gradient(hsla(210, 10%, 80%, 0.2) 1.5px, hsla(210, 10%, 80%, 0) 1.5px);
  background-size: 16px 16px;
  cursor: not-allowed;

  .dark & {
    border-color: ${grey[900]};
    background-image: radial-gradient(hsla(210, 10%, 15%, 0.2) 1.5px, hsla(210, 10%, 80%, 0) 1.5px);
    );
  }
`;
