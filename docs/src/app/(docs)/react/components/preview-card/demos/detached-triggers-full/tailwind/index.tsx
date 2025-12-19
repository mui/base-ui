'use client';
import * as React from 'react';
import { PreviewCard } from '@base-ui/react/preview-card';

const demoPreviewCard = PreviewCard.createHandle<React.ReactElement>();

const cardContents = {
  typography: (
    <div className="flex flex-col gap-2">
      <img
        width="448"
        height="300"
        className="block w-full rounded-sm"
        src="https://images.unsplash.com/photo-1619615391095-dfa29e1672ef?q=80&w=448&h=300"
        alt="Station Hofplein signage in Rotterdam, Netherlands"
      />
      <p className="text-sm text-pretty text-gray-900">
        <strong>Typography</strong> is the art and science of arranging type.
      </p>
    </div>
  ),
  design: (
    <div className="flex flex-col gap-2">
      <img
        width="241"
        height="240"
        className="block w-full rounded-sm"
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Braun_ABW30_%28schwarz%29.jpg/250px-Braun_ABW30_%28schwarz%29.jpg"
        alt="Braun ABW30 clock"
      />
      <p className="text-sm text-pretty text-gray-900">
        A <strong>design</strong> is the concept or proposal for an object, process, or system.
      </p>
    </div>
  ),
  art: (
    <div className="flex flex-col gap-2">
      <img
        width="206"
        height="240"
        className="block w-full rounded-sm"
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/MonaLisa_sfumato.jpeg/250px-MonaLisa_sfumato.jpeg"
        alt="Mona Lisa"
      />
      <p className="text-sm text-pretty text-gray-900">
        <strong>Art</strong> conveys emotion and ideas through imaginative craft.
      </p>
    </div>
  ),
};

export default function PreviewCardDetachedTriggersFullDemo() {
  return (
    <div>
      <p className="max-w-64 text-base text-balance text-gray-900">
        Discover{' '}
        <PreviewCard.Trigger
          className="text-blue-800 no-underline decoration-blue-800/60 decoration-1 underline-offset-2 outline-none hover:underline focus-visible:rounded-sm focus-visible:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 data-[popup-open]:underline data-[popup-open]:focus-visible:no-underline"
          handle={demoPreviewCard}
          href="https://en.wikipedia.org/wiki/Typography"
          payload={cardContents.typography}
        >
          typography
        </PreviewCard.Trigger>
        ,{' '}
        <PreviewCard.Trigger
          className="text-blue-800 no-underline decoration-blue-800/60 decoration-1 underline-offset-2 outline-none hover:underline focus-visible:rounded-sm focus-visible:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 data-[popup-open]:underline data-[popup-open]:focus-visible:no-underline"
          handle={demoPreviewCard}
          href="https://en.wikipedia.org/wiki/Industrial_design"
          payload={cardContents.design}
        >
          design
        </PreviewCard.Trigger>
        , or{' '}
        <PreviewCard.Trigger
          className="text-blue-800 no-underline decoration-blue-800/60 decoration-1 underline-offset-2 outline-none hover:underline focus-visible:rounded-sm focus-visible:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 data-[popup-open]:underline data-[popup-open]:focus-visible:no-underline"
          handle={demoPreviewCard}
          href="https://en.wikipedia.org/wiki/Art"
          payload={cardContents.art}
        >
          art
        </PreviewCard.Trigger>
        without leaving the page.
      </p>

      <PreviewCard.Root handle={demoPreviewCard}>
        {({ payload }) => (
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              sideOffset={8}
              className="
                h-(--positioner-height) w-(--positioner-width)
                max-w-(--available-width)
                transition-[top,left,right,bottom,transform]
                duration-[0.35s]
                ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              <PreviewCard.Popup
                className="
                  relative
                  w-(--popup-width,240px)
                  max-w-[500px]
                  rounded-lg
                  bg-[canvas]
                  text-sm
                  origin-(--transform-origin)
                  shadow-lg shadow-gray-200 outline outline-1 outline-gray-200
                  transition-[width,height,opacity,scale]
                  duration-[0.35s]
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  data-ending-style:opacity-0 data-ending-style:scale-90
                  data-starting-style:opacity-0 data-starting-style:scale-90
                  dark:shadow-none dark:outline-gray-300 dark:-outline-offset-1"
              >
                <PreviewCard.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
                  <ArrowSvg />
                </PreviewCard.Arrow>

                <PreviewCard.Viewport
                  className="
                    relative overflow-clip p-2
                    [&_[data-previous]]:translate-x-0
                    [&_[data-previous]]:opacity-100
                    [&_[data-previous]]:transition-[translate,opacity]
                    [&_[data-previous]]:duration-[350ms,175ms]
                    [&_[data-previous]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    [&_[data-current]]:translate-x-0
                    [&_[data-current]]:opacity-100
                    [&_[data-current]]:transition-[translate,opacity]
                    [&_[data-current]]:duration-[350ms,175ms]
                    [&_[data-current]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:-translate-x-[30%]
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:opacity-0
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:translate-x-[30%]
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:opacity-0
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:translate-x-[30%]
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:opacity-0
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:-translate-x-[30%]
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:opacity-0"
                >
                  {payload}
                </PreviewCard.Viewport>
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        )}
      </PreviewCard.Root>
    </div>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-[canvas]"
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className="fill-gray-200 dark:fill-none"
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className="dark:fill-gray-300"
      />
    </svg>
  );
}
