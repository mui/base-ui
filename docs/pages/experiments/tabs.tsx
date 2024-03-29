import * as React from 'react';
import { css, styled } from '@mui/system';
import { Tabs as BaseTabs } from '@base_ui/react/Tabs';

export default function UnstyledTabsIntroduction() {
  const [v, sv] = React.useState<string | number | null>(0);

  return (
    <div style={{ margin: '30px auto', maxWidth: '800px', display: 'block' }}>
      <h1>Tabs</h1>
      <h2>Horizontal</h2>
      <Tabs value={v} onChange={(e, val) => sv(val)}>
        <TabsList>
          <Bubble />
          <Tab value={0}>Code</Tab>
          <Tab value={1}>Issues</Tab>
          <Tab value={2}>Pull Requests</Tab>
          <Tab value={3}>Discussions</Tab>
          <Tab value={4}>Actions</Tab>
        </TabsList>
        <TabPanel value={0} keepMounted>
          Code panel
        </TabPanel>
        <TabPanel value={1} keepMounted>
          Issues panel
        </TabPanel>
        <TabPanel value={2} keepMounted>
          Pull Requests panel
        </TabPanel>
        <TabPanel value={3} keepMounted>
          Discussions panel
        </TabPanel>
        <TabPanel value={4} keepMounted>
          Actions panel
        </TabPanel>
      </Tabs>

      <h2>Vertical</h2>
      <Tabs value={v} onChange={(e, val) => sv(val)} orientation="vertical">
        <TabsList>
          <Bubble />
          <Tab value={0}>Code</Tab>
          <Tab value={1}>Issues</Tab>
          <Tab value={2}>Pull Requests</Tab>
          <Tab value={3}>Discussions</Tab>
          <Tab value={4}>Actions</Tab>
        </TabsList>
        <TabPanel value={0}>Code panel</TabPanel>
        <TabPanel value={1}>Issues panel</TabPanel>
        <TabPanel value={2}>Pull Requests panel</TabPanel>
        <TabPanel value={3}>Discussions panel</TabPanel>
        <TabPanel value={4}>Actions panel</TabPanel>
      </Tabs>
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

const Tabs = styled(BaseTabs)`
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

const Bubble = styled(BaseTabs.Bubble)`
  position: absolute;
  inset: var(--selected-tab-top) var(--selected-tab-right) var(--selected-tab-bottom)
    var(--selected-tab-left);
  background: ${blue[800]};
  border-radius: 8px;
  z-index: 0;
  box-shadow: 0 0 0 0 ${blue[200]};
  outline-width: 0;
  transition:
    left calc(0.3s + var(--selection-forwards) * 0.3s) calc(var(--selection-forwards) * 0.1s),
    right calc(0.3s + var(--selection-backwards) * 0.3s) calc(var(--selection-backwards) * 0.1s),
    top 0.3s,
    bottom 0.3s,
    box-shadow 0.2s;

  &[data-orientation='vertical'] {
    transition:
      top calc(0.3s + var(--selection-forwards) * 0.3s) calc(var(--selection-forwards) * 0.1s),
      bottom calc(0.3s + var(--selection-backwards) * 0.3s) calc(var(--selection-backwards) * 0.1s);
    left: 0;
    right: 0;
    margin: 0 6px;
  }

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

  &[data-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TabPanel = styled(BaseTabs.Panel)(
  ({ theme }) => css`
    width: 100%;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.875rem;
    padding: 20px 12px;
    background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
    border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
    border-radius: 12px;
    opacity: 0.6;
    box-sizing: border-box;
  `,
);
