'use client';
import * as React from 'react';
import { PreviewCard } from '@base-ui-components/react/preview-card';
import { styled } from '@mui/system';

export default function UnstyledPreviewCardTransition() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <PreviewCard.Root>
        <TriggerLink href="#">Trigger</TriggerLink>
        <PreviewCard.Positioner sideOffset={5}>
          <PreviewCardPopup>
            <img
              src="https://pbs.twimg.com/profile_images/1798056009291997184/B-prVmUP_400x400.jpg"
              alt="Base UI Logo"
              width={80}
              height={80}
              style={{ borderRadius: '50%' }}
            />
            <h2 style={{ fontSize: 20, margin: 0 }}>Base UI</h2>
            <p>
              Unstyled React components and hooks (@base-ui-components/react), by
              @MUI_hq.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <span>
                <strong>1</strong> Following
              </span>
              <span>
                <strong>1,000</strong> Followers
              </span>
            </div>
          </PreviewCardPopup>
        </PreviewCard.Positioner>
      </PreviewCard.Root>
    </div>
  );
}

const blue = {
  400: '#3399FF',
  600: '#0072E6',
  800: '#004C99',
};

export const PreviewCardPopup = styled(PreviewCard.Popup)`
  position: relative;
  background: white;
  color: black;
  border-radius: 5px;
  filter: drop-shadow(0 0.1rem 0.25rem rgb(0 10 20 / 0.25));
  outline: 0;
  padding: 12px 16px;
  max-width: min(300px, var(--available-width));
  transition-property: opacity, transform;
  transition-duration: 0.2s;
  opacity: 0;
  transform-origin: var(--transform-origin);

  &[data-open] {
    opacity: 1;
    transform: scale(1);
  }

  &[data-starting-style] {
    opacity: 0;
    transform: scale(0.95);
  }
`;

export const TriggerLink = styled(PreviewCard.Trigger)`
  border: none;
  color: ${blue[600]};
  font-size: 18px;
  text-decoration: none;

  &:hover {
    color: ${blue[800]};
  }

  &:focus-visible {
    outline: 2px solid ${blue[400]};
    outline-offset: 2px;
  }
`;
