/**
 * Tipi per il layer di storage
 * Astrazione che permette swap locale ↔ server senza cambiare il resto dell'app
 */

import type { LocalDatabase } from '../schema';

export type StorageBackend = 'local' | 'server';

export interface StorageAdapter {
  /** Legge l'intero database locale */
  read(): Promise<LocalDatabase | null>;
  /** Scrive il database (merge o replace) */
  write(data: LocalDatabase): Promise<void>;
  /** Verifica se esiste dati */
  exists(): Promise<boolean>;
  /** Elimina tutti i dati (solo locale, per test/reset) */
  clear(): Promise<void>;
}

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  migratedRecords?: number;
  error?: string;
}
