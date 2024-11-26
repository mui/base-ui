'use client';
import * as React from 'react';
import { css, styled } from '@mui/system';
import { Tabs as BaseTabs } from '@base-ui-components/react/tabs';

export default function IndicatorUnderline() {
  return (
    <Tabs>
      <TabsList>
        <Tab>Code</Tab>
        <Tab>Issues</Tab>
        <Tab>Pull Requests</Tab>
        <Tab>Discussions</Tab>
        <Tab>Actions</Tab>
        <Indicator />
      </TabsList>
    </Tabs>
  );
}

const blue = {
  50: '#F0F7FF',
  100: '#C2E0FF',
  200: '#80BFFF',
  300: '#66B2FF',
  400: '#3399FF',
  500: '#007FFF',
  600: '#0072E5',
  700: '#0059B2',
  800: '#004C99',
  900: '#003A75',
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

const Tabs = styled(BaseTabs.Root)`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &[data-orientation='vertical'] {
    flex-direction: row;
    justify-content: center;
    align-items: stretch;
  }
`;

const TabsList = styled(BaseTabs.List)(
  ({ theme }) => css`
    background-color: ${blue[500]};
    border-radius: 12px;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-evenly;
    box-shadow: 0 4px 30px ${theme.palette.mode === 'dark' ? grey[900] : grey[200]};
    position: relative;

    &[data-orientation='vertical'] {
      flex-direction: column;
    }
  `,
);

const Indicator = styled(BaseTabs.Indicator)`
  position: absolute;
  left: calc(var(--active-tab-left) + 4px);
  right: calc(var(--active-tab-right) + 4px);
  bottom: calc(var(--active-tab-bottom) + 2px);
  height: 4px;
  background: ${blue[800]};
  border-radius: 8px;
  z-index: 0;
  box-shadow: 0 0 0 0 ${blue[200]};
  outline-width: 0;
  transition:
    left 0.3s,
    right 0.3s,
    box-shadow 0.2s;

  *:has(:focus-visible) > & {
    box-shadow: 0 0 0 2px ${blue[200]};
  }
`;

const Tab = styled(BaseTabs.Tab)`
  font-family: 'IBM Plex Sans', sans-serif;
  color: #fff;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  background-color: transparent;
  white-space: nowrap;
  flex: 1 1 auto;
  padding: 10px 12px;
  margin: 6px;
  border: none;
  border-radius: 7px;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 1;

  &:focus-visible {
    outline: none;
  }

  &[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
