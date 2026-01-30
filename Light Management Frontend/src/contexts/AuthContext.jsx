import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (error) {
                console.error('Failed to parse user data:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.login(username, password);

            // Save token and user data
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify({
                _id: response._id,
                username: response.username,
                role: response.role,
                clientId: response.clientId,
            }));

            setUser({
                _id: response._id,
                username: response.username,
                role: response.role,
                clientId: response.clientId,
            });

            return response;
        } catch (error) {
            throw error;
        }
    };

    const register = async (username, password, role, clientId = null) => {
        try {
            const response = await api.register(username, password, role, clientId);

            // Save token and user data
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify({
                _id: response._id,
                username: response.username,
                role: response.role,
                clientId: response.clientId,
            }));

            setUser({
                _id: response._id,
                username: response.username,
                role: response.role,
                clientId: response.clientId,
            });

            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const isAuthenticated = () => {
        return !!user && !!localStorage.getItem('token');
    };

    const isAdmin = () => {
        return user?.role === 'admin';
    };

    const isClient = () => {
        return user?.role === 'client';
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
        isClient,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
