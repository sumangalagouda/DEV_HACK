# 🔧 Quick Fix: Detections Not Saving to Supabase

## **Most Common Issue: RLS (Row Level Security) Policies**

If detections are detected but not saving, it's usually because Supabase RLS policies are blocking the insert.

---

## **Quick Fix (2 minutes):**

### **Step 1: Disable RLS Temporarily (For Testing)**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this SQL:

```sql
-- Temporarily disable RLS for testing
ALTER TABLE detections DISABLE ROW LEVEL SECURITY;
ALTER TABLE cameras DISABLE ROW LEVEL SECURITY;
```

3. **Test again** - Run your Python script
4. Detections should now save!

---

### **Step 2: Create Proper RLS Policies (For Production)**

After testing works, create proper policies:

1. Go to **Supabase Dashboard** → **Authentication** → **Policies**
2. Select **`detections`** table
3. Click **"New Policy"**
4. Create these policies:

**Policy 1: Allow INSERT for all**
- Policy name: `Allow insert for all`
- Allowed operation: `INSERT`
- Policy definition: `true` (allow all)

**Policy 2: Allow SELECT for all**
- Policy name: `Allow select for all`
- Allowed operation: `SELECT`
- Policy definition: `true` (allow all)

5. Do the same for **`cameras`** table

---

## **Alternative: Use Service Role Key (Not Recommended for Production)**

If RLS is too complex, you can use service_role key (but keep it secret!):

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Copy **service_role key** (NOT anon key - this is secret!)
3. Update Python script:
   ```python
   SUPABASE_ANON_KEY = 'your_service_role_key_here'  # ⚠️ Keep this secret!
   ```

**⚠️ Warning:** Service role key bypasses all security. Only use for testing!

---

## **Test After Fix:**

1. Run Python script: `python real_time_monitor.py`
2. At startup, you should see:
   ```
   ✅ Can read from Supabase
   ✅ Can insert to Supabase
   ```
3. When violation detected:
   ```
   ✅ Detection inserted to database! ID: xxxxx
   ```
4. Check Supabase Dashboard → Table Editor → `detections`
   - Should see new rows!

---

## **Still Not Working?**

Run the script and **copy the exact error message** you see:
- Look for lines starting with `❌`
- Look for "row-level security" or "permission denied"
- Share that error and I'll help fix it!

