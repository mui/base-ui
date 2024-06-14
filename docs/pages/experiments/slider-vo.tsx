import * as React from 'react';
import * as Slider from '@base_ui/react/Slider';
import { useSliderContext } from '@base_ui/react/Slider';
import { Styles, TrackFill } from './slider';

function Label(props: any) {
  const { id: idProp, ...otherProps } = props;
  const defaultId = React.useId();
  const labelId = idProp ?? defaultId;

  const { subitems } = useSliderContext();

  const htmlFor = Array.from(subitems.values())
    .reduce((acc, item) => {
      return `${acc} ${item.inputId}`;
    }, '')
    .trim();

  return <label id={labelId} htmlFor={htmlFor} {...otherProps} />;
}

function LabelRange(props: any) {
  const { id: idProp, ...otherProps } = props;

  const defaultId = React.useId();
  const labelId = idProp ?? defaultId;

  return <span id={labelId} {...otherProps} />;
}

export default function App() {
  return (
    <div className="App">
      <Slider.Root className="MySlider" defaultValue={50} aria-labelledby="LabelId">
        <Label id="LabelId">Brightness</Label>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
          <Slider.Thumb className="MySlider-thumb" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={[50, 70]} aria-labelledby="LabelRangeId">
        <LabelRange id="LabelRangeId">Volume Range</LabelRange>
        <Slider.Output className="MySlider-output" />
        <Slider.Track className="MySlider-track">
          <TrackFill className="MySlider-track-fill" />
          <Slider.Thumb
            className="MySlider-thumb start"
            getAriaValueText={(thumbValue) => `start range ${thumbValue}`}
          />
          <Slider.Thumb
            className="MySlider-thumb end"
            getAriaValueText={(thumbValue) => `end range ${thumbValue}`}
          />
        </Slider.Track>
      </Slider.Root>
      <Styles />
    </div>
  );
}
