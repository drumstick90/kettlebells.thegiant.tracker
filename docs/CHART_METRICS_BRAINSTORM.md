# Brainstorm: metriche e chart per le pagine

Documento operativo per decidere cosa mostrare in app con il massimo rapporto valore/complessita.

---

## Pipeline: JSON → Derivazione → Rendering

Tre step distinti per massima modularita e controllo.

| Step | Responsabilita | Output |
|------|----------------|--------|
| **1. JSON** | Solo dati persisteni in `sessions` | WorkoutSession[] |
| **2. Derivazione** | Calcola metriche di dominio da sessions | `{ date, value }[]`, aggregati numerici |
| **3. Rendering** | Formatta (label, colori), adatta al chart, renderizza | Chart, KPI, insight |

**Regole**:
- Step 2 restituisce solo dati di dominio (numeri, Date). Nessuna formattazione (es. "3 Jan").
- Step 3 converte in formato chart (label, colori) e passa ai componenti.
- I chart non conoscono `WorkoutSession`; ricevono dati di dominio o gia formattati.

---

## Dati disponibili

- **WorkoutSession**: `status`, `startedAt`, `endedAt`, `weightKg`, `metrics`, `setEvents`
- **ProgressSnapshot**: cache opzionale per schermate pesanti (`metricKey`, `value`, `auxValue`)
- **ProgramTemplate**: metadati programma (tipo, nome, struttura)
- **Timer sessione**: `metrics.timerMinutes` — The Giant usa 20 o 30 min (scelta utente). La durata effettiva e `endedAt - startedAt`.

> Regola: i grafici leggono prima da `sessions`; `progress` e solo acceleratore.

---

## Step 1: Cosa va nel JSON (persistito)

Solo dati che non si possono ricostruire. Niente ridondanza.

### WorkoutSession (campi root)

| Campo | JSON | Note |
|-------|------|------|
| id, programId, status | si | |
| startedAt, endedAt | si | endedAt null se in_progress |
| weightKg | si | |
| setEvents | si | [] se non live |
| notes, calendarEventId, calendarProvider | si | |
| _sync | si | |

### metrics (dentro WorkoutSession)

| Campo | JSON | Note |
|-------|------|------|
| setsCompleted | si | Canonico; = setEvents.length quando live |
| totalReps | si | Canonico; necessario se setEvents=[] |
| repsPerSet | si | Solo fixed (1.x, 3.x); null per ladder |
| week, day | si | Opzionale, per cicli |
| timerMinutes | si | 20 o 30, scelta utente |
| programVersion | si | es. "1.0", "2.0", "3.0" |
| endedReason | si | timer \| manual \| interrupted |
| failurePointRep | si (futuro) | Rep in cui inizia cedimento; per TPC |
| extra | si | Estensioni namespaced (tg.*, ss.*) |

### ProgressSnapshot (cache opzionale)

Rigenerabile da sessions. Non fonte primaria. Contiene output di step 2 (metricKey: sets_total, reps_total, volume_load, density_reps, rest_avg) per accelerare schermate pesanti.

---

## Step 2: Metriche derivate (mai in JSON)

Calcolate a runtime da sessions. Output: dati di dominio (`{ date, value }`, numeri). Nessuna formattazione UI.

### Per sessione (derivate inline nelle funzioni serie)

| Metrica | Formula | Input |
|---------|---------|-------|
| durationMin | `(endedAt - startedAt) / 60000` | startedAt, endedAt |
| volumeLoad | `totalReps × weightKg` | metrics, weightKg |
| volumeLoadPerMin | `volumeLoad / durationMin` | derivato |
| densityRepsPerMin | `totalReps / durationMin` | metrics, durationMin |
| densitySetsPerMin | `setsCompleted / durationMin` | metrics, durationMin |
| repsPreCedimento | `failurePointRep - 1` | metrics.failurePointRep |
| tonnellaggioPreCedimento | `repsPreCedimento × weightKg` | derivato, weightKg |
| restAvg, restMedian, restMin, restMax, restStd | da setEvents | setEvents |
| restPerSet | diff(completedAt) | setEvents |

