import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import { Tabs, TabsProps } from '@base_ui/react/Tabs';
import HighlightedCode from './HighlightedCode';

const TabList = styled(Tabs.List)(({ theme }) => ({
  padding: 6,
  display: 'flex',
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.primaryDark[700],
  backgroundColor: (theme.vars || theme).palette.primaryDark[900],
  borderTopLeftRadius: (theme.vars || theme).shape.borderRadius,
  borderTopRightRadius: (theme.vars || theme).shape.borderRadius,
  ...theme.applyDarkStyles({
    backgroundColor: alpha(theme.palette.primaryDark[800], 0.5),
  }),
}));

const TabPanel = styled(Tabs.Panel)<{ ownerState: { mounted: boolean } }>(({ ownerState }) => ({
  '& pre': {
    marginTop: -1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    '& code': {
      opacity: ownerState.mounted ? 1 : 0,
    },
  },
}));

const Tab = styled(Tabs.Tab)<{ ownerState: { mounted: boolean } }>(({ theme, ownerState }) =>
  theme.unstable_sx({
    p: 0.8,
    border: 'none',
    bgcolor: 'transparent',
    color: (theme.vars || theme).palette.grey[500],
    fontSize: theme.typography.pxToRem(12),
    fontWeight: theme.typography.fontWeightSemiBold,
    fontFamily: theme.typography.fontFamilyCode,
    outline: 'none',
    minWidth: 52,
    cursor: 'pointer',
    borderRadius: '8px',
    position: 'relative',
    '&:not(:first-of-type)': {
      marginLeft: 0.5,
    },
    ...(ownerState.mounted && {
      '&.base--selected': {
        color: '#FFF',
        '&::after': {
          content: "''",
          position: 'absolute',
          left: 0,
          bottom: '-6px',
          height: 2,
          width: '100%',
          bgcolor: (theme.vars || theme).palette.primary.light,
        },
      },
    }),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primaryDark[500], 0.5),
    },
    '&:focus-visible': {
      outline: '2px solid',
      outlineOffset: '-2px',
      outlineColor: (theme.vars || theme).palette.primary.light,
    },
  }),
);

type TabsConfig = {
  code: string | ((tab: string) => string);
  language: string;
  tab: string;
};
export default function HighlightedCodeWithTabs({
  tabs,
  storageKey,
}: {
  tabs: Array<TabsConfig>;
  storageKey?: string;
} & Record<string, any>) {
  const availableTabs = React.useMemo(() => tabs.map(({ tab }) => tab), [tabs]);
  const [activeTab, setActiveTab] = React.useState(availableTabs[0]);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    try {
      setActiveTab((prev) => {
        if (storageKey === undefined) {
          return prev;
        }
        const storedValues = localStorage.getItem(storageKey);

        return storedValues && availableTabs.includes(storedValues) ? storedValues : prev;
      });
    } catch (error) {
      // ignore error
    }
    setMounted(true);
  }, [availableTabs, storageKey]);

  const handleChange: TabsProps['onChange'] = (event, newValue) => {
    setActiveTab(newValue as string);
    if (storageKey === undefined) {
      return;
    }
    try {
      localStorage.setItem(storageKey, newValue as string);
    } catch (error) {
      // ignore error
    }
  };

  const ownerState = { mounted };
  return (
    <Tabs value={activeTab} onChange={handleChange}>
      <TabList>
        {tabs.map(({ tab }) => (
          <Tab ownerState={ownerState} key={tab} value={tab}>
            {tab}
          </Tab>
        ))}
      </TabList>
      {tabs.map(({ tab, language, code }) => (
        <TabPanel ownerState={ownerState} key={tab} value={tab}>
          <HighlightedCode
            // @ts-ignore
            language={language || 'bash'}
            code={typeof code === 'function' ? code(tab) : code}
          />
        </TabPanel>
      ))}
    </Tabs>
  );
}
