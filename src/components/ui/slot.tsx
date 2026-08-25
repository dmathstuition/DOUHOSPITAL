import * as React from 'react';

/**
 * Minimal Slot implementation (subset of @radix-ui/react-slot) so `asChild`
 * works without adding the Radix dependency. Merges props/className onto the
 * single child element.
 */
export const Slot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ children, ...props }, ref) => {
    if (!React.isValidElement(children)) return null;
    const child = children as React.ReactElement<Record<string, unknown>>;
    const childProps = child.props;

    return React.cloneElement(child, {
      ...props,
      ...childProps,
      className: [
        (props as { className?: string }).className,
        childProps.className as string | undefined,
      ]
        .filter(Boolean)
        .join(' '),
      ref,
    } as Record<string, unknown>);
  },
);
Slot.displayName = 'Slot';
