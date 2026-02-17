import React from 'react';
import { clsx } from '@/lib/clsx';

interface PageContainerProps {
  children:   React.ReactNode;
  className?: string;
  maxWidth?:  'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const maxWidthMap = {
  sm:   'max-w-xl',
  md:   'max-w-2xl',
  lg:   'max-w-4xl',
  xl:   'max-w-6xl',
  full: 'max-w-full',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  maxWidth = 'xl',
}) => (
  <main
    className={clsx(
      'flex-1 w-full mx-auto px-4 py-6 md:px-6 md:py-8',
      'animate-page-enter',
      maxWidthMap[maxWidth],
      className,
    )}
  >
    {children}
  </main>
);
