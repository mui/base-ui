import { Avatar } from '@base-ui/react/avatar';

export default function ExampleAvatar() {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <Avatar.Root className="relative inline-flex size-12 items-center justify-center overflow-hidden rounded-full bg-gray-100 align-middle text-base text-gray-900 select-none">
        <Avatar.Image
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
          width="48"
          height="48"
          className="absolute inset-0 size-full object-cover data-[error]:invisible data-[loading]:invisible"
        />
        <Avatar.Fallback
          delay={600}
          className="absolute inset-0 flex items-center justify-center text-base data-[loaded]:invisible"
        >
          LT
        </Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root className="inline-flex size-12 items-center justify-center overflow-hidden rounded-full bg-gray-100 align-middle text-base text-gray-900 select-none">
        LT
      </Avatar.Root>
    </div>
  );
}
