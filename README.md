# Kettlebell Tracker

App mobile per tracciare i progressi di diversi tipi di allenamenti con kettlebell.

## Stack

- **Expo** + React Native + TypeScript
- **Storage locale**: AsyncStorage (JSON)
- **Calendario**: integrazione Apple/Google (stub pronto)

## Struttura modulare

```
src/
├── schema/           # Schema dati agnostico (locale + futuro sync)
│   ├── index.ts      # Tipi principali
│   └── programs.ts   # Template programmi predefiniti
├── storage/          # Layer persistenza
│   ├── localAdapter.ts
│   ├── migration.ts  # Migrazioni + export per backup
│   └── types.ts
├── modules/
│   ├── calendar/     # Integrazione Apple/Google Calendar
│   └── workouts/     # Logica sessioni e progressi
└── context/
    └── StorageContext.tsx
```

## Schema dati

Lo schema è **agnostico** rispetto al backend: funziona identico in locale e, in futuro, su server.

- **SyncMetadata**: `updatedAt`, `version`, `source`, `serverId`, `pendingSync` — per merge e conflict resolution
- **WorkoutSession**: sessione con `programId`, `metrics`, `calendarEventId`
- **ProgressSnapshot**: aggregati per grafici
- **UserPreferences**: unità, calendario collegato

Vedi `docs/SCHEMA.md` per i dettagli.

## Migrazione locale → server

1. I dati restano sempre in locale per primi
2. `lastBackupAt` e `exportForBackup()` per backup prima del login
3. Al primo sync: upload dati locali, merge con server, preservazione dati beta tester

## Avvio

```bash
npm install
npm start
# oppure: npm run ios | npm run android
```

## TODO

- [ ] Implementare adapter calendario Apple (expo-calendar)
- [ ] Implementare adapter calendario Google
- [ ] UI sessioni e progressi
- [ ] Backend + sync
