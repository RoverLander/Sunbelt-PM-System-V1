-- ============================================================================
-- FIX_QUEUE_DATA.sql
-- Quick fix to populate realistic queue_position data for existing modules
-- Run this after FIX_ALL_DEMO_ISSUES.sql if queue shows 0
-- ============================================================================

-- First, let's see what we have
SELECT 'Current module status distribution:' AS info;
SELECT status, COUNT(*) as count
FROM modules
WHERE factory_id = (SELECT id FROM factories WHERE code = 'NWBS')
GROUP BY status;

SELECT 'Current project status distribution:' AS info;
SELECT status, COUNT(*) as count
FROM projects
WHERE factory = 'NWBS'
GROUP BY status;

-- Update some existing modules to have realistic queue positions
-- This simulates a working factory with modules distributed across stations

DO $$
DECLARE
  v_factory_id UUID;
  v_station_ids UUID[];
  v_module RECORD;
  v_station_idx INTEGER;
  v_queue_counters INTEGER[] := ARRAY[0,0,0,0,0,0,0,0,0,0,0,0];
  v_counter INTEGER := 0;
BEGIN
  SELECT id INTO v_factory_id FROM factories WHERE code = 'NWBS' LIMIT 1;
  IF v_factory_id IS NULL THEN
    RAISE NOTICE 'NWBS factory not found';
    RETURN;
  END IF;

  -- Get station IDs in order
  SELECT ARRAY_AGG(id ORDER BY order_num) INTO v_station_ids
  FROM (
    SELECT id, order_num
    FROM station_templates
    WHERE (factory_id IS NULL OR factory_id = v_factory_id)
    AND is_active = true
    ORDER BY order_num
    LIMIT 12
  ) ordered_stations;

  IF array_length(v_station_ids, 1) IS NULL OR array_length(v_station_ids, 1) < 10 THEN
    RAISE NOTICE 'Not enough stations found: %', array_length(v_station_ids, 1);
    RETURN;
  END IF;

  RAISE NOTICE 'Found % stations', array_length(v_station_ids, 1);

  -- Reset all modules to a clean state first
  UPDATE modules
  SET queue_position = NULL,
      station_entered_at = NULL,
      status = 'Not Started',
      current_station_id = NULL
  WHERE factory_id = v_factory_id;

  -- Now distribute modules realistically across stations
  -- Take first 18 modules and put them in production
  FOR v_module IN
    SELECT id, serial_number
    FROM modules
    WHERE factory_id = v_factory_id
    ORDER BY created_at
    LIMIT 18
  LOOP
    v_counter := v_counter + 1;

    -- Distribute across stations 2-10 (skip Frame shop which is batched)
    -- More modules at bottleneck stations (5-8)
    IF v_counter <= 2 THEN
      v_station_idx := 10;  -- Final Inspection
    ELSIF v_counter <= 4 THEN
      v_station_idx := 9;   -- Interior Finish
    ELSIF v_counter <= 8 THEN
      -- Bottleneck stations (Electrical, Plumbing, HVAC, In-Wall)
      v_station_idx := 5 + ((v_counter - 5) % 4);
    ELSIF v_counter <= 12 THEN
      -- Early production stations
      v_station_idx := 2 + ((v_counter - 9) % 3);
    ELSE
      -- Remaining at various stations
      v_station_idx := 2 + ((v_counter - 1) % 8);
    END IF;

    -- Increment queue counter for this station
    v_queue_counters[v_station_idx] := v_queue_counters[v_station_idx] + 1;

    -- Update the module
    UPDATE modules
    SET current_station_id = v_station_ids[v_station_idx],
        queue_position = v_queue_counters[v_station_idx] - 1,
        status = CASE
          WHEN v_queue_counters[v_station_idx] = 1 THEN 'In Progress'
          ELSE 'In Queue'
        END,
        station_entered_at = NOW() - (RANDOM() * INTERVAL '3 days')
    WHERE id = v_module.id;

    RAISE NOTICE 'Module % -> Station % (queue pos %)',
      v_module.serial_number, v_station_idx, v_queue_counters[v_station_idx] - 1;
  END LOOP;

  -- Mark a few modules as completed/staged
  UPDATE modules
  SET status = 'Completed',
      queue_position = NULL,
      current_station_id = NULL
  WHERE factory_id = v_factory_id
  AND id IN (
    SELECT id FROM modules
    WHERE factory_id = v_factory_id
    ORDER BY created_at
    OFFSET 18 LIMIT 3
  );

  UPDATE modules
  SET status = 'Staged',
      queue_position = NULL,
      current_station_id = v_station_ids[11]  -- Staging yard
  WHERE factory_id = v_factory_id
  AND id IN (
    SELECT id FROM modules
    WHERE factory_id = v_factory_id
    ORDER BY created_at
    OFFSET 21 LIMIT 2
  );

  RAISE NOTICE 'Queue distribution complete';
END $$;

-- Verify the results
SELECT 'After fix - Module status distribution:' AS info;
SELECT status, COUNT(*) as count
FROM modules
WHERE factory_id = (SELECT id FROM factories WHERE code = 'NWBS')
GROUP BY status
ORDER BY
  CASE status
    WHEN 'In Progress' THEN 1
    WHEN 'In Queue' THEN 2
    WHEN 'Staged' THEN 3
    WHEN 'Completed' THEN 4
    ELSE 5
  END;

SELECT 'Modules per station:' AS info;
SELECT
  st.name as station,
  st.order_num,
  COUNT(m.id) as total_modules,
  COUNT(CASE WHEN m.queue_position = 0 THEN 1 END) as active,
  COUNT(CASE WHEN m.queue_position > 0 THEN 1 END) as queued
FROM station_templates st
LEFT JOIN modules m ON m.current_station_id = st.id
WHERE st.factory_id IS NULL OR st.factory_id = (SELECT id FROM factories WHERE code = 'NWBS')
GROUP BY st.id, st.name, st.order_num
ORDER BY st.order_num;

SELECT 'FIX_QUEUE_DATA.sql COMPLETE' AS status;
