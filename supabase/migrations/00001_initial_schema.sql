-- Law Firm Tracker Initial Schema
-- 변호사 이동 추적 시스템 데이터베이스 스키마

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table 1: lawyers (변호사 기본 정보)
-- =====================================================
CREATE TABLE lawyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sid VARCHAR(50) UNIQUE NOT NULL,  -- Lawnb 고유 식별자
  name VARCHAR(100) NOT NULL,
  name_chinese VARCHAR(100),        -- 한자명
  birth_year INT,
  gender VARCHAR(10),
  exam_type VARCHAR(50),             -- 사법시험/변호사시험
  exam_number INT,
  profile_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for lawyers table
CREATE INDEX idx_lawyers_sid ON lawyers(sid);
CREATE INDEX idx_lawyers_name ON lawyers(name);
CREATE INDEX idx_lawyers_birth_year ON lawyers(birth_year);

-- =====================================================
-- Table 2: lawyer_positions (변호사 이력 추적)
-- =====================================================
CREATE TABLE lawyer_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_sid VARCHAR(50) REFERENCES lawyers(sid) ON DELETE CASCADE,
  firm_name VARCHAR(100) NOT NULL,
  position_title VARCHAR(100),       -- 변호사, 파트너 등
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for lawyer_positions table
CREATE INDEX idx_positions_lawyer ON lawyer_positions(lawyer_sid);
CREATE INDEX idx_positions_firm ON lawyer_positions(firm_name);
CREATE INDEX idx_positions_current ON lawyer_positions(is_current);
CREATE INDEX idx_positions_scraped ON lawyer_positions(scraped_at);

-- =====================================================
-- Table 3: movements (이동 감지 기록)
-- =====================================================
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_sid VARCHAR(50) REFERENCES lawyers(sid) ON DELETE CASCADE,
  lawyer_name VARCHAR(100) NOT NULL,
  from_firm VARCHAR(100),
  to_firm VARCHAR(100) NOT NULL,
  movement_type VARCHAR(20) CHECK (movement_type IN ('join', 'leave', 'transfer')),
  detected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for movements table
CREATE INDEX idx_movements_lawyer ON movements(lawyer_sid);
CREATE INDEX idx_movements_date ON movements(detected_at);
CREATE INDEX idx_movements_firm ON movements(to_firm);
CREATE INDEX idx_movements_from_firm ON movements(from_firm);
CREATE INDEX idx_movements_type ON movements(movement_type);

-- =====================================================
-- Row Level Security (RLS) 설정
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Enable read access for all users" ON lawyers
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON lawyer_positions
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON movements
  FOR SELECT USING (true);

-- =====================================================
-- 자동 updated_at 업데이트 함수
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for lawyers table
CREATE TRIGGER update_lawyers_updated_at
  BEFORE UPDATE ON lawyers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 유용한 뷰 (Views)
-- =====================================================

-- 현재 활동 중인 변호사 목록
CREATE VIEW current_lawyers AS
SELECT
  l.sid,
  l.name,
  l.name_chinese,
  l.birth_year,
  l.gender,
  l.exam_type,
  l.exam_number,
  lp.firm_name,
  lp.position_title,
  lp.start_date
FROM lawyers l
INNER JOIN lawyer_positions lp ON l.sid = lp.lawyer_sid
WHERE lp.is_current = true;

-- 최근 이동 내역 (최근 30일)
CREATE VIEW recent_movements AS
SELECT
  m.id,
  m.lawyer_sid,
  m.lawyer_name,
  m.from_firm,
  m.to_firm,
  m.movement_type,
  m.detected_at
FROM movements m
WHERE m.detected_at >= NOW() - INTERVAL '30 days'
ORDER BY m.detected_at DESC;

-- 법인별 현재 인원수
CREATE VIEW firm_headcount AS
SELECT
  firm_name,
  COUNT(*) as lawyer_count
FROM lawyer_positions
WHERE is_current = true
GROUP BY firm_name
ORDER BY lawyer_count DESC;

-- =====================================================
-- 코멘트 (테이블 설명)
-- =====================================================
COMMENT ON TABLE lawyers IS '변호사 기본 정보 마스터 테이블';
COMMENT ON TABLE lawyer_positions IS '변호사 소속 이력 테이블 (시간에 따른 변화 추적)';
COMMENT ON TABLE movements IS '변호사 이동 감지 이벤트 테이블';

COMMENT ON COLUMN lawyers.sid IS 'Lawnb.com의 고유 식별자 (예: P00034AC3D86EF67)';
COMMENT ON COLUMN lawyer_positions.is_current IS '현재 재직 여부 (true: 재직 중, false: 퇴사)';
COMMENT ON COLUMN movements.movement_type IS '이동 유형 (join: 입사, leave: 퇴사, transfer: 이직)';
