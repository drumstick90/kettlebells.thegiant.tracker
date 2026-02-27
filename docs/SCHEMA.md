# Schema dati agnostico (JSON-first)

Schema leggero per storage locale persistente. I dati crescono nel tempo (seed oggi, live domani) senza lock-in su DB.

## Principi

1. **JSON come source of truth**: tutto serializzabile e leggibile in un unico dump
2. **Sessioni come verita primaria**: KPI e grafici derivano da `sessions`
3. **`progress` e cache rigenerabile**: puo essere svuotata e ricostruita da `sessions`
4. **Sync metadata uniforme**: su tutte le entita modificabili
5. **Migrazioni incrementali**: nessuna perdita dati tra versioni schema

## Regole operative minime (no overkill)

- Scrittura file atomica: `tmp -> rename`
- Backup automatico prima di ogni migrazione
- Validazione shape JSON all'avvio (se fallisce: restore backup + log errore)
- Niente campi "sentinella" ambigui (`0` per "non applicabile"): usare `null` o campo assente

## Entita

### SyncMetadata (su ogni record modificabile)

| Campo        | Tipo     | Descrizione |
|-------------|----------|-------------|
| updatedAt   | ISO 8601 | Ultima modifica |
| version     | number   | Incrementa ad ogni modifica locale |
| source      | enum     | `local` \| `server` |
| serverId    | string?  | ID server (null se mai sincronizzato) |
| pendingSync | boolean? | Modificato localmente, non ancora inviato |

### ProgramTemplate

Template di programma (The Giant, S&S, ecc.).

| Campo           | Tipo |
|----------------|------|
| id             | EntityId |
| type           | ProgramType |
| name           | string |
| structure      | string |
| unit           | reps \| seconds \| minutes \| rounds |
| defaultWeightKg| number? |
| _sync          | SyncMetadata |

### SetTiming

Evento raw di una singola serie completata.

| Campo       | Tipo |
|------------|------|
| setIndex   | number |
| completedAt| ISO 8601 |
| repsTarget | number |
| ladderCycle| number? (null per fixed sets) |
| ladderStep | number? (null per fixed sets) |

### WorkoutMetrics (contratto minimo stabile)

Metriche persistite per evitare ricalcoli costosi in UI. Sono numeri/enum semplici e coerenti tra programmi.

| Campo          | Tipo | Note |
|---------------|------|------|
| programVersion| string? | es. `1.0`, `2.0` |
| week          | number? | opzionale per programmi a cicli |
| day           | number? | opzionale per programmi a cicli |
| timerMinutes  | number? | timer impostato |
| setsCompleted | number | sempre valorizzato |
| totalReps     | number | sempre valorizzato |
| repsPerSet    | number? | solo fixed sets, `null` per ladder |
| endedReason   | enum? | `timer` \| `manual` \| `interrupted` |
| extra         | object? | estensioni programma-specifiche con chiavi namespaced (`tg.*`, `ss.*`) |

### WorkoutSession

Una sessione puo essere in corso, completata o interrotta.

| Campo            | Tipo |
|------------------|------|
| id               | EntityId |
| programId        | EntityId |
| status           | in_progress \| completed \| aborted |
| startedAt        | ISO 8601 |
| endedAt          | ISO 8601? |
| weightKg         | number |
| metrics          | WorkoutMetrics |
| setEvents        | SetTiming[] (sempre array, anche vuoto) |
| notes            | string? |
| calendarEventId  | string? |
| calendarProvider | apple \| google \| null |
| _sync            | SyncMetadata |

**Vincoli consigliati**

- `status = completed` -> `endedAt` obbligatorio
- `status = in_progress` -> `endedAt` assente
- `status = in_progress` -> `metrics.endedReason` assente
- `status = completed` -> `metrics.endedReason` in (`timer`, `manual`)
- `status = aborted` -> `metrics.endedReason = interrupted` (preferito) o `manual`
- `setsCompleted = setEvents.length` quando esiste tracking live

**Policy `setEvents`**

