import { Switch } from '@base-ui/react/switch';

export default function ExampleSwitch() {
  return (
    <label className="flex items-center gap-2 text-sm font-normal text-neutral-900 dark:text-neutral-50">
      <Switch.Root
        defaultChecked
        className="box-border flex h-5 w-9 shrink-0 border border-neutral-900 bg-neutral-50 p-0.5 dark:border-neutral-50 dark:bg-neutral-900 data-checked:bg-neutral-900 dark:data-checked:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
      >
        <Switch.Thumb className="size-3.5 bg-neutral-900 transition-transform duration-150 data-checked:translate-x-4 data-checked:bg-neutral-50 dark:bg-neutral-50 dark:data-checked:bg-neutral-900" />
      </Switch.Root>
      Notifications
    </label>
  );
}
