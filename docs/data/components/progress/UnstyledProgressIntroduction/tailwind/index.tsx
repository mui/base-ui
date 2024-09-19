'use client';
import * as React from 'react';
import { useTheme } from '@mui/system';
import * as BaseProgress from '@base_ui/react/Progress';

export default function UnstyledProgressIntroduction() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  return (
    <div className={classNames('w-[20rem] p-4', isDarkMode && 'dark')}>
      <Progress value={50} aria-labelledby="ProgressLabel">
        <Label id="ProgressLabel">Uploading files</Label>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
    </div>
  );
}

const Progress = React.forwardRef(function Progress(
  props: BaseProgress.RootProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseProgress.Root
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'flex flex-col gap-4',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

const ProgressTrack = React.forwardRef(function ProgressTrack(
  props: BaseProgress.TrackProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseProgress.Track
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'relative w-full h-1 rounded-full bg-gray-400 flex overflow-hidden',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

const ProgressIndicator = React.forwardRef(function ProgressIndicator(
  props: BaseProgress.IndicatorProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseProgress.Indicator
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'bg-blue-500 dark:bg-blue-400 rounded-[inherit]',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

function Label(props: React.HTMLAttributes<HTMLElement>) {
  return <span className="cursor-[unset] font-bold" {...props} />;
}

function classNames(...classes: Array<string | boolean | undefined | null>) {
  return classes.filter(Boolean).join(' ');
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}
