import React, { createContext, useContext, useState } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api';
import type { Token, UserCreate } from '../types/definitions';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (formData: FormData) => Promise<void>;
    logout: () => void;
    register: (user: UserCreate) => Promise<void>;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);

    const login = async (formData: FormData) => {
        const data = await apiLogin(formData);
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
    };

    const register = async (user: UserCreate) => {
        await apiRegister(user);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, register, token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
