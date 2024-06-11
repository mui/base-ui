import * as React from 'react';
import { Snackbar, SnackbarProps, SnackbarRootSlotProps } from '@base_ui/react/legacy/Snackbar';

const Root = React.forwardRef(
  (props: SnackbarRootSlotProps, ref: React.ForwardedRef<HTMLDivElement>) => {
    const { ownerState, ...other } = props;
    return !ownerState.exited && ownerState.open ? (
      <div {...other} ref={ref}>
        Hello World
      </div>
    ) : null;
  },
);

function SnackbarWithCustomRoot(props: SnackbarProps) {
  return <Snackbar {...props} slots={{ root: Root }} />;
}
