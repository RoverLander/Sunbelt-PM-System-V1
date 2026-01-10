-- ============================================================================
-- Add missing 'answer' and 'date_answered' columns to rfis table
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add 'answer' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rfis' AND column_name = 'answer'
    ) THEN
        ALTER TABLE rfis ADD COLUMN answer TEXT;
        RAISE NOTICE 'Added answer column to rfis table';
    ELSE
        RAISE NOTICE 'answer column already exists in rfis table';
    END IF;
END $$;

-- Add 'date_answered' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rfis' AND column_name = 'date_answered'
    ) THEN
        ALTER TABLE rfis ADD COLUMN date_answered DATE;
        RAISE NOTICE 'Added date_answered column to rfis table';
    ELSE
        RAISE NOTICE 'date_answered column already exists in rfis table';
    END IF;
END $$;

-- Verify the columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rfis'
ORDER BY ordinal_position;
