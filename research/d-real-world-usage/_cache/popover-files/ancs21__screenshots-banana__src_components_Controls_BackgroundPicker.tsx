import { useState } from 'preact/hooks';
import { Popover } from '@base-ui-components/react/popover';
import {
  gradientIndex,
  patternType,
  noiseOpacity,
  backgroundType,
} from '../../store/editor';
import { gradients, getGradientStyle } from '../../lib/gradients';
import type { PatternType } from '../../lib/patterns';
import { CompactSlider } from '../ui/Slider';
import { Tooltip } from '../ui/Tooltip';
import { Switch } from '@base-ui-components/react/switch';

// Pattern icons
function NoneIcon() {
  return (
    <svg
      class="w-4 h-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <rect x="2" y="2" width="12" height="12" rx="1" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="4" cy="4" r="1.5" />
      <circle cx="8" cy="4" r="1.5" />
      <circle cx="12" cy="4" r="1.5" />
      <circle cx="4" cy="8" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="12" cy="8" r="1.5" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      class="w-4 h-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1"
    >
      <path d="M0 4h16M0 8h16M0 12h16M4 0v16M8 0v16M12 0v16" />
    </svg>
  );
}

function WavesIcon() {
  return (
    <svg
      class="w-4 h-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <path d="M0 4c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2" />
      <path d="M0 8c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2" />
      <path d="M0 12c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2" />
    </svg>
  );
}

function LinesIcon() {
  return (
    <svg
      class="w-4 h-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1"
    >
      <path d="M0 16L16 0M-4 12L12 -4M4 20L20 4" />
    </svg>
  );
}

const patternOptions: {
  value: PatternType;
  label: string;
  icon: () => preact.JSX.Element;
}[] = [
  { value: 'none', label: 'None', icon: NoneIcon },
  { value: 'dots', label: 'Dots', icon: DotsIcon },
  { value: 'grid', label: 'Grid', icon: GridIcon },
  { value: 'waves', label: 'Waves', icon: WavesIcon },
  { value: 'diagonal', label: 'Lines', icon: LinesIcon },
];

// Get current pattern label
function getCurrentPatternLabel(): string {
  const current = patternOptions.find((p) => p.value === patternType.value);
  return current?.label || 'None';
}

export function BackgroundPicker() {
  const [bgOpen, setBgOpen] = useState(false);
  const [patternOpen, setPatternOpen] = useState(false);

  return (
    <div class="flex flex-col">
      {/* Background Row - Expandable with gradient preview */}
      <Popover.Root open={bgOpen} onOpenChange={setBgOpen}>
        <Popover.Trigger
          class="flex items-center justify-between w-full py-3 border-b border-zinc-100/80
						transition-colors duration-150 text-left
						focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          <div class="flex items-center gap-2">
            <span class="text-[13px] font-medium text-zinc-700">
              Background
            </span>
            <span class="px-2 py-0.5 bg-zinc-100 border border-zinc-200/60 rounded-md text-[11px] text-zinc-500 font-medium">
              Gradient
            </span>
          </div>
          <div class="flex items-center gap-2">
            {/* Gradient preview swatch */}
            <div
              class="w-8 h-8 rounded-lg border border-zinc-200 shadow-sm"
              style={getGradientStyle(gradientIndex.value)}
            />
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
          </div>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            side="right"
            sideOffset={12}
            align="start"
            className="z-50"
          >
            <Popover.Popup class="bg-white rounded-xl shadow-lg border border-zinc-200 p-3 w-[280px]">
              <div class="grid grid-cols-5 gap-2">
                {gradients.map((gradient, index) => {
                  const isSelected =
                    gradientIndex.value === index &&
                    backgroundType.value === 'gradient';
                  return (
                    <button
                      key={gradient.name}
                      onClick={() => {
                        gradientIndex.value = index;
                        backgroundType.value = 'gradient';
                        setBgOpen(false);
                      }}
                      class={`aspect-square rounded-lg transition-all duration-150 shadow-sm
												${
                          isSelected
                            ? 'ring-2 ring-zinc-700 ring-offset-1 scale-105'
                            : 'hover:scale-105 hover:ring-1 hover:ring-zinc-300'
                        }`}
                      style={getGradientStyle(index)}
                      title={gradient.name}
                    />
                  );
                })}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {/* Pattern Row - Expandable */}
      <Popover.Root open={patternOpen} onOpenChange={setPatternOpen}>
        <Popover.Trigger
          class="flex items-center justify-between w-full py-3 border-b border-zinc-100/80
						transition-colors duration-150 text-left
						focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          <div class="flex items-center gap-2">
            <span class="text-[13px] font-medium text-zinc-700">Pattern</span>
            <span class="px-2 py-0.5 bg-zinc-100 border border-zinc-200/60 rounded-md text-[11px] text-zinc-500 font-medium">
              {getCurrentPatternLabel()}
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
            <Popover.Popup class="bg-white rounded-xl shadow-lg border border-zinc-200 p-2 w-fit">
              <div class="flex gap-1">
                {patternOptions.map(({ value, label, icon: Icon }) => {
                  const isSelected = patternType.value === value;
                  return (
                    <Tooltip key={value} content={label}>
                      <button
                        onClick={() => {
                          patternType.value = value;
                          setPatternOpen(false);
                        }}
                        class={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150
													${
                            isSelected
                              ? 'bg-zinc-800 text-white'
                              : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700'
                          }`}
                      >
                        <Icon />
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {/* Noise Row with Toggle */}
      <div class="flex items-center gap-3 py-3 border-b border-zinc-100/80">
        <Switch.Root
          checked={noiseOpacity.value > 0}
          onCheckedChange={(checked) => {
            noiseOpacity.value = checked ? 10 : 0;
          }}
          className="group relative inline-flex w-9 h-5 shrink-0 cursor-pointer rounded-full
						bg-zinc-200 transition-colors
						data-[checked]:bg-zinc-700"
        >
          <Switch.Thumb
            className="block w-4 h-4 rounded-full bg-white shadow-sm
							translate-x-0.5 transition-transform
							group-data-[checked]:translate-x-[18px]"
          />
        </Switch.Root>
        <span class="text-[13px] font-medium text-zinc-700">Noise</span>
        {noiseOpacity.value > 0 && (
          <div class="flex-1">
            <CompactSlider
              value={noiseOpacity.value}
              min={1}
              max={20}
              step={1}
              onChange={(v) => (noiseOpacity.value = v)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
