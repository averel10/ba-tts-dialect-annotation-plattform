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

export const DIALECT_LABELS_WITHOUT_DE: Record<string, string> = {
  ch_be: 'Bern',
  ch_bs: 'Basel',
  ch_gr: 'Graubünden',
  ch_in: 'Innerschweiz',
  ch_os: 'Ostschweiz',
  ch_vs: 'Wallis',
  ch_zh: 'Zürich'
};

export type DatasetEntryForAnnotation = {
  id: number;
  externalId: string;
  fileName: string;
  dialect: string;
  durationMs: number | null;
  datasetId: number;
  experimentId: number;
  annotation: number | null;
  utteranceText: string | null;
};
