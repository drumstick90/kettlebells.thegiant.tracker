# Dati seed per sviluppo e test

⚠️ **Rimuovere `scripts/generate-seed-data.ts`, `data/` e lo script `seed:generate` da package.json prima di produzione.**

## seed-workouts.json

Database locale con **11 sessioni** di The Giant su **4 settimane** (3 feb – 26 feb 2025):

- **Giant 1.0** (settimane 1–2): sets of 5/6/4, 24 kg
- **Giant 2.0** (settimane 3–4): ladder 3,4,5 / 3,5,7 / 4,6,8, 24 kg (un giorno 20 kg)
- **2 sessioni interrotte**: 14 feb (mal di testa), 19 feb (impegno improvviso)
- Ogni sessione include `setEvents` con timestamp per serie (rest ~60–120 sec)

## Rigenerare i dati

```bash
npm run seed:generate
```

## Caricare i dati nell'app

Per ora: copia il contenuto di `seed-workouts.json` e incollalo in AsyncStorage con chiave `@kettlebell_tracker_db` (es. tramite debug tools o uno script di import).