### Aggregati (su insieme sessioni)

Restituiti da `aggregates(sessions)`. Output: oggetto con numeri.

| Metrica | Formula | Input |
|---------|---------|-------|
| sessionsCompleted | count(status=completed) | sessions |
| totalReps (aggregato) | sum(totalReps) | sessions |
| totalSets (aggregato) | sum(setsCompleted) | sessions |
| volumeLoad (aggregato) | sum(volumeLoad per sessione) | derivato |
| bestReps | max(totalReps) | sessions |
| bestSets | max(setsCompleted) | sessions |
| streak | giorni/sessioni consecutive | sessions |
| abortedRate | count(aborted) / count(tutte) | sessions |

### The Giant specifiche (da setEvents)

| Metrica | Formula | Input |
|---------|---------|-------|
| ladderCompletate | floor(setsCompleted / ladderLen) | metrics, programVersion |
| ladderParziali | setsCompleted % ladderLen | idem |
| tempoPerLadder | media(tempo blocco) | setEvents |
| restIntraLadder, restInterLadder | media rest per step | setEvents |

---

## Step 3: Rendering

- Formattazione label (es. `date → "3 Jan"`) avviene qui, non in step 2.
- Adapter: dati di dominio → formato richiesto dalla libreria chart.
- I chart possono avere logica di presentazione (maxValue, noOfSections) ma non dipendono da `WorkoutSession`.

---

## Architettura modularita (step 2)

Un solo file `utils/sessionMetrics.ts` con funzioni pure e focalizzate. Niente modulo `metrics/` articolato.

| Funzione | Input | Output | Note |
|----------|-------|--------|------|
| `repsOverTime(sessions, opts)` | sessions, { limit } | `{ date: Date, value: number }[]` | Una funzione = una metrica |
| `volumeOverTime(sessions, opts)` | idem | idem | |
| `densityOverTime(sessions, opts)` | idem | idem | |
| `aggregates(sessions)` | sessions | `{ totalReps, bestReps, streak, ... }` | KPI |
| `restPerSet(session)` | singola session | `{ setIndex, restSec }[]` | Solo se setEvents.length > 1 |

Output serie: `date` e `value` (dominio). Step 3 converte `date` in label (es. "3 Jan") per la libreria chart.

**No** `deriveChartData(sessions, metricKey)` — switch centrale fragile. Preferire funzioni specifiche.

**No** `deriveSession` come concetto first-class — la derivazione per-sessione avviene inline dentro le funzioni che costruiscono le serie.

**Hook opzionale**: `useDerivedMetrics(sessions, options)` — orchestrazione (filtri, limiti), chiama le funzioni, restituisce dati alla screen. La logica resta nelle funzioni pure.

---

## 1) Metriche core (MVP)

| Metrica | Formula | Perche conta | Dove |
|---------|---------|--------------|------|
| **Sessions completed** | count(`status=completed`) | Aderenza | Home, Progress |
| **Total reps** | somma(`metrics.totalReps`) | Output totale | Progress |
| **Total sets** | somma(`metrics.setsCompleted`) | Volume operativo | Progress |
| **Volume load** | somma(`totalReps * weightKg`) | Carico esterno | Progress |
| **Best reps** | max(`totalReps`) | PR sessione | Progress |
| **Best sets** | max(`setsCompleted`) | Capacita lavoro | Progress |
| **Streak** | giorni/sessioni consecutive | Costanza | Home |
| **Aborted rate** | count(`aborted`) / count(tutte) | Qualita aderenza | Analytics |

---

## 1.1) Tonnellaggio (tipi)

Le sessioni possono essere 20 o 30 min (The Giant: `timerMinutes`). Le metriche tempo-dipendenti usano `durationMin = (endedAt - startedAt) / 60000` per normalizzare.

