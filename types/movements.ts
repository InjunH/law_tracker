/**
 * Movement Detection Type Definitions
 *
 * 변호사 이동 감지 시스템의 타입 정의
 */

import { LawyerRawData } from '@/services/lawnbScraper';

/**
 * 이동 유형
 * - join: 신규 입사
 * - leave: 퇴사
 * - transfer: 이직 (30일 이내 다른 로펌에서 퇴사 후 입사)
 */
export type MovementType = 'join' | 'leave' | 'transfer';

/**
 * movements 테이블에 저장될 이동 기록
 */
export interface MovementRecord {
  lawyer_sid: string;
  lawyer_name: string;
  from_firm: string | null;  // LEAVE/TRANSFER의 경우 퇴사 로펌, JOIN의 경우 null
  to_firm: string;            // JOIN/TRANSFER의 경우 입사 로펌, LEAVE의 경우 빈 문자열
  movement_type: MovementType;
  detected_at: Date;
}

/**
 * DB에서 조회한 현재 재직 중인 변호사 정보
 */
export interface CurrentPosition {
  id: string;              // lawyer_positions.id (UUID)
  lawyer_sid: string;      // lawyers.sid
  lawyer_name: string;     // lawyers.name
  firm_name: string;       // lawyer_positions.firm_name
}

/**
 * MovementDetector.detectMovements() 반환 타입
 */
export interface MovementResult {
  movements: MovementRecord[];        // movements 테이블에 INSERT할 레코드들
  positionsToUpdate: string[];        // is_current를 false로 업데이트할 position ID들
  leaves: number;                     // 퇴사자 수
  joins: number;                      // 신규 입사자 수
  transfers: number;                  // 이직자 수
}

/**
 * 최근 LEAVE 이벤트 조회 결과
 */
export interface RecentLeaveEvent {
  lawyer_sid: string;
  from_firm: string;
  detected_at: Date;
}
