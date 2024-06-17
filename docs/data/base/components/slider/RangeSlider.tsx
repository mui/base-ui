import * as React from 'react';
import { styled, useTheme, Box } from '@mui/system';
import * as BaseSlider from '@base_ui/react/Slider';

export default function RangeSlider() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  const [value, setValue] = React.useState<number | number[]>([20, 37]);

  return (
    <Box
      className={isDarkMode ? 'dark' : ''}
      sx={{ display: 'flex', flexDirection: 'column', gap: '4rem', width: 320 }}
    >
      {/* controlled: */}
      <Slider
        value={value}
        onValueChange={setValue}
        aria-labelledby="ControlledRangeLabel"
      >
        <Label id="ControlledRangeLabel">Controlled Range</Label>
        <SliderOutput />
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb />
            <SliderThumb />
          </SliderTrack>
        </SliderControl>
      </Slider>
      {/* uncontrolled: */}
      <Slider defaultValue={[20, 37]} aria-labelledby="UncontrolledRangeLabel">
        <Label id="UncontrolledRangeLabel">Uncontrolled Range</Label>
        <SliderOutput />
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

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

const Slider = styled(BaseSlider.Root)`
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 1rem;
  width: 100%;
  align-items: center;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const SliderOutput = styled(BaseSlider.Output)`
  text-align: right;
`;

const SliderControl = styled(BaseSlider.Control)`
  grid-column: 1/3;
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  height: 16px;
  border-radius: 9999px;
  touch-action: none;

  &[data-disabled] {
    cursor: not-allowed;
  }
`;

const SliderTrack = styled(BaseSlider.Track)`
  width: 100%;
  height: 2px;
  border-radius: 9999px;
  background-color: ${grey[400]};
  touch-action: none;

  .dark & {
    background-color: ${grey[700]};
  }
`;

const SliderIndicator = styled(BaseSlider.Indicator)`
  border-radius: 9999px;
  background-color: black;

  .dark & {
    background-color: ${grey[100]};
  }
`;

const SliderThumb = styled(BaseSlider.Thumb)`
  position: absolute;
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  border-radius: 50%;
  background-color: black;
  transform: translateX(-50%);
  touch-action: none;

  &:focus-visible {
    outline: 2px solid black;
    outline-offset: 2px;
  }

  .dark & {
    background-color: ${grey[300]};
  }

  .dark &:focus-visible {
    outline-color: ${grey[300]};
    outline-width: 1px;
    outline-offset: 3px;
  }

  &[data-dragging='true'] {
    background-color: pink;
  }

  &[data-disabled],
  .dark &[data-disabled] {
    background-color: ${grey[600]};
  }

  .dark &[data-dragging='true'] {
    background-color: pink;
  }
`;

// we can't use a <label> element in a range slider since the `for` attribute
// cannot reference more than one <input> element
// the html spec doesn't forbid <label> without `for` https://html.spec.whatwg.org/multipage/forms.html#the-label-element
// but eslint complains by default and a11y validators may complain e.g. WAVE
const Label = styled('span')`
  cursor: unset;
  font-weight: bold;

  &[data-disabled='true'] {
    color: ${grey[600]};
  }
`;