| Tipo | Formula | Abbiamo | Uso |
|------|---------|---------|-----|
| **Tonnellaggio totale** | `totalReps × weightKg` | si | Carico esterno totale |
| **Tonnellaggio pre-cedimento (TPC)** | `repsPreCedimento × weightKg` | no (richiede `failurePointRep`) | Carico di qualita |
| **Tonnellaggio per set** | `repsTarget × weightKg` per set | derivabile da `setEvents` | Analisi intra-sessione (ladder) |
| **Volume load / min** | `(totalReps × weightKg) / durationMin` | no | kg/min — confronta sessioni 20' vs 30' |

> Volume load/min normalizza per durata effettiva: utile quando si mescolano sessioni da 20 e 30 min.

---

## 2) Matrice metrica -> tipo grafico (precisa)

| Metrica | Tipo grafico primario | Tipo secondario | Granularita | Note visuali |
|---------|------------------------|-----------------|-------------|--------------|
| **Sessions completed** | KPI card | Column chart settimanale | day/week | card con delta vs periodo precedente |
| **Total reps** | KPI card | Line chart | session/day | linea + media mobile 7gg |
| **Total sets** | KPI card | Line chart | session/day | stessa scala di reps solo se normalizzata |
| **Volume load** | Area chart | Line chart | session/day | area opaca 20-30%, highlight PR |
| **Best reps** | KPI badge/record card | Dot plot PR timeline | per sessione PR | mostra data PR e valore |
| **Best sets** | KPI badge/record card | Dot plot PR timeline | per sessione PR | stesso comportamento di best reps |
| **Streak** | KPI card | Calendar heatmap | day | card primaria, heatmap in Analytics |
| **Aborted rate** | Donut chart | Stacked bar (`completed` vs `aborted`) | week/month | donut solo se n>=8 sessioni |
| **Durata sessione** | Line chart | Box plot mensile | session/day | usare solo `status=completed` |
| **Densita reps/min** | Line chart | Bar chart per settimana | session/week | metrica efficienza canonica |
| **Densita sets/min** | Line chart | Bar chart per settimana | session/week | metrica operativa secondaria |
| **Volume load / min** | Line chart | KPI card | session/day | kg/min — confronta 20' vs 30' |
| **Rest medio** | Line chart | KPI card | session/day | solo se `setEvents.length > 1` |
| **Rest mediano** | Line chart | Box plot | session/week | utile per robustezza outlier |
| **Rest min/max** | Range band chart | Error bar chart | session | banda min-max con linea media |
| **Deviazione std rest** | Line chart | KPI card | session/week | indicatore variabilita ritmo |
| **Peso nel tempo** | Step line chart | Line chart | session/day | step consigliato (peso cambia a scatti) |
| **Peso vs reps** | Scatter plot | Bubble chart (size=volume) | session | regressione opzionale |

---

## 3) Grafici principali (priorita prodotto)

### 3.1 Output e carico

| Grafico | Tipo | X | Y | Filtri default | Insight |
|---------|------|---|---|----------------|---------|
| **Reps per sessione** | line | data | `totalReps` | programma + 30gg | Stai producendo di piu? |
| **Sets per sessione** | line | data | `setsCompleted` | programma + 30gg | Capacita lavoro cresce? |
| **Volume load** | area | data | `totalReps*weightKg` | programma + 30gg | Carico totale sale? |
| **Confronto ciclo** | dual-line | session index | reps/sets | `programVersion` A vs B | Stesso punto, ciclo migliore? |

### 3.2 Tempo ed efficienza (solo `completed`)

| Grafico | Tipo | X | Y | Formula |
|---------|------|---|---|---------|
| **Durata sessione** | line | data | minuti | `endedAt-startedAt` |
| **Densita reps/min** | line | data | reps/min | `totalReps / durationMin` |
| **Densita sets/min** | line | data | sets/min | `setsCompleted / durationMin` |
| **Volume load / min** | line | data | kg/min | `(totalReps × weightKg) / durationMin` — confronta 20' vs 30' |

