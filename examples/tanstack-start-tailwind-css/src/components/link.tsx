import clsx from 'clsx';

export function Link({ className, ...props }: React.ComponentPropsWithoutRef<'a'>) {
  return (
    <a
      className={clsx(
        'text-[var(--color-blue)] underline underline-offset-2',
        'decoration-[1px] decoration-[color-mix(in_oklab,var(--color-blue),transparent)] hover:decoration-[var(--color-blue)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-blue)] focus-visible:outline-offset-[-2px] focus-visible:rounded-[var(--radius-sm)]',
        className,
      )}
      rel={props.href && !props.href.includes('base-ui') ? 'noreferrer noopener' : undefined}
      target="_blank"
      {...props}
    />
  );
}
