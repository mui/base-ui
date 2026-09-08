import * as React from 'react';
import { Accordion, DirectionProvider, Slider } from '@base-ui/react';
import './DirectionProvider.css';

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 8h13M8 14.5v-13" />
    </svg>
  );
}

// Canonical hero demo composition: a Slider whose filled indicator and
// thumb position visibly mirror when the reading direction flips to RTL.
export const Basic = () => (
  <div dir="rtl">
    <DirectionProvider direction="rtl">
      <Slider.Root defaultValue={25}>
        <Slider.Control className="Control">
          <Slider.Track className="Track">
            <Slider.Indicator className="Indicator" />
            <Slider.Thumb aria-label="Volume" className="Thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </DirectionProvider>
  </div>
);

// Side-by-side comparison: the same Slider composition under LTR vs RTL
// direction, so the mirrored fill/thumb position is directly comparable.
export const LtrVsRtl = () => (
  <div className="Row">
    <div className="Column">
      <span className="ColumnLabel">LTR</span>
      <div dir="ltr">
        <DirectionProvider direction="ltr">
          <Slider.Root defaultValue={25}>
            <Slider.Control className="Control">
              <Slider.Track className="Track">
                <Slider.Indicator className="Indicator" />
                <Slider.Thumb aria-label="Volume" className="Thumb" />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>
        </DirectionProvider>
      </div>
    </div>
    <div className="Column">
      <span className="ColumnLabel">RTL</span>
      <div dir="rtl">
        <DirectionProvider direction="rtl">
          <Slider.Root defaultValue={25}>
            <Slider.Control className="Control">
              <Slider.Track className="Track">
                <Slider.Indicator className="Indicator" />
                <Slider.Thumb aria-label="Volume" className="Thumb" />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>
        </DirectionProvider>
      </div>
    </div>
  </div>
);

// A second, more "real UI" composition: an Accordion rendered under RTL
// direction. The trigger row (icon + label) visually mirrors because
// Base UI's Accordion, like most flex-row compositions, follows the
// document/CSS reading direction.
export const AccordionRtl = () => (
  <div dir="rtl">
    <DirectionProvider direction="rtl">
      <Accordion.Root className="Accordion" defaultValue={['a']}>
        <Accordion.Item className="Item" value="a">
          <Accordion.Header className="Header">
            <Accordion.Trigger className="Trigger">
              ما هو Base UI؟
              <PlusIcon className="Icon" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="Panel">
            <div className="Content">
              Base UI هي مكتبة من مكونات React عالية الجودة وغير منسقة لأنظمة التصميم وتطبيقات
              الويب.
            </div>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item className="Item">
          <Accordion.Header className="Header">
            <Accordion.Trigger className="Trigger">
              كيف أبدأ؟
              <PlusIcon className="Icon" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="Panel">
            <div className="Content">راجع دليل "البدء السريع" في الوثائق.</div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </DirectionProvider>
  </div>
);
