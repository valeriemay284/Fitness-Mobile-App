/* This file holds all login info in memory and 
securely saves it on the device */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(undefined);
const STORE_KEY = 'auth.user';

export function AuthProvider({ children }) {
    const [user, setUserState] = useState(null);
    const [isReady, setReady] = useState(false); // load data from SecureStore

    // loads any saved user on app launch
    useEffect(() => {
        (async () => {
            try {
                const raw = await SecureStore.getItemAsync(STORE_KEY);
                if (raw) setUserState(JSON.parse(raw));
            } finally {
                setReady(true);
            }
        })();
    }, []);

    const setUser = async (u) => {
        setUserState(u); 
        await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(u));
    };

    const clearUser = async () => {
        setUserState(null); 
        await SecureStore.deleteItemAsync(STORE_KEY);
    };
    
    // passes data to all screens
    const value = useMemo(() => ({ user, isReady, setUser, clearUser }), [user, isReady]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx; 
}