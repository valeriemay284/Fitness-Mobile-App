/* This file holds all login info in memory and 
securely saves it on the device */
// @ts-nocheck

import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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
                if (raw) {
                    console.log("[AuthContext] loaded user from SecureStore:", raw);
                    setUserState(JSON.parse(raw));
                } else {
                    console.log("[AuthContext] no saved user found"); 
                }
            }catch (err) {
                console.log("[AuthContext] error loaded user:", err);
            } finally {
                setReady(true);
                console.log("[AuthContext] finished loading SecureStore data");
            }
        })();
    }, []);

    const setUser = async (u) => {
        console.log("[AuthContext] setUser called with:", u);
        setUserState(u); 
        await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(u));
        console.log("[AuthContext] user saved to SecureStore");
    };

    const clearUser = async () => {
        console.log("[AuthContext] clearUser called");
        setUserState(null); 
        await SecureStore.deleteItemAsync(STORE_KEY);
        console.log("[AuthContext] User removed from SecureStore")
    };
    
    // passes data to all screens
    const value = useMemo(() => {
        console.log("[AuthContext] Providing context value:", { user, isReady }); // ✅ added
        return { user, isReady, setUser, clearUser };
    }, [user, isReady]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth() {
    const ctx = useContext(AuthContext);
    console.log("[AuthContext] useAuth called, context value:", ctx);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx; 
}