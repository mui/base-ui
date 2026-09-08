import * as React from 'react';
import { PreviewCard } from '@base-ui/react';
import './PreviewCard.css';

export const Basic = () => (
  <PreviewCard.Root defaultOpen>
    <p className="Paragraph">
      The principles of good{' '}
      <PreviewCard.Trigger className="Link" href="https://en.wikipedia.org/wiki/Typography">
        typography
      </PreviewCard.Trigger>{' '}
      remain in the digital age.
    </p>

    <PreviewCard.Portal>
      <PreviewCard.Positioner sideOffset={8}>
        <PreviewCard.Popup className="Popup">
          <PreviewCard.Arrow className="Arrow" />
          <div className="PopupContent">
            <div className="ImagePlaceholder">Typography</div>
            <p className="Summary">
              <strong>Typography</strong> is the art and science of arranging type to make written
              language clear, visually appealing, and effective in communication.
            </p>
          </div>
        </PreviewCard.Popup>
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  </PreviewCard.Root>
);
