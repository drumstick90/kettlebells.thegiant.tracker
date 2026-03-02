/**
 * Context per profilo attivo (pier, luigi, test).
 * Se nessun profilo selezionato, mostra ProfileSelectScreen.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ProfileId } from '../storage/profiles';
import { getActiveProfile, setActiveProfile as persistProfile } from '../storage/profiles';

interface ProfileContextValue {
  activeProfile: ProfileId | null;
  isLoading: boolean;
  setActiveProfile: (profile: ProfileId | null) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<ProfileId | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getActiveProfile().then((p) => {
      setActiveProfileState(p);
      setIsLoading(false);
    });
  }, []);

  const setActiveProfile = useCallback(async (profile: ProfileId | null) => {
    await persistProfile(profile);
    setActiveProfileState(profile);
  }, []);

  const value: ProfileContextValue = {
    activeProfile,
    isLoading,
    setActiveProfile,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
