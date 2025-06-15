import { useState, useEffect } from "react";

const TOKEN_KEY = "auth-token";

export function useAuth() {
    const [token, setToken] = useState<string | null>(null);

    // Load token from localStorage once on mount
    useEffect(() => {
        const stored = localStorage.getItem(TOKEN_KEY);
        setToken(stored);
    }, []);

    // Log in: save token
    function login(newToken: string) {
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
    }

    // Log out: remove token
    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
    }

    const isAuthenticated = token !== null;

    return { token, isAuthenticated, login, logout };
}
