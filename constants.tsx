
import { LawFirm, FirmTier } from './types';

export const MAJOR_FIRMS: LawFirm[] = [
  { id: 'knc', name: '김앤장', englishName: 'Kim & Chang', attorneyCount: 960, tier: FirmTier.TIER_1, color: '#1e3a8a' },
  { id: 'lnk', name: '광장', englishName: 'Lee & Ko', attorneyCount: 570, tier: FirmTier.TIER_1, color: '#1e40af' },
  { id: 'bkl', name: '태평양', englishName: 'Bae, Kim & Lee', attorneyCount: 500, tier: FirmTier.TIER_1, color: '#1d4ed8' },
  { id: 'snk', name: '세종', englishName: 'Shin & Kim', attorneyCount: 510, tier: FirmTier.TIER_1, color: '#2563eb' },
  { id: 'yulchon', name: '율촌', englishName: 'Yulchon', attorneyCount: 410, tier: FirmTier.TIER_1, color: '#3b82f6' },
  { id: 'hwawoo', name: '화우', englishName: 'Hwawoo', attorneyCount: 330, tier: FirmTier.TIER_2, color: '#0f172a' },
  { id: 'barun', name: '바른', englishName: 'Barun Law', attorneyCount: 200, tier: FirmTier.TIER_2, color: '#334155' },
  { id: 'jipyong', name: '지평', englishName: 'Jipyong', attorneyCount: 150, tier: FirmTier.TIER_2, color: '#475569' },
  { id: 'yk', name: '와이케이', englishName: 'YK Law', attorneyCount: 100, tier: FirmTier.TIER_3, color: '#64748b' },
  { id: 'dryook', name: '대륙아주', englishName: 'DR & AJU', attorneyCount: 100, tier: FirmTier.TIER_3, color: '#94a3b8' },
  { id: 'daeryun', name: '대륜', englishName: 'Daeryun', attorneyCount: 80, tier: FirmTier.TIER_3, color: '#cbd5e1' },
  { id: 'dongin', name: '동인', englishName: 'Dongin', attorneyCount: 80, tier: FirmTier.TIER_3, color: '#e2e8f0' },
  { id: 'logos', name: '로고스', englishName: 'Logos', attorneyCount: 70, tier: FirmTier.TIER_3, color: '#f1f5f9' },
];

export const EXPERTISE_LIST = [
  'M&A', '금융', '공정거래', '조세', '지식재산권', '송무', '노동', '중대재해', '기업형사', '부동산'
];

export const POSITIONS = [
  '시니어 파트너', '파트너', '어소시에이트', '고문', '외국변호사'
];
