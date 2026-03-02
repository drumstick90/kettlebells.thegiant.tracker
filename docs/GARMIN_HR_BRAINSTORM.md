# Brainstorm: API Garmin e fascia cardiaca

Documento esplorativo per valutare integrazioni con Garmin Connect e/o fasce cardiache (BLE).

---

## 1. Panoramica opzioni

| Opzione | Tipo | Dati | Complessità | Dipendenze |
|---------|------|------|-------------|------------|
| **Garmin Connect API** | Cloud-to-cloud | Import/export attività, HR da Garmin | Media-alta | Approvazione Garmin, OAuth 2.0 PKCE |
| **Garmin Health SDK** | App ↔ dispositivo | Real-time da wearables Garmin | Alta | SDK nativo, dispositivi Garmin |
| **Fascia cardiaca BLE** | App ↔ dispositivo | HR real-time durante workout | Media | react-native-ble-plx, permessi BLE |

---

## 2. Garmin Connect Developer Program

### API disponibili (cloud-to-cloud)

**In ingresso (Garmin → nostra app):**
- **Activity API**: dati completi attività (>30 tipi), inclusi HR, GPS, lap
- **Health API**: metriche giornaliere (HR, sonno, passi, stress)
- **Women's Health API**: ciclo mestruale (non rilevante per kettlebell)

**In uscita (nostra app → Garmin):**
- **Training API**: pubblicare workout strutturati su Garmin Connect → sync su dispositivi
- **Courses API**: percorsi (più per running/cycling)

### Flusso OAuth 2.0 PKCE

1. Utente clicca "Connetti Garmin" in Settings
2. Redirect a Garmin per login e consenso
3. Callback con `code` → exchange per `access_token` + `refresh_token`
4. Salvare token in storage sicuro (Keychain/Keystore)
5. Chiamate API con Bearer token; refresh quando scade

### Requisiti e limiti

