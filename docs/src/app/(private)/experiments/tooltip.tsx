'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { styled, keyframes } from '@mui/system';
import { motion, AnimatePresence } from 'framer-motion';

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
`;

const scaleOut = keyframes`
  to {
    opacity: 0;
    transform: scale(0);
  }
`;

const blue = {
  400: '#3399FF',
  600: '#0072E6',
  800: '#004C99',
};

export const TooltipPopup = styled(Tooltip.Popup)`
  font-family: 'IBM Plex Sans', sans-serif;
  background: black;
  color: white;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 95%;
  cursor: default;
  transform-origin: var(--transform-origin);

  &[data-instant] {
    transition-duration: 0s !important;
    animation-duration: 0s !important;
  }

  &[data-type='css-animation'] {
    animation: ${scaleIn} 0.2s forwards;

    &[data-ending-style] {
      animation: ${scaleOut} 0.2s forwards;
    }
  }

  &[data-type='css-animation-keep-mounted'] {
    animation: ${scaleIn} 0.2s forwards;

    &[data-ending-style] {
      animation: ${scaleOut} 0.2s forwards;
    }
  }

  &[data-type='css-transition'] {
    transition-property: opacity, transform;
    transition-duration: 0.2s;

    &[data-ending-style] {
      opacity: 0;
      transform: scale(0);
    }

    &[data-starting-style] {
      opacity: 0;
      transform: scale(0.8);
    }
  }

  &[data-type='css-transition-keep-mounted'] {
    transition-property: opacity, transform;
    transition-duration: 0.2s;

    &[data-ending-style] {
      opacity: 0;
      transform: scale(0);
    }

    &[data-starting-style] {
      opacity: 0;
      transform: scale(0.8);
    }
  }

  &[data-type='css-transition-starting-style'] {
    transition-property: opacity, transform, visibility;
    transition-duration: 0.2s;

    @starting-style {
      & {
        opacity: 0;
        transform: scale(0.8);
      }
    }

    &[data-ending-style] {
      opacity: 0;
      transform: scale(0);
    }
  }
`;

export const AnchorButton = styled(Tooltip.Trigger)`
  border: none;
  background: ${blue[600]};
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 16px;

  &:focus-visible {
    outline: 2px solid ${blue[400]};
    outline-offset: 2px;
  }

  &:hover,
  &[data-popup-open] {
    background: ${blue[800]};
  }
`;

export default function TooltipTransitionExperiment() {
  return (
    <div
      style={{
        width: 700,
        padding: 50,
        margin: '0 auto',
        fontFamily: '"IBM Plex Sans", sans-serif',
      }}
    >
      <h1>Base UI Tooltip Popup Animations</h1>
      <hr />

      <h2>Conditional Rendering</h2>

      <h3>CSS Animation Group</h3>
      <div style={{ display: 'flex', gap: 5 }}>
        <Tooltip.Provider closeDelay={200}>
          <Tooltip.Root>
            <AnchorButton>Anchor</AnchorButton>
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={(sizes) => sizes.anchor.height}>
                <TooltipPopup data-type="css-animation">Tooltip</TooltipPopup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
          <Tooltip.Root>
            <AnchorButton>Anchor</AnchorButton>
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={7}>
                <TooltipPopup data-type="css-animation">Tooltip</TooltipPopup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
      <h3>CSS Animation</h3>
      <Tooltip.Root>
        <AnchorButton>Anchor</AnchorButton>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={7}>
            <TooltipPopup data-type="css-animation">Tooltip</TooltipPopup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>

      <h3>CSS Transition Group</h3>
      <div style={{ display: 'flex', gap: 5 }}>
        <Tooltip.Provider closeDelay={200}>
          <Tooltip.Root>
            <AnchorButton>Anchor</AnchorButton>
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={7}>
                <TooltipPopup data-type="css-transition">Tooltip</TooltipPopup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
          <Tooltip.Root>
            <AnchorButton>Anchor</AnchorButton>
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={7}>
                <TooltipPopup data-type="css-transition">Tooltip</TooltipPopup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
      <h3>CSS Transition</h3>
      <Tooltip.Root>
        <AnchorButton>Anchor</AnchorButton>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={7}>
            <TooltipPopup data-type="css-transition">Tooltip</TooltipPopup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>

      <h3>CSS Transition with `@starting-style`</h3>
      <p>
        No longer supported due to{' '}
        <a href="https://github.com/mui/base-ui/pull/992">
          https://github.com/mui/base-ui/pull/992
        </a>
      </p>
      <Tooltip.Root>
        <AnchorButton>Anchor</AnchorButton>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={7}>
            <TooltipPopup data-type="css-transition-starting-style">
              Tooltip
            </TooltipPopup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>

      <hr />

      <h2>Keep Mounted</h2>

      <h3>CSS Animation Group</h3>
      <div style={{ display: 'flex', gap: 5 }}>
        <Tooltip.Provider closeDelay={200}>
          <Tooltip.Root>
            <AnchorButton>Anchor</AnchorButton>
            <Tooltip.Portal keepMounted>
              <Tooltip.Positioner sideOffset={7}>
                <TooltipPopup data-type="css-animation-keep-mounted">
                  Tooltip
                </TooltipPopup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
          <Tooltip.Root>
            <AnchorButton>Anchor</AnchorButton>
            <Tooltip.Portal keepMounted>
              <Tooltip.Positioner sideOffset={7}>
                <TooltipPopup data-type="css-animation-keep-mounted">
                  Tooltip
                </TooltipPopup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
      <h3>CSS Animation</h3>
      <Tooltip.Root>
        <AnchorButton>Anchor</AnchorButton>
        <Tooltip.Portal keepMounted>
          <Tooltip.Positioner sideOffset={7}>
            <TooltipPopup data-type="css-animation-keep-mounted">
              Tooltip
            </TooltipPopup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>

      <h3>CSS Transition Group</h3>
      <div style={{ display: 'flex', gap: 5 }}>
        <Tooltip.Provider closeDelay={200}>
          <Tooltip.Root>
            <AnchorButton>Anchor</AnchorButton>
            <Tooltip.Portal keepMounted>
              <Tooltip.Positioner sideOffset={7}>
                <TooltipPopup data-type="css-transition-keep-mounted">
                  Tooltip
                </TooltipPopup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
          <Tooltip.Root>
            <AnchorButton>Anchor</AnchorButton>
            <Tooltip.Portal keepMounted>
              <Tooltip.Positioner sideOffset={7}>
                <TooltipPopup data-type="css-transition-keep-mounted">
                  Tooltip
                </TooltipPopup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
      <h3>CSS Transition</h3>
      <Tooltip.Root>
        <AnchorButton>Anchor</AnchorButton>
        <Tooltip.Portal keepMounted>
          <Tooltip.Positioner sideOffset={7}>
            <TooltipPopup data-type="css-transition-keep-mounted">
              Tooltip
            </TooltipPopup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>

      <hr />

      <h2>JavaScript Animation (`framer-motion`)</h2>
      <FramerMotion />
    </div>
  );
}

function FramerMotion() {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <Tooltip.Root open={isOpen} onOpenChange={setIsOpen}>
      <AnchorButton>Anchor</AnchorButton>
      <AnimatePresence>
        {isOpen && (
          <Tooltip.Portal keepMounted>
            <Tooltip.Positioner sideOffset={7}>
              <TooltipPopup
                data-type="framer-motion"
                render={
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    exit={{ opacity: 0, scale: 0 }}
                  />
                }
              >
                Tooltip
              </TooltipPopup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        )}
      </AnimatePresence>
    </Tooltip.Root>
  );
}
