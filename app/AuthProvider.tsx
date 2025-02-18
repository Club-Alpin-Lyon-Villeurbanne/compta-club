"use client";

import { SessionProvider } from "next-auth/react";
import { Props } from "./lib/definitions";

export default function AuthProvider({ children }: Props) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
