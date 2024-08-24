"use client";
import axios from "../axios";
import { useSession } from "next-auth/react";

export const useRefreshToken = () => {
    const { data:session } = useSession();
    const params = new URLSearchParams();
    params.append("refresh_token", session?.refreshToken as string);
    const options = {headers: {'Content-Type': 'application/x-www-form-urlencoded'}};

    const refreshToken = async () => {
        if (session) {
            const res = await axios.post("/token/refresh", params, options);
            session.accessToken = res.data.token;
        }
    }

    return refreshToken;
};