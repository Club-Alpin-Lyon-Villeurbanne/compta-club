export interface User {
  id: number;
  email: string;
  roles: string[];
}

export interface AuthTokens {
  token: string;
  refresh_token: string;
  user: User;
}

export const COOKIE_NAMES = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
} as const;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
} as const; 