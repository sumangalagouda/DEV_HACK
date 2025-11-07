# 🔍 How to Find the Exact Error

## **Method 1: Check Browser Console (Easiest)**

1. Open your dashboard in browser
2. Press **F12** (or right-click → Inspect)
3. Go to **Console** tab
4. Try uploading an image again
5. Look for red error messages
6. **Copy the full error message** - it will show the exact problem!

---

## **Method 2: Check Supabase Logs (Most Detailed)**

1. Go to **Supabase Dashboard** → **Logs** → **Edge Functions**
2. Find the most recent log entry (when you tried to upload)
3. Click on it to expand
4. Look for:
   - Red error messages
   - Stack traces
   - Error codes
5. **Copy the full error message**

---

## **Method 3: Check Toast Notification**

After uploading, the toast notification should now show:
- The exact error message
- Error code (if available)
- Details about what went wrong

**The error will stay visible for 10 seconds** so you can read it.

---

## **Common Errors You Might See:**

### **"API key missing"**
- **Fix:** The function can't find the API key
- **Solution:** Make sure you're calling from the Supabase client, or set `SUPABASE_ANON_KEY` as a secret

### **"new row violates row-level security policy"**
- **Fix:** RLS is blocking the database insert
- **Solution:** 
  - Set `SUPABASE_SERVICE_ROLE_KEY` as Edge Function secret, OR
  - Disable RLS: `ALTER TABLE detections DISABLE ROW LEVEL SECURITY;`

### **"Bucket not found" or "Storage error"**
- **Fix:** Storage bucket doesn't exist
- **Solution:** Create `detection-images` bucket in Storage (make it public)

### **"relation does not exist"**
- **Fix:** Database tables don't exist
- **Solution:** Run the migration from `supabase/migrations/`

### **"Invalid request URL"**
- **Fix:** Function can't extract project reference
- **Solution:** Make sure you're calling the function correctly

---

## **What to Share:**

When asking for help, share:
1. **Exact error message** from browser console or Supabase logs
2. **Error code** (if shown)
3. **When it happens** (during upload, storage, or database insert)

---

## **Quick Test:**

1. Open browser console (F12)
2. Upload an image
3. Check console for errors
4. Check toast notification for error message
5. Share what you see!

The updated code now shows **much better error messages**! 🎯

