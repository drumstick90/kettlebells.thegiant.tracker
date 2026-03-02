# Stima: libreria chart custom

Quanto è difficile scrivere la nostra libreria di chart per React Native?

## Livello di complessità

| Componente | Difficoltà | Ore stimate | Note |
|------------|------------|-------------|------|
| **Line chart base** | Media | 8–16h | Scale (d3-scale o manuale), path SVG, assi |
| **Area chart** | Bassa | 2–4h | Estensione line con fill |
| **Bar chart** | Media | 6–12h | Layout, animazioni |
| **Assi e grid** | Media | 4–8h | Tick, label, formattazione |
| **Touch/gesture** | Alta | 12–24h | Pan, zoom, tooltip |
| **Animazioni** | Media | 6–12h | Reanimated o Animated |
| **Performance** | Alta | 8–16h | Virtualizzazione, memo |
| **Testing + polish** | Media | 8–16h | Edge case, device vari |

## Totale indicativo

- **MVP (line + area, no gesture):** 20–40 ore
- **Produzione (line, area, bar, gesture, animazioni):** 50–100 ore
- **Libreria riusabile e documentata:** 80–150 ore

## Stack tecnico consigliato

- **Rendering:** react-native-svg (Path, Line, Rect)
- **Scale:** d3-scale (solo logica, no DOM)
- **Path:** d3-shape (line, area)
- **Gesture:** react-native-gesture-handler
- **Animazioni:** react-native-reanimated

## Pro e contro

| Pro | Contro |
|-----|--------|
| Controllo totale su design | Tempo di sviluppo alto |
| Nessuna dipendenza pesante (Skia) | Manutenzione continua |
| Bundle size minimo | Bug e edge case da gestire |
| Ottimizzato per i nostri casi | Meno feature out-of-the-box |

## Raccomandazione

Per un’app fitness con 2–3 tipi di chart: **non conviene** scrivere una libreria da zero. Gifted Charts o Victory Native coprono il 95% dei casi con meno rischio e meno tempo.

Una libreria custom ha senso solo se:
- servono chart molto specifici non coperti dalle librerie esistenti;
- si vuole ridurre il bundle size in modo drastico;
- si ha tempo e risorse per manutenzione a lungo termine.
