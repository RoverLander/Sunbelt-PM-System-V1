-- ============================================================================
-- STEP 3: CREATE DEPARTMENTS LOOKUP TABLE
-- ============================================================================
-- Creates the departments lookup table for directory contacts.
-- This matches the 14 departments from the Sunbelt directory.
--
-- Created: January 14, 2026
-- ============================================================================

-- ============================================================================
-- INSERT DEPARTMENTS (14 total)
-- ============================================================================
INSERT INTO departments (code, name, description, sort_order) VALUES
  ('EXECUTIVE', 'Executive', 'CEO, CFO, CRO, VP, President', 1),
  ('ACCOUNTING', 'Accounting', 'Controller, Accounting Manager, AP, Staff Accountant', 2),
  ('HR', 'Human Resources', 'HR Manager, Payroll, Benefits', 3),
  ('MARKETING', 'Marketing', 'Marketing Director, Coordinator', 4),
  ('SALES', 'Sales', 'Sales Manager, Estimator, Business Development', 5),
  ('OPERATIONS', 'Operations', 'VP Operations, Plant General Manager, Project Manager, Project Coordinator', 6),
  ('PRODUCTION', 'Production', 'Production Manager, Supervisor, Foreman', 7),
  ('PURCHASING', 'Purchasing', 'Purchasing Manager, Purchasing Agent, Material Control', 8),
  ('ENGINEERING', 'Engineering', 'Engineer, Director of Engineering', 9),
  ('DRAFTING', 'Drafting', 'Drafting Manager, Drafter, Designer', 10),
  ('QUALITY', 'Quality', 'QA Manager, QC Inspector', 11),
  ('SAFETY', 'Safety', 'Safety Coordinator, Safety Manager', 12),
  ('IT', 'Information Technology', 'IT Manager, Programmer, Network Admin', 13),
  ('SERVICE', 'Service & Warranty', 'Service Manager, Service Technician, Warranty', 14)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Departments created (14 total):' AS status;
SELECT code, name FROM departments ORDER BY sort_order;
