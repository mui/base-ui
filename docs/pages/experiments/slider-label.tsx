import * as React from 'react';
import * as Slider from '@base_ui/react/Slider';
import { useSliderContext } from '@base_ui/react/Slider';
import { Styles } from './slider';

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
        <Label id="LabelId" className="Label">
          Brightness
        </Label>
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb one" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root className="MySlider" defaultValue={[50, 70]} aria-labelledby="LabelRangeId">
        <LabelRange id="LabelRangeId" className="Label">
          Volume Range
        </LabelRange>
        <Slider.Output className="MySlider-output" />
        <Slider.Control className="MySlider-control">
          <Slider.Track className="MySlider-track">
            <Slider.Indicator className="MySlider-indicator" />
            <Slider.Thumb className="MySlider-thumb one" />
            <Slider.Thumb className="MySlider-thumb two" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Styles />
    </div>
  );
}
