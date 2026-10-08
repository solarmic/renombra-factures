import { renderTokens } from './renderTokens';
import type { YMD } from './types';

export interface TemplateContext {
  n: number;
  date: YMD;
  name: string;
}

const pad = (value: number, width: number) => String(value).padStart(width, '0');

/** Invoice flavour of the shared engine: unknown or malformed tokens are left literal so typos show in the preview. */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  return renderTokens(template, {
    n: ctx.n,
    yyyy: pad(ctx.date.y, 4),
    yy: pad(ctx.date.y % 100, 2),
    mm: pad(ctx.date.m, 2),
    dd: pad(ctx.date.d, 2),
    name: ctx.name,
  });
}
