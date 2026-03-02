/**
 * Profili locali: pier, luigi, test.
 * Ogni profilo ha il proprio database in AsyncStorage.
 * Il profilo "test" usa sempre i dati seed.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProfileId = 'pier' | 'luigi' | 'test';

export const PROFILE_IDS: ProfileId[] = ['pier', 'luigi', 'test'];

export const PROFILE_LABELS: Record<ProfileId, string> = {
  pier: 'Pier',
  luigi: 'Luigi',
  test: 'Test (seed)',
};

const ACTIVE_PROFILE_KEY = 'kettlebell-tracker:activeProfile';

export async function getActiveProfile(): Promise<ProfileId | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
  if (!raw) return null;
  if (PROFILE_IDS.includes(raw as ProfileId)) return raw as ProfileId;
  return null;
}

export async function setActiveProfile(profile: ProfileId | null): Promise<void> {
  if (profile === null) {
    await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
  } else {
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profile);
  }
}
