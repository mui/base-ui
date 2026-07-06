import { useState } from 'preact/hooks';
import { Popover } from '@base-ui-components/react/popover';
import { frameStyle, type FrameStyle } from '../../store/editor';

// Exact macOS traffic light colors
const COLORS = {
  close: '#ff6159',
  minimize: '#ffbd2e',
  maximize: '#28c941',
};

// Frame preview components - miniature accurate representations
function NonePreview() {
  return (
    <div class="w-full h-full flex items-center justify-center bg-zinc-50 rounded-xl">
      <svg
        class="w-5 h-5 text-zinc-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path
          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5m-10 6v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  );
}

function ArcPreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5">
      <div class="w-full h-full bg-white rounded-xl border-2 border-zinc-200 shadow-sm" />
    </div>
  );
}

function StackLightPreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5 pt-4">
      <div class="relative w-full h-full">
        <div class="absolute inset-x-3 top-0 bottom-3 bg-zinc-200/70 rounded-xl" />
        <div class="absolute inset-x-1.5 top-1.5 bottom-1.5 bg-zinc-100 rounded-xl" />
        <div class="absolute inset-0 top-3 bg-white rounded-xl shadow-sm border border-zinc-200" />
      </div>
    </div>
  );
}

function StackDarkPreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5 pt-4">
      <div class="relative w-full h-full">
        <div class="absolute inset-x-3 top-0 bottom-3 bg-zinc-500/50 rounded-xl" />
        <div class="absolute inset-x-1.5 top-1.5 bottom-1.5 bg-zinc-600 rounded-xl" />
        <div class="absolute inset-0 top-3 bg-zinc-700 rounded-xl" />
      </div>
    </div>
  );
}

function MacOSLightPreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5">
      <div class="w-full h-full bg-white rounded-xl shadow-sm border border-zinc-200/80 flex flex-col overflow-hidden">
        <div class="h-5 bg-gradient-to-b from-[#f6f6f6] to-[#e8e8e8] flex items-center gap-1 px-2.5 border-b border-zinc-200/60 rounded-t-xl">
          <div
            class="w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS.close }}
          />
          <div
            class="w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS.minimize }}
          />
          <div
            class="w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS.maximize }}
          />
        </div>
        <div class="flex-1 bg-white" />
      </div>
    </div>
  );
}

function MacOSDarkPreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5">
      <div class="w-full h-full bg-zinc-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div class="h-5 bg-zinc-700 flex items-center gap-1 px-2.5 rounded-t-xl">
          <div
            class="w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS.close }}
          />
          <div
            class="w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS.minimize }}
          />
          <div
            class="w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS.maximize }}
          />
        </div>
        <div class="flex-1 bg-zinc-800" />
      </div>
    </div>
  );
}

function MacOSSubtlePreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5">
      <div class="w-full h-full bg-white rounded-xl shadow-sm border border-zinc-200 flex flex-col overflow-hidden">
        <div class="h-5 bg-white flex items-center gap-1 px-2.5 border-b border-zinc-100 rounded-t-xl">
          <div
            class="w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS.close }}
          />
          <div
            class="w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS.minimize }}
          />
          <div
            class="w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS.maximize }}
          />
        </div>
        <div class="flex-1 bg-white" />
      </div>
    </div>
  );
}

function MacOSAdaptivePreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5">
      <div class="w-full h-full bg-zinc-50 rounded-xl shadow-sm border border-zinc-200 flex flex-col overflow-hidden">
        <div class="h-5 bg-zinc-100/60 flex items-center gap-1 px-2.5 border-b border-zinc-200 rounded-t-xl">
          <div class="w-2 h-2 rounded-full border-[1.5px] border-zinc-400" />
          <div class="w-2 h-2 rounded-full border-[1.5px] border-zinc-400" />
          <div class="w-2 h-2 rounded-full border-[1.5px] border-zinc-400" />
        </div>
        <div class="flex-1 bg-zinc-50" />
      </div>
    </div>
  );
}

function EclipsePreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5 pb-4">
      <div class="relative w-full h-full">
        <div class="absolute inset-x-3 bottom-0 h-3 bg-zinc-400/40 rounded-[50%] blur-[2px]" />
        <div class="absolute inset-0 bottom-2 bg-white rounded-xl shadow-sm border border-zinc-200" />
      </div>
    </div>
  );
}

function SilverBackPreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-1.5">
      <div class="relative w-full h-full">
        <div class="absolute inset-0 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl" />
        <div class="absolute inset-[5px] bg-white rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div class="h-4 bg-rose-50/80 flex items-center gap-1 px-2 border-b border-rose-100 rounded-t-lg">
            <div class="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <div class="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <div class="w-1.5 h-1.5 rounded-full bg-rose-400" />
          </div>
          <div class="flex-1 bg-white" />
        </div>
      </div>
    </div>
  );
}

function ShadowBackPreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5 pb-4">
      <div class="relative w-full h-full">
        <div class="absolute inset-x-3 top-3 bottom-0 bg-zinc-400/30 rounded-xl blur-[3px]" />
        <div class="absolute inset-0 bottom-2 bg-white rounded-xl shadow-sm border border-zinc-200 flex flex-col overflow-hidden">
          <div class="h-4 bg-zinc-50 flex items-center gap-1 px-2 border-b border-zinc-100 rounded-t-xl">
            <div class="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            <div class="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            <div class="w-1.5 h-1.5 rounded-full bg-zinc-300" />
          </div>
          <div class="flex-1 bg-white" />
        </div>
      </div>
    </div>
  );
}

function WindowsLightPreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5">
      <div class="w-full h-full bg-white rounded-md shadow-sm border border-zinc-200 flex flex-col overflow-hidden">
        <div class="h-5 bg-zinc-50 flex items-center justify-end gap-1 px-1.5 border-b border-zinc-100">
          <span class="text-[8px] text-zinc-400 leading-none">—</span>
          <span class="text-[8px] text-zinc-400 leading-none">□</span>
          <span class="text-[8px] text-zinc-400 leading-none">×</span>
        </div>
        <div class="flex-1 bg-white" />
      </div>
    </div>
  );
}

function WindowsDarkPreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5">
      <div class="w-full h-full bg-zinc-800 rounded-md shadow-sm flex flex-col overflow-hidden">
        <div class="h-5 bg-zinc-700 flex items-center justify-end gap-1 px-1.5">
          <span class="text-[8px] text-zinc-400 leading-none">—</span>
          <span class="text-[8px] text-zinc-400 leading-none">□</span>
          <span class="text-[8px] text-zinc-400 leading-none">×</span>
        </div>
        <div class="flex-1 bg-zinc-800" />
      </div>
    </div>
  );
}

function ShortboardPreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5">
      <div class="w-full h-full bg-white rounded-xl border-[2.5px] border-zinc-800" />
    </div>
  );
}

function RulerPreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5">
      <div class="w-full h-full bg-white rounded-xl border-[1.5px] border-dashed border-zinc-400" />
    </div>
  );
}

function EmotionPreview() {
  return (
    <div class="w-full h-full flex items-center justify-center p-2.5">
      <div class="w-full h-full bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl shadow-sm border border-zinc-200" />
    </div>
  );
}

// Frame options with previews
const frameOptions: {
  value: FrameStyle;
  label: string;
  preview: () => preact.JSX.Element;
}[] = [
  { value: 'none', label: 'None', preview: NonePreview },
  { value: 'arc', label: 'Arc', preview: ArcPreview },
  { value: 'stack-light', label: 'Stack Light', preview: StackLightPreview },
  { value: 'stack-dark', label: 'Stack Dark', preview: StackDarkPreview },
  { value: 'macos-light', label: 'macOS Light', preview: MacOSLightPreview },
  { value: 'macos-dark', label: 'macOS Dark', preview: MacOSDarkPreview },
  { value: 'macos-subtle', label: 'macOS Subtle', preview: MacOSSubtlePreview },
  {
    value: 'macos-adaptive',
    label: 'macOS Adaptive',
    preview: MacOSAdaptivePreview,
  },
  { value: 'eclipse', label: 'Eclipse', preview: EclipsePreview },
  { value: 'silver-back', label: 'Silver Back', preview: SilverBackPreview },
  { value: 'shadow-back', label: 'Shadow Back', preview: ShadowBackPreview },
  {
    value: 'windows-light',
    label: 'Windows Light',
    preview: WindowsLightPreview,
  },
  { value: 'windows-dark', label: 'Windows Dark', preview: WindowsDarkPreview },
  { value: 'shortboard', label: 'Shortboard', preview: ShortboardPreview },
  { value: 'ruler', label: 'Ruler', preview: RulerPreview },
  { value: 'emotion', label: 'Emotion', preview: EmotionPreview },
];

// Get current frame label
function getCurrentFrameLabel(): string {
  const current = frameOptions.find((f) => f.value === frameStyle.value);
  return current?.label || 'None';
}

export function FramePicker() {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        class="flex items-center justify-between w-full py-3 border-b border-zinc-100/80
					transition-colors duration-150 text-left
					focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        <div class="flex items-center gap-2">
          <span class="text-[13px] font-medium text-zinc-700">Frame</span>
          <span class="px-2 py-0.5 bg-zinc-100 border border-zinc-200/60 rounded-md text-[11px] text-zinc-500 font-medium font-mono">
            {getCurrentFrameLabel()}
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
          <Popover.Popup class="bg-white rounded-2xl shadow-xl border border-zinc-200 p-4 w-[420px] max-h-[520px] overflow-y-auto">
            <div class="grid grid-cols-4 gap-3">
              {frameOptions.map(({ value, label, preview: Preview }) => {
                const isSelected = frameStyle.value === value;
                return (
                  <button
                    key={value}
                    onClick={() => {
                      frameStyle.value = value;
                      setOpen(false);
                    }}
                    class={`flex flex-col items-center gap-1.5 p-1.5 rounded-2xl transition-all duration-150
											${isSelected ? 'ring-2 ring-zinc-700 bg-zinc-100/50' : 'hover:bg-zinc-100/80'}`}
                  >
                    <div class="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100/50 border border-zinc-200/50">
                      <Preview />
                      {isSelected && (
                        <div class="absolute -top-1 -right-1 w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center shadow-sm">
                          <svg
                            class="w-3 h-3 text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span
                      class={`text-[11px] font-medium leading-tight text-center ${isSelected ? 'text-zinc-800' : 'text-zinc-600'}`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
