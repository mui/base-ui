import { Input } from '@base-ui/react/input';

export default function ExampleInput() {
  return (
    <label className="flex flex-col items-start gap-1">
      <span className="text-sm font-medium text-gray-900">Name</span>
      <Input
        placeholder="Enter your name"
        className="h-10 w-56 rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
      />
    </label>
  );
}
