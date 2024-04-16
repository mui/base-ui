import * as React from 'react';
import { useTheme } from '@mui/system';
import * as Tabs from '@base_ui/react/Tabs';

export default function UnstyledTabsCustomized() {
  return (
    <React.Fragment>
      <Tabs.Root defaultValue={1}>
        <Tabs.List className="CustomTabsList">
          <Tabs.Tab className="CustomTab" value={1}>
            One
          </Tabs.Tab>
          <Tabs.Tab className="CustomTab" value={2}>
            Two
          </Tabs.Tab>
          <Tabs.Tab className="CustomTab" value={3}>
            Three
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel className="CustomTabPanel" value={1}>
          First page
        </Tabs.Panel>
        <Tabs.Panel className="CustomTabPanel" value={2}>
          Second page
        </Tabs.Panel>
        <Tabs.Panel className="CustomTabPanel" value={3}>
          Third page
        </Tabs.Panel>
      </Tabs.Root>
      <Styles />
    </React.Fragment>
  );
}

const cyan = {
  50: '#E9F8FC',
  100: '#BDEBF4',
  200: '#99D8E5',
  300: '#66BACC',
  400: '#1F94AD',
  500: '#0D5463',
  600: '#094855',
  700: '#063C47',
  800: '#043039',
  900: '#022127',
};

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

function Styles() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  return (
    <style>
      {`
      .CustomTabsList {
        min-width: 400px;
        background-color: ${cyan[500]};
        border-radius: 12px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        align-content: space-between;
        box-shadow: 0px 4px 6px ${
          isDarkMode ? 'rgba(0,0,0, 0.4)' : 'rgba(0,0,0, 0.2)'
        };
      }

      .CustomTab {
        font-family: 'IBM Plex Sans', sans-serif;
        color: white;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: bold;
        background-color: transparent;
        width: 100%;
        line-height: 1.5;
        padding: 8px 12px;
        margin: 6px;
        border: none;
        border-radius: 8px;
        display: flex;
        justify-content: center;
      }

      .CustomTab:hover {
        background-color: ${cyan[400]};
      }

      .CustomTab:focus {
        color: #fff;
        outline: 3px solid ${cyan[200]};
      }

      .CustomTab[data-selected='true'] {
        background-color: #fff;
        color: ${cyan[600]};
      }

      .CustomTab[data-disabled='true'] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .CustomTabPanel {
        width: 100%;
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 0.875rem;
      }
      `}
    </style>
  );
}
