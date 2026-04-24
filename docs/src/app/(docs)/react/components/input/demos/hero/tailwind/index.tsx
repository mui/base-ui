import { Input } from '@base-ui/react/input';

export default function ExampleInput() {
  return (
    <label className="flex flex-col items-start gap-1 text-sm font-bold text-gray-950 dark:text-white">
      Name
      <Input
        placeholder="e.g. Colm Tuite"
        className="h-8 w-40 border border-gray-950 dark:border-white bg-transparent px-2 text-sm font-normal text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-800"
      />
    </label>
  );
}
