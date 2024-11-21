'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/system';
import { Progress as BaseProgress } from '@base-ui-components/react/Progress';

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

const Progress = React.forwardRef(function Progress(props, ref) {
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

Progress.propTypes = {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const ProgressTrack = React.forwardRef(function ProgressTrack(props, ref) {
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

ProgressTrack.propTypes = {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const ProgressIndicator = React.forwardRef(function ProgressIndicator(props, ref) {
  return (
    <BaseProgress.Indicator
      {...props}
      ref={ref}
      className={(state) =>
        classNames(
          'rounded-[inherit] bg-gray-500 dark:bg-gray-400',
          typeof props.className === 'function'
            ? props.className(state)
            : props.className,
        )
      }
    />
  );
});

ProgressIndicator.propTypes = {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

function Label(props) {
  return <span className="cursor-[unset] font-bold" {...props} />;
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}
