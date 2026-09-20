export const NIGHTLY_REFERENCE_RATE_KEYS = [
  'ONE_CAT',
  'ONE_CAT_7_TO_14',
  'ONE_CAT_15_TO_29',
  'ONE_CAT_30_PLUS',
  'TWO_CATS',
  'THREE_PLUS_CATS',
] as const;

export type NightlyReferenceRateKey = (typeof NIGHTLY_REFERENCE_RATE_KEYS)[number];

export interface NightlyReferenceRate {
  key: NightlyReferenceRateKey;
  nightlyRate: string | null;
}
