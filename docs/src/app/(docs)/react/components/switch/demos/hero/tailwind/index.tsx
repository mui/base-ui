import { Switch } from '@base-ui/react/switch';

export default function ExampleSwitch() {
  return (
    <label className="flex items-center gap-2 text-sm leading-5 font-normal text-gray-900 dark:text-gray-50">
      <Switch.Root
        defaultChecked
        className="box-border flex h-5 w-9 shrink-0 border border-gray-900 bg-gray-50 p-0.5 dark:border-gray-50 dark:bg-gray-900 data-checked:bg-gray-900 dark:data-checked:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Switch.Thumb className="size-3.5 bg-gray-900 transition-transform duration-150 data-checked:translate-x-4 data-checked:bg-gray-50 dark:bg-gray-50 dark:data-checked:bg-gray-900" />
      </Switch.Root>
      Notifications
    </label>
  );
}
