import { User } from "./api";

export const setSession = (token: string, user: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
};

export const getUser = (): User | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
};

export const getToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
};

export const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

export const isLoggedIn = (): boolean => !!getToken();