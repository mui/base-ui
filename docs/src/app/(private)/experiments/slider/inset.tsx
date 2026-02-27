'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Slider } from '@base-ui/react/slider';
import '../../../../demo-data/theme/css-modules/theme.css';

function InsetSlider(props: Slider.Root.Props) {
  const value = props.defaultValue ?? props.value;
  const range = Array.isArray(value);
  const prefix = React.useId();
  return (
    <Slider.Root
      thumbAlignment="edge"
      {...props}
      className="rounded-full border border-[var(--track-border-color)] bg-[var(--track-bg)] dark:bg-gray-200"
    >
      <Slider.Control className="focus-within:overflow-y-revert-layer relative z-10 box-border touch-none rounded-full select-none">
        <Slider.Track className="relative select-none data-[orientation=horizontal]:h-[var(--h-track-height)] data-[orientation=horizontal]:w-[var(--h-track-width)] data-[orientation=vertical]:h-[var(--h-track-width)] data-[orientation=vertical]:w-[var(--h-track-height)]">
          <Slider.Indicator
            className={clsx(
              'bg-[var(--indicator-bg)] select-none dark:bg-[var(--color-gray-950)]',
              !range &&
                'data-[orientation=horizontal]:rounded-[9999px_0_0_9999px] data-[orientation=vertical]:rounded-[0_0_9999px_9999px]',
            )}
          />

          {!range && (
            <Slider.Thumb className="z-[1] h-[calc(var(--thumb-radius)*2)] w-[calc(var(--thumb-radius)*2)] rounded-full bg-white shadow-[0_0_3px_0_var(--color-gray-500)] select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--color-blue)] data-[dragging]:shadow-[0_0_2px_1px_var(--color-gray-500)]" />
          )}

          {range &&
            value.map((_v, i) => {
              return (
                <Slider.Thumb
                  key={`${prefix}${i}`}
                  index={i}
                  className="z-[1] h-[calc(var(--thumb-radius)*2)] w-[calc(var(--thumb-radius)*2)] rounded-full bg-white shadow-[0_0_3px_0_var(--color-gray-500)] select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--color-blue)] data-[dragging]:shadow-[0_0_2px_1px_var(--color-gray-500)]"
                />
              );
            })}
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}

function DemoSlider(props: Slider.Root.Props & { wide?: boolean }) {
  const { wide, style: styleProp, ...rest } = props;
  const value = rest.value ?? rest.defaultValue;
  const range = Array.isArray(value);
  const prefix = React.useId();
  return (
    <Slider.Root
      thumbAlignment="edge"
      {...rest}
      className="[--base-color:var(--color-blue)] [--dragging-color:color-mix(in_srgb,var(--base-color)_85%,white_15%)] [--indicator-bg:var(--base-color)] [--thumb-bg:var(--base-color)] [--thumb-radius:0.625rem] [--track-bg:var(--color-gray-200)] [--track-height:0.625rem] [--track-border-color:var(--color-gray-400)] [--track-width:6.25rem]"
      style={
        {
          ['--base-color']:
            props.thumbAlignment !== 'edge-client-only' ? 'var(--color-red)' : 'var(--color-blue)',
          ['--track-width']: wide ? '320px' : undefined,
          ...(styleProp ?? {}),
        } as React.CSSProperties
      }
    >
      <Slider.Control className="relative box-border w-[var(--track-width)] touch-none select-none">
        <Slider.Track className="h-[var(--track-height)] w-[var(--track-width)] bg-[var(--track-bg)] rounded-full select-none">
          <Slider.Indicator
            className={clsx(
              'bg-[var(--indicator-bg)] select-none data-[dragging]:bg-[var(--dragging-color)]',
              !range && 'rounded-[9999px_0_0_9999px]',
            )}
          />

          {!range && (
            <Slider.Thumb className="z-[1] h-[calc(var(--thumb-radius)*2)] w-[calc(var(--thumb-radius)*2)] rounded-full bg-[var(--indicator-bg)] select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--base-color)] data-[dragging]:bg-[var(--dragging-color)] data-[dragging]:shadow-[0_0_0_1px_var(--dragging-color)]" />
          )}

          {range &&
            value.map((_v, i) => {
              return (
                <Slider.Thumb
                  key={`${prefix}${i}`}
                  index={i}
                  className="z-[1] h-[calc(var(--thumb-radius)*2)] w-[calc(var(--thumb-radius)*2)] rounded-full bg-[var(--indicator-bg)] select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--base-color)] data-[dragging]:bg-[var(--dragging-color)] data-[dragging]:shadow-[0_0_0_1px_var(--dragging-color)]"
                />
              );
            })}
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}

function RadixSlider(props: Slider.Root.Props) {
  return (
    <Slider.Root
      thumbAlignment="edge"
      {...props}
      className="relative flex select-none touch-none data-[orientation=horizontal]:items-center data-[orientation=horizontal]:w-[240px] data-[orientation=horizontal]:h-[20px] data-[orientation=vertical]:justify-center data-[orientation=vertical]:h-[240px] data-[orientation=vertical]:w-[20px]"
    >
      <Slider.Control className="h-[inherit] w-[inherit] flex justify-center items-center">
        <Slider.Track className="rounded-full bg-[var(--black-a10)] data-[orientation=horizontal]:h-[3px] data-[orientation=horizontal]:w-[inherit] data-[orientation=vertical]:h-[inherit] data-[orientation=vertical]:w-[3px]">
          <Slider.Indicator className=" bg-white data-[orientation=horizontal]:h-full data-[orientation=horizontal]:rounded-[9999px_0_0_9999px] data-[orientation=vertical]:w-[inherit] data-[orientation=vertical]:rounded-[0_0_9999px_9999px]" />
          <Slider.Thumb className="w-[20px] h-[20px] rounded-[10px] bg-white shadow-[0_2px_10px_var(--black-a7)] hover:bg-[var(--violet-3)] data-[dragging]:bg-[var(--violet-3)] has-[:focus-visible]:outline-none has-[:focus-visible]:shadow-[0_0_0_5px_var(--black-a8)]" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}

export default function App() {
  return (
    <React.Fragment>
      <div
        style={
          {
            '--black-a7': 'color(display-p3 0 0 0/0.5)',
            '--black-a8': 'color(display-p3 0 0 0/0.6)',
            '--black-a10': 'color(display-p3 0 0 0/0.8)',
            '--indigo-9': 'color(display-p3 0.276 0.384 0.837)',
            '--purple-9': 'color(display-p3 0.523 0.318 0.751)',
            '--violet-3': 'color(display-p3 0.154 0.123 0.256)',
          } as React.CSSProperties
        }
        className="bg-[linear-gradient(330deg,var(--purple-9)_0,var(--indigo-9)_100%)] h-[400px] flex flex-nowrap items-center justify-center gap-[4rem] mb-8 px-8 self-start"
      >
        <RadixSlider defaultValue={40} />

        <RadixSlider defaultValue={40} orientation="vertical" />
      </div>

      <div
        style={
          {
            '--thumb-radius': '0.625rem',
            '--h-track-height': 'calc(var(--thumb-radius) * 2)',
            '--h-track-width': '14rem',

            '--indicator-bg': 'white',
            '--track-bg': 'var(--color-gray-200)',
            '--track-border-color': 'var(--color-gray-400)',
          } as React.CSSProperties
        }
        className="mb-8 grid grid-cols-[repeat(3,minmax(min-content,auto))] gap-8 self-start"
      >
        <InsetSlider defaultValue={45} orientation="vertical" />

        <InsetSlider defaultValue={[25, 50]} orientation="vertical" />

        <div className="grid content-center gap-8">
          <InsetSlider defaultValue={45} />

          <InsetSlider defaultValue={[25, 50]} />
        </div>
      </div>

      <p className="mb-4 self-start">
        Red <code>thumbAlignment="edge"</code>, Blue <code>thumbAlignment="edge-client-only"</code>
      </p>
      <div className="grid grid-cols-[repeat(2,minmax(min-content,auto))] gap-8 self-start">
        <DemoSlider defaultValue={30} thumbAlignment="edge-client-only" />

        <DemoSlider defaultValue={30} wide thumbAlignment="edge-client-only" />

        <DemoSlider defaultValue={30} />

        <DemoSlider defaultValue={30} wide />

        <DemoSlider defaultValue={[20, 64]} thumbAlignment="edge-client-only" />

        <DemoSlider defaultValue={[20, 64]} wide thumbAlignment="edge-client-only" />

        <DemoSlider defaultValue={[20, 64]} />

        <DemoSlider defaultValue={[20, 64]} wide />
      </div>
    </React.Fragment>
  );
}
