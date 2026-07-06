import { useState } from 'preact/hooks';
import { Popover } from '@base-ui-components/react/popover';
import {
  canvasPreset,
  canvasWidth,
  canvasHeight,
  canvasRadius,
  type CanvasPreset,
} from '../../store/editor';
import { Slider } from '../ui/Slider';

// Canvas size icons
function AutoIcon() {
  return (
    <svg
      class="w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <rect x="4" y="4" width="12" height="12" rx="2" />
      <path
        d="M2 7V4a2 2 0 012-2h3M13 2h3a2 2 0 012 2v3M18 13v3a2 2 0 01-2 2h-3M7 18H4a2 2 0 01-2-2v-3"
        stroke-linecap="round"
      />
    </svg>
  );
}

function FreeIcon() {
  return (
    <svg
      class="w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <rect x="3" y="4" width="14" height="12" rx="2" stroke-dasharray="3 2" />
      <path
        d="M7 8l2 2-2 2M11 8h2v4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

function TweetIcon() {
  return (
    <svg
      class="w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <rect x="2" y="5" width="16" height="10" rx="2" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      class="w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <rect x="3" y="3" width="14" height="14" rx="3" />
    </svg>
  );
}

function StoryIcon() {
  return (
    <svg
      class="w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <rect x="5" y="2" width="10" height="16" rx="2" />
    </svg>
  );
}

function AppStoreIcon() {
  return (
    <svg
      class="w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <rect x="4" y="2" width="12" height="16" rx="2" />
    </svg>
  );
}

const presets: {
  value: CanvasPreset;
  label: string;
  size?: string;
  icon: () => preact.JSX.Element;
}[] = [
  { value: 'auto', label: 'Auto', icon: AutoIcon },
  { value: 'free', label: 'Free', icon: FreeIcon },
  { value: 'tweet', label: 'Tweet', size: '1200×675', icon: TweetIcon },
  {
    value: 'instagram',
    label: 'Instagram',
    size: '1080×1080',
    icon: InstagramIcon,
  },
  {
    value: 'instagram-story',
    label: 'Story',
    size: '1080×1920',
    icon: StoryIcon,
  },
  {
    value: 'appstore',
    label: 'App Store',
    size: '1284×2778',
    icon: AppStoreIcon,
  },
];

// Dimension input component
function DimensionInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div class="flex items-center gap-1.5">
      <span class="text-[11px] text-zinc-400 font-medium">{label}</span>
      <input
        type="number"
        value={value}
        min={100}
        max={4000}
        step={10}
        onInput={(e) => {
          const val = parseInt((e.target as HTMLInputElement).value) || 100;
          onChange(Math.max(100, Math.min(4000, val)));
        }}
        class="w-16 h-8 px-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs text-zinc-700
					tabular-nums text-center
					focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400
					transition-colors"
      />
    </div>
  );
}

export function CanvasSize() {
  const [open, setOpen] = useState(false);
  const currentPreset = presets.find((p) => p.value === canvasPreset.value);
  const isFree = canvasPreset.value === 'free';
  const displayLabel = isFree
    ? `${canvasWidth.value}×${canvasHeight.value}`
    : currentPreset?.label || 'Auto';

  return (
    <div class="flex flex-col">
      {/* Canvas Size Row - Expandable */}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          class="flex items-center justify-between w-full py-3 border-b border-zinc-100/80
						transition-colors duration-150 text-left
						focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          <div class="flex items-center gap-2">
            <span class="text-[13px] font-medium text-zinc-700">
              Canvas Size
            </span>
            <span class="px-2 py-0.5 bg-zinc-100 border border-zinc-200/60 rounded-md text-[11px] text-zinc-500 font-medium">
              {displayLabel}
            </span>
          </div>
          <svg
            class="w-4 h-4 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            side="right"
            sideOffset={12}
            align="start"
            className="z-50"
          >
            <Popover.Popup class="bg-white rounded-xl shadow-lg border border-zinc-200 p-3 w-[240px]">
              <div class="grid grid-cols-3 gap-2">
                {presets.map(({ value, label, size, icon: Icon }) => {
                  const isSelected = canvasPreset.value === value;
                  return (
                    <button
                      key={value}
                      onClick={() => {
                        canvasPreset.value = value;
                        if (value !== 'free') setOpen(false);
                      }}
                      class={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-150
												${
                          isSelected
                            ? 'bg-zinc-800 text-white'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                    >
                      <Icon />
                      <span class="text-[10px] font-medium">{label}</span>
                      {size && (
                        <span
                          class={`text-[9px] ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}
                        >
                          {size}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Free dimension inputs */}
              {isFree && (
                <div class="flex items-center justify-center gap-2 pt-3 mt-3 border-t border-zinc-100">
                  <DimensionInput
                    label="W"
                    value={canvasWidth.value}
                    onChange={(v) => (canvasWidth.value = v)}
                  />
                  <span class="text-zinc-300">×</span>
                  <DimensionInput
                    label="H"
                    value={canvasHeight.value}
                    onChange={(v) => (canvasHeight.value = v)}
                  />
                </div>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {/* Canvas Roundness */}
      <Slider
        label="Roundness"
        value={canvasRadius.value}
        min={0}
        max={48}
        onChange={(v) => (canvasRadius.value = v)}
      />
    </div>
  );
}