### 3.3 Recupero e ritmo (`setEvents.length > 1`)

| Grafico | Tipo | X | Y | Insight |
|---------|------|---|---|---------|
| **Rest per set** | bar | setIndex | restSec | Dove crolla il ritmo nella sessione |
| **Rest medio nel tempo** | line | data | restAvgSec | Recupero sta migliorando/peggiorando |
| **Pace decay** | line | setIndex | elapsedSec | Curva fatica intra-sessione |

Note tecniche:
- `setEvents` e sempre array (`[]` se non live)
- densita/durata solo per sessioni con `endedAt` valido

---

## 4) Metriche The Giant (specifiche)

### Ladder (`programVersion` 2.x)

| Metrica | Formula (da `setEvents`) | Grafico consigliato | Uso |
|---------|---------------------------|---------------------|-----|
| **Ladder completate** | floor(`setsCompleted / ladderLen`) | column chart per sessione | Capacita del giorno |
| **Ladder parziali** | `setsCompleted % ladderLen` | stacked bar (complete + parziale) | Quanto manca al blocco successivo |
| **Tempo per ladder** | media(tempo blocco completo) | line chart | Efficienza su blocco |
| **Rest intra-ladder** | media(rest step1->2, 2->3) | grouped bar per step | Fatica locale |
| **Rest inter-ladder** | media(rest step3->step1 next cycle) | line chart | Recupero tra blocchi |

### Fixed (`programVersion` 1.x / 3.x)

| Metrica | Formula | Grafico consigliato | Uso |
|---------|---------|---------------------|-----|
| **Sets/min** | `setsCompleted/durationMin` | line chart | Efficienza |
| **Reps/set** | `metrics.repsPerSet` | horizontal bar (per giorno) | Identita seduta |
| **Progressione week-by-week** | confronto week N vs N+1 | grouped column | Tracking blocco |

---

## 5) Insight testuali automatici (da mostrare sotto i chart)

- "Ultime 4 sessioni: `+12%` reps medie."
- "Densita in calo da 3 sessioni (`-9%`): valuta recupero/carico."
- "Nuovo best volume: `X kg`."
- "Rest medio migliorato di `Y sec` vs periodo precedente."
- "Aderenza alta: streak `N` sessioni."

---

## 6) Pagine e contenuto

### Home
- Hero KPI: streak, last session reps, best volume
- Mini trend 14gg (reps)
- Quick insight automatico (1 riga)

### Progress
- KPI row (8 metriche core)
- 3 chart primari: reps, volume load, densita reps/min
- filtri: programma, date range, status, peso

### Session Detail
- summary completo (peso, durata, sets, reps, endedReason)
- rest per set + pace decay
- tabella set events

### Analytics
- confronto cicli (`programVersion`)
- scatter peso vs reps
- heatmap aderenza (giorno settimana x settimane)
- data quality panel (record esclusi)

---

## 7) Priorita implementativa

1. **Fase 1 (MVP vero)**: KPI core + reps/sets/volume
2. **Fase 2**: durata + densita + rest medio nel tempo
3. **Fase 3**: The Giant advanced (ladder metrics, pace decay)
4. **Fase 4**: insight automatici + confronto cicli + heatmap

---

## 8) Decisioni UX rapide

- Default range: ultimi 30 giorni
- Mostra delta vs periodo precedente su ogni KPI
- Colori: miglioramento verde, peggioramento ambra/rosso
- Se dati insufficienti: placeholder esplicito ("Servono almeno 2 sessioni")
- Evitare doppioni: una metrica canonica principale, varianti solo in tab secondaria

---

## 9) Regole di fallback per tipo grafico

- Se punti < 3: usare card + mini trend, non line chart completo.
- Se outlier forti su rest: mostrare mediana e IQR (box plot) invece della sola media.
- Se confronto cicli con lunghezze diverse: normalizzare su `sessionIndex`, non su data.
- Se dataset piccolo per donut (`aborted rate`): sostituire con percentuale testuale.
