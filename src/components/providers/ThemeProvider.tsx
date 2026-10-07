'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { usePathname } from 'next/navigation';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  return (
    <NextThemesProvider
      {...props}
      forcedTheme={isAuthPage ? 'light' : props.forcedTheme}
    >
      {children}
    </NextThemesProvider>
  );
}
