import { describe, expect, it } from 'vitest';
import { planPhotos, type PhotoPlanItem, type PhotoPlanOptions } from './planPhotos';
import { photoSortKey } from './photoSortKey';
import { parseExifDateTime } from './photoTime';

const photo = (name: string, exif: string | null, place: string | null = null, included = true): PhotoPlanItem => ({
  name,
  key: photoSortKey({ name, exifMoment: exif ? parseExifDateTime(exif) : null, lastModified: 0 }),
  place,
  included,
});

const opts: PhotoPlanOptions = {
  template: '{n:2}_{t1}_{t2}',
  t1: 'Menorca',
  t2: 'Familia',
  start: 1,
  replacement: '-',
  groupByPlace: false,
  noPlaceFolder: 'No location',
};

describe('planPhotos', () => {
  it('acceptance: names by capture time with the default template', () => {
    const plan = planPhotos(
      [photo('b.JPG', '2026:07:05 10:00:00'), photo('a.jpg', '2026:07:05 09:00:00')],
      opts,
    );
    expect(plan.planned.map((p) => [p.item.name, p.path])).toEqual([
      ['a.jpg', '01_Menorca_Familia.jpg'],
      ['b.JPG', '02_Menorca_Familia.JPG'],
    ]);
  });

  it('drops an empty title without leaving a separator', () => {
    const plan = planPhotos([photo('a.jpg', '2026:07:05 09:00:00')], { ...opts, t2: '' });
    expect(plan.planned[0]?.newName).toBe('01_Menorca.jpg');
  });

  it('renders date, time and place tokens', () => {
    const plan = planPhotos([photo('a.jpg', '2026:07:05 09:08:07', 'Ciutadella')], {
      ...opts,
      template: '{yyyy}-{mm}-{dd} {hh}.{min} {place} {yy}',
    });
    expect(plan.planned[0]?.newName).toBe('2026-07-05 09.08 Ciutadella 26.jpg');
  });

  it('falls back to the original name when the template renders empty', () => {
    const plan = planPhotos([photo('a.jpg', '2026:07:05 09:00:00')], { ...opts, template: '{t1}', t1: '' });
    expect(plan.planned[0]?.newName).toBe('a.jpg');
  });

  it('numbers from the start value and skips excluded photos', () => {
    const plan = planPhotos(
      [photo('a.jpg', '2026:07:05 09:00:00'), photo('b.jpg', '2026:07:05 10:00:00', null, false), photo('c.jpg', '2026:07:05 11:00:00')],
      { ...opts, start: 5, t1: '', t2: '' },
    );
    expect(plan.planned.map((p) => p.newName)).toEqual(['05.jpg', '06.jpg']);
    expect(plan.skipped.map((s) => s.name)).toEqual(['b.jpg']);
  });

  it('groups into place folders, with a translated folder for missing places', () => {
    const plan = planPhotos(
      [
        photo('a.jpg', '2026:07:05 09:00:00', 'Ciutadella'),
        photo('b.jpg', '2026:07:05 10:00:00', null),
        photo('c.jpg', '2026:07:05 11:00:00', 'ciutadella'),
        photo('d.jpg', '2026:07:05 12:00:00', 'Maó'),
      ],
      { ...opts, groupByPlace: true, noPlaceFolder: 'Sin ubicación' },
    );
    expect(plan.planned.map((p) => p.path)).toEqual([
      'Ciutadella/01_Menorca_Familia.jpg',
      'Sin ubicación/02_Menorca_Familia.jpg',
      'Ciutadella/03_Menorca_Familia.jpg',
      'Maó/04_Menorca_Familia.jpg',
    ]);
  });

  it('sanitizes folder names', () => {
    const plan = planPhotos([photo('a.jpg', '2026:07:05 09:00:00', 'A/B: C')], { ...opts, groupByPlace: true });
    expect(plan.planned[0]?.folder).toBe('A-B- C');
  });

  it('keeps names unique within a folder when the template has no counter', () => {
    const plan = planPhotos(
      [photo('a.jpg', '2026:07:05 09:00:00', 'X'), photo('b.jpg', '2026:07:05 10:00:00', 'X'), photo('c.jpg', '2026:07:05 11:00:00', 'Y')],
      { ...opts, template: 'same', groupByPlace: true },
    );
    expect(plan.planned.map((p) => p.path)).toEqual(['X/same.jpg', 'X/same (2).jpg', 'Y/same.jpg']);
  });

  it('breaks full ties by original name, naturally', () => {
    const plan = planPhotos([photo('f10.jpg', '2026:07:05 09:00:00'), photo('f2.jpg', '2026:07:05 09:00:00')], opts);
    expect(plan.planned.map((p) => p.item.name)).toEqual(['f2.jpg', 'f10.jpg']);
  });

  it('plans nothing for no photos', () => {
    expect(planPhotos([], opts).planned).toEqual([]);
  });
});
