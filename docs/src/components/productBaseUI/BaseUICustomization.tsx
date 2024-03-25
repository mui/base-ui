import * as React from 'react';
import { styled } from '@mui/system';
import { Switch as BaseSwitch } from '@mui/base/Switch';
import { useSwitch, UseSwitchParameters } from '@mui/base/useSwitch';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import SvgTwinkle from 'docs/src/icons/SvgTwinkle';
import Section from 'docs/src/layouts/Section';
import Highlighter from 'docs/src/components/action/Highlighter';
import Item, { Group } from 'docs/src/components/action/Item';
import GradientText from 'docs/src/components/typography/GradientText';
import SectionHeadline from 'docs/src/components/typography/SectionHeadline';
import FlashCode from 'docs/src/components/animation/FlashCode';
import Frame from 'docs/src/components/action/Frame';
import HighlightedCode from 'docs/src/modules/components/HighlightedCode';
import MarkdownElement from 'docs/src/components/markdown/MarkdownElement';

const code = `
import { Switch as BaseSwitch } from '@mui/base/Switch';
import { useSwitch } from '@mui/base/useSwitch';
import { styled } from '@mui/system';

const StyledSwitchRoot = styled('button')(\`
  font-size: 0;
  position: relative;
  display: inline-flex;
  width: 40px;
  height: 24px;
  margin: 10px;
  padding: 0;
  border: none;
  cursor: pointer;
  border-radius: 16px;
  background: #B0B8C4;
  transition: all ease 120ms;

  :hover {
    background: #9DA8B7;
  }

  &[data-disabled] {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &[data-state="checked"] {
    background: #007FFF;
    :hover {
      background: #0072E5;
    }
  }

  &:focus-visible {
    outline: 4px solid rgba(0, 127, 255, 0.4);
  }

  :where([data-mui-color-scheme='dark']) & {
    background: #6B7A90;
  
    :hover {
      background: #434D5B;
    }
  }
\`);

const StyledSwitchThumb = styled('span')\`
  display: block;
  width: 16px;
  height: 16px;
  top: 4px;
  left: 4px;
  border-radius: 16px;
  background-color: #fff;
  position: relative;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;

  &[data-state='checked'] {
    left: 20px;
  }
\`;

function SwitchFromHook(props) {
  const { getInputProps, getButtonProps, checked, disabled } = useSwitch(props);

  const stateAttributes = {
    'data-state': checked ? 'checked' : 'unchecked',
    'data-disabled': disabled || undefined,
  };

  return (
    <StyledSwitchRoot aria-label="Demo switch" {...getButtonProps()} {...stateAttributes}>
      <StyledSwitchThumb {...stateAttributes} />
      <input {...getInputProps()} />
    </StyledSwitchRoot>
  );
}

function App() {
  return (
    <BaseSwitch
      aria-label="Demo switch"
      render={(props) => <StyledSwitchRoot {...props} />}
    >
      <BaseSwitch render={(props) => <StyledSwitchThumb {...props} />} />
    </BaseSwitch>
    <SwitchFromHook />
  )
}
`;

const startLine = [4, 85, 65];
const endLine = [45, 87, 79];
const scrollTo = [0, 1400, 1140];

const StyledSwitchRoot = styled('button')(`
  font-size: 0;
  position: relative;
  display: inline-flex;
  width: 40px;
  height: 24px;
  margin: 10px;
  padding: 0;
  border: none;
  cursor: pointer;
  border-radius: 16px;
  background: #B0B8C4;
  transition: all ease 120ms;

  :hover {
    background: #9DA8B7;
  }

  &[data-disabled] {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &[data-state="checked"] {
    background: #007FFF;
    :hover {
      background: #0072E5;
    }
  }

  &:focus-visible {
    outline: 4px solid rgba(0, 127, 255, 0.4);
  }

  :where([data-mui-color-scheme='dark']) & {
    background: #6B7A90;
  
    :hover {
      background: #434D5B;
    }
  }
`);

const StyledSwitchThumb = styled('span')`
  display: block;
  width: 16px;
  height: 16px;
  top: 4px;
  left: 4px;
  border-radius: 16px;
  background-color: #fff;
  position: relative;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;

  &[data-state='checked'] {
    left: 20px;
  }
`;

