-- ============================================================================
-- Add geocoding fields to projects table
-- ============================================================================

-- Add delivery location coordinates
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;

-- Add index for map queries
CREATE INDEX IF NOT EXISTS idx_projects_delivery_coords 
ON projects (delivery_lat, delivery_lng) 
WHERE delivery_lat IS NOT NULL AND delivery_lng IS NOT NULL;

-- Add comment
COMMENT ON COLUMN projects.delivery_lat IS 'Geocoded latitude of delivery location';
COMMENT ON COLUMN projects.delivery_lng IS 'Geocoded longitude of delivery location';
COMMENT ON COLUMN projects.geocoded_at IS 'Timestamp when location was geocoded';