- **Accesso**: richiesta form su [Garmin Developer](https://developer.garmin.com/gc-developer-program/overview/), approvazione ~2 giorni lavorativi
- **Gratuito** per sviluppatori business approvati
- **Throttling** in produzione (da verificare in docs)
- **Cloud-to-cloud**: non c’è connessione diretta app ↔ orologio; tutto passa da Garmin Connect

### Cosa possiamo fare con Activity API

- **Import**: dopo un workout, l’utente può sincronizzare da Garmin Connect le attività che coincidono con `startedAt`/`endedAt` della sessione
- **Match fuzzy**: cercare attività con `activityType` "Strength" o "Other" in un intervallo temporale
- **Dati HR**: se l’utente ha registrato con orologio/fascia Garmin, otteniamo serie HR, avg, max, zone
- **Merge**: arricchire `WorkoutSession` con `heartRate` (vedi schema sotto)

### Cosa possiamo fare con Training API

- **Export**: dopo aver completato una sessione in app, inviare a Garmin un workout "Strength" con sets/reps/durata
- **Sync bidirezionale**: l’utente vede le sessioni anche su Garmin Connect
- **Limite**: il formato Training API è pensato per workout strutturati (intervalli, step); mappare "The Giant" (ladder, timer) richiede adattamento

---

## 3. Fascia cardiaca (BLE)

### Protocollo standard

- **GATT**: Heart Rate Service `0x180D`, Characteristic `0x2A37`
- **Compatibilità**: Polar, Garmin HRM, Wahoo, Xiaomi, ecc. (tutte le fasce standard BLE)
- **Dati**: bpm, eventualmente RR-interval (variabilità) se supportato

### Librerie React Native

| Libreria | Note |
|----------|------|
| **react-native-ble-plx** | Standard de facto, cross-platform, ben mantenuta |
| **react-native-polar-ble** | Solo Polar, SDK ufficiale Polar |
| **expo** | Non ha BLE nativo; serve bare workflow o dev client |

**Nota**: Expo managed non espone BLE. Serve `expo prebuild` o eject per usare `react-native-ble-plx`.

### Flusso tipico

1. Scan dispositivi BLE (filtrando per Heart Rate Service)
2. Utente seleziona fascia da lista
3. Connect → discover services → subscribe a `0x2A37`
4. Durante workout live: ricevere notifiche con bpm
5. Salvare campioni in memoria (array `{ timestamp, bpm }[]`)
6. A fine sessione: persistire in `WorkoutSession.heartRate`

### Permessi

- **iOS**: `NSBluetoothAlwaysUsageDescription`, `NSBluetoothPeripheralUsageDescription`
- **Android**: `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_CONNECT` (API 31+)
- **Expo**: config plugin per `react-native-ble-plx` se si usa prebuild

---

## 4. Estensione schema dati

### WorkoutSession – campi HR

```ts
// WorkoutSession (estensione)
heartRate?: {
  source: 'ble' | 'garmin' | 'apple_health';  // provenienza
  samples?: { t: string; bpm: number }[];     // serie temporale (opzionale, può essere pesante)
  avgBpm?: number;
  maxBpm?: number;
  minBpm?: number;
  zoneMinutes?: { zone: string; minutes: number }[];  // Z1-Z5 se calcolabili
} | null;
```

**Policy**: `heartRate` opzionale. Se `samples` è vuoto o assente, usare solo `avgBpm`/`maxBpm` per KPI e chart.

### WorkoutMetrics – estensioni in `extra`

Per coerenza con schema esistente, metriche HR derivate possono stare in `extra`:

```ts
extra: {
  'hr.avgBpm': number;
  'hr.maxBpm': number;
  'hr.timeInZoneZ2': number;  // minuti in zona 2, ecc.
}
```

Oppure aggiungere campi first-class in `WorkoutMetrics` se diventano core.

### ProgressSnapshot – nuove metriche

| metricKey | Descrizione |
|-----------|-------------|
| `hr_avg` | Media HR sessione |
| `hr_max` | Max HR sessione |
| `hr_time_z2` | Minuti in zona 2 (es. 60–70% max HR) |

---

## 5. Metriche e chart con HR

### Derivazioni (step 2 in CHART_METRICS_BRAINSTORM)

| Metrica | Formula | Input |
|---------|---------|-------|
| avgBpm | media(samples.bpm) | heartRate.samples |
| maxBpm | max(samples.bpm) | heartRate.samples |
| minBpm | min(samples.bpm) | heartRate.samples |
| timeInZoneZ2 | count(samples in 60–70% maxHR) × intervalSec | samples, maxHR utente |
| hrRecovery1min | bpm at end - bpm 1min after | samples (serve post-workout) |

**Nota**: `maxHR` utente va in `UserPreferences` (o profilo). Default: 220 - age (stima).

### Chart possibili

| Chart | Dati | Insight |
|-------|------|---------|
| **HR durante sessione** | samples vs tempo | Curva sforzo, picchi per set |
| **HR medio nel tempo** | sessioni → avgBpm | Trend fitness (stesso sforzo = HR più basso) |
| **HR max nel tempo** | sessioni → maxBpm | Intensità massima raggiunta |
| **Tempo in zona** | stacked bar per zona | Distribuzione intensità |
| **HR vs densità reps** | scatter avgBpm vs densityRepsPerMin | Correlazione sforzo percepito/oggettivo |

---

## 6. Flussi utente

### A) Solo Garmin (import post-workout)

1. Utente completa workout in app (o registra manualmente)
2. In Session Summary: "Importa dati da Garmin" (se connesso)
3. App chiama Activity API per attività in `[startedAt - 5min, endedAt + 5min]`
4. Match per tipo "Strength" o "Other" + overlap temporale
5. Merge: HR, calorie, durata → `WorkoutSession.heartRate`
6. Opzione: "Sovrascrivi durata con dati Garmin" se c’è discrepanza

### B) Solo fascia BLE (real-time)

1. Settings: "Fascia cardiaca" → scan → pair → salva deviceId
2. All’avvio workout live: "Connetti fascia" (auto-connect se paired)
3. Durante workout: mostrare bpm live + eventuale grafico a linea
4. A fine sessione: salvare `samples` in `heartRate`, calcolare avg/max

### C) Garmin + fascia

- Fascia BLE: dati real-time durante workout in app
- Garmin: backup/merge se l’utente ha anche registrato su orologio Garmin
- Policy merge: preferire BLE se abbiamo `samples`; altrimenti usare Garmin

### D) Export verso Garmin (Training API)

1. Dopo `status = completed`: "Invia a Garmin Connect"
2. Costruire payload workout (sets, reps, timer, tipo "Strength")
3. POST a Training API
4. Mostrare conferma "Sincronizzato con Garmin"

---

## 7. Effort stimato (ordine di grandezza)

| Feature | Effort | Note |
|---------|--------|------|
| **Garmin OAuth + Activity API (import)** | 3–5 gg | OAuth flow, storage token, chiamate API, match attività |
| **Garmin Training API (export)** | 2–3 gg | Mapping sessione → formato Garmin, POST |
| **BLE scan + connect + HR stream** | 3–4 gg | react-native-ble-plx, permessi, parsing GATT |
| **Schema HR + persistenza** | 1 gg | Estensione WorkoutSession, validazione |
| **UI Settings (connect Garmin, pair BLE)** | 1–2 gg | Schermate, stati loading/error |
| **Chart HR in Session Detail** | 1–2 gg | Line chart samples, KPI avg/max |
| **Metriche HR in Progress** | 1 gg | Derivazioni, ProgressSnapshot |

**Totale ordine**: 12–18 gg per stack completo (Garmin + BLE + UI + chart).

---

## 8. Pro e contro

### Garmin Connect API

| Pro | Contro |
|-----|--------|
| Dati già registrati (orologio/fascia Garmin) | Richiede approvazione developer |
| Nessun hardware extra se utente ha Garmin | Cloud-to-cloud, no real-time in app |
| Export su Garmin = visibilità su ecosystem | Throttling, dipendenza da terzi |
| Activity API ricca (HR, lap, GPS) | Mapping Strength workout non banale |

### Fascia BLE

| Pro | Contro |
|-----|--------|
| Real-time durante workout | Serve bare workflow (no Expo managed) |
| Funziona con qualsiasi fascia standard | UX: pairing, batteria, connessione |
| Dati nostri, nessun lock-in | Gestione disconnessioni, reconnect |
| Nessuna approvazione esterna | Permessi BLE, testing su device reale |

---

## 9. Raccomandazioni

### Fase 1 – Quick win
- **Garmin Activity API (solo import)**: massimo valore con minimo sforzo se molti utenti hanno Garmin. HR e durata arrivano senza hardware aggiuntivo.

### Fase 2 – Real-time
- **BLE fascia**: per utenti che vogliono vedere HR live e non hanno Garmin, o hanno fascia Polar/Wahoo/Xiaomi. Richiede valutazione Expo vs bare.

### Fase 3 – Export
- **Garmin Training API**: utile per visibilità e per chi usa Garmin come hub principale. Priorità più bassa rispetto a import.

### Schema
- Estendere `WorkoutSession` con `heartRate` subito (opzionale, backward compatible) così sia BLE che Garmin scrivono nello stesso formato.

---

## 10. Domande aperte

1. **Expo**: l’app è managed o già in prebuild? BLE richiede native modules.
2. **Target utenti**: quanti usano Garmin vs altre fasce? Influenza priorità Garmin vs BLE.
3. **Apple Health / Google Fit**: alternativa a Garmin per import HR? Health Connect (Android) e HealthKit (iOS) hanno SDK diversi.
4. **Max HR**: dove lo prendiamo? Input manuale in profilo, stima da età, o da dati storici (max osservato)?

---

## Riferimenti

- [Garmin Connect Developer Program](https://developer.garmin.com/gc-developer-program/overview/)
- [Garmin Activity API](https://developer.garmin.com/gc-developer-program/activity-api/)
- [Garmin Training API](https://developer.garmin.com/gc-developer-program/training-api/)
- [Garmin Health SDK](https://developer.garmin.com/health-sdk/overview/) (app ↔ dispositivo)
- [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx)
- [BLE Heart Rate Service (GATT)](https://www.bluetooth.com/specifications/specs/heart-rate-service-1-0/)
- [WellAlly – React Native BLE HR tutorial](https://www.wellally.tech/en/blog/react-native-ble-heart-rate-monitor-tutorial)
