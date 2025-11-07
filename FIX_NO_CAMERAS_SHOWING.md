# 🔧 Fix: No Cameras Showing in Upload Dropdown

## **Quick Fixes:**

### **Option 1: Assign Zones to Your Profile (Recommended)**

If you have assigned zones but no cameras show, make sure cameras exist in those zones:

1. Go to **Supabase Dashboard** → **Table Editor** → `cameras`
2. Check which zones have cameras (look at the `zone` column)
3. Make sure your profile's `assigned_zones` matches those zones

**Assign zones to your profile:**
```sql
-- Get your user ID first
SELECT id, email FROM auth.users;

-- Then assign zones (replace 'your-user-id' with your actual user ID)
UPDATE public.profiles 
SET assigned_zones = ARRAY['Zone A', 'Zone B']
WHERE id = 'your-user-id';
```

---

### **Option 2: Make Yourself Admin (See All Cameras)**

If you want to see all cameras regardless of zones:

```sql
-- Make yourself admin (empty array = sees all)
UPDATE public.profiles 
SET assigned_zones = ARRAY[]::TEXT[]
WHERE id = 'your-user-id';
```

---

### **Option 3: Check if Cameras Exist**

1. Go to **Supabase Dashboard** → **Table Editor** → `cameras`
2. Check if cameras exist and their `zone` values
3. If no cameras exist, create some:

```sql
INSERT INTO public.cameras (name, location, zone, status) VALUES
  ('Camera 1', 'Main Entrance', 'Zone A', 'active'),
  ('Camera 2', 'Construction Floor', 'Zone B', 'active'),
  ('Camera 3', 'Storage Area', 'Zone C', 'active');
```

---

### **Option 4: Temporarily Disable RLS for Cameras (Testing Only)**

If you need to test without zone restrictions:

```sql
ALTER TABLE cameras DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning:** This allows all users to see all cameras. Only use for testing!

---

## **Check Browser Console**

1. Open browser console (F12)
2. Look for:
   - `Fetched cameras: X` - Shows how many cameras were found
   - Any error messages
3. Share the console output if cameras still don't show

---

## **Most Common Issues:**

1. **No assigned zones** → RLS blocks all cameras
   - **Fix:** Assign zones or make admin (empty array)

2. **Assigned zones don't match camera zones** → No cameras match
   - **Fix:** Make sure zone names match exactly (case-sensitive)

3. **No cameras in database** → Nothing to show
   - **Fix:** Create cameras in Supabase

4. **RLS policy too restrictive** → Policy blocking access
   - **Fix:** Check RLS policies or temporarily disable for testing

---

## **Quick Test:**

Run this SQL to check your setup:

```sql
-- Check your assigned zones
SELECT id, assigned_zones FROM profiles WHERE id = auth.uid();

-- Check available cameras
SELECT id, name, location, zone FROM cameras WHERE status = 'active';

-- Check if any cameras match your zones
SELECT c.* 
FROM cameras c
JOIN profiles p ON c.zone = ANY(p.assigned_zones)
WHERE p.id = auth.uid()
AND c.status = 'active';
```

If the last query returns no rows, that's why no cameras show!

---

**The updated component now shows helpful error messages. Check the browser console for details!** 🔍

