import type { YMD } from './types';

export interface TemplateContext {
  n: number;
  date: YMD;
  name: string;
}

const pad = (value: number, width: number) => String(value).padStart(width, '0');

/** Unknown or malformed tokens are left literal so the user can see the typo in the preview. */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  return template.replace(/\{(n|yyyy|yy|mm|dd|name)(?::(\d+))?\}/g, (whole, token: string, width?: string) => {
    if (width !== undefined && token !== 'n') return whole;
    switch (token) {
      case 'n':
        return pad(ctx.n, width === undefined ? 0 : Number(width));
      case 'yyyy':
        return pad(ctx.date.y, 4);
      case 'yy':
        return pad(ctx.date.y % 100, 2);
      case 'mm':
        return pad(ctx.date.m, 2);
      case 'dd':
        return pad(ctx.date.d, 2);
      default:
        return ctx.name;
    }
  });
}
