'use client';

import React, { forwardRef } from 'react';

interface ScrollAreaProps extends React.HTMLProps<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`custom-scrollbar relative overflow-auto ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';
