"use client";

import { SessionProvider } from "next-auth/react";
import { Props } from "./lib/definitions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function AuthProviderContent({ children }: Props) {
  const router = useRouter();

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "next-auth.error" && e.newValue === "RefreshAccessTokenError") {
        // Rediriger vers la page de login en cas d'erreur de refresh
        router.push("/");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router]);

  return <>{children}</>;
}

export default function AuthProvider({ children }: Props) {
  return (
    <SessionProvider 
      refetchOnWindowFocus={true} 
      refetchInterval={5 * 60} // Rafraîchir la session toutes les 5 minutes
      refetchWhenOffline={false}
    >
      <AuthProviderContent>{children}</AuthProviderContent>
    </SessionProvider>
  );
}
