import clsx from 'clsx';

export function Link({ className, ...props }: React.ComponentPropsWithoutRef<'a'>) {
  const external = props.href && !props.href.includes('base-ui') && props.href.startsWith('http');
  return (
    <a
      className={clsx(styles, className)}
      rel={external ? 'noreferrer noopener' : undefined}
      target={external ? '_blank' : undefined}
      {...props}
    />
  );
}

export const styles = [
  'text-[var(--color-blue)] underline underline-offset-2',
  'decoration-[1px] decoration-[color-mix(in_oklab,var(--color-blue),transparent)] hover:decoration-[var(--color-blue)]',
  'focus-visible:outline-2 focus-visible:outline-[var(--color-blue)] focus-visible:outline-offset-[-2px] focus-visible:rounded-[var(--radius-sm)]',
];
