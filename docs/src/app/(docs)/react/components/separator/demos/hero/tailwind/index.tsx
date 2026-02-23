import { Separator } from '@base-ui/react/separator';

export default function ExampleSeparator() {
  return (
    <div className="flex gap-4 text-nowrap">
      <a
        href="#"
        className="text-sm text-gray-900 decoration-gray-400 decoration-1 underline-offset-2 outline-hidden hover:underline focus-visible:rounded-xs focus-visible:no-underline focus-visible:outline-2 focus-visible:outline-blue-800"
      >
        Home
      </a>
      <a
        href="#"
        className="text-sm text-gray-900 decoration-gray-400 decoration-1 underline-offset-2 outline-hidden hover:underline focus-visible:rounded-xs focus-visible:no-underline focus-visible:outline-2 focus-visible:outline-blue-800"
      >
        Pricing
      </a>
      <a
        href="#"
        className="text-sm text-gray-900 decoration-gray-400 decoration-1 underline-offset-2 outline-hidden hover:underline focus-visible:rounded-xs focus-visible:no-underline focus-visible:outline-2 focus-visible:outline-blue-800"
      >
        Blog
      </a>
      <a
        href="#"
        className="text-sm text-gray-900 decoration-gray-400 decoration-1 underline-offset-2 outline-hidden hover:underline focus-visible:rounded-xs focus-visible:no-underline focus-visible:outline-2 focus-visible:outline-blue-800"
      >
        Support
      </a>

      <Separator orientation="vertical" className="w-px bg-gray-300" />

      <a
        href="#"
        className="text-sm text-gray-900 decoration-gray-400 decoration-1 underline-offset-2 outline-hidden hover:underline focus-visible:rounded-xs focus-visible:no-underline focus-visible:outline-2 focus-visible:outline-blue-800"
      >
        Log in
      </a>
      <a
        href="#"
        className="text-sm text-gray-900 decoration-gray-400 decoration-1 underline-offset-2 outline-hidden hover:underline focus-visible:rounded-xs focus-visible:no-underline focus-visible:outline-2 focus-visible:outline-blue-800"
      >
        Sign up
      </a>
    </div>
  );
}
