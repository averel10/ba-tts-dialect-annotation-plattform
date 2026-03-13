export const DIALECT_LABELS: Record<string, string> = {
  ch_be: 'Bern',
  ch_bs: 'Basel',
  ch_gr: 'Graubünden',
  ch_in: 'Innerschweiz',
  ch_os: 'Ostschweiz',
  ch_vs: 'Wallis',
  ch_zh: 'Zürich',
  de: 'Deutsch',
};

export type AnnotationEntry = {
  id: number;
  externalId: string;
  fileName: string;
  dialect: string;
  durationMs: number | null;
  datasetId: number;
};
