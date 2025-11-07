# 🔧 Fix: Detections Not Showing in Supabase/Dashboard

## **What I Fixed:**

1. ✅ **Improved error logging** - Now shows detailed error messages
2. ✅ **Auto-creates camera** - Creates camera in database if it doesn't exist
3. ✅ **Better image upload** - Properly uploads images to Supabase storage
4. ✅ **Direct database insert** - More reliable than Edge Function for now
5. ✅ **UUID handling** - Properly handles camera UUIDs

---

## **What to Check:**

### **1. Run the Python Script Again**

```bash
cd python-worker
python real_time_monitor.py
```

**Look for these messages:**
- `✅ Created camera: ...` - Camera was created successfully
- `📤 Inserting directly to database...` - Trying to insert
- `✅ Detection inserted to database! ID: ...` - **SUCCESS!**
- `❌ Database insert failed: ...` - **ERROR - see below**

---

### **2. Check Terminal Output**

When a violation is detected, you should see:

```
🚨 VIOLATION DETECTED (Frame X):
   Type: Missing Hard Hat (Confidence: 85.1%)
   Severity: high
📤 Inserting directly to database...
   URL: https://iscxriwdxxvzhcoguvyk.supabase.co/rest/v1/detections
   Data: Missing Hard Hat (Confidence: 85.1%) (severity: high)
✅ Detection inserted to database! ID: xxxxx
```

**If you see errors instead, copy the error message!**

---

### **3. Common Errors & Fixes**

#### **Error: "new row violates row-level security policy"**

**Fix:** Check Supabase RLS policies:
1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. Find `detections` table
3. Make sure there's a policy allowing INSERT for authenticated users
4. Or temporarily disable RLS for testing:
   ```sql
   ALTER TABLE detections DISABLE ROW LEVEL SECURITY;
   ```

#### **Error: "permission denied for table detections"**

**Fix:** Your anon key might not have permissions. Check:
1. Supabase Dashboard → **Settings** → **API**
2. Make sure you're using the **anon public key** (not service_role)
3. Check RLS policies allow inserts

#### **Error: "storage bucket not found"**

**Fix:** Create the storage bucket:
1. Go to Supabase Dashboard → **Storage**
2. Create bucket named: `detection-images`
3. Make it **Public**
4. Or the script will use a placeholder image URL

#### **Error: "camera_id foreign key violation"**

**Fix:** The script now auto-creates cameras, but if it fails:
1. Go to Supabase Dashboard → **Table Editor** → `cameras`
2. Manually add a camera:
   - `name`: "Camera Zone A"
   - `location`: "Zone A"
   - `status`: "active"
   - `zone`: "Zone A"
3. Copy the `id` (UUID)
4. Update `CAMERA_ID` in Python script with that UUID

---

### **4. Verify in Supabase Dashboard**

1. Go to Supabase Dashboard → **Table Editor** → `detections`
2. You should see new rows appearing when violations are detected
3. Check:
   - `violation_type` has the violation text
   - `image_url` has a URL
   - `camera_id` matches a camera in `cameras` table

---

### **5. Verify Dashboard Updates**

1. Make sure your dashboard is running: `npm run dev`
2. You should be logged in
3. The `LiveDetectionStatus` component should show new detections
4. Check browser console (F12) for any errors

---

## **Quick Test:**

1. **Run Python script:**
   ```bash
   python real_time_monitor.py
   ```

2. **Trigger a violation** (remove helmet/vest in front of camera)

3. **Check terminal** - Should see:
   ```
   ✅ Detection inserted to database! ID: ...
   ```

4. **Check Supabase Dashboard** → Table Editor → `detections`
   - Should see new row

5. **Check your web dashboard**
   - Should update automatically via Realtime

---

## **Still Not Working?**

**Share the exact error message** from terminal when violation is detected. Look for:
- Lines starting with `❌`
- Lines starting with `⚠️`
- Any error messages after "Database insert failed"

I'll help you fix it! 🚀

