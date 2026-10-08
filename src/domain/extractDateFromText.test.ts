import { describe, expect, it } from 'vitest';
import { extractDateFromText } from './extractDateFromText';

const dateOf = (text: string) => extractDateFromText(text)?.date;

describe('numeric formats', () => {
  it('reads dd/mm/yyyy, dd-mm-yyyy and dd.mm.yyyy', () => {
    expect(dateOf('Fecha factura: 05/01/2026')).toEqual({ y: 2026, m: 1, d: 5 });
    expect(dateOf('Fecha factura: 05-01-2026')).toEqual({ y: 2026, m: 1, d: 5 });
    expect(dateOf('Fecha factura: 05.01.2026')).toEqual({ y: 2026, m: 1, d: 5 });
  });

  it('reads two-digit years', () => {
    expect(dateOf('Data factura 05/01/26')).toEqual({ y: 2026, m: 1, d: 5 });
  });

  it('reads ISO dates', () => {
    expect(dateOf('Invoice date: 2026-01-05')).toEqual({ y: 2026, m: 1, d: 5 });
  });

  it('reads single-digit day and month', () => {
    expect(dateOf('Fecha: 5/1/2026')).toEqual({ y: 2026, m: 1, d: 5 });
  });

  it('rejects impossible dates', () => {
    expect(extractDateFromText('Fecha factura 31/02/2026')).toBeNull();
    expect(extractDateFromText('Fecha factura 00/01/2026')).toBeNull();
    expect(extractDateFromText('Fecha factura 13/13/2026')).toBeNull();
  });

  it('does not match inside longer numbers or dotted references', () => {
    expect(extractDateFromText('Ref 2.222.232 y 1234567890123')).toBeNull();
    expect(extractDateFromText('IBAN 1234/05/012026999')).toBeNull();
  });

  it('returns null for empty or date-less text', () => {
    expect(extractDateFromText('')).toBeNull();
    expect(extractDateFromText('Total 123,45 EUR')).toBeNull();
  });
});

describe('written months', () => {
  it('reads Spanish', () => {
    expect(dateOf('Fecha de emisión: 5 de enero de 2026')).toEqual({ y: 2026, m: 1, d: 5 });
    expect(dateOf('Fecha factura 15 de septiembre del 2026')).toEqual({ y: 2026, m: 9, d: 15 });
  });

  it('reads Catalan, including the d\' elision', () => {
    expect(dateOf('Data d\'emissió: 5 de gener de 2026')).toEqual({ y: 2026, m: 1, d: 5 });
    expect(dateOf('Data factura: 5 d\'abril de 2026')).toEqual({ y: 2026, m: 4, d: 5 });
    expect(dateOf('Data factura: 5 de març de 2026')).toEqual({ y: 2026, m: 3, d: 5 });
    expect(dateOf('Data factura: 5 d’octubre de 2026')).toEqual({ y: 2026, m: 10, d: 5 });
  });

  it('reads English in both orders', () => {
    expect(dateOf('Invoice date: January 5, 2026')).toEqual({ y: 2026, m: 1, d: 5 });
    expect(dateOf('Date of issue 5 Jan 2026')).toEqual({ y: 2026, m: 1, d: 5 });
    expect(dateOf('Issue date: Sept 5th, 2026')).toEqual({ y: 2026, m: 9, d: 5 });
    expect(dateOf('Date: 5 January 2026')).toEqual({ y: 2026, m: 1, d: 5 });
  });
});

describe('scoring', () => {
  it('prefers a date next to an invoice-date keyword', () => {
    const text = 'Pedido 01/03/2026\nFecha factura: 05/03/2026\nVencimiento: 05/04/2026';
    expect(dateOf(text)).toEqual({ y: 2026, m: 3, d: 5 });
  });

  it('penalises delivery-note and due dates', () => {
    const text = 'Vencimiento 30/06/2026\nAlbarán fecha 12/06/2026\nFecha 14/06/2026';
    expect(dateOf(text)).toEqual({ y: 2026, m: 6, d: 14 });
  });

  it('picks the header-row date over a later delivery-note date (Saltoki-style layout)', () => {
    const text = [
      'FACTURA     FECHA       CLIENTE',
      '600001      14-06-2026  200001',
      '',
      'ALBARAN Nº 1.111.111 FECHA 12-06-2026',
    ].join('\n');
    expect(dateOf(text)).toEqual({ y: 2026, m: 6, d: 14 });
  });

  it('ignores period ranges', () => {
    const text = 'Periodo desde 01/05/2026 hasta 31/05/2026\nFecha de emisión 03/06/2026';
    expect(dateOf(text)).toEqual({ y: 2026, m: 6, d: 3 });
  });

  it('ignores English due dates and periods', () => {
    const text = 'Due date: 30/06/2026\nBilling period from 01/05/2026 to 31/05/2026\nInvoice date: 03/06/2026';
    expect(dateOf(text)).toEqual({ y: 2026, m: 6, d: 3 });
  });

  it('breaks ties by first occurrence', () => {
    expect(dateOf('Total 10/01/2026 y 20/01/2026')).toEqual({ y: 2026, m: 1, d: 10 });
  });

  it('returns null when every candidate is a delivery or due date', () => {
    expect(extractDateFromText('Vencimiento: 30/06/2026')).toBeNull();
  });

  it('reports higher confidence for keyword-backed dates', () => {
    const strong = extractDateFromText('Fecha factura: 05/01/2026');
    const bare = extractDateFromText('Total 05/01/2026');
    expect(strong!.confidence).toBeGreaterThan(bare!.confidence);
  });

  it('interprets mm/dd only when dd/mm is impossible', () => {
    expect(dateOf('Invoice date 06/14/2026')).toEqual({ y: 2026, m: 6, d: 14 });
    expect(dateOf('Invoice date 06/05/2026')).toEqual({ y: 2026, m: 5, d: 6 });
  });
});

describe('layout handling', () => {
  it('uses the label cell above the value column, not the whole label row', () => {
    const text = [
      '  Data                              Data de venciment                  CLIENT',
      '  07/01/2026                        09/02/2026                         ACME',
    ].join('\n');
    expect(extractDateFromText(text)).toMatchObject({ date: { y: 2026, m: 1, d: 7 } });
    expect(extractDateFromText(text)!.confidence).toBeGreaterThan(0.5);
  });

  it('reads dates with spaces around separators', () => {
    expect(dateOf('D. Emissió: 03 / 09 / 2026')).toEqual({ y: 2026, m: 9, d: 3 });
  });

  it('prefers the issue date over the operation and due dates', () => {
    const text = "Data d'emissió: 15.01.2026\nData d'operació: 14.01.2026\nVenciment: 14.01.2026";
    expect(dateOf(text)).toEqual({ y: 2026, m: 1, d: 15 });
  });

  it('prefers the document date over the order date', () => {
    const text = 'Fecha del documento 15.06.2026\nFecha de pedido 10.06.2026\nFecha de vencimiento 15.06.2026';
    expect(dateOf(text)).toEqual({ y: 2026, m: 6, d: 15 });
  });
});

describe('slightly misaligned columns', () => {
  it('matches a value to the nearest label even when the column is shifted left', () => {
    const text = [
      'Nº pedido                                Fecha apertura                           Fecha prevista de entrega',
      '0034826001882                         09/07/2026                              10/07/2026 18:10h',
    ].join('\n');
    expect(dateOf(text)).toEqual({ y: 2026, m: 7, d: 9 });
  });
});
