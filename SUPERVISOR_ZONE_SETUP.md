# 🎯 Supervisor Zone-Based Dashboard Setup

## **Overview**

Each supervisor now has their own isolated dashboard showing only detections from their assigned zones. When Supervisor A logs in, they won't see violations from Supervisor B's zones.

---

## **Step 1: Run Database Migration**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and run the migration from: `supabase/migrations/20251107000000_add_supervisor_zones.sql`

This will:
- Add `assigned_zones` column to `profiles` table
- Update RLS policies to filter detections by supervisor's zones
- Create indexes for better performance

---

## **Step 2: Assign Zones to Supervisors**

### **Option A: Via Supabase Dashboard**

1. Go to **Table Editor** → `profiles`
2. Find the supervisor's profile
3. Edit the `assigned_zones` column
4. Enter zones as a JSON array: `["Zone A", "Zone B"]`
   - Example: `["Zone A"]` for one zone
   - Example: `["Zone A", "Zone B"]` for multiple zones
   - Example: `[]` or leave empty for admin (sees all zones)

### **Option B: Via SQL**

```sql
-- Assign Zone A to a supervisor
UPDATE public.profiles 
SET assigned_zones = ARRAY['Zone A']
WHERE id = 'supervisor-user-id-here';

-- Assign multiple zones
UPDATE public.profiles 
SET assigned_zones = ARRAY['Zone A', 'Zone B']
WHERE id = 'supervisor-user-id-here';

-- Make admin (see all zones) - leave empty array
UPDATE public.profiles 
SET assigned_zones = ARRAY[]::TEXT[]
WHERE id = 'admin-user-id-here';
```

---

## **Step 3: Verify Zone Names Match**

Make sure camera zones match the zones assigned to supervisors:

1. Go to **Table Editor** → `cameras`
2. Check the `zone` column values (e.g., "Zone A", "Zone B", "Zone C")
3. Make sure supervisor `assigned_zones` use the same zone names

---

## **How It Works**

### **Database Level (RLS)**
- RLS policies automatically filter detections based on supervisor's `assigned_zones`
- Supervisors can only see detections from cameras in their assigned zones
- If `assigned_zones` is empty, supervisor sees all zones (admin mode)

### **Frontend Level**
- Dashboard queries are automatically filtered by RLS
- Real-time updates only show detections from assigned zones
- Alerts only trigger for violations in supervisor's zones

---

## **Example Setup**

### **Supervisor A (Zone A only)**
```sql
UPDATE profiles SET assigned_zones = ARRAY['Zone A'] WHERE id = 'user-id-a';
```
- Sees: Detections from cameras in Zone A only
- Doesn't see: Detections from Zone B, Zone C, etc.

### **Supervisor B (Zone B only)**
```sql
UPDATE profiles SET assigned_zones = ARRAY['Zone B'] WHERE id = 'user-id-b';
```
- Sees: Detections from cameras in Zone B only
- Doesn't see: Detections from Zone A, Zone C, etc.

### **Admin (All Zones)**
```sql
UPDATE profiles SET assigned_zones = ARRAY[]::TEXT[] WHERE id = 'admin-id';
```
- Sees: All detections from all zones

---

## **Testing**

1. **Assign zones to test supervisors:**
   ```sql
   -- Get user IDs first
   SELECT id, email FROM auth.users;
   
   -- Assign zones
   UPDATE profiles SET assigned_zones = ARRAY['Zone A'] WHERE id = 'user-id-1';
   UPDATE profiles SET assigned_zones = ARRAY['Zone B'] WHERE id = 'user-id-2';
   ```

2. **Login as Supervisor 1:**
   - Should only see detections from Zone A

3. **Login as Supervisor 2:**
   - Should only see detections from Zone B

4. **Verify isolation:**
   - Create a detection in Zone A
   - Supervisor 1 should see it
   - Supervisor 2 should NOT see it

---

## **Troubleshooting**

### **Supervisor sees all detections (not filtered)**

**Fix:** Check RLS policies are enabled:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Re-enable if needed
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
```

### **Supervisor sees no detections**

**Fix:** Check assigned zones:
```sql
-- Check supervisor's assigned zones
SELECT id, assigned_zones FROM profiles WHERE id = 'user-id';

-- Check camera zones
SELECT id, name, zone FROM cameras;
```

Make sure zone names match exactly (case-sensitive).

### **RLS policy error**

**Fix:** Re-run the migration SQL to recreate policies.

---

## **Security Notes**

- ✅ RLS policies enforce zone filtering at database level
- ✅ Supervisors cannot bypass filters (even with direct API calls)
- ✅ Empty `assigned_zones` = admin (sees all) - use carefully
- ✅ Zone names are case-sensitive - use consistent naming

---

**Your dashboard is now multi-tenant! Each supervisor only sees their assigned zones.** 🎯

