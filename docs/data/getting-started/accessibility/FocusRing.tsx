import * as React from 'react';
import { styled, alpha, Box } from '@mui/system';
import { Slider as BaseSlider } from '@base-ui-components/react/slider';

export default function FocusRing() {
  return (
    <Box sx={{ width: 300 }}>
      <Slider defaultValue={[20, 40]}>
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb />
            <SliderThumb />
          </SliderTrack>
        </SliderControl>
      </Slider>
    </Box>
  );
}

const blue = {
  100: '#DAECFF',
  200: '#99CCF3',
  400: '#3399FF',
  300: '#66B2FF',
  500: '#007FFF',
  600: '#0072E5',
  900: '#003A75',
};

const Slider = styled(BaseSlider.Root)(
  ({ theme }) => `
  color: ${theme.palette.mode === 'light' ? blue[500] : blue[400]};
  width: 100%;
  display: inline-flex;
  align-items: center;
  position: relative;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
`,
);

const SliderControl = styled(BaseSlider.Control)`
  width: 100%;
  height: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const SliderTrack = styled(BaseSlider.Track)`
  width: 100%;
  height: 4px;
  border-radius: 6px;
  background-color: color-mix(in srgb, currentColor 30%, transparent);
`;

const SliderIndicator = styled(BaseSlider.Indicator)`
  position: absolute;
  border-radius: 6px;
  background-color: currentColor;
`;

const SliderThumb = styled(BaseSlider.Thumb)(
  ({ theme }) => `
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  box-sizing: border-box;
  border-radius: 50%;
  outline: 0;
  background-color: ${theme.palette.mode === 'light' ? blue[500] : blue[400]};
  transition-property: box-shadow, transform;
  transition-timing-function: ease;
  transition-duration: 120ms;
  transform-origin: center;

  &:hover {
    box-shadow: 0 0 0 6px ${alpha(
      theme.palette.mode === 'light' ? blue[200] : blue[300],
      0.3,
    )};
  }

  &:focus-visible {
    box-shadow: 0 0 0 8px ${alpha(
      theme.palette.mode === 'light' ? blue[200] : blue[400],
      0.5,
    )};
    outline: none;
  }

  &[data-dragging] {
    box-shadow: 0 0 0 8px ${alpha(
      theme.palette.mode === 'light' ? blue[200] : blue[400],
      0.5,
    )};
    outline: none;
    transform: scale(1.2);
  }
`,
);
