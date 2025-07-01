import { useState, useEffect } from "react";

const TOKEN_KEY = "auth-token";

export function useAuth() {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(TOKEN_KEY);
        setToken(stored);
    }, []);

    function login(newToken: string) {
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
    }

    const isAuthenticated = token !== null;

    return { token, isAuthenticated, login, logout };
}
