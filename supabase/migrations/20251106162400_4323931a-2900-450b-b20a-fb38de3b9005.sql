-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'supervisor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create cameras table for CCTV locations
CREATE TABLE public.cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  zone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on cameras
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;

-- Cameras policies (all authenticated users can view)
CREATE POLICY "Authenticated users can view cameras"
  ON public.cameras FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cameras"
  ON public.cameras FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create detections table for violation records
CREATE TABLE public.detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  confidence DECIMAL(5,2),
  image_url TEXT,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'new',
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on detections
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;

-- Detections policies
CREATE POLICY "Authenticated users can view detections"
  ON public.detections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert detections"
  ON public.detections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update detections"
  ON public.detections FOR UPDATE
  TO authenticated
  USING (true);

-- Create storage bucket for detection images
INSERT INTO storage.buckets (id, name, public)
VALUES ('detection-images', 'detection-images', true);

-- Storage policies for detection images
CREATE POLICY "Public can view detection images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'detection-images');

CREATE POLICY "Authenticated users can upload detection images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'detection-images');

-- Enable realtime for detections table
ALTER PUBLICATION supabase_realtime ADD TABLE public.detections;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User')
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample cameras
INSERT INTO public.cameras (name, location, zone) VALUES
  ('Camera 1', 'Main Entrance', 'Zone A'),
  ('Camera 2', 'Construction Floor 1', 'Zone B'),
  ('Camera 3', 'Equipment Storage', 'Zone C');