import React, { createContext, ReactNode, useContext, useState } from 'react';

// ProfileContext
// Provides a shared profile state for the app (name, about, avatarUri).
// This lets the profile view (`my_profile.tsx`) read the current profile and
// the edit screen (`my_profile_edit.tsx`) update it. The provider is mounted
// at the root in `_layout.tsx` so all screens inside the Stack can access it.

type Profile = {
  name: string;
  about: string;
  avatarUri?: string | null;
};

type ProfileContextValue = {
  profile: Profile;
  setProfile: (patch: Partial<Profile>) => void;
};

const defaultProfile: Profile = {
  name: 'Your Name',
  about: 'Hello! I’m a passionate developer who loves building mobile and web apps. Always learning something new!',
  avatarUri: null,
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile>(defaultProfile);

  const setProfile = (patch: Partial<Profile>) => {
    setProfileState(prev => ({ ...prev, ...patch }));
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}

export default ProfileContext;
