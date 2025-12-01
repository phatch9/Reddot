import React, { useState, useEffect, Suspense, createContext, useContext } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, RouterProvider, createBrowserRouter, Outlet, useLocation } from "react-router-dom";

// TYPE DEFINITIONS - Pulled from app.types.ts Canvas
/** Defines the structure for an authenticated user object. */
export interface User {
    username: string;
    id: string;
}

/** Defines the structure and methods provided by the AuthContext. */
export interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: () => void;
    logout: () => void;
}

/** Props for a generic page component (MOCK: SimplePage). */
export interface SimplePageProps {
    title: string;
    route: string;
}

/** Props for wrapper components that accept children (MOCK: RequireAuth, AuthProvider). */
export interface WrapperProps {
    children: React.ReactNode;
}


// Mocked Components and Contexts for demonstration purposes
/** MOCK: Loader */
const Loader: React.FC = () => (
    <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-600">Loading...</p>
    </div>
);

/** MOCK: Error Page */
const Error: React.FC = () => {
    const error: { statusText: string, message: string } = { 
        statusText: "Not Found", 
        message: "The page you requested does not exist." 
    };
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
            <h1 className="text-4xl font-bold text-red-700 mb-4">Oops!</h1>
            <p className="text-xl text-red-600 mb-2">Error: {error.statusText || 'Unknown Error'}</p>
            <p className="text-md text-red-500">{error.message}</p>
            <a href="/" className="mt-6 text-blue-500 hover:underline">Go Home</a>
        </div>
    );
};

/** MOCK: AuthContext and AuthProvider */
const initialAuthContext: AuthContextType = {
    isAuthenticated: false,
    user: null,
    login: () => console.log('Login mock called'),
    logout: () => console.log('Logout mock called'),
};
const AuthContext = createContext<AuthContextType>(initialAuthContext);

export const AuthProvider: React.FC<WrapperProps> = ({ children }) => {
    // Mock authentication state (Assume authenticated for routing tests)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
    const [user, setUser] = useState<User | null>({ username: 'mockuser', id: '123' });

    const login = () => {
        setIsAuthenticated(true);
        setUser({ username: 'testuser', id: '456' });
    };
    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
    };

    const value: AuthContextType = {
        isAuthenticated,
        user,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** MOCK: RequireAuth (PrivateRoute) */
const RequireAuth: React.FC<WrapperProps> = ({ children }) => {
    const auth = useContext(AuthContext);
    
    if (!auth.isAuthenticated) {
        return (
            <div className="p-8 bg-yellow-100 border border-yellow-300 rounded-lg text-center">
                Please <a href="/login" className="text-blue-600 font-medium hover:underline">log in</a> to view this page.
            </div>
        );
    }
    return <>{children}</>;
};

