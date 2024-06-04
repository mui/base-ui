import * as React from 'react';
import Box from '@mui/system/Box';
import { Portal } from '@base_ui/react/legacy/Portal';
import { FocusTrap } from '@base_ui/react/legacy/FocusTrap';

export default function PortalFocusTrap() {
  const [open, setOpen] = React.useState(false);
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        '& [tabindex]:focus': { outline: '1px solid green' },
      }}
    >
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open && (
        <FocusTrap open>
          <Box tabIndex={-1} sx={{ mt: 1, p: 1 }}>
            <label>
              First name: <input type="text" />
            </label>
            <br />
            <Portal container={container}>
              <label>
                Last name: <input type="text" />
              </label>
              <br />
            </Portal>
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </Box>
        </FocusTrap>
      )}
      <div ref={setContainer} />
    </Box>
  );
}
