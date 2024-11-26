'use client';
import * as React from 'react';
import { styled } from '@mui/system';
import { Tabs } from '@base-ui-components/react/tabs';

export default function KeyboardNavigation() {
  return (
    <div>
      <p>Selection following focus (default behavior):</p>
      <Tabs.Root defaultValue={1} aria-label="Tabs where selection follows focus">
        <TabsList>
          <Tab value={1}>One</Tab>
          <Tab value={2}>Two</Tab>
          <Tab value={3}>Three</Tab>
        </TabsList>
      </Tabs.Root>

      <p>Selection independent of focus:</p>
      <Tabs.Root
        defaultValue={1}
        aria-label="Tabs where selection does not follow focus"
      >
        <TabsList activateOnFocus={false}>
          <Tab value={1}>One</Tab>
          <Tab value={2}>Two</Tab>
          <Tab value={3}>Three</Tab>
        </TabsList>
      </Tabs.Root>
    </div>
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

const Tab = styled(Tabs.Tab)`
  font-family: 'IBM Plex Sans', sans-serif;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: bold;
  background-color: transparent;
  width: 100%;
  padding: 12px;
  margin: 6px;
  border: none;
  border-radius: 7px;
  display: flex;
  justify-content: center;

  &:hover {
    background-color: ${blue[400]};
  }

  &:focus {
    color: #fff;
    outline: 3px solid ${blue[200]};
  }

  &[data-selected] {
    background-color: #fff;
    color: ${blue[600]};
  }

  &[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TabsList = styled(Tabs.List)(
  ({ theme }) => `
  min-width: 400px;
  background-color: ${blue[500]};
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  align-content: space-between;
  box-shadow: 0px 4px 8px ${theme.palette.mode === 'dark' ? grey[900] : grey[200]};
  `,
);
