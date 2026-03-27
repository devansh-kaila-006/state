'use client'

import * as React from 'next-themes'

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof nextThemes.ThemeProvider>) {
  return <nextThemes.ThemeProvider {...props}>{children}</nextThemes.ThemeProvider>
}
