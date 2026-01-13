/**
 * 데이터 변환 유틸리티
 * Lawnb 스크래핑 데이터를 Supabase 스키마에 맞게 변환
 */

import { LawyerRawData } from './lawnbScraper';

/**
 * Supabase lawyers 테이블 타입
 */
export interface LawyerDBData {
  sid: string;
  name: string;
  name_chinese: string | null;
  birth_year: number | null;
  gender: string | null;
  exam_type: string | null;
  exam_number: number | null;
  profile_url: string;
}

/**
 * Supabase lawyer_positions 테이블 타입
 */
export interface LawyerPositionDBData {
  lawyer_sid: string;
  firm_name: string;
  position_title: string | null;
  is_current: boolean;
  scraped_at: Date;
}

/**
 * 변환 결과 타입
 */
export interface TransformedLawyerData {
  lawyer: LawyerDBData;
  position: LawyerPositionDBData;
}

/**
 * 로펌명 정규화
 *
 * 예시:
 * - "법무법인(유) 세종 / 관세" → "세종"
 * - "법무법인(유한) 광장" → "광장"
 * - "김앤장 법률사무소" → "김앤장"
 * - "법무법인 해담(안산분사무소)" → "해담"
 */
export function normalizeFirmName(firmName: string): string {
  let normalized = firmName;

  // 1. "/" 이후 팀/부서 정보 제거
  const slashIndex = normalized.indexOf('/');
  if (slashIndex !== -1) {
    normalized = normalized.substring(0, slashIndex).trim();
  }

  // 2. 법인 형태 키워드 제거 (순서 중요: 긴 것부터)
  normalized = normalized
    .replace(/법무법인\(유한\)/g, '')
    .replace(/법무법인\(유\)/g, '')
    .replace(/법무법인/g, '')
    .replace(/법률사무소/g, '')
    .replace(/변호사무소/g, '')
    .trim();

  // 3. 괄호와 내용 제거 (분사무소, 안산분사무소 등)
  normalized = normalized.replace(/\([^)]*\)/g, '').trim();

  // 4. 연속된 공백을 하나로
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * LawyerRawData를 Supabase 스키마에 맞게 변환
 */
export function transformLawyerData(
  raw: LawyerRawData,
  scrapedAt: Date = new Date()
): TransformedLawyerData {
  return {
    lawyer: {
      sid: raw.sid,
      name: raw.name,
      name_chinese: raw.nameChina,
      birth_year: raw.birthYear,
      gender: raw.gender,
      exam_type: raw.examType,
      exam_number: raw.examNumber,
      profile_url: raw.profileUrl
    },
    position: {
      lawyer_sid: raw.sid,
      firm_name: raw.firmName,
      position_title: raw.position,
      is_current: true,
      scraped_at: scrapedAt
    }
  };
}

/**
 * 여러 변호사 데이터 일괄 변환
 */
export function transformLawyersData(
  rawLawyers: LawyerRawData[],
  scrapedAt: Date = new Date()
): TransformedLawyerData[] {
  return rawLawyers.map(raw => transformLawyerData(raw, scrapedAt));
}

/**
 * 변호사 데이터를 lawyer와 position으로 분리
 */
export function separateLawyerData(transformed: TransformedLawyerData[]) {
  return {
    lawyers: transformed.map(t => t.lawyer),
    positions: transformed.map(t => t.position)
  };
}

/**
 * 데이터 유효성 검증
 */
export function validateLawyerData(raw: LawyerRawData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!raw.sid || raw.sid.trim() === '') {
    errors.push('SID is required');
  }

  if (!raw.name || raw.name.trim() === '') {
    errors.push('Name is required');
  }

  if (!raw.firmName || raw.firmName.trim() === '') {
    errors.push('Firm name is required');
  }

  if (!raw.profileUrl || raw.profileUrl.trim() === '') {
    errors.push('Profile URL is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 유효한 데이터만 필터링
 */
export function filterValidLawyers(rawLawyers: LawyerRawData[]): {
  valid: LawyerRawData[];
  invalid: Array<{ data: LawyerRawData; errors: string[] }>;
} {
  const valid: LawyerRawData[] = [];
  const invalid: Array<{ data: LawyerRawData; errors: string[] }> = [];

  for (const raw of rawLawyers) {
    const validation = validateLawyerData(raw);
    if (validation.isValid) {
      valid.push(raw);
    } else {
      invalid.push({ data: raw, errors: validation.errors });
    }
  }

  return { valid, invalid };
}
