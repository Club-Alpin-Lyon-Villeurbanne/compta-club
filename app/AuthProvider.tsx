// app/AuthProvider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { Props } from './lib/definitions';

export default function AuthProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}