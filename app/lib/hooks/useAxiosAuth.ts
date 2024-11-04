"use client";
import { useSession, signOut } from "next-auth/react";
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
        
        if (error.response?.status === 401 && !prevRequest.sent) {
          prevRequest.sent = true;
          try {
            await refreshToken();
            prevRequest.headers["Authorization"] = `Bearer ${session?.accessToken}`;
            return axiosAuth(prevRequest);
          } catch (refreshError) {
            // Au lieu de rediriger, déconnectez l'utilisateur
            await signOut({ redirect: false });
            router.push('/');
            return Promise.reject(refreshError);
          }
        }
        
        if (error.response?.status >= 400 && error.response?.status < 500) {
          // Au lieu de simplement rediriger, déconnectez l'utilisateur
          await signOut({ redirect: false });
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