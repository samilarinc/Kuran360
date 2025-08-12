import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, type User } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

type AuthContextType = {
    user: User | null;
    loading: boolean;
    signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const signOutUser = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOutUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
