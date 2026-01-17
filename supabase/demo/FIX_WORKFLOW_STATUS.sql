-- ============================================================================
-- FIX_WORKFLOW_STATUS.sql
-- Creates realistic workflow status data for demo projects
-- Run this in Supabase SQL Editor after FIX_PM_ASSIGNMENTS.sql
-- ============================================================================

-- Clear existing workflow status for demo projects
DELETE FROM project_workflow_status
WHERE project_id IN (SELECT id FROM projects WHERE project_number LIKE '%26-%');

-- ============================================================================
-- WORKFLOW RULES:
-- Phase 1: Sales Handoff -> Kickoff
-- Phase 2: 20% -> 65% -> [Color, Long Lead, Cutsheets parallel] -> 95% -> 100%
-- Phase 3: Engineering -> Third Party -> State Approval -> Production Release
-- Phase 4: Production -> QC Inspection -> Staging -> Delivery -> Set Complete -> Closeout
--
-- Prerequisites for Production Release:
-- - Long Lead Items: Customer approved
-- - Color Selections: Customer approved
-- - 100% Drawings: Complete
-- - Engineering Review: Approved
-- - Third Party Review: Stamped
-- - State Approval: Approved
-- - All Change Orders: Signed with PO
-- ============================================================================

DO $$
DECLARE
  v_project RECORD;
  v_base_date DATE;
