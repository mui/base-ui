import * as React from 'react';
import { Badge as BaseBadge, badgeClasses } from '@mui/base/Badge';
// Auxiliary demo components
import { styled, Stack } from '@mui/system';
import { Button, buttonClasses } from '@mui/base/Button';
import { Switch as BaseSwitch } from '@mui/base/Switch';
import Divider from '@mui/material/Divider';
// Icons
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import MailIcon from '@mui/icons-material/Mail';

const blue = {
  200: '#99CCF3',
  500: '#007FFF',
  700: '#0059B2',
};

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

const Badge = styled(BaseBadge)(
  ({ theme }) => `
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-self: center;
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  line-height: 1;

  & .${badgeClasses.badge} {
    z-index: auto;
    position: absolute;
    top: 0;
    right: 0;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    color: #fff;
    font-weight: 600;
    font-size: 12px;
    line-height: 22px;
    white-space: nowrap;
    text-align: center;
    border-radius: 12px;
    background: ${blue[500]};
    box-shadow: 0px 4px 6x ${theme.palette.mode === 'dark' ? grey[900] : grey[300]};
    transform: translate(50%, -50%);
    transform-origin: 100% 0;
  }

  & .${badgeClasses.invisible} {
    opacity: 0;
    pointer-events: none;
  }
  `,
);

const StyledButton = styled(Button)(
  ({ theme }) => `
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: all 150ms ease;
  background-color: transparent;
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[800] : grey[200]};

  &:hover {
    background: ${theme.palette.mode === 'dark' ? grey[800] : grey[50]};
  }

  &.${buttonClasses.active} {
    background: ${theme.palette.mode === 'dark' ? grey[900] : grey[100]};
  }

  &.${buttonClasses.focusVisible} {
    box-shadow: 0 3px 20px 0 rgba(61, 71, 82, 0.1), 0 0 0 4px rgba(0, 127, 255, 0.5);
    outline: none;
  }
  `,
);

const Switch = styled(BaseSwitch)(
  ({ theme }) => `
  width: 38px;
  height: 24px;
  margin: 10px;
  padding: 0;
  box-sizing: border-box;
  background: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[800] : grey[200]};
  border-radius: 24px;
  display: inline-block;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 120ms;
  box-shadow: inset 0px 1px 1px ${
    theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.05)'
  };

  &[data-disabled] {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:hover:not([data-disabled]) {
    background: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
    border-color: ${theme.palette.mode === 'dark' ? grey[600] : grey[300]};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${theme.palette.mode === 'dark' ? blue[700] : blue[200]};
  }

  &[data-state="checked"] {
    border: none;
    background: ${blue[500]};
  }

  &[data-state="checked"]:not([data-disabled]):hover {
    background: ${blue[700]};
  }
  `,
);

const Thumb = styled(BaseSwitch.Thumb)(
  ({ theme }) => `
    box-sizing: border-box;
    border: 1px solid ${theme.palette.mode === 'dark' ? grey[800] : grey[200]};
    display: block;
    width: 16px;
    height: 16px;
    left: 4px;
    border-radius: 16px;
    background-color: #FFF;
    position: relative;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 120ms;
    box-shadow: 0px 1px 2px ${
      theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.1)'
    };

    &[data-state="checked"] {
      left: 18px;
      background-color: #fff;
      box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.3);
    }
`,
);

const StyledLabel = styled('label')(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  `,
);

export default function BadgeVisibility() {
  const [count, setCount] = React.useState(1);
  const [invisible, setInvisible] = React.useState(false);

  const handleBadgeVisibility = () => {
    setInvisible(!invisible);
  };

  return (
    <Stack direction="column" justifyContent="center" spacing={1} useFlexGap>
      <Badge badgeContent={count} invisible={invisible}>
        <MailIcon />
      </Badge>
      <Divider sx={{ my: 2 }} />
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        gap={1}
        useFlexGap
      >
        <StyledButton
          aria-label="decrease"
          onClick={() => {
            setCount(Math.max(count - 1, 0));
          }}
        >
          <RemoveIcon fontSize="small" color="primary" />
        </StyledButton>
        <StyledButton
          aria-label="increase"
          onClick={() => {
            setCount(count + 1);
          }}
        >
          <AddIcon fontSize="small" color="primary" />
        </StyledButton>
        <Divider orientation="vertical" />
        <Stack direction="row" spacing={1} useFlexGap>
          <StyledLabel>Show badge</StyledLabel>
          <Switch checked={!invisible} onChange={handleBadgeVisibility}>
            <Thumb />
          </Switch>
        </Stack>
      </Stack>
    </Stack>
  );
}
