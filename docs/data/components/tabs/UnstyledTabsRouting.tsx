'use client';
import * as React from 'react';
import { Tabs } from '@base-ui-components/react/tabs';
import {
  MemoryRouter,
  Route,
  Routes,
  Link,
  matchPath,
  useLocation,
} from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';
import { styled } from '@mui/system';

function Router(props: { children?: React.ReactNode }) {
  const { children } = props;
  if (typeof window === 'undefined') {
    return <StaticRouter location="/drafts">{children}</StaticRouter>;
  }

  return (
    <MemoryRouter initialEntries={['/drafts']} initialIndex={0}>
      {children}
    </MemoryRouter>
  );
}

function useRouteMatch(patterns: readonly string[]) {
  const { pathname } = useLocation();

  for (let i = 0; i < patterns.length; i += 1) {
    const pattern = patterns[i];
    const possibleMatch = matchPath(pattern, pathname);
    if (possibleMatch !== null) {
      return possibleMatch;
    }
  }

  return null;
}

function MyTabs() {
  // You need to provide the routes in descendant order.
  // This means that if you have nested routes like:
  // users, users/new, users/edit.
  // Then the order should be ['users/add', 'users/edit', 'users'].
  const routeMatch = useRouteMatch(['/inbox/:id', '/drafts', '/trash']);
  const currentTab = routeMatch?.pattern?.path;

  return (
    <Tabs.Root value={currentTab}>
      <TabsList>
        <Tab
          value="/inbox/:id"
          render={(props) => <Link {...props} to="/inbox/1" />}
        >
          Inbox
        </Tab>
        <Tab value="/drafts" render={(props) => <Link {...props} to="/drafts" />}>
          Drafts
        </Tab>
        <Tab value="/trash" render={(props) => <Link {...props} to="/trash" />}>
          Trash
        </Tab>
      </TabsList>
    </Tabs.Root>
  );
}

function CurrentRoute() {
  const location = useLocation();
  return <RouteDisplay>Current route: {location.pathname}</RouteDisplay>;
}

export default function UnstyledTabsRouting() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="*" element={<CurrentRoute />} />
        </Routes>
        <MyTabs />
      </div>
    </Router>
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

const RouteDisplay = styled('p')`
  font-size: 0.75rem;
  color: ${grey[500]};
`;

const Tab = styled(Tabs.Tab)`
  font-family: 'IBM Plex Sans', sans-serif;
  color: #fff;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  background-color: transparent;
  width: 100%;
  padding: 10px 12px;
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
  box-shadow: 0px 4px 30px ${theme.palette.mode === 'dark' ? grey[900] : grey[200]};
  `,
);
