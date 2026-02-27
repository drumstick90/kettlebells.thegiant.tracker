/**
 * Modulo Calendario
 * Factory per ottenere l'adapter corretto (Apple/Google) in base alla piattaforma.
 * Implementazioni concrete in calendar/apple.ts e calendar/google.ts (future)
 */

import type { CalendarAdapter } from './types';
import { Platform } from 'react-native';

// Stub: ritorna adapter mock. Sostituire con implementazioni reali.
const createStubAdapter = (): CalendarAdapter => ({
  async requestPermissions() {
    return false;
  },
  async getCalendars() {
    return [];
  },
  async createEvent() {
    return null;
  },
  async updateEvent() {
    return false;
  },
  async deleteEvent() {
    return false;
  },
});

export function getCalendarAdapter(): CalendarAdapter {
  if (Platform.OS === 'ios') {
    // TODO: import { appleCalendarAdapter } from './apple';
    // return appleCalendarAdapter;
  }
  // Android: Google Calendar
  // TODO: import { googleCalendarAdapter } from './google';
  return createStubAdapter();
}

export * from './types';
