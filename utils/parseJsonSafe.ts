import { validateJsonSyntax } from './errorHighlighter';
import type { ErrorPosition } from './errorHighlighter';

/**
 * parseJsonSafe – Centralized JSON parsing, comment detection, and normalization utility
 *
 * Purpose:
 * - One source of truth for parsing raw JSON strings in the Online JSON Formatter and Validator
 * - Detects JSON comments (JSONC-style // and block comments) without stripping them
 * - Normalizes input (BOM removal, newline normalization) for stable line/column reporting
 * - Returns structured results for both success and failure with error positions for highlighting
 *
 * SEO-friendly description:
 * Online JSON formatter and validator with comment detection, centralized parsing normalization,
 * fast JSON syntax error detection, accurate line and column reporting, strict JSON parsing rules,
 * and safe post-parse formatting that never modifies whitespace inside JSON strings.
 */
export type CommentMatch = { line: number; kind: 'single' | 'multi'; preview: string };

export type ParseResultOk = {
  ok: true;
  value: unknown;
  normalized: string;
  hasComments: boolean;
  comments: CommentMatch[];
};

export type ParseResultErr = {
  ok: false;
  error: Error;
  errors: ErrorPosition[];
  normalized: string;
  hasComments: boolean;
  comments: CommentMatch[];
};

export type ParseResult = ParseResultOk | ParseResultErr;

const detectComments = (src: string): CommentMatch[] => {
  const singles = Array.from(src.matchAll(/\/\/.*$/gm)).map(m => {
    const idx = m.index ?? 0;
    const line = src.substring(0, idx).split('\n').length;
    const preview = m[0].slice(0, 80).replace(/\n/g, ' ');
    return { line, kind: 'single' as const, preview };
  });
  const multis = Array.from(src.matchAll(/\/\*[\s\S]*?\*\//g)).map(m => {
    const idx = m.index ?? 0;
    const line = src.substring(0, idx).split('\n').length;
    const preview = m[0].slice(0, 80).replace(/\n/g, ' ');
    return { line, kind: 'multi' as const, preview };
  });
  return [...singles, ...multis];
};

export function parseJsonSafe(input: string): ParseResult {
  let normalized = input.replace(/^\uFEFF/, '');
  normalized = normalized.replace(/\r\n/g, '\n');

  const comments = detectComments(normalized);
  const hasComments = comments.length > 0;

  try {
    const value = JSON.parse(normalized);
    return { ok: true, value, normalized, hasComments, comments };
  } catch (error: any) {
    const errors = validateJsonSyntax(normalized);
    return { ok: false, error, errors, normalized, hasComments, comments };
  }
}
