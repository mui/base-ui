'use client';
import * as React from 'react';
import { PreviewCard } from '@base-ui-components/react/preview-card';
import { styled } from '@mui/system';

export default function UnstyledPreviewCardIntroduction() {
  return (
    <PreviewCard.Root>
      <TriggerLink href="#">@Base_UI</TriggerLink>
      <PreviewCard.Portal>
        <PreviewCard.Positioner sideOffset={8}>
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
            <PreviewCardArrow />
          </PreviewCardPopup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
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
  border-radius: 10px;
  filter: drop-shadow(0 2px 4px rgb(0 10 20 / 0.25));
  outline: 0;
  padding: 12px 16px;
  max-width: min(300px, var(--available-width));
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

export const PreviewCardArrow = styled(PreviewCard.Arrow)`
  width: 10px;
  height: 10px;
  transform: rotate(45deg);
  background: white;
  z-index: -1;

  &[data-side='top'] {
    bottom: -5px;
  }

  &[data-side='right'] {
    left: -5px;
  }

  &[data-side='bottom'] {
    top: -5px;
  }

  &[data-side='left'] {
    right: -5px;
  }
`;
