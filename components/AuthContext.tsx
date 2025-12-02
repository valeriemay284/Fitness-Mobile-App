/* This file holds all login info in memory and 
securely saves it on the device */
// @ts-nocheck

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
                if (raw) {
                    console.log("[AuthContext] loaded user from SecureStore:", raw);
                    setUserState(JSON.parse(raw));
                } else {
                    console.log("[AuthContext] no saved user found");
                }
            } catch (err) {
                console.log("[AuthContext] error loaded user:", err);
            } finally {
                setReady(true);
                console.log("[AuthContext] finished loading SecureStore data");
            }
        })();
    }, []);

    // FIXED: prevents saving null or invalid/incomplete users
    const setUser = async (u) => {
        console.log("[AuthContext] setUser called with:", u);

        setUserState(u);

        // If user is null OR missing an ID → wipe SecureStore instead of saving bad data
        if (!u || u.id == null) {
            console.log("[AuthContext] user is null or invalid, clearing SecureStore");
            await SecureStore.deleteItemAsync(STORE_KEY);
            return;
        }

        await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(u));
        console.log("[AuthContext] user saved to SecureStore");
    };

    const clearUser = async () => {
        console.log("[AuthContext] clearUser called");
        setUserState(null);
        await SecureStore.deleteItemAsync(STORE_KEY);
        console.log("[AuthContext] User removed from SecureStore");
    };

    // passes data to all screens
    const value = useMemo(() => {
        console.log("[AuthContext] Providing context value:", { user, isReady });
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
