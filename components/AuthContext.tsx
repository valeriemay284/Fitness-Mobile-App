/* Holds login info and saves it securely on the device */
// @ts-nocheck

import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(undefined);
const STORE_KEY = 'auth.user';

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [isReady, setReady] = useState(false);

  // Load saved user from SecureStore on app launch
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

  // Memoized helpers to prevent unnecessary re-renders
  const setUser = useCallback(async (u) => {
    setUserState(u);

    if (!u || u.id == null) {
      await SecureStore.deleteItemAsync(STORE_KEY);
      return;
    }

    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(u));
  }, []);

  const clearUser = useCallback(async () => {
    setUserState(null);
    await SecureStore.deleteItemAsync(STORE_KEY);
  }, []);

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
}

// Custom hook to consume auth
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
