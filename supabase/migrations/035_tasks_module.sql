-- Migration: 035_tasks_module.sql
-- Description: Task management module for BenzERP
-- Replicates Google Sheets task system with proper view isolation

-- ============================================================================
-- TABLE: tasks
-- Central task management table
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_number SERIAL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low','Normal','High','Urgent')),
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New','In Progress','Done','Cancelled')),
  employee_update TEXT,
  employee_updated_at TIMESTAMPTZ,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Auto-update trigger
CREATE TRIGGER tasks_updated_at 
  BEFORE UPDATE ON tasks
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();
