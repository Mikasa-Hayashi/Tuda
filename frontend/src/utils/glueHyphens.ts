/**
 * Keeps ordinal numbers like "62-й" on one line: a word joiner after the hyphen removes the
 * line-break opportunity that otherwise splits "62-" from "й армии".
 */
export const glueHyphens = (s: string): string => s.replace(/(\d)-(?=\p{L})/gu, '$1-\u2060');
