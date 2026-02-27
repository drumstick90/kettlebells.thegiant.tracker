/**
 * Tipi per integrazione calendario (Apple / Google)
 * Astrazione comune per entrambi i provider
 */

export type CalendarProvider = 'apple' | 'google';

export interface CalendarEvent {
  id: string;
  title: string;
  startAt: string; // ISO 8601
  endAt: string;
  provider: CalendarProvider;
  /** ID calendario di origine */
  calendarId: string;
}

export interface CalendarAdapter {
  /** Richiede permessi e ritorna true se concessi */
  requestPermissions(): Promise<boolean>;
  /** Lista calendari disponibili */
  getCalendars(): Promise<{ id: string; title: string }[]>;
  /** Crea evento collegato a una sessione */
  createEvent(params: {
    title: string;
    startAt: string;
    endAt: string;
    calendarId?: string;
  }): Promise<CalendarEvent | null>;
  /** Aggiorna evento esistente */
  updateEvent(eventId: string, params: Partial<CalendarEvent>): Promise<boolean>;
  /** Elimina evento */
  deleteEvent(eventId: string): Promise<boolean>;
}
