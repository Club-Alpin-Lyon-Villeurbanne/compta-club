"use client";
import axios from "../axios";
import { useSession } from "next-auth/react";

export const useRefreshToken = () => {
    const { data: session, update } = useSession();
    const params = new URLSearchParams();
    params.append("refresh_token", session?.refreshToken as string);
    const options = {headers: {'Content-Type': 'application/x-www-form-urlencoded'}};

    const refreshToken = async () => {
        if (session) {
            try {
                const res = await axios.post("/token/refresh", params, options);
                // Mettre à jour la session avec le nouveau token
                await update({
                    ...session,
                    accessToken: res.data.token,
                    accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 heures
                });
                return res.data.token;
            } catch (error) {
                console.error("Erreur lors du rafraîchissement du token:", error);
                throw error;
            }
        }
    }

    return refreshToken;
};