export type User = {
    id: string;
    accessToken: string;
    accessTokenExpires: Number,
    refreshToken: string;
    name: string;
    email: string;
};

export type Props = {
    children: React.ReactNode;
};

declare module "next-auth" {
    interface Session {
        user: User,
        accessToken: string,
        accessTokenExpires: Number,
        refreshToken: string,
    }
}