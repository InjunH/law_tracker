
export enum FirmTier {
  TIER_1 = 'Tier 1',
  TIER_2 = 'Tier 2',
  TIER_3 = 'Tier 3'
}

export interface LawFirm {
  id: string;
  name: string;
  englishName: string;
  attorneyCount: number;
  tier: FirmTier;
  color: string;
}

export type MovementType = 'JOIN' | 'LEAVE' | 'TRANSFER';

export interface Movement {
  id: string;
  lawyerName: string;
  date: string;
  type: MovementType;
  fromFirm?: string;
  toFirm?: string;
  position: string;
  expertise: string[];
}

export interface DailyStats {
  date: string;
  joiners: number;
  leavers: number;
  transfers: number;
}

export interface SystemStatus {
  crawlerStatus: 'idle' | 'running' | 'error';
  lastSync: string;
  nextSync: string;
  dbStatus: 'connected' | 'reconnecting' | 'disconnected';
  activeWorkers: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface FirmStats {
  firmName: string;
  current: number;
  joins: number;
  leaves: number;
  net: number;
}

export interface TrendData {
  date: string;
  count: number;
}
