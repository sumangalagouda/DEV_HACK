-- Add assigned_zones column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN assigned_zones TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index for faster zone filtering
CREATE INDEX idx_profiles_assigned_zones ON public.profiles USING GIN (assigned_zones);

-- Update RLS policy for detections to filter by supervisor's assigned zones
DROP POLICY IF EXISTS "Authenticated users can view detections" ON public.detections;

CREATE POLICY "Supervisors can view detections from their assigned zones"
  ON public.detections FOR SELECT
  TO authenticated
  USING (
    -- Check if user has no assigned zones (admin - sees all)
    NOT EXISTS (
      SELECT 1 
      FROM public.profiles p
      WHERE p.id = auth.uid()
      AND array_length(p.assigned_zones, 1) > 0
    )
    OR
    -- Check if detection's camera zone is in supervisor's assigned zones
    EXISTS (
      SELECT 1 
      FROM public.profiles p
      JOIN public.cameras c ON c.id = detections.camera_id
      WHERE p.id = auth.uid()
      AND c.zone = ANY(p.assigned_zones)
    )
  );

-- Update cameras policy to show only assigned zones
DROP POLICY IF EXISTS "Authenticated users can view cameras" ON public.cameras;

CREATE POLICY "Supervisors can view cameras in their assigned zones"
  ON public.cameras FOR SELECT
  TO authenticated
  USING (
    -- Check if camera zone is in user's assigned zones
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND zone = ANY(assigned_zones)
    )
    OR
    -- Allow if user has no assigned zones (admin/fallback)
    NOT EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND array_length(assigned_zones, 1) > 0
    )
  );

-- Add comment explaining the structure
COMMENT ON COLUMN public.profiles.assigned_zones IS 'Array of zone names (e.g., ["Zone A", "Zone B"]) that this supervisor is responsible for monitoring';

