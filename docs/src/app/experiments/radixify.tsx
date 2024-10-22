'use client';
import * as React from 'react';
import { Tooltip } from '@base_ui/react/Tooltip';
import { styled, keyframes } from '@mui/system';
import { motion, AnimatePresence } from 'framer-motion';
// eslint-disable-next-line no-restricted-imports
import { radixify } from '@base_ui/react/utils/radixify';

const RadixifiedTooltipPopup = radixify(Tooltip.Popup);

export default function Demo() {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <Tooltip.Root open={isOpen} onOpenChange={setIsOpen}>
      <AnchorButton>I have a tooltip</AnchorButton>
      <AnimatePresence>
        {isOpen && (
          <Tooltip.Positioner keepMounted sideOffset={7}>
            <TooltipPopup data-type="framer-motion" asChild>
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.8 }}
                exit={{ opacity: 0, scale: 0 }}
              >
                Tooltip
              </motion.div>
            </TooltipPopup>
          </Tooltip.Positioner>
        )}
      </AnimatePresence>
    </Tooltip.Root>
  );
}

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

export const TooltipPopup = styled(RadixifiedTooltipPopup)`
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
    &[data-open] {
      visibility: visible;
      animation: ${scaleIn} 0.2s forwards;
    }

    &[data-exiting] {
      animation: ${scaleOut} 0.2s forwards;
    }
  }

  &[data-type='css-animation-keep-mounted'] {
    visibility: hidden;

    &[data-open] {
      visibility: visible;
      animation: ${scaleIn} 0.2s forwards;
    }

    &[data-exiting] {
      visibility: visible;
      animation: ${scaleOut} 0.2s forwards;
    }
  }

  &[data-type='css-transition'] {
    transition-property: opacity, transform, visibility;
    transition-duration: 0.2s;
    opacity: 0;
    transform: scale(0);

    &[data-open] {
      opacity: 1;
      transform: scale(1);
    }

    &[data-entering] {
      opacity: 0;
      transform: scale(0.8);
    }
  }

  &[data-type='css-transition-keep-mounted'] {
    transition-property: opacity, transform, visibility;
    transition-duration: 0.2s;
    opacity: 0;
    transform: scale(0.8);
    visibility: hidden;

    &[data-open] {
      opacity: 1;
      transform: scale(1);
      visibility: visible;
    }

    &[data-exiting] {
      opacity: 0;
      transform: scale(0);
    }
  }

  &[data-type='css-transition-starting-style'] {
    transition-property: opacity, transform, visibility;
    transition-duration: 0.2s;
    opacity: 0;
    transform: scale(0);

    &[data-open] {
      opacity: 1;
      transform: scale(1);
    }

    @starting-style {
      &[data-open] {
        opacity: 0;
        transform: scale(0.8);
      }
    }
  }
`;

const blue = {
  400: '#3399FF',
  600: '#0072E6',
  800: '#004C99',
};

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
