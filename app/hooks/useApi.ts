import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export const useApi = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const api = useCallback(async (url: string, options: ApiOptions = {}) => {
    const { requireAuth = true, ...fetchOptions } = options;

    if (requireAuth && status === "unauthenticated") {
      router.push("/");
      throw new Error("Not authenticated");
    }

    const headers = {
      ...fetchOptions.headers,
      ...(session?.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
    };

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (response.status === 401) {
        // En cas d'erreur 401, on force un refresh de la session
        const event = new StorageEvent("storage", {
          key: "next-auth.error",
          newValue: "RefreshAccessTokenError",
        });
        window.dispatchEvent(event);
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  }, [session, status, router]);

  return api;
}; 