BEGIN
  -- ============================================================================
  -- PHASE 4 PROJECTS (Production & Closeout) - Should be 85-95% complete
  -- These have completed Phase 1-3 and are in production
  -- ============================================================================

  -- NWBS-26-001: Boise School District (Phase 4, On Track) - 90% complete
  -- Production well underway, near QC inspection
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'NWBS-26-001' LOOP
    v_base_date := CURRENT_DATE - 120; -- Started 120 days ago

    -- Phase 1: Complete
    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, 'Smooth handoff from sales'),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, 'Dealer kickoff meeting held');

    -- Phase 2: Complete (parallel stations ran concurrently after 65%)
    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 15, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 16, v_base_date + 35, NULL),
      (v_project.id, 'color_selections', 'complete', v_base_date + 36, v_base_date + 50, 'Customer approved all colors'),
      (v_project.id, 'long_lead_items', 'complete', v_base_date + 36, v_base_date + 48, 'HVAC and electrical panels ordered'),
      (v_project.id, 'cutsheets', 'complete', v_base_date + 36, v_base_date + 45, 'All submittals approved'),
      (v_project.id, 'drawings_95', 'complete', v_base_date + 51, v_base_date + 60, NULL),
      (v_project.id, 'drawings_100', 'complete', v_base_date + 61, v_base_date + 68, 'Final drawings issued for construction');

    -- Phase 3: Complete
    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'engineering', 'complete', v_base_date + 69, v_base_date + 78, 'Engineering approved with minor comments'),
      (v_project.id, 'third_party', 'complete', v_base_date + 79, v_base_date + 90, 'Plans stamped by third party'),
      (v_project.id, 'state_approval', 'complete', v_base_date + 91, v_base_date + 105, 'Idaho state approved'),
      (v_project.id, 'production_release', 'complete', v_base_date + 106, v_base_date + 107, 'Released to NWBS production');

    -- Phase 4: In Progress (Production started, near QC)
    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'production', 'in_progress', v_base_date + 108, NULL, '6 of 8 modules complete'),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- NWBS-26-002: Idaho State University (Phase 4, At Risk) - 80% complete
  -- Production started but behind schedule
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'NWBS-26-002' LOOP
    v_base_date := CURRENT_DATE - 90;

    -- Phase 1: Complete
    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL);

    -- Phase 2: Complete (but long lead items took extra time)
    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 14, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 15, v_base_date + 32, NULL),
      (v_project.id, 'color_selections', 'complete', v_base_date + 33, v_base_date + 42, NULL),
      (v_project.id, 'long_lead_items', 'complete', v_base_date + 33, v_base_date + 55, 'Lab equipment delayed 2 weeks'),
      (v_project.id, 'cutsheets', 'complete', v_base_date + 33, v_base_date + 48, NULL),
      (v_project.id, 'drawings_95', 'complete', v_base_date + 49, v_base_date + 58, NULL),
      (v_project.id, 'drawings_100', 'complete', v_base_date + 59, v_base_date + 65, NULL);

    -- Phase 3: Complete
    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'engineering', 'complete', v_base_date + 66, v_base_date + 75, NULL),
      (v_project.id, 'third_party', 'complete', v_base_date + 76, v_base_date + 82, NULL),
      (v_project.id, 'state_approval', 'complete', v_base_date + 83, v_base_date + 88, NULL),
      (v_project.id, 'production_release', 'complete', v_base_date + 89, v_base_date + 90, NULL);

    -- Phase 4: In Progress (Behind on production)
    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'production', 'in_progress', v_base_date + 91, NULL, '4 of 10 modules complete - BEHIND SCHEDULE'),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- PMI-26-001: Phoenix VA (Phase 4, On Track) - 85% complete
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'PMI-26-001' LOOP
    v_base_date := CURRENT_DATE - 150;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 3, 'Federal VA project'),
      (v_project.id, 'kickoff', 'complete', v_base_date + 4, v_base_date + 7, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 8, v_base_date + 20, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 21, v_base_date + 45, NULL),
      (v_project.id, 'color_selections', 'complete', v_base_date + 46, v_base_date + 60, 'VA standard colors'),
      (v_project.id, 'long_lead_items', 'complete', v_base_date + 46, v_base_date + 70, 'Medical equipment ordered'),
      (v_project.id, 'cutsheets', 'complete', v_base_date + 46, v_base_date + 65, NULL),
      (v_project.id, 'drawings_95', 'complete', v_base_date + 66, v_base_date + 80, NULL),
      (v_project.id, 'drawings_100', 'complete', v_base_date + 81, v_base_date + 90, NULL),
      (v_project.id, 'engineering', 'complete', v_base_date + 91, v_base_date + 105, NULL),
      (v_project.id, 'third_party', 'complete', v_base_date + 106, v_base_date + 115, NULL),
      (v_project.id, 'state_approval', 'complete', v_base_date + 116, v_base_date + 130, 'Arizona approved'),
      (v_project.id, 'production_release', 'complete', v_base_date + 131, v_base_date + 132, NULL),
      (v_project.id, 'production', 'in_progress', v_base_date + 133, NULL, '8 of 12 modules complete'),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- WMEV-26-001: Seattle Fire Station (Phase 4, On Track)
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'WMEV-26-001' LOOP
    v_base_date := CURRENT_DATE - 110;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 15, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 16, v_base_date + 35, NULL),
      (v_project.id, 'color_selections', 'complete', v_base_date + 36, v_base_date + 45, NULL),
      (v_project.id, 'long_lead_items', 'complete', v_base_date + 36, v_base_date + 50, 'Fire equipment ordered'),
      (v_project.id, 'cutsheets', 'complete', v_base_date + 36, v_base_date + 48, NULL),
      (v_project.id, 'drawings_95', 'complete', v_base_date + 46, v_base_date + 55, NULL),
      (v_project.id, 'drawings_100', 'complete', v_base_date + 56, v_base_date + 62, NULL),
      (v_project.id, 'engineering', 'complete', v_base_date + 63, v_base_date + 72, NULL),
      (v_project.id, 'third_party', 'complete', v_base_date + 73, v_base_date + 82, NULL),
      (v_project.id, 'state_approval', 'complete', v_base_date + 83, v_base_date + 95, 'Washington approved'),
      (v_project.id, 'production_release', 'complete', v_base_date + 96, v_base_date + 97, NULL),
      (v_project.id, 'production', 'in_progress', v_base_date + 98, NULL, '5 of 8 modules complete'),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- WMEA-26-001: Charlotte Hospital (Phase 4, On Track)
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'WMEA-26-001' LOOP
    v_base_date := CURRENT_DATE - 140;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 3, 'Large medical project'),
      (v_project.id, 'kickoff', 'complete', v_base_date + 4, v_base_date + 7, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 8, v_base_date + 22, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 23, v_base_date + 50, NULL),
      (v_project.id, 'color_selections', 'complete', v_base_date + 51, v_base_date + 65, NULL),
      (v_project.id, 'long_lead_items', 'complete', v_base_date + 51, v_base_date + 80, 'Medical equipment lead time'),
      (v_project.id, 'cutsheets', 'complete', v_base_date + 51, v_base_date + 70, NULL),
      (v_project.id, 'drawings_95', 'complete', v_base_date + 71, v_base_date + 85, NULL),
      (v_project.id, 'drawings_100', 'complete', v_base_date + 86, v_base_date + 95, NULL),
      (v_project.id, 'engineering', 'complete', v_base_date + 96, v_base_date + 108, NULL),
      (v_project.id, 'third_party', 'complete', v_base_date + 109, v_base_date + 118, NULL),
      (v_project.id, 'state_approval', 'complete', v_base_date + 119, v_base_date + 130, 'NC approved'),
      (v_project.id, 'production_release', 'complete', v_base_date + 131, v_base_date + 132, NULL),
      (v_project.id, 'production', 'in_progress', v_base_date + 133, NULL, '10 of 14 modules complete'),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- WMSO-26-001: Houston Energy (Phase 4, On Track)
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'WMSO-26-001' LOOP
    v_base_date := CURRENT_DATE - 130;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 18, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 19, v_base_date + 40, NULL),
      (v_project.id, 'color_selections', 'complete', v_base_date + 41, v_base_date + 52, NULL),
      (v_project.id, 'long_lead_items', 'complete', v_base_date + 41, v_base_date + 60, NULL),
      (v_project.id, 'cutsheets', 'complete', v_base_date + 41, v_base_date + 55, NULL),
      (v_project.id, 'drawings_95', 'complete', v_base_date + 56, v_base_date + 68, NULL),
      (v_project.id, 'drawings_100', 'complete', v_base_date + 69, v_base_date + 78, NULL),
      (v_project.id, 'engineering', 'complete', v_base_date + 79, v_base_date + 90, NULL),
      (v_project.id, 'third_party', 'complete', v_base_date + 91, v_base_date + 100, NULL),
      (v_project.id, 'state_approval', 'complete', v_base_date + 101, v_base_date + 115, 'Texas approved'),
      (v_project.id, 'production_release', 'complete', v_base_date + 116, v_base_date + 117, NULL),
      (v_project.id, 'production', 'in_progress', v_base_date + 118, NULL, '9 of 12 modules complete'),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- AMT-26-001: Dallas ISD (Phase 4, On Track)
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'AMT-26-001' LOOP
    v_base_date := CURRENT_DATE - 120;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 15, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 16, v_base_date + 35, NULL),
      (v_project.id, 'color_selections', 'complete', v_base_date + 36, v_base_date + 45, NULL),
      (v_project.id, 'long_lead_items', 'complete', v_base_date + 36, v_base_date + 50, NULL),
      (v_project.id, 'cutsheets', 'complete', v_base_date + 36, v_base_date + 48, NULL),
      (v_project.id, 'drawings_95', 'complete', v_base_date + 49, v_base_date + 60, NULL),
      (v_project.id, 'drawings_100', 'complete', v_base_date + 61, v_base_date + 70, NULL),
      (v_project.id, 'engineering', 'complete', v_base_date + 71, v_base_date + 82, NULL),
      (v_project.id, 'third_party', 'complete', v_base_date + 83, v_base_date + 92, NULL),
      (v_project.id, 'state_approval', 'complete', v_base_date + 93, v_base_date + 105, 'Texas approved'),
      (v_project.id, 'production_release', 'complete', v_base_date + 106, v_base_date + 107, NULL),
      (v_project.id, 'production', 'in_progress', v_base_date + 108, NULL, '10 of 12 modules complete'),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- SMM-26-001: Mobile Port (Phase 4, On Track)
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'SMM-26-001' LOOP
    v_base_date := CURRENT_DATE - 100;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 14, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 15, v_base_date + 30, NULL),
      (v_project.id, 'color_selections', 'complete', v_base_date + 31, v_base_date + 40, NULL),
      (v_project.id, 'long_lead_items', 'complete', v_base_date + 31, v_base_date + 45, NULL),
      (v_project.id, 'cutsheets', 'complete', v_base_date + 31, v_base_date + 42, NULL),
      (v_project.id, 'drawings_95', 'complete', v_base_date + 43, v_base_date + 52, NULL),
      (v_project.id, 'drawings_100', 'complete', v_base_date + 53, v_base_date + 60, NULL),
      (v_project.id, 'engineering', 'complete', v_base_date + 61, v_base_date + 70, NULL),
      (v_project.id, 'third_party', 'complete', v_base_date + 71, v_base_date + 78, NULL),
      (v_project.id, 'state_approval', 'complete', v_base_date + 79, v_base_date + 88, 'Alabama approved'),
      (v_project.id, 'production_release', 'complete', v_base_date + 89, v_base_date + 90, NULL),
      (v_project.id, 'production', 'in_progress', v_base_date + 91, NULL, '4 of 6 modules complete'),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- ============================================================================
  -- PHASE 3 PROJECTS (Approvals) - Should be 55-75% complete
  -- ============================================================================

  -- NWBS-26-003: Boeing (Phase 3, On Track) - In engineering review
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'NWBS-26-003' LOOP
    v_base_date := CURRENT_DATE - 60;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 15, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 16, v_base_date + 32, NULL),
      (v_project.id, 'color_selections', 'complete', v_base_date + 33, v_base_date + 42, NULL),
      (v_project.id, 'long_lead_items', 'complete', v_base_date + 33, v_base_date + 48, NULL),
      (v_project.id, 'cutsheets', 'complete', v_base_date + 33, v_base_date + 45, NULL),
      (v_project.id, 'drawings_95', 'complete', v_base_date + 46, v_base_date + 54, NULL),
      (v_project.id, 'drawings_100', 'complete', v_base_date + 55, v_base_date + 60, NULL),
      (v_project.id, 'engineering', 'in_progress', v_base_date + 61, NULL, 'Minor comments being addressed'),
      (v_project.id, 'third_party', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'state_approval', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production_release', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- PMI-26-002: Scottsdale School (Phase 3, At Risk) - Stuck at state approval
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'PMI-26-002' LOOP
    v_base_date := CURRENT_DATE - 80;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 14, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 15, v_base_date + 35, NULL),
      (v_project.id, 'color_selections', 'complete', v_base_date + 36, v_base_date + 48, NULL),
      (v_project.id, 'long_lead_items', 'complete', v_base_date + 36, v_base_date + 52, NULL),
      (v_project.id, 'cutsheets', 'complete', v_base_date + 36, v_base_date + 50, NULL),
      (v_project.id, 'drawings_95', 'complete', v_base_date + 51, v_base_date + 60, NULL),
      (v_project.id, 'drawings_100', 'complete', v_base_date + 61, v_base_date + 68, NULL),
      (v_project.id, 'engineering', 'complete', v_base_date + 69, v_base_date + 78, NULL),
      (v_project.id, 'third_party', 'complete', v_base_date + 79, v_base_date + 88, 'Plans stamped'),
      (v_project.id, 'state_approval', 'in_progress', v_base_date + 89, NULL, 'DELAYED - State requested additional info'),
      (v_project.id, 'production_release', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- WMEV-26-002: Tacoma Port (Phase 3, On Track) - At third party review
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'WMEV-26-002' LOOP
    v_base_date := CURRENT_DATE - 70;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 15, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 16, v_base_date + 35, NULL),
      (v_project.id, 'color_selections', 'complete', v_base_date + 36, v_base_date + 45, NULL),
      (v_project.id, 'long_lead_items', 'complete', v_base_date + 36, v_base_date + 50, NULL),
      (v_project.id, 'cutsheets', 'complete', v_base_date + 36, v_base_date + 48, NULL),
      (v_project.id, 'drawings_95', 'complete', v_base_date + 49, v_base_date + 58, NULL),
      (v_project.id, 'drawings_100', 'complete', v_base_date + 59, v_base_date + 65, NULL),
      (v_project.id, 'engineering', 'complete', v_base_date + 66, v_base_date + 75, NULL),
      (v_project.id, 'third_party', 'in_progress', v_base_date + 76, NULL, 'Under review - expected 5 more days'),
      (v_project.id, 'state_approval', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production_release', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- WMSO-26-002: San Antonio Military (Phase 3, At Risk) - Complex project
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'WMSO-26-002' LOOP
    v_base_date := CURRENT_DATE - 90;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 3, 'Large military housing'),
      (v_project.id, 'kickoff', 'complete', v_base_date + 4, v_base_date + 8, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 9, v_base_date + 22, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 23, v_base_date + 48, 'Complex military specs'),
      (v_project.id, 'color_selections', 'complete', v_base_date + 49, v_base_date + 58, NULL),
      (v_project.id, 'long_lead_items', 'in_progress', v_base_date + 49, NULL, 'DELAYED - Security equipment backordered'),
      (v_project.id, 'cutsheets', 'complete', v_base_date + 49, v_base_date + 65, NULL),
      (v_project.id, 'drawings_95', 'complete', v_base_date + 66, v_base_date + 78, NULL),
      (v_project.id, 'drawings_100', 'complete', v_base_date + 79, v_base_date + 88, NULL),
      (v_project.id, 'engineering', 'in_progress', v_base_date + 89, NULL, 'Awaiting long lead resolution'),
      (v_project.id, 'third_party', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'state_approval', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production_release', 'not_started', NULL, NULL, 'BLOCKED - Waiting on long lead items'),
      (v_project.id, 'production', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- AMT-26-002: Fort Worth Convention (Phase 3, On Track)
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'AMT-26-002' LOOP
    v_base_date := CURRENT_DATE - 50;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 14, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 15, v_base_date + 32, NULL),
      (v_project.id, 'color_selections', 'complete', v_base_date + 33, v_base_date + 42, NULL),
      (v_project.id, 'long_lead_items', 'complete', v_base_date + 33, v_base_date + 45, NULL),
      (v_project.id, 'cutsheets', 'complete', v_base_date + 33, v_base_date + 43, NULL),
      (v_project.id, 'drawings_95', 'complete', v_base_date + 44, v_base_date + 52, NULL),
      (v_project.id, 'drawings_100', 'in_progress', v_base_date + 53, NULL, 'Final revisions in progress'),
      (v_project.id, 'engineering', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'third_party', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'state_approval', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production_release', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- ============================================================================
  -- PHASE 2 PROJECTS (Preconstruction) - Should be 25-50% complete
  -- ============================================================================

  -- NWBS-26-004: Nampa Medical (Phase 2, On Track) - At 65% drawings
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'NWBS-26-004' LOOP
    v_base_date := CURRENT_DATE - 30;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 14, NULL),
      (v_project.id, 'drawings_65', 'in_progress', v_base_date + 15, NULL, 'On track for completion'),
      (v_project.id, 'color_selections', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'long_lead_items', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'cutsheets', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'drawings_95', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'drawings_100', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'engineering', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'third_party', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'state_approval', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production_release', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- PMI-26-003: Tempe Tech (Phase 2, On Track) - Parallel work started
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'PMI-26-003' LOOP
    v_base_date := CURRENT_DATE - 40;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 15, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 16, v_base_date + 32, NULL),
      (v_project.id, 'color_selections', 'in_progress', v_base_date + 33, NULL, 'Waiting on customer selections'),
      (v_project.id, 'long_lead_items', 'in_progress', v_base_date + 33, NULL, 'HVAC specs being finalized'),
      (v_project.id, 'cutsheets', 'in_progress', v_base_date + 33, NULL, 'Submittals in progress'),
      (v_project.id, 'drawings_95', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'drawings_100', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'engineering', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'third_party', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'state_approval', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production_release', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- WMEV-26-003: Olympia State (Phase 2, Critical) - Customer delays
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'WMEV-26-003' LOOP
    v_base_date := CURRENT_DATE - 25;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 14, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 15, v_base_date + 28, NULL),
      (v_project.id, 'color_selections', 'in_progress', v_base_date + 29, NULL, 'CRITICAL - Awaiting customer decision for 2 weeks'),
      (v_project.id, 'long_lead_items', 'in_progress', v_base_date + 29, NULL, 'BLOCKED - Cannot order until colors confirmed'),
      (v_project.id, 'cutsheets', 'in_progress', v_base_date + 29, NULL, 'Partial submittals submitted'),
      (v_project.id, 'drawings_95', 'not_started', NULL, NULL, 'BLOCKED - Waiting on color/LL decisions'),
      (v_project.id, 'drawings_100', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'engineering', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'third_party', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'state_approval', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production_release', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- WMSO-26-003: Austin Startup (Phase 2, On Track)
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'WMSO-26-003' LOOP
    v_base_date := CURRENT_DATE - 20;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 14, NULL),
      (v_project.id, 'drawings_65', 'in_progress', v_base_date + 15, NULL, 'On schedule'),
      (v_project.id, 'color_selections', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'long_lead_items', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'cutsheets', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'drawings_95', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'drawings_100', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'engineering', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'third_party', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'state_approval', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production_release', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- SMM-26-002: Birmingham Medical (Phase 2, On Track)
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'SMM-26-002' LOOP
    v_base_date := CURRENT_DATE - 35;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'complete', v_base_date + 3, v_base_date + 5, NULL),
      (v_project.id, 'drawings_20', 'complete', v_base_date + 6, v_base_date + 15, NULL),
      (v_project.id, 'drawings_65', 'complete', v_base_date + 16, v_base_date + 32, NULL),
      (v_project.id, 'color_selections', 'in_progress', v_base_date + 33, NULL, 'Medical colors being selected'),
      (v_project.id, 'long_lead_items', 'in_progress', v_base_date + 33, NULL, 'Medical equipment quotes'),
      (v_project.id, 'cutsheets', 'in_progress', v_base_date + 33, NULL, NULL),
      (v_project.id, 'drawings_95', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'drawings_100', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'engineering', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'third_party', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'state_approval', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production_release', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  -- ============================================================================
  -- PHASE 1 PROJECTS (Initiation) - Should be 5-15% complete
  -- ============================================================================

  -- WMEA-26-003: Durham Tech (Phase 1, On Track) - Just kicked off
  FOR v_project IN SELECT id FROM projects WHERE project_number = 'WMEA-26-003' LOOP
    v_base_date := CURRENT_DATE - 5;

    INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, notes)
    VALUES
      (v_project.id, 'sales_handoff', 'complete', v_base_date, v_base_date + 2, NULL),
      (v_project.id, 'kickoff', 'in_progress', v_base_date + 3, NULL, 'Kickoff scheduled for this week'),
      (v_project.id, 'drawings_20', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'drawings_65', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'color_selections', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'long_lead_items', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'cutsheets', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'drawings_95', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'drawings_100', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'engineering', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'third_party', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'state_approval', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production_release', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'production', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'qc_inspection', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'staging', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'delivery', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'set_complete', 'not_started', NULL, NULL, NULL),
      (v_project.id, 'closeout', 'not_started', NULL, NULL, NULL);
  END LOOP;

  RAISE NOTICE 'Workflow status created for all demo projects';
  RAISE NOTICE 'Phase 4 projects: ~85-95%% complete (in production)';
  RAISE NOTICE 'Phase 3 projects: ~55-75%% complete (in approvals)';
  RAISE NOTICE 'Phase 2 projects: ~25-50%% complete (preconstruction)';
  RAISE NOTICE 'Phase 1 projects: ~5-15%% complete (initiation)';
END $$;

-- ============================================================================
-- VERIFICATION: Show workflow progress for all demo projects
-- ============================================================================

SELECT
  p.project_number,
  p.name,
  p.current_phase,
  p.health_status,
  COUNT(*) FILTER (WHERE pws.status = 'complete') as completed_stations,
  COUNT(*) FILTER (WHERE pws.status = 'in_progress') as in_progress_stations,
  COUNT(*) as total_stations,
  ROUND(COUNT(*) FILTER (WHERE pws.status = 'complete')::numeric / COUNT(*)::numeric * 100) as progress_pct
FROM projects p
LEFT JOIN project_workflow_status pws ON p.id = pws.project_id
WHERE p.project_number LIKE '%26-%'
GROUP BY p.id, p.project_number, p.name, p.current_phase, p.health_status
ORDER BY p.current_phase DESC, p.project_number;
