-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Provinces enum
CREATE TYPE province AS ENUM ('BC', 'AB', 'ON');

-- Assessment types enum
CREATE TYPE assessment_type AS ENUM ('formative', 'summative', 'diagnostic', 'benchmark');

-- Alignment confidence enum
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');

-- ============================================================================
-- CURRICULUM STANDARDS TABLE
-- ============================================================================
CREATE TABLE curriculum_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  province province NOT NULL,
  subject VARCHAR(100) NOT NULL,
  grade_level VARCHAR(10) NOT NULL,
  standard_code VARCHAR(50) NOT NULL,
  standard_name TEXT NOT NULL,
  description TEXT,
  -- Competency level or learning outcome specifics
  competency_domain VARCHAR(255),
  skill_category VARCHAR(100),
  -- Full curriculum reference
  curriculum_reference JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(province, standard_code)
);

CREATE INDEX idx_curriculum_province_subject ON curriculum_standards(province, subject);
CREATE INDEX idx_curriculum_grade ON curriculum_standards(grade_level);
CREATE INDEX idx_curriculum_code ON curriculum_standards(standard_code);

-- ============================================================================
-- ASSESSMENT INGESTION RECORDS TABLE
-- ============================================================================
CREATE TABLE assessment_ingestion_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  district_id VARCHAR(100),
  district_name VARCHAR(255),
  province province NOT NULL,
  assessment_type assessment_type NOT NULL,
  assessment_name VARCHAR(255) NOT NULL,
  assessment_code VARCHAR(100),
  subject VARCHAR(100) NOT NULL,
  grade_level VARCHAR(10) NOT NULL,
  -- Raw assessment data (questions, rubrics, etc)
  raw_data JSONB NOT NULL,
  -- Extracted/parsed data by AI
  parsed_data JSONB,
  -- Processing status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'error')),
  error_message TEXT,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assessment_user ON assessment_ingestion_records(user_id);
CREATE INDEX idx_assessment_province_subject ON assessment_ingestion_records(province, subject);
CREATE INDEX idx_assessment_status ON assessment_ingestion_records(status);
CREATE INDEX idx_assessment_grade ON assessment_ingestion_records(grade_level);

-- ============================================================================
-- ALIGNMENT MAPPINGS TABLE
-- ============================================================================
CREATE TABLE alignment_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessment_ingestion_records(id) ON DELETE CASCADE,
  curriculum_standard_id UUID NOT NULL REFERENCES curriculum_standards(id) ON DELETE CASCADE,
  -- Question/item reference within assessment
  assessment_item_id VARCHAR(100),
  assessment_item_text TEXT,
  -- Alignment details
  confidence confidence_level NOT NULL,
  alignment_score DECIMAL(3,2) CHECK (alignment_score >= 0 AND alignment_score <= 1),
  alignment_rationale TEXT,
  -- AI reasoning/metadata
  ai_analysis JSONB,
  validated_by_user BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alignment_assessment ON alignment_mappings(assessment_id);
CREATE INDEX idx_alignment_curriculum ON alignment_mappings(curriculum_standard_id);
CREATE INDEX idx_alignment_confidence ON alignment_mappings(confidence);
CREATE INDEX idx_alignment_validated ON alignment_mappings(validated_by_user);

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE curriculum_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_ingestion_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE alignment_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Curriculum standards: read-only for authenticated users
CREATE POLICY "curriculum_read" ON curriculum_standards
  FOR SELECT USING (TRUE);

-- Assessment records: users see only their own
CREATE POLICY "assessment_own" ON assessment_ingestion_records
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Alignment mappings: users see only their own assessments' alignments
CREATE POLICY "alignment_own" ON alignment_mappings
  FOR SELECT USING (
    assessment_id IN (
      SELECT id FROM assessment_ingestion_records WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "alignment_insert_own" ON alignment_mappings
  FOR INSERT WITH CHECK (
    assessment_id IN (
      SELECT id FROM assessment_ingestion_records WHERE user_id = auth.uid()
    )
  );

-- Audit logs: users see only their own entries
CREATE POLICY "audit_own" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);