- Sessione live: `setEvents` popolato progressivamente
- Sessione non live/importata: `setEvents = []`
- Mai `null` o campo assente (semplifica parser e chart)

### ProgressSnapshot

Cache per grafici; non e fonte primaria.

| Campo          | Tipo |
|---------------|------|
| id            | EntityId |
| programId     | EntityId |
| date          | YYYY-MM-DD |
| metricKey     | string (`sets_total`, `reps_total`, `volume_load`, `density_reps`, `rest_avg`) |
| value         | number |
| auxValue      | number? |
| _sync         | SyncMetadata |

Note:

- Contratto esplicito: ogni record rappresenta una sola metrica (`metricKey`)
- `auxValue` solo se serve (es. confronto periodo precedente)

### LocalDatabase (root)

| Campo         | Tipo |
|---------------|------|
| schemaVersion | number |
| programs      | ProgramTemplate[] |
| sessions      | WorkoutSession[] |
| progress      | ProgressSnapshot[] |
| preferences   | UserPreferences |
| lastBackupAt  | ISO 8601? |

## Politica derivazione metriche

- KPI e trend principali leggono da `sessions`
- `progress` serve solo a velocizzare schermate pesanti
- Se `progress` manca o e invalido: rebuild completo da `sessions`
- Il rebuild di `progress` deve essere idempotente

## Checklist validazione runtime (lean)

Da eseguire all'avvio app e prima di renderizzare i chart principali.

1. **Root shape**
   - `schemaVersion` presente e numerico
   - `programs`, `sessions`, `progress` sono array

2. **Sessioni: campi obbligatori**
   - per ogni sessione: `id`, `programId`, `status`, `startedAt`, `weightKg`, `metrics`, `setEvents`, `_sync`
   - `setEvents` deve essere array (anche `[]`)

3. **Coerenza stato/tempo**
   - `status = completed` -> `endedAt` presente
   - `status = in_progress` -> `endedAt` assente
   - `status = aborted` -> `endedAt` opzionale

4. **Coerenza `endedReason`**
   - `in_progress` -> `metrics.endedReason` assente
   - `completed` -> `metrics.endedReason` in (`timer`, `manual`)
   - `aborted` -> `metrics.endedReason` in (`interrupted`, `manual`)

5. **Numeriche non negative**
   - `weightKg >= 0`
   - `metrics.setsCompleted >= 0`
   - `metrics.totalReps >= 0`
   - `metrics.timerMinutes`, se presente, `> 0`
   - `metrics.repsPerSet`, se presente, `> 0`

6. **Coerenza `setEvents`**
   - `setIndex` strettamente crescente da 1
   - `completedAt` monotono crescente
   - se `setEvents.length > 0`: `metrics.setsCompleted = setEvents.length`

7. **Integrita referenziale minima**
   - ogni `session.programId` esiste in `programs.id`

8. **ProgressSnapshot shape**
   - `metricKey` presente e in whitelist
   - `value` numerico
   - se record invalido: scartarlo (non bloccare app)

9. **Strategia errore (fail soft)**
   - errori in sessione singola: sessione esclusa da KPI/chart + log warning
   - errori strutturali root: ripristino backup e stop caricamento analytics

## Migrazione

- `schemaVersion` abilita migrazioni incrementali
- `migration.ts` applica migratori versione-per-versione
- `exportForBackup()` produce JSON prima di login/sync o migrazione

### Mapping consigliato da seed legacy

Per mantenere compatibilita con dati sintetici/storici gia presenti:

- `metrics.version` -> `metrics.programVersion` (stringa)
- `metrics.endedByTimer = 1` -> `metrics.endedReason = "timer"`
- `metrics.endedManually = 1` -> `metrics.endedReason = "manual"`
- `metrics.repsPerSet = 0` -> `metrics.repsPerSet = null` (ladder)
- `endedAt = null` + stop manuale -> `status = aborted`
- `endedAt valorizzato` -> `status = completed`
- se non inferibile -> `status = aborted`, `metrics.endedReason = "interrupted"`
- `progress.primaryValue` -> `progress.value`
- `progress.secondaryValue` -> `progress.auxValue`
