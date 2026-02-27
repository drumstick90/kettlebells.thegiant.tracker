# Schema dati agnostico

Schema leggero pensato per storage locale e futuro sync server. I dati dei beta tester non vengono persi in fase di migrazione.

## Principi

1. **Identificatori**: `EntityId` (string) — UUID o nanoid, univoci locale e server
2. **SyncMetadata**: su ogni entità modificabile, per merge e conflict resolution
3. **Nessuna dipendenza da DB**: tutto serializzabile in JSON

## Entità

### SyncMetadata (su ogni record modificabile)

| Campo       | Tipo     | Descrizione                                      |
|------------|----------|--------------------------------------------------|
| updatedAt  | ISO 8601 | Ultima modifica                                  |
| version    | number   | Incrementa ad ogni modifica (per conflict)       |
| source     | enum     | `local` \| `server`                              |
| serverId   | string?  | ID sul server (null se mai sincronizzato)       |
| pendingSync| boolean? | Modificato localmente, non ancora inviato        |

### ProgramTemplate

Template di programma (The Giant, S&S, ecc.).

| Campo         | Tipo   |
|---------------|--------|
| id            | EntityId |
| type          | ProgramType |
| name          | string |
| structure     | string |
| unit          | reps \| seconds \| minutes \| rounds |
| defaultWeightKg | number? |

### WorkoutSession

Una sessione di allenamento completata.

| Campo            | Tipo   |
|------------------|--------|
| id               | EntityId |
| programId        | EntityId |
| startedAt        | ISO 8601 |
| endedAt          | ISO 8601? |
| weightKg         | number |
| metrics          | Record<string, number> |
| notes            | string? |
| calendarEventId  | string? |
| calendarProvider | apple \| google \| null |
| _sync            | SyncMetadata |

### ProgressSnapshot

Aggregato di progresso (cache per grafici).

| Campo        | Tipo   |
|-------------|--------|
| id          | EntityId |
| programId   | EntityId |
| date        | YYYY-MM-DD |
| primaryValue| number |
| secondaryValue | number? |
| weightKg    | number |
| _sync       | SyncMetadata |

### LocalDatabase (root)

| Campo         | Tipo   |
|---------------|--------|
| schemaVersion | number |
| programs      | ProgramTemplate[] |
| sessions      | WorkoutSession[] |
| progress      | ProgressSnapshot[] |
| preferences   | UserPreferences |
| lastBackupAt  | ISO 8601? |

## Migrazione

- `schemaVersion` permette migrazioni incrementali
- `migration.ts` applica migratori per ogni versione
- `exportForBackup()` produce JSON per backup prima di login/sync
