"use client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { axiosAuth } from "../axios";
import { useRefreshToken } from "./useRefreshToken";
import { useRouter } from "next/navigation";

const useAxiosAuth = () => {
  const { data: session } = useSession();
  const refreshToken = useRefreshToken();
  const router = useRouter();

  useEffect(() => {
    const requestIntercept = axiosAuth.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${session?.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseIntercept = axiosAuth.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error.config;
        
        // Tente de rafraîchir le token si erreur 401 et pas déjà essayé
        if (error.response?.status === 401 && !prevRequest.sent) {
          prevRequest.sent = true;
          try {
            await refreshToken();
            prevRequest.headers["Authorization"] = `Bearer ${session?.accessToken}`;
            return axiosAuth(prevRequest);
          } catch (refreshError) {
            // Si le refresh token échoue, redirige vers la page de connexion
            router.push('/');
            return Promise.reject(refreshError);
          }
        }
        
        // Pour les autres erreurs 4xx (403, 404, etc.), redirige vers la page de connexion
        if (error.response?.status >= 400 && error.response?.status < 500) {
          router.push('/');
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axiosAuth.interceptors.request.eject(requestIntercept);
      axiosAuth.interceptors.response.eject(responseIntercept);
    };
  }, [refreshToken, session, router]);

  return axiosAuth;
};

export default useAxiosAuth;