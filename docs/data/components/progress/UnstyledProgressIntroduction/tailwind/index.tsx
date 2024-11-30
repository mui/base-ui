'use client';
import * as React from 'react';
import { useTheme } from '@mui/system';
import { Progress as BaseProgress } from '@base-ui-components/react/progress';

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
  props: BaseProgress.Root.Props,
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
  props: BaseProgress.Track.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseProgress.Track
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'relative flex h-1 w-full overflow-hidden rounded-full bg-gray-400',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

const ProgressIndicator = React.forwardRef(function ProgressIndicator(
  props: BaseProgress.Indicator.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseProgress.Indicator
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'rounded-[inherit] bg-[background-color:var(--code-6)]',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

function Label(props: React.HTMLAttributes<HTMLElement>) {
  return (
    <span
      className="cursor-[unset] font-bold text-[color:var(--color-gray-700)]"
      {...props}
    />
  );
}

function classNames(...classes: Array<string | boolean | undefined | null>) {
  return classes.filter(Boolean).join(' ');
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}
