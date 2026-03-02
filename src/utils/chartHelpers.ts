/**
 * Utilities per chart: moving average, linear regression, adapter Step 3.
 */

export interface ChartPoint {
  value: number;
  label?: string;
}

/** Formato uniforme per date su asse X: "DD MMM" (es. "03 Jan", "15 Jan") */
export function formatDateUniform(d: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${months[d.getMonth()]}`;
}

/** Step 3: converte dati di dominio in formato chart (value, label) */
export function toChartPoints(
  points: { date: Date; value: number }[],
  formatLabel: (d: Date) => string,
  /** Se > 0, mostra solo ogni Nth label per evitare sovrapposizione (es. 2 = ogni 2°) */
  showLabelEveryN = 0
): ChartPoint[] {
  return points.map((p, i) => {
    const label = formatLabel(p.date);
    const show = showLabelEveryN <= 0 || i % showLabelEveryN === 0;
    return { value: p.value, label: show ? label : '' };
  });
}

/** Media mobile a finestra fissa. Stessa lunghezza di data, primi (windowSize-1) punti = media parziale. */
export function movingAverage(
  data: ChartPoint[],
  windowSize: number
): ChartPoint[] {
  if (data.length < 2 || windowSize < 2) return [];
  return data.map((_, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((s, p) => s + p.value, 0) / slice.length;
    return {
      value: Math.round(avg * 10) / 10,
      label: data[i].label,
    };
  });
}

/** Calcola maxValue e stepValue "puliti" per asse Y (es. volume load in kg) */
export function niceAxisScale(
  dataMax: number,
  sections = 4,
  padding = 1.15
): { maxValue: number; stepValue: number } {
  const target = Math.ceil((dataMax || 1) * padding);
  const rawStep = target / sections;
  let stepValue: number;
  if (rawStep <= 50) stepValue = Math.ceil(rawStep / 10) * 10 || 25;
  else if (rawStep <= 200) stepValue = Math.ceil(rawStep / 25) * 25;
  else if (rawStep <= 500) stepValue = Math.ceil(rawStep / 50) * 50;
  else stepValue = Math.ceil(rawStep / 100) * 100;
  const maxValue = stepValue * sections;
  return { maxValue, stepValue };
}

/** Regressione lineare: restituisce punti sulla retta per ogni indice */
export function linearRegression(data: ChartPoint[]): ChartPoint[] {
  const n = data.length;
  if (n < 2) return [];
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i].value;
    sumXY += i * data[i].value;
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-10) return [];
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return data.map((d, i) => ({
    value: Math.round((intercept + slope * i) * 10) / 10,
    label: d.label,
  }));
}
