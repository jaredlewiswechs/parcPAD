/** Minimal clsx — join truthy class strings */
export function clsx(...args: (string | undefined | null | false)[]): string {
  return args.filter(Boolean).join(' ');
}
