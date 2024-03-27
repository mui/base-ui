import * as React from 'react';
import Box from '@mui/material/Box';
import { Tabs } from '@base_ui/react/Tabs';
import { styled, GlobalStyles } from '@mui/system';

const tabListStyles = `
  min-width: 300px;
  background-color: var(--primary);
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  align-content: space-between;
  box-shadow: var(--shadow);
`;

const TabsList = styled(Tabs.List)(tabListStyles);

const tabPanelStyles = `
  width: 100%;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
`;
const TabPanel = styled(Tabs.Panel)(tabPanelStyles);

const tabStyles = `
  font-family: 'IBM Plex Sans', sans-serif;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: bold;
  background-color: transparent;
  width: 100%;
  padding: 12px;
  margin: 6px 6px;
  border: none;
  border-radius: 7px;
  display: flex;
  justify-content: center;
  transition: all 120ms ease;
  user-select: none;

  &:hover {
    background-color: var(--primary-hover);
  }

  &:focus-visible {
    color: #FFF;
    outline: 2px solid rgba(255,255,255,0.8);
    outline-offset: 2px;
  }

  &.base--selected {
    background-color: #FFF;
    color: var(--primary);
  }
`;

const Tab = styled(Tabs.Tab)(tabStyles);

const CSS = `.base-TabsList-root {${tabListStyles}}

.base-TabPanel-root {${tabPanelStyles}}

.base-Tab-root {${tabStyles}}`;

const tabStylesTailwind = `m-[6px] flex w-full cursor-pointer justify-center rounded-[7px] border-none bg-transparent p-[12px] text-[0.875rem] font-bold text-white [font-family:IBM_Plex_sans] hover:bg-[--primary-hover] focus:text-white focus-visible:[outline:2px_solid_rgba(255,255,255,0.8)] outline-offset-2 ui-selected:bg-white ui-selected:text-[--primary] transition select-none`;

const tabPanelStylesTailwind = `text-[0.875rem] [font-family:IBM_Plex_sans]`;

export default function BaseTabsDemo({ styling }: { styling: 'system' | 'tailwindcss' | 'css' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 144,
        gap: 2,
        py: 3,
      }}
    >
      {styling === 'system' && (
        <Tabs defaultValue={0}>
          <TabsList>
            <Tab>One</Tab>
            <Tab>Two</Tab>
            <Tab>Three</Tab>
          </TabsList>
          <TabPanel value={0}>First page</TabPanel>
          <TabPanel value={1}>Second page</TabPanel>
          <TabPanel value={2}>Third page</TabPanel>
        </Tabs>
      )}
      {styling === 'css' && (
        <Tabs defaultValue={0}>
          <GlobalStyles styles={CSS} />
          <Tabs.List>
            <Tabs.Tab>One</Tabs.Tab>
            <Tabs.Tab>Two</Tabs.Tab>
            <Tabs.Tab>Three</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value={0}>First page</Tabs.Panel>
          <Tabs.Panel value={1}>Second page</Tabs.Panel>
          <Tabs.Panel value={2}>Third page</Tabs.Panel>
        </Tabs>
      )}
      {styling === 'tailwindcss' && ( // https://play.tailwindcss.com/8jGjUI7EWe
        <Tabs defaultValue={0}>
          <Tabs.List className="mb-[16px] flex min-w-[300px] content-between items-center justify-center rounded-[12px] bg-[--primary] [box-shadow:var(--shadow)]">
            <Tabs.Tab className={tabStylesTailwind}>One</Tabs.Tab>
            <Tabs.Tab className={tabStylesTailwind}>Two</Tabs.Tab>
            <Tabs.Tab className={tabStylesTailwind}>Three</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel className={tabPanelStylesTailwind} value={0}>
            First page
          </Tabs.Panel>
          <Tabs.Panel className={tabPanelStylesTailwind} value={1}>
            Second page
          </Tabs.Panel>
          <Tabs.Panel className={tabPanelStylesTailwind} value={2}>
            Third page
          </Tabs.Panel>
        </Tabs>
      )}
    </Box>
  );
}
BaseTabsDemo.getCode = (styling: 'system' | 'tailwindcss' | 'css') => {
  if (styling === 'system') {
    return `import { Tabs } from '@base_ui/react/Tabs';
import { styled } from '@mui/system';

const StyledTabsList = styled(Tabs.List)\`${tabListStyles}\`;

const StyledTabPanel = styled(Tabs.Panel)\`${tabPanelStyles}\`;

const StyledTab = styled(Tabs.Tab)\`${tabStyles}\`;

<Tabs defaultValue={0}>
  <TabsList>
    <Tab>One</Tab>
    <Tab>Two</Tab>
    <Tab>Three</Tab>
  </TabsList>
  <TabPanel value={0}>
    First page
  </TabPanel>
  <TabPanel value={1}>
    Second page
  </TabPanel>
  <TabPanel value={2}>
    Third page
  </TabPanel>
</Tabs>
`;
  }
  if (styling === 'tailwindcss') {
    return `import { Tabs } from '@base_ui/react/Tabs';

<Tabs defaultValue={0}>
  <Tabs.List className="mb-[16px] flex min-w-[300px] content-between items-center justify-center rounded-[12px] bg-[--primary] [box-shadow:var(--shadow)]">
    <Tabs.Tab className={${tabStylesTailwind}}>One</Tabs.Tab>
    <Tabs.Tab className={${tabStylesTailwind}}>Two</Tabs.Tab>
    <Tabs.Tab className={${tabStylesTailwind}}>Three</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel className={${tabPanelStylesTailwind}} value={0}>
    First page
  </Tabs.Panel>
  <Tabs.Panel className={${tabPanelStylesTailwind}} value={1}>
    Second page
  </Tabs.Panel>
  <Tabs.Panel className={${tabPanelStylesTailwind}} value={2}>
    Third page
  </Tabs.Panel>
</Tabs>`;
  }
  if (styling === 'css') {
    return `import { Tabs } from '@base_ui/react/Tabs';
import { styled } from '@mui/system';
import './styles.css';

<Tabs defaultValue={0}>
  <Tabs.List>
    <Tabs.Tab>One</Tabs.Tab>
    <Tabs.Tab>Two</Tabs.Tab>
    <Tabs.Tab>Three</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value={0}>First page</Tabs.Panel>
  <Tabs.Panel value={1}>Second page</Tabs.Panel>
  <Tabs.Panel value={2}>Third page</Tabs.Panel>
</Tabs>

/* styles.css */
${CSS}
`;
  }
  return '';
};
