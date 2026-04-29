import { PreviewCard } from '@base-ui/react/preview-card';

export default function ExamplePreviewCard() {
  return (
    <PreviewCard.Root>
      <p className="m-0 text-base text-neutral-950 text-balance dark:text-white">
        The principles of good{' '}
        <PreviewCard.Trigger
          className="text-blue-800 underline decoration-blue-800/60 decoration-1 underline-offset-2 outline-0 hover:decoration-blue-800 data-[popup-open]:decoration-blue-800 focus-visible:no-underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 dark:text-blue-500 dark:decoration-blue-500/60 dark:hover:decoration-blue-500 dark:data-[popup-open]:decoration-blue-500"
          href="https://en.wikipedia.org/wiki/Typography"
        >
          typography
        </PreviewCard.Trigger>{' '}
        remain in the digital age.
      </p>

      <PreviewCard.Portal>
        <PreviewCard.Positioner sideOffset={8}>
          <PreviewCard.Popup className="relative box-border h-[var(--popup-height,auto)] w-[var(--popup-width,auto)] origin-[var(--transform-origin)] border border-neutral-950 bg-white text-neutral-950 [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[transform,opacity] duration-100 ease-out data-[ending-style]:[transform:scale(0.98)] data-[ending-style]:opacity-0 data-[starting-style]:[transform:scale(0.98)] data-[starting-style]:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:[filter:none]">
            <PreviewCard.Arrow className="relative block h-1.5 w-3 overflow-clip data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:absolute before:bottom-0 before:left-1/2 before:box-border before:h-[calc(6px*sqrt(2))] before:w-[calc(6px*sqrt(2))] before:border before:border-neutral-950 before:bg-white before:content-[''] before:[transform:translate(-50%,50%)_rotate(45deg)] dark:before:border-white dark:before:bg-neutral-950" />
            <div className="box-border flex w-min flex-col gap-2 p-2">
              <img
                width="224"
                height="150"
                className="block max-w-none"
                src="https://images.unsplash.com/photo-1619615391095-dfa29e1672ef?q=80&w=448&h=300"
                alt="Station Hofplein signage in Rotterdam, Netherlands"
              />
              <p className="m-0 text-sm text-neutral-600 text-pretty dark:text-neutral-400">
                <strong>Typography</strong> is the art and science of arranging type to make written
                language clear, visually appealing, and effective in communication.
              </p>
            </div>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}
