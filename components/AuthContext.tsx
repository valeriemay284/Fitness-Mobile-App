<<<<<<< Updated upstream
/* This file holds all login info in memory and 
securely saves it on the device */
=======
/**
 * Module: AuthContext
 * Date: 2026-04-17
 * Programmer: Group 4
 *
 * Description:
 *   Provides authentication state and helpers for the app. This module stores
 *   the authenticated user securely on the device using Expo SecureStore and
 *   exposes methods to set, clear, and sign out the user.
 *
 * Important data structures:
 *   - user: current authenticated profile object
 *   - STORE_KEY: secure storage key used for persistence
 *
 * Algorithm note:
 *   UseEffect loads persisted auth data once on startup. useCallback wraps
 *   setter functions to keep stable references for consumers.
 */
>>>>>>> Stashed changes
// @ts-nocheck

import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(undefined);
const STORE_KEY = 'auth.user';

export function AuthProvider({ children }) {
    const [user, setUserState] = useState(null);
    const [isReady, setReady] = useState(false); // load data from SecureStore

<<<<<<< Updated upstream
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
=======
  // Load saved user from SecureStore on app launch.
  // This runs once to restore session state when the app starts.
  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORE_KEY);
        if (raw) {
          setUserState(JSON.parse(raw));
        }
      } catch (err) {
        console.error("[AuthContext] error loading user:", err);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  /**
   * Set the current authenticated user and persist it securely.
   * @param u User object containing authentication and profile data.
   */
  const setUser = useCallback(async (u) => {
    setUserState(u);

    if (!u || u.id == null) {
      await SecureStore.deleteItemAsync(STORE_KEY);
      return;
    }

    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(u));
  }, []);

  /**
   * Clear the current user from state and secure storage.
   */
  const clearUser = useCallback(async () => {
    setUserState(null);
    await SecureStore.deleteItemAsync(STORE_KEY);
  }, []);

  /**
   * Sign out the current user by clearing stored authentication data.
   */
  const signOut = useCallback(async () => {
    await clearUser();
  }, [clearUser]);

  // Stable context value
  const value = useMemo(() => ({
    user,
    isReady,
    setUser,
    clearUser,
    signOut
  }), [user, isReady, setUser, clearUser, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
>>>>>>> Stashed changes
}


export function useAuth() {
    const ctx = useContext(AuthContext);
    console.log("[AuthContext] useAuth called, context value:", ctx);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx; 
}