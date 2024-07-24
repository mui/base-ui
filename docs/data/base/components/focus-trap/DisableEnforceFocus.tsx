import * as React from 'react';
import Box from '@mui/system/Box';
import { FocusTrap } from '@base_ui/react/legacy/FocusTrap';

export default function DisableEnforceFocus() {
  const [open, setOpen] = React.useState(false);

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
        <FocusTrap disableEnforceFocus open>
          <Box tabIndex={-1} sx={{ mt: 1, p: 1 }}>
            <label>
              First name: <input type="text" />
            </label>
            <br />
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </Box>
        </FocusTrap>
      )}
    </Box>
  );
}
