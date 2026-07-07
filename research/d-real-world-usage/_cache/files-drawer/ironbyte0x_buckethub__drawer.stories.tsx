import { useState } from 'react';
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer';
import { Box } from '@buckethub/styled-system/jsx';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { Text } from '../text';
import { Drawer } from './drawer';
import { StyledDrawerBackdrop, StyledDrawerPopup, StyledDrawerViewport } from './drawer.styled';

const meta: Meta<typeof Drawer> = {
  component: Drawer,
  title: 'Components/Drawer'
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof Drawer>;

export const Right: Story = {
  render: () => (
    <Drawer>
      <Drawer.Trigger>
        <Button variant="primary">Open Right Drawer</Button>
      </Drawer.Trigger>

      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Right Drawer</Drawer.Title>
          <Drawer.Description>This drawer slides in from the right.</Drawer.Description>
          <Drawer.Close />
        </Drawer.Header>

        <Drawer.Body>
          <p>This is the default position. Swipe left to dismiss.</p>
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.CloseTrigger>
            <Button variant="secondary">Cancel</Button>
          </Drawer.CloseTrigger>
          <Button variant="primary">Confirm</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
};

export const Left: Story = {
  render: () => (
    <Drawer position="left">
      <Drawer.Trigger>
        <Button variant="primary">Open Left Drawer</Button>
      </Drawer.Trigger>

      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Left Drawer</Drawer.Title>
          <Drawer.Description>This drawer slides in from the left.</Drawer.Description>
          <Drawer.Close />
        </Drawer.Header>

        <Drawer.Body>
          <p>Useful for navigation menus. Swipe right to dismiss.</p>
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.CloseTrigger>
            <Button variant="secondary">Close</Button>
          </Drawer.CloseTrigger>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
};

export const Bottom: Story = {
  render: () => (
    <Drawer position="bottom">
      <Drawer.Trigger>
        <Button variant="primary">Open Bottom Drawer</Button>
      </Drawer.Trigger>

      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Bottom Drawer</Drawer.Title>
          <Drawer.Description>
            This drawer slides up from the bottom with rounded top corners.
          </Drawer.Description>
          <Drawer.Close />
        </Drawer.Header>

        <Drawer.Body>
          <p>Great for mobile action sheets. Swipe down to dismiss.</p>
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.CloseTrigger>
            <Button variant="secondary">Cancel</Button>
          </Drawer.CloseTrigger>

          <Button variant="primary">Confirm</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
};

export const BottomSafari: Story = {
  render: () => (
    <Drawer position="bottom">
      <Drawer.Trigger>
        <Button variant="primary">Open Bottom Drawer</Button>
      </Drawer.Trigger>

      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Bottom Drawer</Drawer.Title>
          <Drawer.Description>
            This drawer slides up from the bottom with rounded top corners.
          </Drawer.Description>
          <Drawer.Close />
        </Drawer.Header>

        <Drawer.Body
          css={{
            paddingBottom: 'var(--drawer-bottom-offset, {spacing.5})'
          }}
        >
          <p>Great for mobile action sheets. Swipe down to dismiss.</p>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
};

export const Top: Story = {
  render: () => (
    <Drawer position="top">
      <Drawer.Trigger>
        <Button variant="primary">Open Top Drawer</Button>
      </Drawer.Trigger>

      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Top Drawer</Drawer.Title>
          <Drawer.Description>This drawer slides down from the top.</Drawer.Description>
          <Drawer.Close />
        </Drawer.Header>

        <Drawer.Body>
          <p>Useful for notifications or alerts. Swipe up to dismiss.</p>
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.CloseTrigger>
            <Button variant="secondary">Close</Button>
          </Drawer.CloseTrigger>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
};

const SwipeAreaExample = () => {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  return (
    <Box
      ref={setPortalContainer}
      css={{
        position: 'relative',
        width: '100%',
        minHeight: '320px',
        overflow: 'hidden',
        border: '1px solid var(--colors-border-input)',
        borderRadius: '8px',
        backgroundColor: 'background-surface'
      }}
    >
      <Drawer position="right" modal={false}>
        <Drawer.SwipeArea
          css={{
            position: 'absolute',
            top: '0',
            right: '0',
            bottom: '0',
            width: '10',
            zIndex: '1',
            borderLeft: '2px dashed {colors.border-input-focus}',
            backgroundColor: 'border-input-focus/10'
          }}
        >
          <Box
            css={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%) rotate(-90deg)',
              transformOrigin: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'border-input-focus',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}
          >
            Swipe here
          </Box>
        </Drawer.SwipeArea>

        <Box
          css={{
            minHeight: '320px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: '3rem'
          }}
        >
          <Text>Swipe from the right edge to open the drawer.</Text>
        </Box>

        <DrawerPrimitive.Portal container={portalContainer}>
          <StyledDrawerBackdrop />
          <StyledDrawerViewport position="right">
            <StyledDrawerPopup position="right">
              <Drawer.Header>
                <Drawer.Title>Library</Drawer.Title>
                <Drawer.Description>
                  Swipe from the edge whenever you want to jump back into your playlists.
                </Drawer.Description>
              </Drawer.Header>

              <Drawer.Footer>
                <Drawer.CloseTrigger>
                  <Button variant="secondary">Close</Button>
                </Drawer.CloseTrigger>
              </Drawer.Footer>
            </StyledDrawerPopup>
          </StyledDrawerViewport>
        </DrawerPrimitive.Portal>
      </Drawer>
    </Box>
  );
};

export const WithSwipeArea: Story = {
  render: () => <SwipeAreaExample />
};

export const NestedBottom: Story = {
  render: () => (
    <Drawer position="bottom">
      <Drawer.Trigger>
        <Button variant="primary">Open Bottom Drawer</Button>
      </Drawer.Trigger>

      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Parent Drawer</Drawer.Title>
          <Drawer.Description>
            This drawer supports nested drawers with stacking.
          </Drawer.Description>
          <Drawer.Close />
        </Drawer.Header>

        <Drawer.Body>
          <p>Open the nested drawer to see the stacking animation.</p>

          <Drawer position="bottom">
            <Drawer.Trigger>
              <Button variant="secondary" css={{ marginTop: '4' }}>
                Open Nested Drawer
              </Button>
            </Drawer.Trigger>

            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>Nested Drawer</Drawer.Title>
                <Drawer.Description>
                  This is a nested drawer. The parent scales down behind it.
                </Drawer.Description>
                <Drawer.Close />
              </Drawer.Header>

              <Drawer.Body>
                <p>Swipe down to dismiss this drawer and return to the parent.</p>
              </Drawer.Body>

              <Drawer.Footer>
                <Drawer.CloseTrigger>
                  <Button variant="secondary">Close</Button>
                </Drawer.CloseTrigger>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer>
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.CloseTrigger>
            <Button variant="secondary">Close</Button>
          </Drawer.CloseTrigger>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
};

export const NestedRight: Story = {
  render: () => (
    <Drawer>
      <Drawer.Trigger>
        <Button variant="primary">Open Right Drawer</Button>
      </Drawer.Trigger>

      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Parent Drawer</Drawer.Title>
          <Drawer.Description>Nested drawer stacking from the right.</Drawer.Description>
          <Drawer.Close />
        </Drawer.Header>

        <Drawer.Body>
          <p>Open the nested drawer to see the stacking animation.</p>

          <Drawer>
            <Drawer.Trigger>
              <Button variant="secondary" css={{ marginTop: '4' }}>
                Open Nested Drawer
              </Button>
            </Drawer.Trigger>

            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>Nested Drawer</Drawer.Title>
                <Drawer.Description>The parent scales down behind this drawer.</Drawer.Description>
                <Drawer.Close />
              </Drawer.Header>

              <Drawer.Body>
                <p>Swipe right to dismiss and return to the parent.</p>
              </Drawer.Body>

              <Drawer.Footer>
                <Drawer.CloseTrigger>
                  <Button variant="secondary">Close</Button>
                </Drawer.CloseTrigger>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer>
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.CloseTrigger>
            <Button variant="secondary">Close</Button>
          </Drawer.CloseTrigger>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
};
