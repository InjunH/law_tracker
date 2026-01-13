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