function SwitchFromHook(props: UseSwitchParameters) {
  const { getInputProps, getButtonProps, checked } = useSwitch(props);

  const stateAttributes = {
    'data-state': checked ? 'checked' : 'unchecked',
    'data-disabled': props.disabled || undefined,
  };

  return (
    <StyledSwitchRoot aria-label="Demo switch" {...getButtonProps()} {...stateAttributes}>
      <StyledSwitchThumb {...stateAttributes} />
      <input {...getInputProps()} />
    </StyledSwitchRoot>
  );
}

export default function BaseUICustomization() {
  const [index, setIndex] = React.useState(0);
  const infoRef = React.useRef<HTMLDivElement | null>(null);
  function getSelectedProps(i: number) {
    return {
      selected: index === i,
      sx: { '& svg': { opacity: index === i ? 1 : 0.5 } },
    };
  }
  React.useEffect(() => {
    if (infoRef.current) {
      infoRef.current.scroll({ top: scrollTo[index], behavior: 'smooth' });
    }
  }, [index]);
  return (
    <Section>
      <Grid container spacing={2}>
        <Grid item md={6} sx={{ minWidth: 0 }}>
          <SectionHeadline
            overline="Customization"
            title={
              <Typography variant="h2">
                <GradientText>Endless possibilities </GradientText>
                <br /> with a lightweight API
              </Typography>
            }
            description="With Base UI, you have the freedom to decide how much you want to customize a component's structure and style."
          />
          <Group sx={{ m: -2, p: 2 }}>
            <Highlighter disableBorder {...getSelectedProps(0)} onClick={() => setIndex(0)}>
              <Item
                icon={<SvgTwinkle />}
                title="Applying custom CSS rules"
                description="Your CSS, your rules. With Base UI there are no styles to override, so you can start with a clean slate."
              />
            </Highlighter>
            <Highlighter disableBorder {...getSelectedProps(1)} onClick={() => setIndex(1)}>
              <Item
                icon={<SvgTwinkle />}
                title="Overriding subcomponent slots"
                description="Default DOM structure doesn't suit your needs? Replace any node with the element you prefer using the `render` prop."
              />
            </Highlighter>
            <Highlighter disableBorder {...getSelectedProps(2)} onClick={() => setIndex(2)}>
              <Item
                icon={<SvgTwinkle />}
                title="Creating custom components using hooks"
                description="Base UI includes low-level hooks for adding functionality to your own fully custom-built components."
              />
            </Highlighter>
          </Group>
        </Grid>
        <Grid item xs={12} md={6}>
          <Frame sx={{ height: '100%' }}>
            <Frame.Demo
              sx={(theme) => ({
                overflow: 'auto',
                flexGrow: 1,
                height: '140px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundSize: '100%, 72px',
                background: `${(theme.vars || theme).palette.gradients.linearSubtle}`,
                ...theme.applyDarkStyles({
                  backgroundSize: '72px, 100%',
                  background: `${(theme.vars || theme).palette.gradients.linearSubtle}`,
                }),
              })}
            >
              <BaseSwitch
                aria-label="Demo switch"
                render={(props) => <StyledSwitchRoot {...props} />}
              >
                <BaseSwitch render={(props) => <StyledSwitchThumb {...props} />} />
              </BaseSwitch>
              <SwitchFromHook defaultChecked />
            </Frame.Demo>
            <Frame.Info
              ref={infoRef}
              sx={{
                maxHeight: 450,
                overflow: 'auto',
              }}
            >
              <Box sx={{ position: 'relative', '&& pre': { bgcolor: 'transparent' } }}>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <HighlightedCode
                    copyButtonHidden
                    component={MarkdownElement}
                    code={code}
                    language="jsx"
                  />
                </Box>
                <FlashCode startLine={startLine[index]} endLine={endLine[index]} sx={{ mx: -1 }} />
              </Box>
            </Frame.Info>
          </Frame>
        </Grid>
      </Grid>
    </Section>
  );
}
