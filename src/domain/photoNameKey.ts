import { isValidMoment, type PhotoMoment } from './photoTime';

export interface NameKey {
  /** Capture time encoded in the name (phone and screenshot naming), if any. */
  moment: PhotoMoment | null;
  /** Camera/phone running counter (IMG_0423, DSC01234, WhatsApp WA0012), if any. */
  counter: number | null;
}

const COMPACT = /(?<!\d)((?:19|20)\d{2})(\d{2})(\d{2})[_-]?(\d{2})(\d{2})(\d{2})(\d{3})?(?!\d)/;
const SEPARATED = /(?<!\d)((?:19|20)\d{2})[-_.](\d{2})[-_.](\d{2})[ _T-](\d{2})[-_.:](\d{2})[-_.:](\d{2})(?!\d)/;
const WHATSAPP = /(?<!\d)((?:19|20)\d{2})(\d{2})(\d{2})-WA(\d+)/i;
const COUNTER = /^(?:IMG_E?|_?DSC[FN_]?|P|PICT|GOPR|IMG)(\d{3,8})(?:[\s_(.-].*)?$/i;

function build(parts: (string | undefined)[]): PhotoMoment | null {
  const at = (i: number) => Number(parts[i] ?? 0);
  const moment = { y: at(0), m: at(1), d: at(2), hh: at(3), mi: at(4), ss: at(5), ms: at(6) };
  return isValidMoment(moment) ? moment : null;
}

/** Reads what can be inferred from a photo's file name. The extension is stripped here. */
export function parsePhotoName(fileName: string): NameKey {
  const base = fileName.replace(/\.[A-Za-z0-9]{1,5}$/, '');

  const wa = WHATSAPP.exec(base);
  if (wa) {
    const moment = build([wa[1], wa[2], wa[3]]);
    if (moment) return { moment, counter: Number(wa[4]) };
  }

  const full = COMPACT.exec(base) ?? SEPARATED.exec(base);
  if (full) {
    const moment = build(full.slice(1));
    if (moment) return { moment, counter: null };
  }

  const counter = COUNTER.exec(base);
  return { moment: null, counter: counter ? Number(counter[1]) : null };
}
