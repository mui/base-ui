'use client';
import * as React from 'react';
import { styled, useTheme, Box } from '@mui/system';
import { Collapsible as BaseCollapsible } from '@base_ui/react/Collapsible';

const Collapsible = BaseCollapsible.Root;

const CollapsibleTrigger = styled(BaseCollapsible.Trigger)`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  gap: 4px;
  font-size: 16px;

  & svg {
    margin-top: 1px;
  }

  &[data-collapsible='open'] svg {
    transform: rotate(180deg);
  }
`;

const CollapsibleContent = styled(BaseCollapsible.Content)``;

export default function UnstyledCollapsibleIntroduction() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  const [open, setOpen] = React.useState(true);
  return (
    <Box
      className={isDarkMode ? 'dark' : ''}
      sx={{ width: 480, fontFamily: 'IBM Plex Sans, sans-serif' }}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="16"
            height="16"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
          Show {open ? 'less' : 'more'}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p>
            This is the collapsed content. The element that shows and hides the
            content has role button
          </p>
          <p>
            When the content is visible, the element with role `button` has
            `aria-expanded` set to `true`
          </p>
          <p>When the content area is hidden, it is set to `false`</p>
          <p>
            Optionally, the element with role `button` has a value specified for
            `aria-controls` that refers to the element that contains all the content
            that is shown or hidden
          </p>
        </CollapsibleContent>
      </Collapsible>
    </Box>
  );
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}
