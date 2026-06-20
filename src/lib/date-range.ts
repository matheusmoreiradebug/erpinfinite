/** Utilitários de período. Datas trafegam como string "YYYY-MM-DD" (sem fuso). */

export type DateRange = { from: string; to: string };
export type PresetKey = "hoje" | "semana" | "mes" | "personalizado";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function isoOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Converte "YYYY-MM-DD" para Date local (meio-dia, evita troca de dia por fuso). */
export function dateOf(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function todayRange(now = new Date()): DateRange {
  const t = isoOf(now);
  return { from: t, to: t };
}

/** Semana corrente, de segunda a domingo. */
export function weekRange(now = new Date()): DateRange {
  const d = new Date(now);
  const dow = (d.getDay() + 6) % 7; // 0 = segunda
  const seg = new Date(d);
  seg.setDate(d.getDate() - dow);
  const dom = new Date(seg);
  dom.setDate(seg.getDate() + 6);
  return { from: isoOf(seg), to: isoOf(dom) };
}

export function monthRange(now = new Date()): DateRange {
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: isoOf(first), to: isoOf(last) };
}

const isValidIso = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Lê o período dos search params; cai no mês corrente se ausente/ inválido. */
export function parseRange(params: { from?: string; to?: string }): DateRange {
  if (isValidIso(params.from) && isValidIso(params.to)) {
    const from = params.from!;
    const to = params.to!;
    return from <= to ? { from, to } : { from: to, to: from };
  }
  return monthRange();
}

/** Detecta qual preset corresponde ao intervalo (para destacar o botão ativo). */
export function detectPreset(range: DateRange, now = new Date()): PresetKey {
  const eq = (a: DateRange, b: DateRange) => a.from === b.from && a.to === b.to;
  if (eq(range, todayRange(now))) return "hoje";
  if (eq(range, weekRange(now))) return "semana";
  if (eq(range, monthRange(now))) return "mes";
  return "personalizado";
}

/** Rótulo amigável: "17/06/2026", "Junho 2026" ou "09/06 – 16/06/2026". */
export function formatRangeLabel(range: DateRange, now = new Date()): string {
  const { from, to } = range;
  const f = dateOf(from);
  const t = dateOf(to);
  const dd = (d: Date) => String(d.getDate()).padStart(2, "0");
  const mm = (d: Date) => String(d.getMonth() + 1).padStart(2, "0");

  if (from === to) return `${dd(f)}/${mm(f)}/${f.getFullYear()}`;

  const m = monthRange(now);
  if (from === m.from && to === m.to) {
    return `${MESES[f.getMonth()][0].toUpperCase()}${MESES[f.getMonth()].slice(1)} ${f.getFullYear()}`;
  }
  // mês cheio qualquer
  const firstOfMonth = isoOf(new Date(f.getFullYear(), f.getMonth(), 1));
  const lastOfMonth = isoOf(new Date(f.getFullYear(), f.getMonth() + 1, 0));
  if (from === firstOfMonth && to === lastOfMonth) {
    return `${MESES[f.getMonth()][0].toUpperCase()}${MESES[f.getMonth()].slice(1)} ${f.getFullYear()}`;
  }

  if (f.getFullYear() === t.getFullYear()) {
    return `${dd(f)}/${mm(f)} – ${dd(t)}/${mm(t)}/${t.getFullYear()}`;
  }
  return `${dd(f)}/${mm(f)}/${f.getFullYear()} – ${dd(t)}/${mm(t)}/${t.getFullYear()}`;
}

export function rangeToQuery(range: DateRange): string {
  return `from=${range.from}&to=${range.to}`;
}

export function addDaysIso(iso: string, n: number): string {
  const d = dateOf(iso);
  d.setDate(d.getDate() + n);
  return isoOf(d);
}

/** Semana útil (segunda a sexta) que contém a data informada. */
export function businessWeek(baseIso?: string): DateRange {
  const base = baseIso ? dateOf(baseIso) : new Date();
  const dow = (base.getDay() + 6) % 7; // 0 = segunda
  const seg = new Date(base);
  seg.setDate(base.getDate() - dow);
  const sex = new Date(seg);
  sex.setDate(seg.getDate() + 4);
  return { from: isoOf(seg), to: isoOf(sex) };
}

/** "16 a 20 de junho de 2026" */
export function formatWeekLabel(range: DateRange): string {
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const f = dateOf(range.from);
  const t = dateOf(range.to);
  const mesF = meses[f.getMonth()];
  if (f.getMonth() === t.getMonth()) {
    return `${f.getDate()} a ${t.getDate()} de ${mesF} de ${f.getFullYear()}`;
  }
  return `${f.getDate()} de ${mesF} a ${t.getDate()} de ${meses[t.getMonth()]} de ${t.getFullYear()}`;
}
