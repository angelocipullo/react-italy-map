import type { ProvinceInfo, RegionInfo } from '../types';

const BILINGUAL: Record<string, string[]> = {
    'IT-23': ["Valle d'Aosta/Vallée d'Aoste", "Vallée d'Aoste"],
    'IT-32': ['Trentino-Alto Adige/Südtirol', 'Trentino-Südtirol'],
};

/** Every identifier a region answers to, besides its ISO code. */
export const regionKeys = (r: RegionInfo): string[] => [
    r.istat, String(Number(r.istat)), r.name, r.nameEn, ...(BILINGUAL[r.code] ?? []),
];

/** Every identifier a province answers to, besides its sigla. */
export const provinceKeys = (p: ProvinceInfo): (string | undefined)[] => [
    p.istat, String(Number(p.istat)), `IT-${p.code}`, p.name, p.officialName, ...(p.aliases ?? []),
];
